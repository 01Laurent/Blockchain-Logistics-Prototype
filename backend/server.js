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

// Allow file access
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- CONFIGURATION ---
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
}).promise();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);
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

// --- HELPER: PROFESSIONAL PDF GENERATOR ---
function generateInvoicePDF(shipment, packingList, filePath, isDraft = true) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        // --- 1. HEADER & LOGO ---
        // Top Bar Background
        doc.rect(0, 0, 595.28, 140).fill('#111827'); // Dark Slate/Black

        // Logo: "EP" Monogram in a Hexagon
        doc.save();
        doc.translate(50, 45);
        doc.path('M15 0 L45 0 L60 26 L45 52 L15 52 L0 26 Z').fill('#10b981'); // Emerald Hexagon
        doc.fillColor('white').fontSize(20).font('Helvetica-Bold').text('EP', 14, 16);
        doc.restore();

        // Company Details (White text on dark header)
        doc.fillColor('white');
        doc.fontSize(22).font('Helvetica-Bold').text('EASTERN PRODUCE', 120, 45);
        doc.fontSize(9).font('Helvetica').text('KENYA LOGISTICS DIVISION', 120, 72);
        doc.text('P.O. Box 45678, Nairobi, Kenya', 120, 85);
        doc.text('+254 700 123 456 | export@easternproduce.co.ke', 120, 98);

        // Invoice Label
        doc.fontSize(28).text('INVOICE', 400, 45, { align: 'right' });
        doc.fontSize(10).font('Helvetica-Bold').text(`# ${shipment.tracking_number}`, 400, 80, { align: 'right' });
        
        // Status Badge
        doc.save();
        const badgeColor = isDraft ? '#ef4444' : '#10b981'; // Red for Draft, Green for Approved
        doc.rect(480, 95, 65, 20).fill(badgeColor);
        doc.fillColor('white').fontSize(8).text(isDraft ? 'DRAFT' : 'OFFICIAL', 480, 101, { width: 65, align: 'center' });
        doc.restore();

        // --- 2. BILLING DETAILS ---
        doc.fillColor('black').moveDown(8);
        const topDetails = 170;

        // Bill To
        doc.fontSize(10).font('Helvetica-Bold').text('BILL TO:', 50, topDetails);
        doc.font('Helvetica').fontSize(10)
           .text(shipment.receiver_name, 50, topDetails + 15)
           .text(shipment.destination, 50, topDetails + 30);

        // Ship From
        doc.fontSize(10).font('Helvetica-Bold').text('SHIP FROM:', 300, topDetails);
        doc.font('Helvetica').fontSize(10)
           .text(shipment.sender_name, 300, topDetails + 15)
           .text(shipment.origin, 300, topDetails + 30);

        // Metadata
        doc.fontSize(10).font('Helvetica-Bold').text('DATE:', 450, topDetails);
        doc.font('Helvetica').text(new Date().toLocaleDateString(), 500, topDetails);
        
        doc.font('Helvetica-Bold').text('DUE DATE:', 450, topDetails + 15);
        doc.font('Helvetica').text("Upon Receipt", 515, topDetails + 15);

        // --- 3. THE TABLE ---
        const tableTop = 250;
        const col1 = 50;  // Item
        const col2 = 280; // Qty
        const col3 = 350; // Weight
        const col4 = 420; // Price
        const col5 = 500; // Total

        // Header Row
        doc.rect(50, tableTop, 495, 25).fill('#f3f4f6');
        doc.fillColor('#374151').fontSize(9).font('Helvetica-Bold');
        doc.text('DESCRIPTION / GRADE', col1 + 10, tableTop + 8);
        doc.text('QTY', col2, tableTop + 8);
        doc.text('WEIGHT (KG)', col3, tableTop + 8);
        doc.text('UNIT PRICE', col4, tableTop + 8);
        doc.text('TOTAL', col5, tableTop + 8);

        // Rows
        doc.fillColor('black').font('Helvetica');
        let position = tableTop + 35;
        let grandTotal = 0;

        packingList.forEach((item, i) => {
            // Logic to calculate dummy price if not provided (for prototype realism)
            const unitPrice = item.price || (Math.random() * (50 - 20) + 20).toFixed(2); // Random price between $20-$50 if missing
            const qty = parseInt(item.qty) || 1;
            const lineTotal = (qty * unitPrice).toFixed(2);
            grandTotal += parseFloat(lineTotal);

            // Row Background (Alternating)
            if (i % 2 === 1) {
                doc.rect(50, position - 5, 495, 20).fill('#f9fafb');
                doc.fillColor('black'); // Reset fill
            }

            doc.text(item.grade || item.desc, col1 + 10, position);
            doc.text(item.qty, col2, position);
            doc.text(item.weight, col3, position);
            doc.text(`$${unitPrice}`, col4, position);
            doc.text(`$${lineTotal}`, col5, position);
            
            position += 20;
        });

        // --- 4. TOTALS SECTION ---
        position += 20;
        
        // Line separator
        doc.moveTo(50, position).lineTo(545, position).strokeColor('#e5e7eb').stroke();
        
        position += 10;
        doc.fontSize(10).font('Helvetica-Bold').text('SUBTOTAL:', 400, position, { align: 'right' });
        doc.text(`$${grandTotal.toFixed(2)}`, 500, position);
        
        position += 15;
        doc.text('TAX (0% Export):', 400, position, { align: 'right' });
        doc.text('$0.00', 500, position);

        position += 20;
        doc.rect(380, position - 5, 165, 30).fill('#10b981'); // Total Box
        doc.fillColor('white').fontSize(12).font('Helvetica-Bold')
           .text('GRAND TOTAL:', 390, position + 5)
           .text(`$${grandTotal.toFixed(2)}`, 490, position + 5, { align: 'right', width: 50 });

        // --- 5. FOOTER ---
        const bottomY = 700;
        
        // Watermark if Draft
        if(isDraft) {
            doc.save().rotate(-45, { origin: [300, 400] });
            doc.fontSize(100).fillColor('#fee2e2').opacity(0.5).text('DRAFT', 100, 300);
            doc.restore();
        } else {
            // Authorized Signature area for Final Invoice
            doc.fillColor('black').opacity(1);
            doc.moveTo(50, bottomY - 40).lineTo(200, bottomY - 40).stroke();
            doc.fontSize(8).text('AUTHORIZED SIGNATURE', 50, bottomY - 35);
            doc.font('Helvetica-Oblique').text('Digitally Verified by Eastern Produce Admin', 50, bottomY - 25);
        }

        doc.fillColor('#6b7280').fontSize(8).font('Helvetica')
           .text('PAYMENT TERMS: Net 30 Days. Please include invoice number on your check.', 50, bottomY);
        
        doc.fontSize(7).text(`Blockchain Hash: ${crypto.randomBytes(10).toString('hex')}... (Placeholder for actual hash)`, 50, bottomY + 15);

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
        if(userId) await logAction(userId, "CREATE_ORDER", `Created Shipment ${trackingNum}`);
        res.json({ message: "Shipment Created", shipmentId: result.insertId, trackingNumber: trackingNum });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/shipments', async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT s.*, d.file_hash, d.file_path FROM shipments s LEFT JOIN documents d ON s.shipment_id = d.shipment_id ORDER BY s.created_at DESC`);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// LOGISTICS: CREATE DRAFT PDF
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
        if(docs.length === 0) {
            await db.query(`INSERT INTO documents (shipment_id, file_path, file_hash) VALUES (?, ?, ?)`, [shipmentId, filename, "PENDING_LOCK"]);
        } else {
            await db.query(`UPDATE documents SET file_path = ? WHERE shipment_id = ?`, [filename, shipmentId]);
        }

        if(userId) await logAction(userId, "DRAFT_INVOICE", `Drafted Invoice PDF for ${ship.tracking_number}`);
        res.json({ message: "Draft PDF Generated" });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: err.message }); 
    }
});

