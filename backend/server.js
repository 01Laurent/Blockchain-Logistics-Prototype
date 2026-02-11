require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const { ethers } = require('ethers');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const PDFDocument = require('pdfkit');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- CONFIGURATION ---
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
}).promise();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contractJson = JSON.parse(fs.readFileSync('./Shipment.json'));
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractJson.abi, wallet);

if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');

// --- HELPER: AUDIT LOGGER ---
async function logAction(userId, action, details) {
    try {
        if (!userId) return;
        await db.query('INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)', [userId, action, details]);
    } catch (err) { console.error("Audit Error:", err); }
}

// --- HELPER: PDF GENERATOR ---
function generateInvoicePDF(shipment, packingList, filePath, isDraft = true) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        const colors = {
            primary: '#0f172a',
            accent: '#10b981',
            border: '#e2e8f0',
            text: '#334155'
        };

        doc.rect(0, 0, 595, 125).fill(colors.primary);
        doc.save().translate(50, 35);
        doc.path('M20 0 L40 10 L40 30 L20 40 L0 30 L0 10 Z').fill(colors.accent);
        doc.fillColor('white').fontSize(12).font('Helvetica-Bold').text('EP', 11, 14);
        doc.restore();

        doc.fillColor('white').font('Helvetica-Bold').fontSize(22).text('EASTERN PRODUCE', 110, 42);
        doc.font('Helvetica').fontSize(9).text('TEA EXPORTERS & LOGISTICS SPECIALISTS', 110, 70);
        doc.text('Riverside Square, Nairobi, Kenya | trade@easternproduce.com', 110, 82);
        doc.fontSize(26).text('INVOICE', 400, 42, { align: 'right' });
        doc.fontSize(10).font('Helvetica').text(`REF: ${shipment.tracking_number}`, 400, 72, { align: 'right' });
        doc.text(`DATE: ${new Date().toLocaleDateString('en-GB')}`, 400, 85, { align: 'right' });

        const startY = 150;
        doc.fillColor(colors.primary).font('Helvetica-Bold').fontSize(10).text('EXPORTER / SENDER:', 50, startY);
        doc.font('Helvetica').text(shipment.sender_name, 50, startY + 15).text(shipment.origin, 50, startY + 28);
        doc.font('Helvetica-Bold').text('CONSIGNEE / RECEIVER:', 320, startY);
        doc.font('Helvetica').text(shipment.receiver_name, 320, startY + 15).text(shipment.destination, 320, startY + 28);

        const tableTop = 230;
        const col = { id: 50, grade: 80, qty: 280, weight: 340, uprice: 410, total: 485 };

        doc.rect(40, tableTop, 515, 25).fill(colors.primary);
        doc.fillColor('white').font('Helvetica-Bold').fontSize(9);
        doc.text('#', col.id, tableTop + 8);
        doc.text('ITEM GRADE & DESCRIPTION', col.grade, tableTop + 8);
        doc.text('QTY', col.qty, tableTop + 8);
        doc.text('WEIGHT', col.weight, tableTop + 8);
        doc.text('UNIT PRICE', col.uprice, tableTop + 8);
        doc.text('SUBTOTAL', col.total, tableTop + 8, { align: 'right', width: 60 });

        let currentY = tableTop + 25;
        let grandTotal = 0;

        packingList.forEach((item, i) => {
            let price = 5.50;
            const g = (item.grade || "").toLowerCase();
            if (g.includes('purple')) price = 14.20;
            if (g.includes('bp1')) price = 6.40;
            if (g.includes('dust') || g.includes('d1')) price = 3.90;
            if (g.includes('green')) price = 8.50;

            const weightVal = parseFloat(item.weight) || 0;
            const lineTotal = weightVal * price;
            grandTotal += lineTotal;

            if (i % 2 === 0) doc.rect(40, currentY, 515, 22).fill('#f8fafc');

            doc.fillColor(colors.text).font('Helvetica');
            doc.text(i + 1, col.id, currentY + 7);
            doc.text(item.grade, col.grade, currentY + 7);
            doc.text(item.qty, col.qty, currentY + 7);
            doc.text(`${weightVal} KG`, col.weight, currentY + 7);
            doc.text(`$${price.toFixed(2)}`, col.uprice, currentY + 7);
            doc.text(`$${lineTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}`, col.total, currentY + 7, { align: 'right', width: 60 });

            currentY += 22;
        });

        currentY += 20;
        doc.moveTo(350, currentY).lineTo(555, currentY).strokeColor(colors.border).stroke();
        currentY += 10;
        doc.font('Helvetica-Bold').fontSize(10).text('GRAND TOTAL (USD):', 360, currentY + 10);
        doc.fontSize(16).fillColor(colors.accent).text(`$${grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}`, 450, currentY + 5, { align: 'right', width: 100 });

        const footerY = 740;
        if (isDraft) {
            doc.save().rotate(-45, { origin: [300, 400] }).fontSize(80).fillColor('red').opacity(0.1).text('DRAFT ONLY', 100, 350).restore();
        }

        doc.opacity(1).fillColor(colors.text).fontSize(8).font('Helvetica-Oblique');
        doc.text('This document is cryptographically secured via Ethereum Smart Contract.', 40, footerY, { align: 'center' });
        doc.text(`Blockchain Verify ID: ${crypto.createHash('md5').update(shipment.tracking_number).digest('hex')}`, 40, footerY + 12, { align: 'center' });

        doc.end();
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
    });
}

