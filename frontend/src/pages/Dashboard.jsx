import { useState, useEffect } from 'react';
import axios from 'axios';

import SalesView from '../components/SalesView';
import LogisticsView from '../components/LogisticsView';
import WarehouseView from '../components/WarehouseView';
import AdminView from '../components/AdminView';
import AccountsView from '../components/AccountsView';
import AdminAnalytics from '../components/AdminAnalytics';

const API_URL = 'http://localhost:3000/api';

export default function Dashboard({ user, logout }) {
    const [shipments, setShipments] = useState([]);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [logs, setLogs] = useState([]);
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'Sales' });

    const role = user?.role?.toLowerCase?.() || '';

    useEffect(() => {
        console.log('Dashboard user:', user);
        console.log('Dashboard role:', user?.role);

        fetchShipments();

        if (role === 'admin') {
            fetchLogs();
        }

        const interval = setInterval(() => {
            fetchShipments();

            if (role === 'admin') {
                fetchLogs();
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [role]);

    const fetchShipments = async () => {
        try {
            const res = await axios.get(`${API_URL}/shipments`);
            console.log('Shipments response:', res.data);
            setShipments(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            console.error('Failed to fetch shipments', e);
            setShipments([]);
        }
    };

    const fetchLogs = async () => {
        try {
            const res = await axios.get(`${API_URL}/admin/logs`);
            console.log('Logs response:', res.data);
            setLogs(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            console.error('Failed to fetch logs', e);
            setLogs([]);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/admin/users`, { ...newUser, adminId: user.id });
            alert('User Created!');
        } catch (e) {
            console.error('Failed to create user:', e);
            alert('Failed');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
            <nav className="bg-slate-900 shadow-lg sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-16 items-center">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-emerald-600 rounded-lg">
                            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                />
                            </svg>
                        </div>
                        <span className="text-xl font-bold text-white tracking-wide">
                            Eastern Produce Logistics
                        </span>
                    </div>

                    <div className="flex items-center space-x-3 sm:space-x-4">
                        {role === 'admin' && (
                            <a
                                href="/demo"
                                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold bg-amber-400 text-slate-900 hover:bg-amber-300 transition border border-amber-200 shadow-sm"
                                title="Open tampering demonstration"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                                Tampering Demo
                            </a>
                        )}

                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold text-slate-100">{user.username}</p>
                            <p className="text-xs text-emerald-400 uppercase tracking-wider font-bold">
                                {user.role}
                            </p>
                        </div>

                        <button
                            onClick={logout}
                            className="bg-slate-800 text-slate-300 hover:text-white px-4 py-2 rounded-md text-sm font-medium transition border border-slate-700"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-8 px-4">
                {role === 'admin' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                        <div className="bg-white shadow-xl shadow-slate-200 rounded-xl p-6 border border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                                <span className="bg-indigo-100 text-indigo-800 p-2 rounded-full mr-3 text-xs">
                                    ADMIN
                                </span>
                                👤 User Management
                            </h3>

                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <input
                                    placeholder="New Username"
                                    value={newUser.username}
                                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                    className="w-full border-slate-300 rounded-lg p-2 border shadow-sm"
                                    required
                                />

                                <input
                                    placeholder="Password"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                    className="w-full border-slate-300 rounded-lg p-2 border shadow-sm"
                                    required
                                />

                                <select
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                    className="w-full border-slate-300 rounded-lg p-2 border shadow-sm"
                                >
                                    <option>Sales</option>
                                    <option>Logistics</option>
                                    <option>Warehouse</option>
                                    <option>Accounts</option>
                                    <option>Admin</option>
                                </select>

                                <button
                                    type="submit"
                                    className="w-full bg-slate-800 text-white py-2 rounded-lg font-bold hover:bg-slate-900 transition"
                                >
                                    Create User
                                </button>
                            </form>
                        </div>

                        <div className="bg-white shadow-xl shadow-slate-200 rounded-xl p-6 border border-slate-100 h-64 overflow-y-auto">
                            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                                <span className="bg-indigo-100 text-indigo-800 p-2 rounded-full mr-3 text-xs">
                                    AUDIT
                                </span>
                                🛡️ System Logs
                            </h3>

                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 sticky top-0">
                                    <tr>
                                        <th className="p-2 font-bold text-slate-600">Time</th>
                                        <th className="p-2 font-bold text-slate-600">User</th>
                                        <th className="p-2 font-bold text-slate-600">Action</th>
                                        <th className="p-2 font-bold text-slate-600">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {logs.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="p-4 text-center text-slate-500">
                                                No logs found.
                                            </td>
                                        </tr>
                                    ) : (
                                        logs.map((log) => (
                                            <tr key={log.log_id} className="hover:bg-slate-50">
                                                <td className="p-2 text-slate-500 whitespace-nowrap">
                                                    {new Date(log.timestamp).toLocaleTimeString()}
                                                </td>
                                                <td className="p-2 font-bold text-slate-700">{log.username}</td>
                                                <td className="p-2 text-indigo-600 font-mono font-bold">{log.action}</td>
                                                <td className="p-2 text-slate-600 truncate max-w-xs">{log.details}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {role === 'sales' && <SalesView user={user} refreshData={fetchShipments} />}

                {role === 'admin' && (
                    <div className="mb-6">
                        <button
                            onClick={() => setShowAnalytics(!showAnalytics)}
                            className="bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-slate-800 border border-slate-700 transition-all duration-300 font-bold shadow-lg hover:shadow-xl flex items-center gap-2"
                        >
                            {showAnalytics ? (
                                <>
                                    <span className="text-xl">📋</span>
                                    <span>View Shipments</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-xl">📊</span>
                                    <span>View Analytics</span>
                                </>
                            )}
                        </button>
                    </div>
                )}

                {role === 'admin' && showAnalytics ? (
                    <AdminAnalytics />
                ) : (
                    <>
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Active Shipments</h3>

                        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-slate-200">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                                            Tracking
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                                            Details
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-200">
                                    {shipments.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                                                No shipments found.
                                            </td>
                                        </tr>
                                    ) : (
                                        shipments.map((ship) => (
                                            <tr key={ship.shipment_id} className="hover:bg-slate-50 transition">
                                                <td className="px-6 py-4 font-bold text-slate-900">
                                                    {ship.tracking_number}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-slate-700">
                                                    {ship.origin} ➝ {ship.destination}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`px-2 py-1 text-xs font-bold rounded-full border ${
                                                            ship.invoice_status === 'Approved'
                                                                ? 'bg-green-100 text-green-800 border-green-200'
                                                                : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                                        }`}
                                                    >
                                                        Inv: {ship.invoice_status || 'Pending'}
                                                    </span>

                                                    <span className="ml-2 px-2 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                                                        {ship.status}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4 text-sm font-medium">
                                                    {role === 'sales' && (
                                                        <img
                                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=50x50&data=${ship.tracking_number}`}
                                                            alt="QR"
                                                            className="h-8 w-8"
                                                        />
                                                    )}

                                                    {role === 'logistics' && (
                                                        <LogisticsView
                                                            shipment={ship}
                                                            user={user}
                                                            refreshData={fetchShipments}
                                                        />
                                                    )}

                                                    {role === 'warehouse' && (
                                                        <WarehouseView
                                                            shipment={ship}
                                                            user={user}
                                                            refreshData={fetchShipments}
                                                        />
                                                    )}

                                                    {role === 'admin' && (
                                                        <AdminView
                                                            shipment={ship}
                                                            user={user}
                                                            refreshData={fetchShipments}
                                                        />
                                                    )}

                                                    {role === 'accounts' && <AccountsView shipment={ship} />}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}