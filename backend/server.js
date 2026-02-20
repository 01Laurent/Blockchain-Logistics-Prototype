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
const PDFLib = require('pdf-lib');
const bcrypt = require('bcrypt');

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

const contractJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../blockchain/artifacts/contracts/Shipment.sol/Shipment.json"), "utf8")
);
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractJson.abi, wallet);

if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');

// --- HELPER: AUDIT LOGGER ---
async function logAction(userId, action, details) {
    try {
        if (!userId) return;
        await db.query('INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)', [userId, action, details]);
    } catch (err) { console.error("Audit Error:", err); }
}

// --- PDF GENERATOR ---
function generateInvoicePDF(shipment, packingList, filePath, isDraft = true) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        const colors = {
            primary: '#DC2626',      // Red
            secondary: '#F5F5DC',    // Beige/Cream
            dark: '#1a1a1a',         // Dark text
            gray: '#666666'          // Gray text
        };

        const invoiceDate = new Date();
        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + 30);

        // --- HEADER SECTION ---
        // Left side - INVOICE in large red text
        doc.fontSize(42).fillColor(colors.primary).font('Helvetica-Bold').text('INVOICE', 50, 50);
        
        // Right side - Company info (aligned right)
        doc.fontSize(16).fillColor(colors.primary).font('Helvetica-Bold');
        doc.text('EASTERN PRODUCE', 350, 50, { align: 'right', width: 195 });
        
        doc.fontSize(9).fillColor(colors.dark).font('Helvetica');
        doc.text('TEA EXPORTERS', 350, 70, { align: 'right', width: 195 });
        doc.text('& LOGISTICS', 350, 82, { align: 'right', width: 195 });
        
        doc.fontSize(8).fillColor(colors.gray);
        doc.text('New Rehema House.,', 350, 105, { align: 'right', width: 195 });
        doc.text('Lantana Rd, Nairobi', 350, 116, { align: 'right', width: 195 });
        doc.text('+254-722-205342', 350, 127, { align: 'right', width: 195 });

        // --- INVOICE DETAILS ---
        const detailsY = 160;
        doc.fontSize(9).fillColor(colors.dark).font('Helvetica');
        doc.text('INVOICE NUMBER:', 50, detailsY);
        doc.text(`#${shipment.tracking_number}`, 150, detailsY);
        
        doc.text('DATE:', 50, detailsY + 15);
        doc.text(invoiceDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), 150, detailsY + 15);
        
        doc.text('DUE DATE:', 50, detailsY + 30);
        doc.text(dueDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), 150, detailsY + 30);

        // --- BILL TO & PAYMENT METHOD ---
        const billingY = 240;
        
        // Bill To (Left)
        doc.fontSize(10).fillColor(colors.dark).font('Helvetica-Bold');
        doc.text('Bill To:', 50, billingY);
        
        doc.fontSize(9).font('Helvetica').fillColor(colors.dark);
        doc.text(shipment.receiver_name || 'CLIENT NAME', 50, billingY + 20);
        doc.text(shipment.destination || 'Address', 50, billingY + 35);

        // Payment Method (Right)
        doc.fontSize(10).fillColor(colors.dark).font('Helvetica-Bold');
        doc.text('Payment Method', 350, billingY, { align: 'right', width: 195 });
        
        doc.fontSize(9).font('Helvetica').fillColor(colors.dark);
        doc.text('Bank Transfer', 350, billingY + 20, { align: 'right', width: 195 });
        doc.text('SWIFT: EASTKE', 350, billingY + 35, { align: 'right', width: 195 });
        doc.text('+123-456-7890', 350, billingY + 50, { align: 'right', width: 195 });

        // --- TABLE ---
        const tableTop = 350;
        const descCol = 50;
        const qtyCol = 320;
        const priceCol = 400;
        const subtotalCol = 480;

        // Table header background (cream color)
        doc.rect(50, tableTop, 495, 25).fillAndStroke(colors.secondary, colors.gray);
        
        // Table headers
        doc.fontSize(9).fillColor(colors.dark).font('Helvetica-Bold');
        doc.text('DESCRIPTION', descCol + 5, tableTop + 8);
        doc.text('QTY', qtyCol, tableTop + 8);
        doc.text('PRICE', priceCol, tableTop + 8);
        doc.text('SUBTOTAL', subtotalCol, tableTop + 8);

        let currentY = tableTop + 25;
        let grandTotal = 0;

        // Table rows
        packingList.forEach((item, i) => {
            // Pricing logic
            let price = 5.50;
            const g = (item.grade || "").toLowerCase();
            if (g.includes('purple')) price = 14.20;
            if (g.includes('bp1')) price = 6.40;
            if (g.includes('dust') || g.includes('d1')) price = 3.90;
            if (g.includes('green')) price = 8.50;

            const weightVal = parseFloat(item.weight) || 0;
            const lineTotal = weightVal * price;
            grandTotal += lineTotal;

            // Row background (alternating)
            if (i % 2 === 1) {
                doc.rect(50, currentY, 495, 22).fillAndStroke('#fafafa', '#e5e5e5');
            } else {
                doc.rect(50, currentY, 495, 22).stroke('#e5e5e5');
            }

            doc.fontSize(9).fillColor(colors.dark).font('Helvetica');
            doc.text(item.grade, descCol + 5, currentY + 7, { width: 260 });
            doc.text(item.qty, qtyCol, currentY + 7);
            doc.text(`$${price.toFixed(2)}`, priceCol, currentY + 7);
            doc.text(`$${lineTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}`, subtotalCol, currentY + 7);

            currentY += 22;
        });

        // Fill remaining rows if needed (for visual consistency)
        const minRows = 5;
        const rowsToAdd = Math.max(0, minRows - packingList.length);
        for (let i = 0; i < rowsToAdd; i++) {
            if ((packingList.length + i) % 2 === 1) {
                doc.rect(50, currentY, 495, 22).fillAndStroke('#fafafa', '#e5e5e5');
            } else {
                doc.rect(50, currentY, 495, 22).stroke('#e5e5e5');
            }
            currentY += 22;
        }

        // --- TOTALS SECTION ---
        currentY += 15;
        
        // Tax (10%)
        const taxAmount = grandTotal * 0.1;
        doc.fontSize(9).fillColor(colors.dark).font('Helvetica');
        doc.text('TAX', 400, currentY);
        doc.text(`$${taxAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}`, subtotalCol, currentY);

        currentY += 20;
        
        // Grand Total
        const finalTotal = grandTotal + taxAmount;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('GRAND TOTAL', 400, currentY);
        doc.text(`$${finalTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}`, subtotalCol, currentY);

        // --- TERMS & CONDITIONS ---
        const termsY = currentY + 50;
        
        doc.fontSize(10).fillColor(colors.dark).font('Helvetica-Bold');
        doc.text('TERM & CONDITION', 50, termsY);

        doc.fontSize(8).font('Helvetica').fillColor(colors.gray);
        const terms = `Goods once sold cannot be re-accepted.`;
        doc.text(terms, 50, termsY + 20, { width: 250, lineGap: 2 });

        // --- CONTACT & SIGNATURE ---
        doc.fontSize(8).fillColor(colors.gray);
        doc.text('FOR ANY QUESTIONS, PLEASE', 350, termsY + 20);
        doc.text('CONTACT:', 350, termsY + 32);
        doc.fillColor(colors.primary).text('info@easternproduce.com', 350, termsY + 44);
        doc.fillColor(colors.gray).text('OR CALL US AT', 350, termsY + 56);
        doc.fillColor(colors.primary).text('+123-456-7890', 350, termsY + 68);

        // Signature line
        doc.fontSize(8).fillColor(colors.dark).font('Helvetica-Bold');
        doc.text('OLIVIA WILSON', 350, termsY + 100);
        doc.fontSize(7).font('Helvetica').fillColor(colors.gray);
        doc.text('OPERATIONS MANAGER', 350, termsY + 112);
        
        // Signature image placeholder (draw a line)
        doc.moveTo(350, termsY + 95).lineTo(480, termsY + 95).stroke(colors.dark);

        // Draft watermark
        if (isDraft) {
            doc.save()
                .rotate(-45, { origin: [300, 400] })
                .fontSize(80)
                .fillColor('red')
                .opacity(0.1)
                .text('DRAFT ONLY', 100, 350)
                .restore();
        }

        // Blockchain footer
        doc.opacity(1).fontSize(7).fillColor(colors.gray).font('Helvetica-Oblique');
        doc.text('This document is cryptographically secured via Ethereum Smart Contract.', 50, 750, { align: 'center' });
        doc.text(`Blockchain Verify ID: ${crypto.createHash('md5').update(shipment.tracking_number).digest('hex')}`, 50, 760, { align: 'center' });

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
        
        // Comparing the hashed password
        const validPassword = await bcrypt.compare(password, users[0].password_hash);
        if (!validPassword) return res.status(401).json({ error: "Invalid password" });
        
        await logAction(users[0].user_id, "LOGIN", "User logged in");
        res.json({ 
            message: "Login Successful", 
            user: { 
                id: users[0].user_id, 
                username: users[0].username, 
                role: users[0].role 
            } 
        });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

