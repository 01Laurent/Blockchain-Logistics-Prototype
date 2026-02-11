import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://192.168.1.67:3000/api'; // Ensure this matches your IP

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
            refreshData(); // Refresh parent list
        } catch (err) {
            alert("Error creating shipment");
        }
        setLoading(false);
    };

    return (
        <div className="bg-white shadow-xl shadow-slate-200 rounded-xl p-6 mb-8 border border-slate-100">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                <span className="bg-emerald-100 text-emerald-800 p-2 rounded-full mr-3 text-sm">Step 1</span>
                Place New Order
            </h3>
            <form onSubmit={handleCreateShipment} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Sender</label>
                    <input placeholder="Ex: Kericho Tea Estates" value={newShipment.sender} onChange={e => setNewShipment({...newShipment, sender: e.target.value})} required className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 border p-3" />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Receiver</label>
                    <input placeholder="Ex: Tesco UK" value={newShipment.receiver} onChange={e => setNewShipment({...newShipment, receiver: e.target.value})} required className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 border p-3" />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Origin</label>
                    <input placeholder="Ex: Kericho" value={newShipment.origin} onChange={e => setNewShipment({...newShipment, origin: e.target.value})} required className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 border p-3" />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Destination</label>
                    <input placeholder="Ex: London Port" value={newShipment.destination} onChange={e => setNewShipment({...newShipment, destination: e.target.value})} required className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 border p-3" />
                </div>
                <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Declared Value (USD)</label>
                    <input placeholder="0.00" type="number" value={newShipment.value} onChange={e => setNewShipment({...newShipment, value: e.target.value})} required className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 border p-3" />
                </div>
                <button type="submit" disabled={loading} className="md:col-span-2 w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition">
                    {loading ? "Processing..." : "Place Order"}
                </button>
            </form>
        </div>
    );
}