// --- ROUTES ---

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) return res.status(401).json({ error: "User not found" });
        await logAction(users[0].user_id, "LOGIN", "User logged in");
        res.json({ message: "Login Successful", user: { id: users[0].user_id, username: users[0].username, role: users[0].role } });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/shipments', async (req, res) => {
    const { sender, receiver, origin, destination, value, userId } = req.body;
    const trackingNum = "TRK-" + Math.floor(100000 + Math.random() * 900000);
    try {
        const [result] = await db.query(
            `INSERT INTO shipments (tracking_number, sender_name, receiver_name, origin, destination, value, smart_contract_address) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [trackingNum, sender, receiver, origin, destination, value, process.env.CONTRACT_ADDRESS]
        );
        if (userId) await logAction(userId, "CREATE_ORDER", `Created Shipment ${trackingNum}`);
        res.json({ message: "Shipment Created", shipmentId: result.insertId, trackingNumber: trackingNum });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/shipments', async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT s.*, d.file_hash, d.file_path FROM shipments s LEFT JOIN documents d ON s.shipment_id = d.shipment_id ORDER BY s.created_at DESC`);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/logistics/draft-invoice/:id', async (req, res) => {
    const shipmentId = req.params.id;
    const { packingList, userId } = req.body;
    try {
        const [ships] = await db.query('SELECT * FROM shipments WHERE shipment_id = ?', [shipmentId]);
        if (ships.length === 0) return res.status(404).json({ error: "Shipment not found" });
        const ship = ships[0];

        const filename = `INVOICE-${ship.tracking_number}-DRAFT.pdf`;
        const filePath = path.join(__dirname, 'uploads', filename);

        await generateInvoicePDF(ship, packingList, filePath, true);

        await db.query('UPDATE shipments SET packing_list = ?, invoice_status = "Draft", file_path_draft = ? WHERE shipment_id = ?',
            [JSON.stringify(packingList), filename, shipmentId]
        );

        const [docs] = await db.query('SELECT * FROM documents WHERE shipment_id = ?', [shipmentId]);
        if (docs.length === 0) {
            await db.query(`INSERT INTO documents (shipment_id, file_path, file_hash) VALUES (?, ?, ?)`, [shipmentId, filename, "PENDING_LOCK"]);
        } else {
            await db.query(`UPDATE documents SET file_path = ? WHERE shipment_id = ?`, [filename, shipmentId]);
        }

        if (userId) await logAction(userId, "DRAFT_INVOICE", `Drafted Invoice PDF for ${ship.tracking_number}`);
        res.json({ message: "Draft PDF Generated" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/lock-invoice/:id', async (req, res) => {
    const shipmentId = req.params.id;
    const { userId } = req.body;
    try {
        const [ships] = await db.query('SELECT * FROM shipments WHERE shipment_id = ?', [shipmentId]);
        if (ships.length === 0) return res.status(404).json({ error: "Shipment not found" });
        const ship = ships[0];
        const packingList = JSON.parse(ship.packing_list || "[]");

        const filename = `INVOICE-${ship.tracking_number}-FINAL.pdf`;
        const filePath = path.join(__dirname, 'uploads', filename);

        await generateInvoicePDF(ship, packingList, filePath, false);

        const fileBuffer = fs.readFileSync(filePath);
        const hashSum = crypto.createHash('sha256');
        hashSum.update(fileBuffer);
        const hexHash = "0x" + hashSum.digest('hex');

        const tx = await contract.registerDocument(shipmentId, hexHash);
        await tx.wait();

        await db.query(`UPDATE documents SET file_path = ?, file_hash = ? WHERE shipment_id = ?`, [filename, hexHash, shipmentId]);
        await db.query('UPDATE shipments SET invoice_status = "Approved" WHERE shipment_id = ?', [shipmentId]);

        if (userId) await logAction(userId, "ADMIN_LOCK", `Locked Invoice ${ship.tracking_number}`);
        res.json({ message: "Invoice Locked", hash: hexHash });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/reset-invoice/:id', async (req, res) => {
    const { userId } = req.body;
    try {
        await db.query('UPDATE shipments SET invoice_status = "Pending" WHERE shipment_id = ?', [req.params.id]);
        if (userId) await logAction(userId, "ADMIN_RESET", `Rejected Invoice ${req.params.id}`);
        res.json({ message: "Invoice Reset" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/dispatch/:id', async (req, res) => {
    try {
        await db.query('UPDATE shipments SET status = "In-Transit" WHERE shipment_id = ?', [req.params.id]);
        if (req.body.userId) await logAction(req.body.userId, "DISPATCH", `Dispatched ID ${req.params.id}`);
        res.json({ message: "Dispatched" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/confirm/:id', async (req, res) => {
    try {
        const tx = await contract.confirmDelivery(req.params.id);
        await tx.wait();
        await db.query('UPDATE shipments SET status = "Delivered" WHERE shipment_id = ?', [req.params.id]);
        if (req.body.userId) await logAction(req.body.userId, "CONFIRM", `Confirmed ID ${req.params.id}`);
        res.json({ message: "Confirmed" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});


// AFTER (handles not-yet-locked shipments):
app.get('/api/shipments/:id/status', async (req, res) => {
    try {
        const [docs] = await db.query(
            'SELECT file_hash FROM documents WHERE shipment_id = ?',
            [req.params.id]
        );

        const isOnChain = docs.length > 0 && docs[0].file_hash && docs[0].file_hash !== 'PENDING_LOCK';

        if (!isOnChain) {
            return res.json({ isDelivered: false, isPaid: false, blockchainHash: null });
        }

        const [isDelivered, isPaid, blockchainHash] = await Promise.all([
            contract.isDelivered(req.params.id),
            contract.isPaid(req.params.id),
            contract.documentHashes(req.params.id)
        ]);

        res.json({ isDelivered, isPaid, blockchainHash });

    } catch (err) {
        console.error("Status endpoint error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/logs', async (req, res) => {
    try {
        const [logs] = await db.query(`SELECT l.*, u.username, u.role FROM audit_logs l JOIN users u ON l.user_id = u.user_id ORDER BY l.timestamp DESC`);
        res.json(logs);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/users', async (req, res) => {
    const { username, password, role, adminId } = req.body;
    try {
        await db.query('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', [username, password, role]);
        if (adminId) await logAction(adminId, "CREATE_USER", `Created user ${username}`);
        res.json({ message: "User Created" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 API Server running on port ${PORT}`));