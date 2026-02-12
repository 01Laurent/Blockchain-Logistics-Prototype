import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://192.168.1.67:3000/api';

export default function SalesView({ user, refreshData }) {
    const [newShipment, setNewShipment] = useState({ sender: '', receiver: '', origin: '', destination: '', value: '' });
    const [loading, setLoading] = useState(false);

    const handleCreateShipment = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${API_URL}/shipments`, { ...newShipment, userId: user.id });
            alert("Order Placed Successfully!");
            setNewShipment({ sender: '', receiver: '', origin: '', destination: '', value: '' });
            refreshData();
        } catch (err) {
            alert("Error creating shipment");
        }
        setLoading(false);
    };

    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-8 mb-8 border border-slate-700 shadow-xl">
            {/* Background accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-3xl opacity-5"></div>
            
            <div className="relative">
                <div className="flex items-center mb-6">
                    <div className="bg-emerald-500/20 p-3 rounded-xl mr-4">
                        <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-200">Create New Shipment</h3>
                        <p className="text-slate-400 text-sm">Initiate a new tea export order</p>
                    </div>
                </div>

                <form onSubmit={handleCreateShipment} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Sender */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                            <svg className="w-3 h-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Exporter / Sender
                        </label>
                        <input 
                            placeholder="Ex: Kericho Tea Estates Ltd." 
                            value={newShipment.sender} 
                            onChange={e => setNewShipment({...newShipment, sender: e.target.value})} 
                            required 
                            className="w-full bg-slate-700/50 border-slate-600 text-slate-200 placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent border p-3.5 transition"
                        />
                    </div>

                    {/* Receiver */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                            <svg className="w-3 h-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Consignee / Receiver
                        </label>
                        <input 
                            placeholder="Ex: Tesco UK Distribution" 
                            value={newShipment.receiver} 
                            onChange={e => setNewShipment({...newShipment, receiver: e.target.value})} 
                            required 
                            className="w-full bg-slate-700/50 border-slate-600 text-slate-200 placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent border p-3.5 transition"
                        />
                    </div>

                    {/* Origin */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                            <svg className="w-3 h-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Origin Port
                        </label>
                        <input 
                            placeholder="Ex: Mombasa, Kenya" 
                            value={newShipment.origin} 
                            onChange={e => setNewShipment({...newShipment, origin: e.target.value})} 
                            required 
                            className="w-full bg-slate-700/50 border-slate-600 text-slate-200 placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent border p-3.5 transition"
                        />
                    </div>

                    {/* Destination */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                            <svg className="w-3 h-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                            </svg>
                            Destination Port
                        </label>
                        <input 
                            placeholder="Ex: London Gateway, UK" 
                            value={newShipment.destination} 
                            onChange={e => setNewShipment({...newShipment, destination: e.target.value})} 
                            required 
                            className="w-full bg-slate-700/50 border-slate-600 text-slate-200 placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent border p-3.5 transition"
                        />
                    </div>

                    {/* Value */}
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                            <svg className="w-3 h-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Declared Value (USD)
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                            <input 
                                placeholder="0.00" 
                                type="number" 
                                step="0.01"
                                value={newShipment.value} 
                                onChange={e => setNewShipment({...newShipment, value: e.target.value})} 
                                required 
                                className="w-full pl-8 bg-slate-700/50 border-slate-600 text-slate-200 placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent border p-3.5 transition"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button 
                        type="submit" 
                        disabled={loading} 
                        className="md:col-span-2 w-full flex justify-center items-center py-3.5 px-4 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Create Shipment Order
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}