app.post('/api/users/change-password', async (req, res) => {
    const { userId, oldPassword, newPassword } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE user_id = ?', [userId]);
        if (users.length === 0) return res.status(404).json({ error: "User not found" });
        
        // Verify old password
        const validPassword = await bcrypt.compare(oldPassword, users[0].password_hash);
        if (!validPassword) return res.status(401).json({ error: "Invalid current password" });
        
        // Hash and update new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password_hash = ? WHERE user_id = ?', [hashedPassword, userId]);
        
        await logAction(userId, "PASSWORD_CHANGE", "Password changed");
        res.json({ message: "Password updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
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
        // bcrypt password with (10 salt rounds)
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await db.query(
            'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', 
            [username, hashedPassword, role]
        );
        
        if(adminId) await logAction(adminId, "CREATE_USER", `Created user ${username}`);
        res.json({ message: "User Created" });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});


// ANALYTICS ENDPOINT: Get summary statistics
app.get('/api/analytics/summary', async (req, res) => {
    try {
        // Total shipments
        const [totalShipments] = await db.query('SELECT COUNT(*) as count FROM shipments');
        
        // Total value
        const [totalValue] = await db.query('SELECT SUM(value) as total FROM shipments');
        
        // Pending invoices
        const [pendingInvoices] = await db.query('SELECT COUNT(*) as count FROM shipments WHERE invoice_status = "Pending"');
        
        // Approved invoices
        const [approvedInvoices] = await db.query('SELECT COUNT(*) as count FROM shipments WHERE invoice_status = "Approved"');
        
        res.json({
            totalShipments: totalShipments[0].count,
            totalValue: totalValue[0].total || 0,
            pendingInvoices: pendingInvoices[0].count,
            approvedInvoices: approvedInvoices[0].count
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ANALYTICS ENDPOINT: Shipment status breakdown
app.get('/api/analytics/status-breakdown', async (req, res) => {
    try {
        const [results] = await db.query(`
            SELECT status, COUNT(*) as count 
            FROM shipments 
            GROUP BY status
        `);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ANALYTICS ENDPOINT: Monthly volume
app.get('/api/analytics/monthly-volume', async (req, res) => {
    try {
        const [results] = await db.query(`
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                COUNT(*) as count
            FROM shipments
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month DESC
            LIMIT 12
        `);
        res.json(results.reverse());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ANALYTICS ENDPOINT: Top tea grades
app.get('/api/analytics/top-grades', async (req, res) => {
    try {
        // Extract grades from packing_list JSON
        const [shipments] = await db.query('SELECT packing_list FROM shipments WHERE packing_list IS NOT NULL');
        
        const gradeCounts = {};
        
        shipments.forEach(ship => {
            try {
                const items = JSON.parse(ship.packing_list);
                items.forEach(item => {
                    const grade = item.grade || 'Unknown';
                    gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
                });
            } catch (e) {}
        });
        
        // Convert to array and sort
        const results = Object.entries(gradeCounts)
            .map(([grade, count]) => ({ grade, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// TAMPERING DEMO: Get list of locked invoices
app.get('/api/demo/locked-invoices', async (req, res) => {
    try {
        const [invoices] = await db.query(`
            SELECT s.shipment_id, s.tracking_number, s.sender_name, s.receiver_name, 
                   d.file_path, d.file_hash 
            FROM shipments s 
            JOIN documents d ON s.shipment_id = d.shipment_id 
            WHERE s.invoice_status = 'Approved' 
            AND d.file_hash IS NOT NULL 
            AND d.file_hash != 'PENDING_LOCK'
            ORDER BY s.created_at DESC
        `);
        res.json(invoices);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// TAMPERING DEMO: Deliberately tamper with a PDF
app.post('/api/demo/tamper-invoice/:id', async (req, res) => {
    const shipmentId = req.params.id;
    
    try {
        const [shipments] = await db.query('SELECT * FROM shipments WHERE shipment_id = ?', [shipmentId]);
        if (shipments.length === 0) return res.status(404).json({ error: "Shipment not found" });
        
        const shipment = shipments[0];
        const [docs] = await db.query('SELECT * FROM documents WHERE shipment_id = ?', [shipmentId]);
        if (docs.length === 0) return res.status(404).json({ error: "No document found" });
        
        const originalFilePath = path.join(__dirname, 'uploads', docs[0].file_path);
        if (!fs.existsSync(originalFilePath)) {
            return res.status(404).json({ error: "PDF file not found" });
        }

        // Read original PDF
        const originalBytes = fs.readFileSync(originalFilePath);
        const pdfDoc = await PDFLib.PDFDocument.load(originalBytes);
        
        // Get the first page
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        
        // Add a visible "FRAUDULENT MODIFICATION" stamp
        firstPage.drawText('*** AMOUNT MODIFIED FROM $6,320 TO $12,000 ***', {
            x: 50,
            y: 500,
            size: 12,
            color: PDFLib.rgb(1, 0, 0),
        });
        
        firstPage.drawText('(This is a deliberate tampering for demonstration)', {
            x: 50,
            y: 480,
            size: 8,
            color: PDFLib.rgb(0.5, 0, 0),
        });

        // Save tampered version
        const tamperedBytes = await pdfDoc.save();
        const tamperedFileName = `TAMPERED-${docs[0].file_path}`;
        const tamperedFilePath = path.join(__dirname, 'uploads', tamperedFileName);
        fs.writeFileSync(tamperedFilePath, tamperedBytes);
        
        // Calculate both hashes
        const originalHash = "0x" + crypto.createHash('sha256').update(originalBytes).digest('hex');
        const tamperedHash = "0x" + crypto.createHash('sha256').update(tamperedBytes).digest('hex');
        
        res.json({ 
            message: "Invoice tampered - amount modified",
            originalHash: docs[0].file_hash,
            originalHashComputed: originalHash,
            tamperedHash: tamperedHash,
            tamperedFile: tamperedFileName,
            originalFile: docs[0].file_path,
            modification: "Added fraudulent text: 'AMOUNT MODIFIED FROM $6,320 TO $12,000'"
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// verify any file aganaist the blockchain hash
app.post('/api/demo/verify-file', async (req, res) => {
    const { filename, shipmentId } = req.body;
    
    try {
        const [docs] = await db.query('SELECT * FROM documents WHERE shipment_id = ?', [shipmentId]);
        if (docs.length === 0) return res.status(404).json({ error: "No document found" });
        
        const filePath = path.join(__dirname, 'uploads', filename);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: "File not found" });
        }
        
        const fileBytes = fs.readFileSync(filePath);
        const computedHash = "0x" + crypto.createHash('sha256').update(fileBytes).digest('hex');
        const blockchainHash = docs[0].file_hash;
        
        res.json({
            computedHash,
            blockchainHash,
            matches: computedHash.toLowerCase() === blockchainHash.toLowerCase(),
            filename
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// TAMPERING DEMO: Restore original invoice
app.post('/api/demo/restore-invoice/:id', async (req, res) => {
    const shipmentId = req.params.id;
    
    try {
        const [docs] = await db.query('SELECT * FROM documents WHERE shipment_id = ?', [shipmentId]);
        if (docs.length === 0) return res.status(404).json({ error: "No document found" });
        
        const tamperedFileName = `TAMPERED-${docs[0].file_path}`;
        const tamperedFilePath = path.join(__dirname, 'uploads', tamperedFileName);
        
        // Delete tampered version if it exists
        if (fs.existsSync(tamperedFilePath)) {
            fs.unlinkSync(tamperedFilePath);
        }
        
        res.json({ message: "Tampered invoice deleted, original restored" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 API Server running on port ${PORT}`));