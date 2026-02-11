import { useState, useEffect } from 'react';
import axios from 'axios';

// Import our new clean components
import SalesView from '../components/SalesView';
import LogisticsView from '../components/LogisticsView';
import WarehouseView from '../components/WarehouseView';
import AdminView from '../components/AdminView';
import AccountsView from '../components/AccountsView';

const API_URL = 'http://192.168.1.67:3000/api';

export default function Dashboard({ user, logout }) {
    const [shipments, setShipments] = useState([]);
    
    // --- ADMIN SPECIFIC STATES ---
    const [logs, setLogs] = useState([]);
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'Sales' });

    // Load Data
    useEffect(() => {
        fetchShipments();
        if(user.role === 'Admin') fetchLogs();
        const interval = setInterval(() => { fetchShipments(); if(user.role === 'Admin') fetchLogs(); }, 5000); 
        return () => clearInterval(interval);
    }, [user.role]);

    const fetchShipments = async () => { try { const res = await axios.get(`${API_URL}/shipments`); setShipments(res.data); } catch (e) {} };
    const fetchLogs = async () => { try { const res = await axios.get(`${API_URL}/admin/logs`); setLogs(res.data); } catch (e) {} };

    // ADMIN USER CREATION
    const handleCreateUser = async (e) => {
        e.preventDefault();
        try { await axios.post(`${API_URL}/admin/users`, { ...newUser, adminId: user.id }); alert("User Created!"); } catch (e) { alert("Failed"); }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
            <nav className="bg-slate-900 shadow-lg sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-16 items-center">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-emerald-600 rounded-lg"><svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg></div>
                        <span className="text-xl font-bold text-white tracking-wide">Eastern Produce Logistics</span>
                    </div>
                    <div className="flex items-center space-x-6">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold text-slate-100">{user.username}</p>
                            <p className="text-xs text-emerald-400 uppercase tracking-wider font-bold">{user.role}</p>
                        </div>
                        <button onClick={logout} className="bg-slate-800 text-slate-300 hover:text-white px-4 py-2 rounded-md text-sm font-medium transition border border-slate-700">Logout</button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-8 px-4">
                
                {/* --- ADMIN PANEL --- */}
                {user.role === 'Admin' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                        <div className="bg-white shadow-xl shadow-slate-200 rounded-xl p-6 border border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                                <span className="bg-indigo-100 text-indigo-800 p-2 rounded-full mr-3 text-xs">ADMIN</span>
                                👤 User Management
                            </h3>
                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <input placeholder="New Username" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} className="w-full border-slate-300 rounded-lg p-2 border shadow-sm" required />
                                <input placeholder="Password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full border-slate-300 rounded-lg p-2 border shadow-sm" required />
                                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full border-slate-300 rounded-lg p-2 border shadow-sm">
                                    <option>Sales</option><option>Logistics</option><option>Warehouse</option><option>Accounts</option><option>Admin</option>
                                </select>
                                <button type="submit" className="w-full bg-slate-800 text-white py-2 rounded-lg font-bold hover:bg-slate-900 transition">Create User</button>
                            </form>
                        </div>

                        <div className="bg-white shadow-xl shadow-slate-200 rounded-xl p-6 border border-slate-100 h-64 overflow-y-auto">
                            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                                <span className="bg-indigo-100 text-indigo-800 p-2 rounded-full mr-3 text-xs">AUDIT</span>
                                🛡️ System Logs
                            </h3>
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 sticky top-0"><tr><th className="p-2 font-bold text-slate-600">Time</th><th className="p-2 font-bold text-slate-600">User</th><th className="p-2 font-bold text-slate-600">Action</th><th className="p-2 font-bold text-slate-600">Details</th></tr></thead>
                                <tbody className="divide-y divide-slate-100">
                                    {logs.map(log => (
                                        <tr key={log.log_id} className="hover:bg-slate-50">
                                            <td className="p-2 text-slate-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString()}</td>
                                            <td className="p-2 font-bold text-slate-700">{log.username}</td>
                                            <td className="p-2 text-indigo-600 font-mono font-bold">{log.action}</td>
                                            <td className="p-2 text-slate-600 truncate max-w-xs">{log.details}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- SALES PANEL --- */}
                {user.role === 'Sales' && <SalesView user={user} refreshData={fetchShipments} />}

                {/* --- SHIPMENTS TABLE --- */}
                <h3 className="text-xl font-bold text-slate-800 mb-4">Active Shipments</h3>
                <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-slate-200">
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
                                <tr key={ship.shipment_id} className="hover:bg-slate-50 transition">
                                    <td className="px-6 py-4 font-bold text-slate-900">{ship.tracking_number}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-700">{ship.origin} ➝ {ship.destination}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-bold rounded-full border ${ship.invoice_status === 'Approved' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}`}>
                                            Inv: {ship.invoice_status || 'Pending'}
                                        </span>
                                        <span className="ml-2 px-2 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200">{ship.status}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium">
                                        {/* DYNAMIC COMPONENT RENDERING */}
                                        {user.role === 'Sales' && <img src={`https://api.qrserver.com/v1/create-qr-code/?size=50x50&data=${ship.tracking_number}`} alt="QR" className="h-8 w-8" />}
                                        {user.role === 'Logistics' && <LogisticsView shipment={ship} user={user} refreshData={fetchShipments} />}
                                        {user.role === 'Warehouse' && <WarehouseView shipment={ship} user={user} refreshData={fetchShipments} />}
                                        {user.role === 'Admin' && <AdminView shipment={ship} user={user} refreshData={fetchShipments} />}
                                        {user.role === 'Accounts' && <AccountsView shipment={ship} />}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}