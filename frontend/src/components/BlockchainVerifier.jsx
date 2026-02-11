import React, { useState } from 'react';
import axios from 'axios';

// Update this to your computer's IP address
const API_URL = 'http://192.168.1.67:3000/api';

const BlockchainVerifier = ({ initialTrackingId = '' }) => {
    const [trackingId, setTrackingId] = useState(initialTrackingId);
    const [verificationData, setVerificationData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleVerify = async (e) => {
        if (e) e.preventDefault();
        if (!trackingId) return;

        setLoading(true);
        setError('');
        setVerificationData(null);

        try {
            // 1. Get Shipment ID from Tracking Number (We need to search for it)
            // In a real app, you'd have a specific endpoint like /api/shipments/track/:id
            // For this prototype, we'll fetch all and find it (simple but works)
            const res = await axios.get(`${API_URL}/shipments`);
            const shipment = res.data.find(s => s.tracking_number === trackingId);

            if (!shipment) {
                throw new Error("Tracking ID not found in system.");
            }

            // 2. Get Blockchain Status
            const statusRes = await axios.get(`${API_URL}/shipments/${shipment.shipment_id}/status`);
            
            setVerificationData({
                local: shipment,
                chain: statusRes.data
            });

        } catch (err) {
            console.error(err);
            setError(err.message || "Verification Failed");
        } finally {
            setLoading(false);
        }
    };

    // If initialTrackingId changes (e.g. parent passed a new one), update state
    React.useEffect(() => {
        if (initialTrackingId) {
            setTrackingId(initialTrackingId);
            // Optional: Auto-verify if passed? Uncomment below line if desired
            // handleVerify();
        }
    }, [initialTrackingId]);

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                <span className="bg-indigo-100 text-indigo-700 p-2 rounded-full mr-2">🛡️</span>
                Blockchain Verifier
            </h3>

            {/* Search Input (Only show if not verifying a specific item) */}
            <div className="flex gap-2 mb-6">
                <input 
                    type="text" 
                    placeholder="Enter Tracking ID (e.g. TRK-123456)" 
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    className="flex-1 border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button 
                    onClick={handleVerify} 
                    disabled={loading}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition disabled:opacity-50"
                >
                    {loading ? "Scanning..." : "Verify"}
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                    {error}
                </div>
            )}

            {/* Results Display */}
            {verificationData && (
                <div className="space-y-4 animate-fade-in-up">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <div>
                            <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Verification Status</p>
                            <div className="flex items-center mt-1">
                                {verificationData.chain.blockchainHash && verificationData.chain.blockchainHash !== "0x" ? (
                                    <>
                                        <span className="flex h-3 w-3 relative mr-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                        </span>
                                        <span className="text-lg font-bold text-emerald-700">AUTHENTIC & SECURED</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="h-3 w-3 rounded-full bg-amber-500 mr-2"></span>
                                        <span className="text-lg font-bold text-amber-700">PENDING BLOCKCHAIN LOCK</span>
                                    </>
                                )}
                            </div>
                        </div>
                        {/* QR Code Placeholder */}
                        <div className="hidden sm:block">
                            {trackingId && (
                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(trackingId)}`} alt="QR" className="border-4 border-white shadow-sm" />
                            )}
                        </div>
                    </div>

                    {/* Chain Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <p className="text-xs text-slate-500 uppercase font-bold mb-2">Smart Contract Data</p>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Payment Status:</span>
                                    <span className={`font-bold ${verificationData.chain.isPaid ? 'text-emerald-600' : 'text-slate-800'}`}>
                                        {verificationData.chain.isPaid ? "PAID" : "UNPAID"}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Delivery Status:</span>
                                    <span className={`font-bold ${verificationData.chain.isDelivered ? 'text-emerald-600' : 'text-slate-800'}`}>
                                        {verificationData.chain.isDelivered ? "DELIVERED" : "IN-TRANSIT"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <p className="text-xs text-slate-500 uppercase font-bold mb-2">Document Fingerprint</p>
                            <p className="text-xs font-mono break-all text-slate-600 bg-white p-2 rounded border border-slate-200">
                                {verificationData.chain.blockchainHash || "No Hash Found"}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1 text-right">SHA-256 / KECCAK-256</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BlockchainVerifier;