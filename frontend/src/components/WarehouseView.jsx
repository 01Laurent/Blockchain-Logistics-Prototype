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
        } catch (e) { alert("Error reading packing list"); }
    };

    const handleDispatch = async () => {
        if(!confirm("Mark shipment as dispatched?")) return;
        try { 
            await axios.post(`${API_URL}/dispatch/${shipment.shipment_id}`, { userId: user.id }); 
            refreshData(); 
        } catch(e) { alert("Failed to dispatch"); }
    };

    const handleDelivery = async () => {
        if(!confirm("Confirm delivery complete?")) return;
        try { 
            await axios.post(`${API_URL}/confirm/${shipment.shipment_id}`, { userId: user.id }); 
            refreshData(); 
        } catch(e) { alert("Failed to confirm delivery"); }
    };

    return (
        <>
            <div className="flex space-x-2">
                {/* View Items Button */}
                <button 
                    onClick={openPacking} 
                    className="bg-purple-500/20 text-purple-300 px-3 py-1.5 rounded-lg text-xs font-bold border border-purple-500/30 hover:bg-purple-500/30 transition flex items-center"
                >
                    <svg className="w-3 h-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    Items
                </button>
                
                {/* Print Label Button */}
                <button 
                    onClick={() => setShowLabel(true)} 
                    className="bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-600 hover:bg-slate-600 transition flex items-center"
                >
                    <svg className="w-3 h-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Label
                </button>

                {/* Dispatch Button */}
                {shipment.status === 'Created' && (
                    <button 
                        onClick={handleDispatch} 
                        className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md hover:from-indigo-500 hover:to-indigo-600 transition flex items-center"
                    >
                        <svg className="w-3 h-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Dispatch
                    </button>
                )}
                
                {/* Confirm Delivery Button */}
                {shipment.status === 'In-Transit' && (
                    <button 
                        onClick={handleDelivery} 
                        className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md hover:from-emerald-500 hover:to-emerald-600 transition flex items-center"
                    >
                        <svg className="w-3 h-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Confirm
                    </button>
                )}
            </div>

            {/* PACKING LIST MODAL */}
            {showPacking && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl w-full max-w-2xl border border-slate-700">
                        {/* Header */}
                        <div className="border-b border-slate-700 p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="bg-purple-500/20 p-3 rounded-xl mr-4">
                                        <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-200">Packing List Inspector</h3>
                                        <p className="text-sm text-slate-400 font-mono">{shipment.tracking_number}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setShowPacking(false)}
                                    className="text-slate-400 hover:text-slate-200 transition"
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <div className="bg-slate-700/30 rounded-xl border border-slate-600 overflow-hidden">
                                {items.length > 0 ? (
                                    <table className="w-full">
                                        <thead className="bg-slate-700/50">
                                            <tr className="text-slate-300 text-left text-xs uppercase tracking-wider">
                                                <th className="p-4 font-semibold">Tea Grade</th>
                                                <th className="p-4 font-semibold">Quantity</th>
                                                <th className="p-4 font-semibold">Weight (KG)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-700">
                                            {items.map((it, i) => (
                                                <tr key={i} className="text-slate-300 hover:bg-slate-700/30">
                                                    <td className="p-4 font-medium">{it.grade}</td>
                                                    <td className="p-4">{it.qty}</td>
                                                    <td className="p-4">{it.weight}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="p-12 text-center text-slate-500">
                                        <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                        </svg>
                                        <p className="text-sm mb-1">No Items Found</p>
                                        <p className="text-xs text-slate-600">Check with Logistics team</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="border-t border-slate-700 p-6">
                            <button 
                                onClick={() => setShowPacking(false)} 
                                className="w-full px-5 py-2.5 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700/50 font-medium transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SHIPPING LABEL MODAL */}
            {showLabel && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6 rounded-t-xl">
                            <h3 className="text-2xl font-bold tracking-tight">EASTERN PRODUCE</h3>
                            <p className="text-xs text-slate-300 uppercase tracking-widest font-bold mt-1">Official Shipment Label</p>
                        </div>

                        {/* QR Code */}
                        <div className="p-8 text-center">
                            <div className="border-4 border-slate-900 p-4 inline-block mb-6 bg-white shadow-inner">
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ID:${shipment.tracking_number}|ORIGIN:${shipment.origin}`} 
                                    alt="Shipping Label QR Code" 
                                />
                            </div>

                            {/* Shipment Details */}
                            <div className="bg-slate-50 border-2 border-slate-900 p-5 rounded-lg text-left space-y-2 font-mono text-sm">
                                <div className="flex justify-between">
                                    <span className="font-bold text-slate-600">TRACKING:</span>
                                    <span className="text-slate-900 font-bold">{shipment.tracking_number}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-bold text-slate-600">FROM:</span>
                                    <span className="text-slate-900">{shipment.origin}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-bold text-slate-600">TO:</span>
                                    <span className="text-slate-900">{shipment.destination}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t-2 border-slate-300">
                                    <span className="font-bold text-emerald-600">STATUS:</span>
                                    <span className="text-emerald-700 font-bold">VERIFIED PACKING</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t flex space-x-3">
                            <button 
                                onClick={() => window.print()} 
                                className="flex-1 bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 shadow-lg transition flex items-center justify-center"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                Print Label
                            </button>
                            <button 
                                onClick={() => setShowLabel(false)} 
                                className="flex-1 border-2 border-slate-300 text-slate-700 py-3 rounded-lg font-bold hover:bg-slate-50 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}