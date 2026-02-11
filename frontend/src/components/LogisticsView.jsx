import React, { useState } from 'react';
import axios from 'axios';

const TEA_GRADES = ["BP1 (Broken Pekoe 1)", "PF1 (Pekoe Fannings 1)", "PD (Pekoe Dust)", "D1 (Dust 1)", "Green Tea Extract", "Purple Tea (Specialty)"];
const API_URL = 'http://192.168.1.67:3000/api'; 

export default function LogisticsView({ shipment, user, refreshData }) {
    const [showModal, setShowModal] = useState(false);
    const [invoiceItems, setInvoiceItems] = useState([]);
    const [currentItem, setCurrentItem] = useState({ grade: TEA_GRADES[0], qty: '', weight: '' });
    const [loading, setLoading] = useState(false);

    // Logic to add items to list
    const addItem = () => {
        if(!currentItem.qty || !currentItem.weight) return alert("Enter Quantity and Weight");
        setInvoiceItems([...invoiceItems, currentItem]);
        setCurrentItem({ grade: TEA_GRADES[0], qty: '', weight: '' });
    };

    // Logic to submit draft
    const submitDraft = async () => {
        if(invoiceItems.length === 0) return alert("Add items first");
        setLoading(true);
        try {
            await axios.post(`${API_URL}/logistics/draft-invoice/${shipment.shipment_id}`, { 
                packingList: invoiceItems, 
                userId: user.id 
            });
            alert("Draft Submitted to Admin!");
            setShowModal(false);
            refreshData();
        } catch (err) { alert("Failed to submit draft"); }
        setLoading(false);
    };

    return (
        <>
            {/* The Action Button in the Table */}
            {shipment.invoice_status === 'Pending' || shipment.invoice_status === null ? (
                <button onClick={() => setShowModal(true)} className="bg-amber-100 text-amber-800 px-3 py-1 rounded text-xs font-bold border border-amber-300 hover:bg-amber-200 transition">
                    Create Draft Invoice
                </button>
            ) : shipment.invoice_status === 'Draft' ? (
                <span className="text-xs text-amber-600 italic font-medium bg-amber-50 px-2 py-1 rounded border border-amber-100">⏳ Waiting Admin</span>
            ) : (
                <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded border border-green-100">✔ Locked</span>
            )}

            {/* The Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900 bg-opacity-75 flex items-center justify-center z-50 transition-opacity backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg transform transition-all border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                            <span className="bg-amber-100 text-amber-800 p-2 rounded-lg mr-2 text-xl">📄</span> 
                            Create Draft Invoice
                        </h3>
                        
                        <div className="bg-slate-50 p-4 rounded-lg mb-4 border border-slate-200">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Add Item:</p>
                            <div className="grid grid-cols-2 gap-2">
                                <select className="col-span-2 border-slate-300 border p-2 rounded-md focus:ring-amber-500 focus:border-amber-500" value={currentItem.grade} onChange={e => setCurrentItem({...currentItem, grade: e.target.value})}>
                                    {TEA_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                                <input placeholder="Qty" className="border-slate-300 border p-2 rounded-md" value={currentItem.qty} onChange={e => setCurrentItem({...currentItem, qty: e.target.value})} />
                                <input placeholder="Weight" className="border-slate-300 border p-2 rounded-md" value={currentItem.weight} onChange={e => setCurrentItem({...currentItem, weight: e.target.value})} />
                            </div>
                            <button onClick={addItem} className="w-full mt-3 bg-slate-800 hover:bg-slate-900 text-white py-2 rounded-md text-sm font-bold transition">Add Item</button>
                        </div>

                        <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg mb-4 bg-white p-2">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500"><tr><th>Grade</th><th>Qty</th><th>Weight</th></tr></thead>
                                <tbody>
                                    {invoiceItems.map((it, i) => (
                                        <tr key={i} className="border-b"><td className="p-1">{it.grade}</td><td>{it.qty}</td><td>{it.weight}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-medium transition">Cancel</button>
                            <button onClick={submitDraft} disabled={loading} className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-bold shadow-md transition">
                                {loading ? "Saving..." : "Submit Draft"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}