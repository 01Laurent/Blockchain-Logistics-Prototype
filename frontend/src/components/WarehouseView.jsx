import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://192.168.1.67:3000/api';

export default function WarehouseView({ shipment, user, refreshData }) {
    const [showPacking, setShowPacking] = useState(false);
    const [showLabel, setShowLabel] = useState(false);
    const [items, setItems] = useState([]);

    const openPacking = () => {
        try {
            setItems(shipment.packing_list ? JSON.parse(shipment.packing_list) : []);
            setShowPacking(true);
        } catch (e) { alert("Error reading list"); }
    };

    const handleDispatch = async () => {
        if(!confirm("Dispatch?")) return;
        try { await axios.post(`${API_URL}/dispatch/${shipment.shipment_id}`, { userId: user.id }); refreshData(); } catch(e){}
    };

    const handleDelivery = async () => {
        if(!confirm("Confirm Arrival?")) return;
        try { await axios.post(`${API_URL}/confirm/${shipment.shipment_id}`, { userId: user.id }); refreshData(); } catch(e){}
    };

    return (
        <div className="flex space-x-2">
            <button onClick={openPacking} className="bg-purple-100 text-purple-700 px-3 py-1 rounded text-xs font-bold border border-purple-300 hover:bg-purple-200 transition">
                📦 View Items
            </button>
            
            <button onClick={() => setShowLabel(true)} className="bg-slate-100 border px-2 py-1 rounded text-xs hover:bg-slate-200 transition">
                Label
            </button>

            {shipment.status === 'Created' && (
                <button onClick={handleDispatch} className="bg-indigo-600 text-white px-2 py-1 rounded text-xs font-bold shadow hover:bg-indigo-700 transition">
                    Dispatch
                </button>
            )}
            
            {shipment.status === 'In-Transit' && (
                <button onClick={handleDelivery} className="bg-emerald-600 text-white px-2 py-1 rounded text-xs font-bold shadow hover:bg-emerald-700 transition">
                    Confirm
                </button>
            )}

            {/* PACKING MODAL */}
            {showPacking && (
                <div className="fixed inset-0 bg-slate-900 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl border-l-4 border-purple-500">
                        <h3 className="font-bold text-slate-900 mb-4 text-lg">📦 Warehouse Inspector</h3>
                        <p className="text-sm text-slate-500 mb-2">Tracking: <span className="font-mono font-bold text-slate-800">{shipment.tracking_number}</span></p>
                        <div className="bg-slate-50 p-4 rounded-lg mb-4 max-h-60 overflow-y-auto border border-slate-200">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-100 text-slate-500"><tr><th className="p-2">Item</th><th className="p-2">Qty</th><th className="p-2">Weight</th></tr></thead>
                                <tbody>
                                    {items.length > 0 ? items.map((it, i) => (
                                        <tr key={i} className="border-t"><td className="p-2 font-medium">{it.grade}</td><td className="p-2">{it.qty}</td><td className="p-2">{it.weight}</td></tr>
                                    )) : <tr><td colSpan="3" className="p-4 text-center text-red-400 italic">No Items Found. Check with Logistics.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                        <button onClick={() => setShowPacking(false)} className="w-full border py-2 rounded-lg hover:bg-slate-50 transition">Close</button>
                    </div>
                </div>
            )}

            {/* LABEL MODAL */}
            {showLabel && (
                <div className="fixed inset-0 bg-slate-900 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md text-center border border-slate-200">
                        <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">EASTERN PRODUCE</h3>
                        <p className="text-xs text-slate-500 mb-6 uppercase tracking-widest font-bold">Official Shipment Label</p>
                        <div className="border-4 border-slate-900 p-4 inline-block mb-6 bg-white shadow-inner">
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ID:${shipment.tracking_number}|ORIGIN:${shipment.origin}`} alt="QR" />
                        </div>
                        <div className="text-left bg-slate-50 p-4 rounded-lg mb-6 text-sm space-y-2 font-mono border border-slate-200 shadow-inner">
                            <p><strong className="text-slate-900">TRACKING:</strong> {shipment.tracking_number}</p>
                            <p><strong className="text-slate-900">ORIGIN:</strong> {shipment.origin}</p>
                            <p><strong className="text-emerald-600">STATUS:</strong> VERIFIED PACKING</p>
                        </div>
                        <div className="flex space-x-3">
                            <button onClick={() => window.print()} className="flex-1 bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 shadow-lg transition">🖨 Print</button>
                            <button onClick={() => setShowLabel(false)} className="flex-1 border border-slate-300 text-slate-700 py-3 rounded-lg font-bold hover:bg-slate-50 transition">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}