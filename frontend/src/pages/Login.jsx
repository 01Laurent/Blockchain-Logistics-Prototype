import { useState } from 'react';
import axios from 'axios';

export default function Login({ setUser }) {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Determine Role based on Username (Simple Mock for Prototype)
            let role = 'Sales';
            const lowerUser = username.toLowerCase();
            if(lowerUser.includes('logistics')) role = 'Logistics';
            if(lowerUser.includes('warehouse')) role = 'Warehouse';
            if(lowerUser.includes('accounts')) role = 'Accounts';
            if(lowerUser.includes('admin')) role = 'Admin';


            const res = await axios.post('http://localhost:3000/api/auth/login', { 
                username, 
                password: 'password123' 
            });
            
            // Save user with detected role
            setUser({ ...res.data.user, role: role });
        } catch (err) {
            alert('Login Failed: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                {/* Logo / Icon Area */}
                <div className="mx-auto h-16 w-16 bg-gray-900 rounded-lg flex items-center justify-center shadow-xl transform rotate-3 hover:rotate-0 transition duration-300">
                    <svg className="h-9 w-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                </div>
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                    Logistics Chain
                </h2>
                <p className="mt-2 text-center text-sm text-gray-500">
                    Secure Blockchain Verification System
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-2xl shadow-gray-200 sm:rounded-xl sm:px-10 border border-gray-100">
                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div>
                            <label htmlFor="username" className="block text-sm font-semibold text-gray-700">
                                Username
                            </label>
                            <div className="mt-2 relative">
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent sm:text-sm transition"
                                    placeholder="e.g. sales_user"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                                Password
                            </label>
                            <div className="mt-2 relative">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    defaultValue="password123"
                                    className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent sm:text-sm transition"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-gray-800 hover:shadow-lg transform hover:-translate-y-0.5'} transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900`}
                            >
                                {loading ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Authenticating...
                                    </span>
                                ) : "Sign in to Dashboard"}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-3 bg-white text-gray-400 font-medium">
                                    Select a Role to Demo
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            {['sales_user', 'logistics_user', 'warehouse_user', 'accounts_user'].map((usr) => (
                                <button
                                    key={usr}
                                    onClick={() => setUsername(usr)}
                                    className="w-full inline-flex justify-center items-center py-2 px-4 border border-gray-200 rounded-lg shadow-sm bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 transition duration-200"
                                >
                                    {usr.replace('_user', '')}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                
                <p className="mt-6 text-center text-xs text-gray-400">
                    &copy; 2026 Eastern Produce Logistics Prototype
                </p>
            </div>
        </div>
    );
}