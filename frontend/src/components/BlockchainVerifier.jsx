import React, { useState } from 'react';
import axios from 'axios';

// Update this to your computer's IP address
const API_URL = 'http://localhost:3000/api';

const BlockchainVerifier = ({ initialTrackingId = '' }) => {
    const [trackingId, setTrackingId] = useState(initialTrackingId);
    const [verificationData, setVerificationData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [hashVerification, setHashVerification] = useState(null); // null | 'verifying' | 'match' | 'tampered'

    // ✅ NEW: Function to hash the PDF file in the browser
    const verifyPdfHash = async (filePath, blockchainHash) => {
        if (!blockchainHash || blockchainHash === '0x' || !filePath) {
            setHashVerification(null);
            return;
        }

        setHashVerification('verifying');

        try {
            // Fetch the PDF file
            const response = await fetch(`http://localhost:3000/uploads/${filePath}`);
            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();

            // Compute SHA-256 hash
            const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            // Compare hashes
            if (hashHex.toLowerCase() === blockchainHash.toLowerCase()) {
                setHashVerification('match');
            } else {
                setHashVerification('tampered');
            }
        } catch (err) {
            console.error("Hash verification error:", err);
            setHashVerification(null);
        }
    };

    const handleVerify = async (e) => {
        if (e) e.preventDefault();
        if (!trackingId) return;

        setLoading(true);
        setError('');
        setVerificationData(null);
        setHashVerification(null);

        try {
            // 1. Get Shipment ID from Tracking Number
            const res = await axios.get(`${API_URL}/shipments`);
            const shipment = res.data.find(s => s.tracking_number === trackingId);

            if (!shipment) {
                throw new Error("Tracking ID not found in system.");
            }

            // 2. Get Blockchain Status
            const statusRes = await axios.get(`${API_URL}/shipments/${shipment.shipment_id}/status`);
            
            const data = {
                local: shipment,
                chain: statusRes.data
            };

            setVerificationData(data);

            // 3. ✅ NEW: Verify the PDF hash if it exists
            if (shipment.file_path && statusRes.data.blockchainHash) {
                await verifyPdfHash(shipment.file_path, statusRes.data.blockchainHash);
            }

        } catch (err) {
            console.error(err);
            setError(err.message || "Verification Failed");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        if (initialTrackingId) {
            setTrackingId(initialTrackingId);
        }
    }, [initialTrackingId]);

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                <span className="bg-indigo-100 text-indigo-700 p-2 rounded-full mr-2">🛡️</span>
                Blockchain Verifier
            </h3>

            {/* Search Input */}
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
                        {/* QR Code */}
                        <div className="hidden sm:block">
                            {trackingId && (
                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(trackingId)}`} alt="QR" className="border-4 border-white shadow-sm" />
                            )}
                        </div>
                    </div>

                    {/* ✅ NEW: Hash Verification Indicator */}
                    {hashVerification && (
                        <div className={`p-4 rounded-lg border-2 ${
                            hashVerification === 'verifying' ? 'bg-blue-50 border-blue-300' :
                            hashVerification === 'match' ? 'bg-emerald-50 border-emerald-300' :
                            'bg-red-50 border-red-300'
                        }`}>
                            <div className="flex items-center">
                                {hashVerification === 'verifying' && (
                                    <>
                                        <svg className="animate-spin h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span className="font-bold text-blue-700">Verifying Document Integrity...</span>
                                    </>
                                )}
                                {hashVerification === 'match' && (
                                    <>
                                        <svg className="h-6 w-6 mr-2 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div>
                                            <p className="font-bold text-emerald-700">✓ DOCUMENT VERIFIED</p>
                                            <p className="text-xs text-emerald-600 mt-1">Hash matches blockchain record. Document has NOT been altered.</p>
                                        </div>
                                    </>
                                )}
                                {hashVerification === 'tampered' && (
                                    <>
                                        <svg className="h-6 w-6 mr-2 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <div>
                                            <p className="font-bold text-red-700">⚠ TAMPERED DOCUMENT</p>
                                            <p className="text-xs text-red-600 mt-1">Hash does NOT match blockchain. Document may have been altered!</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

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

                    {/* ✅ NEW: Download PDF Button (if available) */}
                    {verificationData.local.file_path && (
                        <div className="text-center">
                            <a 
                                href={`http://localhost:3000/uploads/${verificationData.local.file_path}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Download Invoice PDF
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default BlockchainVerifier;