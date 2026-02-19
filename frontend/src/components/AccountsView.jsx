import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';
const FILE_URL = 'http://localhost:3000/uploads';

export default function AccountsView({ shipment }) {
    const [showModal, setShowModal] = useState(false);
    const [verificationData, setVerificationData] = useState(null);
    const [loading, setLoading] = useState(false);

    const viewInvoice = () => {
        if(!shipment.file_path) return alert("Invoice not generated yet.");
        const cleanName = shipment.file_path.split('/').pop().split('\\').pop();
        window.open(`${FILE_URL}/${cleanName}`, '_blank');
    };

    const verifyBlockchain = async () => {
        setLoading(true);
        setShowModal(true);
        try {
            const res = await axios.get(`${API_URL}/shipments/${shipment.shipment_id}/status`);
            setVerificationData(res.data);
        } catch (err) {
            alert("Verification failed");
            setShowModal(false);
        }
        setLoading(false);
    };

    // Calculate estimated value from packing list
    const calculateValue = () => {
        if (!shipment.packing_list) return 0;
        try {
            const items = JSON.parse(shipment.packing_list);
            let total = 0;
            items.forEach(item => {
                const weight = parseFloat(item.weight) || 0;
                let price = 5.50;
                const g = (item.grade || "").toLowerCase();
                if (g.includes('purple')) price = 14.20;
                if (g.includes('bp1')) price = 6.40;
                if (g.includes('dust') || g.includes('d1')) price = 3.90;
                if (g.includes('green')) price = 8.50;
                total += weight * price;
            });
            return total;
        } catch (e) {
            return shipment.value || 0;
        }
    };

    const estimatedValue = calculateValue();

    if (shipment.invoice_status !== 'Approved') {
        return (
            <span className="text-xs text-slate-500 italic bg-slate-700/30 px-3 py-1.5 rounded-lg border border-slate-600 flex items-center">
                <svg className="w-3 h-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Awaiting Approval
            </span>
        );
    }

    return (
        <>
            <div className="flex space-x-2">
                {/* View PDF Button */}
                <button 
                    onClick={viewInvoice} 
                    className="bg-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-lg text-xs font-bold border border-indigo-500/30 hover:bg-indigo-500/30 transition flex items-center"
                >
                    <svg className="w-3 h-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    PDF
                </button>

                {/* Verify Button */}
                <button 
                    onClick={verifyBlockchain} 
                    className="bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-500/30 hover:bg-emerald-500/30 transition flex items-center"
                >
                    <svg className="w-3 h-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Verify
                </button>

                {/* Value Badge */}
                <div className="bg-purple-500/20 text-purple-300 px-3 py-1.5 rounded-lg text-xs font-bold border border-purple-500/30 flex items-center">
                    <svg className="w-3 h-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    ${estimatedValue.toLocaleString()}
                </div>
            </div>

            {/* Verification Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl w-full max-w-lg border border-slate-700">
                        {/* Header */}
                        <div className="border-b border-slate-700 p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="bg-emerald-500/20 p-3 rounded-xl mr-4">
                                        <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-200">Blockchain Verification</h3>
                                        <p className="text-sm text-slate-400">{shipment.tracking_number}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setShowModal(false)}
                                    className="text-slate-400 hover:text-slate-200 transition"
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="p-12 text-center">
                                <svg className="animate-spin h-8 w-8 mx-auto mb-3 text-emerald-400" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <p className="text-slate-400">Verifying on blockchain...</p>
                            </div>
                        ) : verificationData ? (
                            <div className="p-6 space-y-4">
                                {/* Status Badge */}
                                {verificationData.blockchainHash && verificationData.blockchainHash !== "0x" ? (
                                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center">
                                        <div className="flex h-3 w-3 relative mr-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                        </div>
                                        <div>
                                            <p className="text-emerald-400 font-bold">VERIFIED & AUTHENTIC</p>
                                            <p className="text-emerald-300/60 text-xs mt-0.5">Document secured on blockchain</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center">
                                        <div className="h-3 w-3 rounded-full bg-amber-500 mr-3"></div>
                                        <div>
                                            <p className="text-amber-400 font-bold">PENDING LOCK</p>
                                            <p className="text-amber-300/60 text-xs mt-0.5">Not yet on blockchain</p>
                                        </div>
                                    </div>
                                )}

                                {/* Financial Status */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-600">
                                        <p className="text-xs text-slate-400 uppercase font-semibold mb-2">Payment Status</p>
                                        <p className={`font-bold ${verificationData.isPaid ? 'text-emerald-400' : 'text-slate-300'}`}>
                                            {verificationData.isPaid ? "PAID" : "UNPAID"}
                                        </p>
                                    </div>

                                    <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-600">
                                        <p className="text-xs text-slate-400 uppercase font-semibold mb-2">Delivery Status</p>
                                        <p className={`font-bold ${verificationData.isDelivered ? 'text-emerald-400' : 'text-slate-300'}`}>
                                            {verificationData.isDelivered ? "DELIVERED" : "IN-TRANSIT"}
                                        </p>
                                    </div>
                                </div>

                                {/* Document Hash */}
                                <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-600">
                                    <p className="text-xs text-slate-400 uppercase font-semibold mb-2">Document Fingerprint (SHA-256)</p>
                                    <p className="text-xs font-mono text-slate-300 break-all bg-slate-800/50 p-2 rounded border border-slate-700">
                                        {verificationData.blockchainHash || "Not Available"}
                                    </p>
                                </div>

                                {/* Invoice Value */}
                                <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/30 p-4 rounded-xl">
                                    <p className="text-xs text-slate-400 uppercase font-semibold mb-2">Invoice Value</p>
                                    <p className="text-2xl font-bold text-purple-300">
                                        ${estimatedValue.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">USD</p>
                                </div>
                            </div>
                        ) : null}

                        {/* Footer */}
                        <div className="border-t border-slate-700 p-6">
                            <button 
                                onClick={() => setShowModal(false)} 
                                className="w-full px-5 py-2.5 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700/50 font-medium transition"
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