// ADMIN: LOCK INVOICE
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

        if(userId) await logAction(userId, "ADMIN_LOCK", `Locked Invoice ${ship.tracking_number}`);
        res.json({ message: "Invoice Locked", hash: hexHash });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/reset-invoice/:id', async (req, res) => {
    const { userId } = req.body;
    try {
        await db.query('UPDATE shipments SET invoice_status = "Pending" WHERE shipment_id = ?', [req.params.id]);
        if(userId) await logAction(userId, "ADMIN_RESET", `Rejected Invoice ${req.params.id}`);
        res.json({ message: "Invoice Reset" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/dispatch/:id', async (req, res) => {
    try {
        await db.query('UPDATE shipments SET status = "In-Transit" WHERE shipment_id = ?', [req.params.id]);
        if(req.body.userId) await logAction(req.body.userId, "DISPATCH", `Dispatched ID ${req.params.id}`);
        res.json({ message: "Dispatched" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/confirm/:id', async (req, res) => {
    try {
        const tx = await contract.confirmDelivery(req.params.id);
        await tx.wait();
        await db.query('UPDATE shipments SET status = "Delivered" WHERE shipment_id = ?', [req.params.id]);
        if(req.body.userId) await logAction(req.body.userId, "CONFIRM", `Confirmed ID ${req.params.id}`);
        res.json({ message: "Confirmed" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/shipments/:id/status', async (req, res) => {
    try {
        const status = await contract.getShipmentStatus(req.params.id);
        res.json({ isDelivered: status[0], isPaid: status[1], blockchainHash: status[2] });
    } catch (err) { res.status(500).json({ error: err.message }); }
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
        if(adminId) await logAction(adminId, "CREATE_USER", `Created user ${username}`);
        res.json({ message: "User Created" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 API Server running on port ${PORT}`));