import { useState, useEffect } from 'react';
import axios from 'axios';

// Standard Tea Grades for Eastern Produce
const TEA_GRADES = ["BP1 (Broken Pekoe 1)", "PF1 (Pekoe Fannings 1)", "PD (Pekoe Dust)", "D1 (Dust 1)", "Green Tea Extract", "Purple Tea (Specialty)"];

// YOUR IP
const API_URL = 'http://192.168.1.67:3000/api';
const BASE_URL = 'http://192.168.1.67:3000';

export default function Dashboard({ user, logout }) {
    const [shipments, setShipments] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // STATES
    const [logs, setLogs] = useState([]);
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'Sales' });
    const [newShipment, setNewShipment] = useState({ sender: '', receiver: '', origin: '', destination: '', value: '' });
    
    // MODALS
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [showAdminReviewModal, setShowAdminReviewModal] = useState(false);
    const [showPackingListModal, setShowPackingListModal] = useState(false); 
    const [showLabelModal, setShowLabelModal] = useState(false);

    const [currentShipment, setCurrentShipment] = useState(null);
    const [invoiceItems, setInvoiceItems] = useState([]); 
    const [currentItem, setCurrentItem] = useState({ grade: TEA_GRADES[0], qty: '', weight: '' });

    // Load Data
    useEffect(() => {
        fetchShipments();
        if(user.role === 'Admin') fetchLogs();
        const interval = setInterval(() => { fetchShipments(); if(user.role === 'Admin') fetchLogs(); }, 5000); 
        return () => clearInterval(interval);
    }, [user.role]);

    const fetchShipments = async () => {
        try { const res = await axios.get(`${API_URL}/shipments`); setShipments(res.data); } catch (err) { console.error(err); }
    };
    const fetchLogs = async () => {
        try { const res = await axios.get(`${API_URL}/admin/logs`); setLogs(res.data); } catch (err) { console.error(err); }
    };

    // --- ACTIONS ---

    const handleCreateShipment = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${API_URL}/shipments`, { ...newShipment, userId: user.id });
            alert("Order Placed Successfully!");
            setNewShipment({ sender: '', receiver: '', origin: '', destination: '', value: '' });
            fetchShipments();
        } catch (err) { alert("Error creating shipment"); }
        setLoading(false);
    };

    // LOGISTICS: Create Draft
    const openInvoiceBuilder = (shipment) => {
        setCurrentShipment(shipment);
        setInvoiceItems([]); 
        setShowInvoiceModal(true);
    };
    const addItemToInvoice = () => {
        if(!currentItem.qty) return alert("Enter Qty");
        setInvoiceItems([...invoiceItems, currentItem]);
    };
    const submitDraftInvoice = async () => {
        if (invoiceItems.length === 0) return alert("Add items");
        setLoading(true);
        try {
            await axios.post(`${API_URL}/logistics/draft-invoice/${currentShipment.shipment_id}`, { packingList: invoiceItems, userId: user.id });
            alert("✅ Draft Submitted to Admin");
            setShowInvoiceModal(false);
            fetchShipments();
        } catch (err) { alert("Failed"); }
        setLoading(false);
    };

    // ADMIN: Review
    const openAdminReview = (shipment) => {
        setCurrentShipment(shipment);
        try {
            const items = shipment.packing_list ? JSON.parse(shipment.packing_list) : [];
            setInvoiceItems(items);
            setShowAdminReviewModal(true);
        } catch (e) { setInvoiceItems([]); }
    };
    const handleAdminLock = async () => {
        if(!confirm("Lock Invoice on Blockchain?")) return;
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/admin/lock-invoice/${currentShipment.shipment_id}`, { userId: user.id });
            alert(`✅ Locked! Hash: ${res.data.hash}`);
            setShowAdminReviewModal(false);
            fetchShipments();
        } catch (err) { alert("Locking Failed"); }
        setLoading(false);
    };
    const handleAdminReset = async () => {
        if(!confirm("Reject?")) return;
        try {
            await axios.post(`${API_URL}/admin/reset-invoice/${currentShipment.shipment_id}`, { userId: user.id });
            alert("Invoice Rejected.");
            setShowAdminReviewModal(false);
            fetchShipments();
        } catch (err) { alert("Reset Failed"); }
    };

    // WAREHOUSE
    const openPackingInspector = (shipment) => {
        setCurrentShipment(shipment);
        try {
            const items = shipment.packing_list ? JSON.parse(shipment.packing_list) : [];
            setInvoiceItems(items);
            setShowPackingListModal(true);
        } catch (e) {
            alert("No items found. Ensure Logistics created the draft.");
            setInvoiceItems([]);
        }
    };
    const openLabelPrinter = (shipment) => { setCurrentShipment(shipment); setShowLabelModal(true); };
    const handleDispatch = async (id) => {
        if(!confirm("Dispatch?")) return;
        try { await axios.post(`${API_URL}/dispatch/${id}`, { userId: user.id }); fetchShipments(); } catch(e){}
    };
    const handleDelivery = async (id) => {
        if(!confirm("Confirm Arrival?")) return;
        try { await axios.post(`${API_URL}/confirm/${id}`, { userId: user.id }); fetchShipments(); } catch(e){}
    };

    // VIEW FILE (ADMIN/ACCOUNTS)
    const viewInvoiceFile = (filename) => {
        if(!filename) return alert("Invoice not generated yet.");
        // This is the fix. It now points to the clean URL.
        // If the DB has a full path (from old code), we strip it.
        const cleanName = filename.split('/').pop().split('\\').pop(); 
        window.open(`${BASE_URL}/uploads/${cleanName}`, '_blank');
    };

    // VERIFY
    const verifyInvoice = async (shipment) => {
        try {
            const res = await axios.get(`${API_URL}/shipments/${shipment.shipment_id}/status`);
            if (res.data.blockchainHash && res.data.blockchainHash !== "0x") alert(`✅ VERIFIED!\nHash: ${res.data.blockchainHash.substring(0,10)}...`);
            else alert("⚠️ Not Anchored");
        } catch (err) { alert("Error"); }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try { await axios.post(`${API_URL}/admin/users`, { ...newUser, adminId: user.id }); alert("User Created!"); } catch (err) { alert("Failed"); }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
            <nav className="bg-slate-900 shadow-lg sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-16 items-center">
                    <span className="text-xl font-bold text-white">Eastern Produce Logistics</span>
                    <div className="flex items-center space-x-4">
                        <span className="text-emerald-400 font-bold uppercase text-xs">{user.role}</span>
                        <button onClick={logout} className="bg-slate-800 text-slate-300 hover:text-white px-3 py-1 rounded text-sm">Logout</button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-8 px-4">
                {user.role === 'Admin' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                        <div className="bg-white shadow p-6 rounded-xl border border-slate-100">
                            <h3 className="font-bold text-slate-900 mb-4">👤 Create User</h3>
                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <input placeholder="Username" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} className="w-full border p-2 rounded" required />
                                <input placeholder="Password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full border p-2 rounded" required />
                                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full border p-2 rounded">
                                    <option>Sales</option><option>Logistics</option><option>Warehouse</option><option>Accounts</option><option>Admin</option>
                                </select>
                                <button type="submit" className="w-full bg-slate-800 text-white py-2 rounded font-bold">Create</button>
                            </form>
                        </div>
                        <div className="bg-white shadow p-6 rounded-xl border border-slate-100 h-64 overflow-y-auto">
                            <h3 className="font-bold text-slate-900 mb-4">🛡️ Audit Logs</h3>
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 sticky top-0"><tr><th className="p-2">User</th><th className="p-2">Action</th><th className="p-2">Details</th></tr></thead>
                                <tbody>
                                    {logs.map(log => (
                                        <tr key={log.log_id} className="border-b">
                                            <td className="p-2 font-bold">{log.username}</td>
                                            <td className="p-2 text-indigo-600">{log.action}</td>
                                            <td className="p-2 text-slate-500">{log.details}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {user.role === 'Sales' && (
                    <div className="bg-white shadow p-6 rounded-xl mb-8 border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-4">📝 Place Order</h3>
                        <form onSubmit={handleCreateShipment} className="grid grid-cols-2 gap-4">
                            <input placeholder="Sender" value={newShipment.sender} onChange={e => setNewShipment({...newShipment, sender: e.target.value})} className="border p-2 rounded" />
                            <input placeholder="Receiver" value={newShipment.receiver} onChange={e => setNewShipment({...newShipment, receiver: e.target.value})} className="border p-2 rounded" />
                            <input placeholder="Origin" value={newShipment.origin} onChange={e => setNewShipment({...newShipment, origin: e.target.value})} className="border p-2 rounded" />
                            <input placeholder="Destination" value={newShipment.destination} onChange={e => setNewShipment({...newShipment, destination: e.target.value})} className="border p-2 rounded" />
                            <input placeholder="Value" type="number" value={newShipment.value} onChange={e => setNewShipment({...newShipment, value: e.target.value})} className="border p-2 rounded" />
                            <button type="submit" disabled={loading} className="col-span-2 bg-emerald-600 text-white font-bold py-2 rounded">Place Order</button>
                        </form>
                    </div>
                )}

                <h3 className="font-bold text-slate-800 mb-4">Active Shipments</h3>
                <div className="bg-white shadow rounded-xl overflow-hidden border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Tracking</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Details</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {shipments.map((ship) => (
                                <tr key={ship.shipment_id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-bold text-slate-900">{ship.tracking_number}</td>
                                    <td className="px-6 py-4 text-sm">{ship.origin} ➝ {ship.destination}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${ship.invoice_status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            Inv: {ship.invoice_status || 'Pending'}
                                        </span>
                                        <span className="ml-2 px-2 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800">{ship.status}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium space-x-2">
                                        {user.role === 'Logistics' && (
                                            ship.invoice_status === 'Pending' || ship.invoice_status === null ? 
                                            <button onClick={() => openInvoiceBuilder(ship)} className="bg-amber-100 text-amber-800 px-3 py-1 rounded text-xs font-bold border border-amber-300">Create Draft</button> :
                                            ship.invoice_status === 'Draft' ? <span className="text-xs text-amber-600 italic">Waiting Admin</span> :
                                            <span className="text-xs text-green-600 font-bold">✔ Locked</span>
                                        )}

                                        {user.role === 'Admin' && (
                                            <>
                                                {ship.invoice_status === 'Draft' && (
                                                    <button onClick={() => openAdminReview(ship)} className="bg-red-100 text-red-800 border border-red-300 px-3 py-1 rounded text-xs font-bold animate-pulse">⚡ Review Draft</button>
                                                )}
                                                {ship.invoice_status === 'Approved' && (
                                                    <button onClick={() => viewInvoiceFile(ship.file_path)} className="bg-blue-100 text-blue-700 border border-blue-300 px-2 py-1 rounded text-xs font-bold">📄 View Invoice</button>
                                                )}
                                                <button onClick={() => openPackingInspector(ship)} className="bg-slate-100 border px-2 py-1 rounded text-xs">Items</button>
                                                {ship.invoice_status === 'Approved' && <button onClick={() => verifyInvoice(ship)} className="bg-slate-700 text-white px-2 py-1 rounded text-xs">Verify Chain</button>}
                                            </>
                                        )}

                                        {user.role === 'Warehouse' && (
                                            <div className="flex space-x-2">
                                                <button onClick={() => openPackingInspector(ship)} className="bg-purple-100 text-purple-700 px-3 py-1 rounded text-xs font-bold border border-purple-300">📦 View Packing List</button>
                                                <button onClick={() => openLabelPrinter(ship)} className="bg-slate-100 border px-2 py-1 rounded text-xs">Label</button>
                                                {ship.status === 'Created' && <button onClick={() => handleDispatch(ship.shipment_id)} className="bg-indigo-600 text-white px-2 py-1 rounded text-xs ml-2">Dispatch</button>}
                                                {ship.status === 'In-Transit' && <button onClick={() => handleDelivery(ship.shipment_id)} className="bg-emerald-600 text-white px-2 py-1 rounded text-xs ml-2">Confirm</button>}
                                            </div>
                                        )}

                                        {user.role === 'Accounts' && ship.invoice_status === 'Approved' ? (
                                            <button onClick={() => viewInvoiceFile(ship.file_path)} className="bg-slate-700 text-white px-3 py-1 rounded text-xs font-bold">📄 View PDF</button>
                                        ) : user.role === 'Accounts' && <span className="text-xs text-slate-400">Waiting Approval</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* MODALS */}
                {showInvoiceModal && (
                    <div className="fixed inset-0 bg-slate-900 bg-opacity-75 flex items-center justify-center z-50 transition-opacity">
                        <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg transform transition-all border border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                                <span className="bg-amber-100 text-amber-800 p-1 rounded mr-2">📄</span> Create Draft Invoice
                            </h3>
                            <div className="bg-slate-50 p-4 rounded-lg mb-4 border border-slate-200">
                                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Add Item to Shipment:</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <select className="col-span-2 border-slate-300 border p-2 rounded-md focus:ring-amber-500 focus:border-amber-500" value={currentItem.grade} onChange={e => setCurrentItem({...currentItem, grade: e.target.value})}>{TEA_GRADES.map(g=><option key={g} value={g}>{g}</option>)}</select>
                                    <input placeholder="Qty" className="border-slate-300 border p-2 rounded-md focus:ring-amber-500 focus:border-amber-500" value={currentItem.qty} onChange={e => setCurrentItem({...currentItem, qty: e.target.value})} />
                                    <input placeholder="Weight" className="border-slate-300 border p-2 rounded-md focus:ring-amber-500 focus:border-amber-500" value={currentItem.weight} onChange={e => setCurrentItem({...currentItem, weight: e.target.value})} />
                                </div>
                                <button onClick={addItemToInvoice} className="w-full mt-3 bg-slate-800 hover:bg-slate-900 text-white py-2 rounded-md text-sm font-bold transition">Add Item to List</button>
                            </div>
                            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg mb-4 bg-white">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-100"><tr><th className="p-2 font-bold text-slate-600">Grade</th><th className="p-2 font-bold text-slate-600">Qty</th><th className="p-2 font-bold text-slate-600">Weight</th></tr></thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {invoiceItems.map((it, i) => (
                                            <tr key={i}><td className="p-2 text-slate-800">{it.grade}</td><td className="p-2 text-slate-600">{it.qty}</td><td className="p-2 text-slate-600">{it.weight}</td></tr>
                                        ))}
                                        {invoiceItems.length === 0 && <tr><td colSpan="3" className="p-4 text-center text-slate-400 italic">No items added yet.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                                <button onClick={() => setShowInvoiceModal(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-medium">Cancel</button>
                                <button onClick={submitDraftInvoice} className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-bold shadow-md transition">{loading ? "Processing..." : "Submit Draft"}</button>
                            </div>
                        </div>
                    </div>
                )}

                {showAdminReviewModal && (
                    <div className="fixed inset-0 bg-slate-900 bg-opacity-75 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-lg border-l-4 border-red-500">
                            <h3 className="font-bold text-red-600 mb-2">⚡ Admin Approval Required</h3>
                            <div className="bg-slate-50 p-4 rounded mb-4 max-h-40 overflow-y-auto">
                                {invoiceItems.map((it, i) => <div key={i} className="text-sm border-b p-1">{it.grade} | {it.qty} | {it.weight}</div>)}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleAdminReset} className="flex-1 bg-red-100 text-red-700 py-2 rounded font-bold border border-red-200">Reject</button>
                                <button onClick={handleAdminLock} className="flex-1 bg-emerald-600 text-white py-2 rounded font-bold">Approve & Lock PDF</button>
                            </div>
                            <button onClick={() => setShowAdminReviewModal(false)} className="w-full mt-2 text-xs text-slate-400">Cancel</button>
                        </div>
                    </div>
                )}

                {showPackingListModal && (
                    <div className="fixed inset-0 bg-slate-900 bg-opacity-75 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-lg">
                            <h3 className="font-bold text-slate-800 mb-4">📦 Packing List Items</h3>
                            <div className="bg-slate-50 p-4 rounded mb-4 max-h-60 overflow-y-auto border border-slate-200">
                                <table className="w-full text-sm text-left">
                                    <thead><tr><th>Item</th><th>Qty</th><th>Weight</th></tr></thead>
                                    <tbody>
                                        {invoiceItems.length > 0 ? invoiceItems.map((it, i) => (
                                            <tr key={i} className="border-t"><td className="py-2">{it.grade}</td><td>{it.qty}</td><td>{it.weight}</td></tr>
                                        )) : <tr><td colSpan="3" className="py-4 text-center text-slate-400">No Items Found</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                            <button onClick={() => setShowPackingListModal(false)} className="w-full border py-2 rounded">Close</button>
                        </div>
                    </div>
                )}

                {showLabelModal && (
                    <div className="fixed inset-0 bg-slate-900 bg-opacity-75 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md text-center border border-slate-200">
                            <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">EASTERN PRODUCE</h3>
                            <p className="text-xs text-slate-500 mb-6 uppercase tracking-widest font-bold">Official Shipment Label</p>
                            <div className="border-4 border-slate-900 p-4 inline-block mb-6 bg-white"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ID:${currentShipment?.tracking_number}`} alt="QR" /></div>
                            <div className="text-left bg-slate-50 p-4 rounded-lg mb-6 text-sm space-y-2 font-mono border border-slate-200">
                                <p><strong className="text-slate-900">TRACKING:</strong> {currentShipment?.tracking_number}</p>
                                <p><strong className="text-slate-900">ORIGIN:</strong> {currentShipment?.origin}</p>
                                <p><strong className="text-emerald-600">STATUS:</strong> VERIFIED PACKING</p>
                            </div>
                            <div className="flex space-x-3">
                                <button onClick={() => window.print()} className="flex-1 bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 shadow-lg transition">🖨 Print Label</button>
                                <button onClick={() => setShowLabelModal(false)} className="flex-1 border border-slate-300 text-slate-700 py-3 rounded-lg font-bold hover:bg-slate-50 transition">Close</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}