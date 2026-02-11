import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://192.168.1.67:3000/api';
const FILE_URL = 'http://192.168.1.67:3000/uploads';

export default function AdminView({ shipment, user, refreshData }) {
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showInspector, setShowInspector] = useState(false);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    // --- LOGIC ---
    const openReview = () => {
        try {
            setItems(shipment.packing_list ? JSON.parse(shipment.packing_list) : []);
            setShowReviewModal(true);
        } catch (e) { setItems([]); }
    };

    const openInspector = () => {
        try {
            setItems(shipment.packing_list ? JSON.parse(shipment.packing_list) : []);
            setShowInspector(true);
        } catch (e) { setItems([]); }
    };

    const handleLock = async () => {
        if(!confirm("Lock this Invoice on Blockchain? Cannot be undone.")) return;
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/admin/lock-invoice/${shipment.shipment_id}`, { userId: user.id });
            alert(`✅ Locked! Hash: ${res.data.hash}`);
            setShowReviewModal(false);
            refreshData();
        } catch (err) { alert("Locking Failed"); }
        setLoading(false);
    };

    const handleReset = async () => {
        if(!confirm("Reject Invoice?")) return;
        try {
            await axios.post(`${API_URL}/admin/reset-invoice/${shipment.shipment_id}`, { userId: user.id });
            alert("Invoice Rejected.");
            setShowReviewModal(false);
            refreshData();
        } catch (err) { alert("Reset Failed"); }
    };

    const viewInvoice = () => {
        if(!shipment.file_path) return alert("No file");
        const cleanName = shipment.file_path.split('/').pop().split('\\').pop();
        window.open(`${FILE_URL}/${cleanName}`, '_blank');
    };

    const verifyChain = async () => {
        try {
            const res = await axios.get(`${API_URL}/shipments/${shipment.shipment_id}/status`);
            if(res.data.blockchainHash && res.data.blockchainHash !== "0x") alert(`✅ VERIFIED!\nHash: ${res.data.blockchainHash.substring(0,10)}...`);
            else alert("⚠️ Not Anchored");
        } catch(e) { alert("Error"); }
    };

    return (
        <div className="flex space-x-2">
            {/* ACTION BUTTONS */}
            {shipment.invoice_status === 'Draft' && (
                <button onClick={openReview} className="bg-red-100 text-red-800 border border-red-300 px-3 py-1 rounded text-xs font-bold animate-pulse hover:bg-red-200 transition">
                    ⚡ Review Draft
                </button>
            )}
            
            {shipment.invoice_status === 'Approved' && (
                <button onClick={viewInvoice} className="bg-blue-100 text-blue-700 border border-blue-300 px-2 py-1 rounded text-xs font-bold hover:bg-blue-200 transition">
                    📄 View PDF
                </button>
            )}

            <button onClick={openInspector} className="bg-slate-100 border px-2 py-1 rounded text-xs hover:bg-slate-200 transition">Inspect</button>
            
            {shipment.invoice_status === 'Approved' && (
                <button onClick={verifyChain} className="bg-slate-700 text-white px-2 py-1 rounded text-xs hover:bg-slate-800 transition">Verify</button>
            )}

            {/* REVIEW MODAL */}
            {showReviewModal && (
                <div className="fixed inset-0 bg-slate-900 bg-opacity-75 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg border-l-4 border-red-500 shadow-2xl">
                        <h3 className="font-bold text-red-600 mb-2 text-lg">⚡ Admin Approval Required</h3>
                        <div className="bg-slate-50 p-4 rounded-lg mb-4 max-h-40 overflow-y-auto border border-slate-200">
                            <table className="w-full text-xs text-left">
                                <thead className="text-slate-500 border-b"><tr><th>Item</th><th>Qty</th><th>Weight</th></tr></thead>
                                <tbody>
                                    {items.map((it, i) => (
                                        <tr key={i}><td className="py-1 font-bold">{it.grade}</td><td>{it.qty}</td><td>{it.weight}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleReset} className="flex-1 bg-red-50 text-red-700 py-2 rounded-lg font-bold border border-red-200 hover:bg-red-100 transition">Reject</button>
                            <button onClick={handleLock} disabled={loading} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg font-bold hover:bg-emerald-700 shadow-md transition">
                                {loading ? "Locking..." : "Approve & Lock PDF"}
                            </button>
                        </div>
                        <button onClick={() => setShowReviewModal(false)} className="w-full mt-3 text-xs text-slate-400 hover:text-slate-600">Cancel</button>
                    </div>
                </div>
            )}

            {/* INSPECTOR MODAL */}
            {showInspector && (
                <div className="fixed inset-0 bg-slate-900 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl">
                        <h3 className="font-bold text-slate-900 mb-4 text-lg">📦 Packing List Inspector</h3>
                        <div className="bg-slate-50 p-4 rounded-lg mb-4 max-h-60 overflow-y-auto border border-slate-200">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-100"><tr><th className="p-2">Item</th><th className="p-2">Qty</th><th className="p-2">Weight</th></tr></thead>
                                <tbody>
                                    {items.length > 0 ? items.map((it, i) => (
                                        <tr key={i} className="border-t"><td className="p-2 font-medium">{it.grade}</td><td className="p-2">{it.qty}</td><td className="p-2">{it.weight}</td></tr>
                                    )) : <tr><td colSpan="3" className="p-4 text-center text-slate-400">No items found</td></tr>}
                                </tbody>
                            </table>
                        </div>
                        <button onClick={() => setShowInspector(false)} className="w-full border py-2 rounded-lg hover:bg-slate-50 transition">Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}