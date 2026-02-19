import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';
const FILE_URL = 'http://localhost:3000/uploads';

export default function TamperingDemo() {
    const [invoices, setInvoices] = useState([]);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [tamperedData, setTamperedData] = useState(null);
    const [originalVerification, setOriginalVerification] = useState(null);
    const [tamperedVerification, setTamperedVerification] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const res = await axios.get(`${API_URL}/demo/locked-invoices`);
            setInvoices(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const tamperInvoice = async () => {
        if (!selectedInvoice) return;
        setLoading(true);
        setOriginalVerification(null);
        setTamperedVerification(null);
        
        try {
            const res = await axios.post(`${API_URL}/demo/tamper-invoice/${selectedInvoice.shipment_id}`);
            setTamperedData(res.data);
        } catch (err) {
            alert("Failed to tamper invoice");
        }
        setLoading(false);
    };

    const verifyFile = async (filename, label) => {
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/demo/verify-file`, {
                filename,
                shipmentId: selectedInvoice.shipment_id
            });
            
            if (label === 'original') {
                setOriginalVerification(res.data);
            } else {
                setTamperedVerification(res.data);
            }
        } catch (err) {
            alert("Verification failed");
        }
        setLoading(false);
    };

    const restoreInvoice = async () => {
        if (!selectedInvoice) return;
        try {
            await axios.post(`${API_URL}/demo/restore-invoice/${selectedInvoice.shipment_id}`);
            setTamperedData(null);
            setOriginalVerification(null);
            setTamperedVerification(null);
            alert("Demo reset - tampered file deleted");
        } catch (err) {
            alert("Failed to restore");
        }
    };

    const openPDF = (filename) => {
        window.open(`${FILE_URL}/${filename}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-block bg-red-500/20 p-4 rounded-2xl mb-4">
                        <svg className="w-12 h-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-3">🔥 Live Tampering Detection Demo</h1>
                    <p className="text-slate-400 text-lg max-w-3xl mx-auto">
                        This demonstration shows how blockchain cryptographic verification detects invoice fraud by modifying a real PDF and proving the tampering
                    </p>
                </div>

                {/* Main Demo Area */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                    {/* Step 1: Select */}
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 shadow-xl">
                        <div className="flex items-center mb-4">
                            <div className="bg-indigo-500/20 p-2 rounded-lg mr-3">
                                <span className="text-indigo-400 font-bold">1</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-200">Select Invoice</h3>
                        </div>
                        
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {invoices.map(inv => (
                                <button
                                    key={inv.shipment_id}
                                    onClick={() => {
                                        setSelectedInvoice(inv);
                                        setTamperedData(null);
                                        setOriginalVerification(null);
                                        setTamperedVerification(null);
                                    }}
                                    className={`w-full text-left p-3 rounded-lg border transition ${
                                        selectedInvoice?.shipment_id === inv.shipment_id
                                            ? 'bg-indigo-500/20 border-indigo-500'
                                            : 'bg-slate-700/30 border-slate-600 hover:border-slate-500'
                                    }`}
                                >
                                    <p className="text-sm font-bold text-slate-200">{inv.tracking_number}</p>
                                    <p className="text-xs text-slate-400 truncate">{inv.sender_name}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Step 2: Tamper */}
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 shadow-xl">
                        <div className="flex items-center mb-4">
                            <div className="bg-red-500/20 p-2 rounded-lg mr-3">
                                <span className="text-red-400 font-bold">2</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-200">Tamper</h3>
                        </div>

                        {selectedInvoice ? (
                            <div className="space-y-4">
                                <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-600">
                                    <p className="text-xs text-slate-400 mb-2">Invoice:</p>
                                    <p className="font-mono text-sm text-slate-200">{selectedInvoice.tracking_number}</p>
                                </div>

                                <button
                                    onClick={tamperInvoice}
                                    disabled={loading || tamperedData}
                                    className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white py-3 rounded-lg font-bold hover:from-red-500 hover:to-red-600 transition disabled:opacity-50"
                                >
                                    {loading ? "Tampering..." : "🔨 Tamper Invoice"}
                                </button>

                                {tamperedData && (
                                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                                        <p className="text-red-400 text-sm font-bold mb-2">⚠️ Modification Made:</p>
                                        <p className="text-xs text-slate-300">{tamperedData.modification}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-500">
                                <p className="text-sm">Select invoice first</p>
                            </div>
                        )}
                    </div>

                    {/* Step 3: View Original */}
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 shadow-xl">
                        <div className="flex items-center mb-4">
                            <div className="bg-emerald-500/20 p-2 rounded-lg mr-3">
                                <span className="text-emerald-400 font-bold">3</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-200">Original PDF</h3>
                        </div>

                        {tamperedData ? (
                            <div className="space-y-3">
                                <button
                                    onClick={() => openPDF(tamperedData.originalFile)}
                                    className="w-full bg-slate-700 text-slate-200 py-3 rounded-lg font-bold hover:bg-slate-600 transition flex items-center justify-center"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    View Original
                                </button>

                                <button
                                    onClick={() => verifyFile(tamperedData.originalFile, 'original')}
                                    disabled={loading}
                                    className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition"
                                >
                                    ✓ Verify Original
                                </button>

                                {originalVerification && (
                                    <div className={`border rounded-lg p-3 ${
                                        originalVerification.matches 
                                            ? 'bg-emerald-500/10 border-emerald-500/30' 
                                            : 'bg-red-500/10 border-red-500/30'
                                    }`}>
                                        <p className={`font-bold text-sm mb-2 ${originalVerification.matches ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {originalVerification.matches ? '✓ VERIFIED' : '✗ FAILED'}
                                        </p>
                                        <p className="text-xs text-slate-400">Computed:</p>
                                        <p className="text-xs font-mono text-slate-300 break-all">{originalVerification.computedHash.substring(0, 20)}...</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-500">
                                <p className="text-sm">Tamper first</p>
                            </div>
                        )}
                    </div>

                    {/* Step 4: View Tampered */}
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-red-700/50 shadow-xl">
                        <div className="flex items-center mb-4">
                            <div className="bg-red-500/20 p-2 rounded-lg mr-3">
                                <span className="text-red-400 font-bold">4</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-200">Tampered PDF</h3>
                        </div>

                        {tamperedData ? (
                            <div className="space-y-3">
                                <button
                                    onClick={() => openPDF(tamperedData.tamperedFile)}
                                    className="w-full bg-red-700 text-white py-3 rounded-lg font-bold hover:bg-red-800 transition flex items-center justify-center"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    View Tampered
                                </button>

                                <button
                                    onClick={() => verifyFile(tamperedData.tamperedFile, 'tampered')}
                                    disabled={loading}
                                    className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition"
                                >
                                    ⚠ Verify Tampered
                                </button>

                                {tamperedVerification && (
                                    <div className={`border rounded-lg p-3 ${
                                        tamperedVerification.matches 
                                            ? 'bg-emerald-500/10 border-emerald-500/30' 
                                            : 'bg-red-500/10 border-red-500/30'
                                    }`}>
                                        <p className={`font-bold text-sm mb-2 ${tamperedVerification.matches ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {tamperedVerification.matches ? '✓ VERIFIED' : '✗ TAMPERED!'}
                                        </p>
                                        <p className="text-xs text-slate-400">Computed:</p>
                                        <p className="text-xs font-mono text-slate-300 break-all">{tamperedVerification.computedHash.substring(0, 20)}...</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-500">
                                <p className="text-sm">Tamper first</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Hash Comparison Panel */}
                {tamperedData && (
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-8 border border-slate-700 shadow-xl mb-8">
                        <h3 className="text-xl font-bold text-slate-200 mb-6 flex items-center">
                            <svg className="w-6 h-6 mr-2 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Cryptographic Hash Comparison
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Original Hash */}
                            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
                                <div className="flex items-center mb-3">
                                    <div className="bg-emerald-500 p-2 rounded-lg mr-3">
                                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <h4 className="font-bold text-emerald-400">Original Invoice Hash</h4>
                                </div>
                                <p className="text-xs text-slate-400 mb-2">Blockchain Record (Immutable):</p>
                                <p className="font-mono text-xs text-emerald-300 break-all bg-slate-900/50 p-3 rounded">
                                    {tamperedData.originalHash}
                                </p>
                            </div>

                            {/* Tampered Hash */}
                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                                <div className="flex items-center mb-3">
                                    <div className="bg-red-500 p-2 rounded-lg mr-3">
                                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <h4 className="font-bold text-red-400">Tampered Invoice Hash</h4>
                                </div>
                                <p className="text-xs text-slate-400 mb-2">Computed from Modified PDF:</p>
                                <p className="font-mono text-xs text-red-300 break-all bg-slate-900/50 p-3 rounded">
                                    {tamperedData.tamperedHash}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                            <p className="text-sm text-purple-300 font-bold mb-2">🔍 What This Proves:</p>
                            <p className="text-sm text-slate-300">
                                The hashes are completely different! Even though we only added text to the PDF, the SHA-256 algorithm produced an entirely different 256-bit fingerprint. This is cryptographic proof that the document was altered. The blockchain preserves the original hash forever, making fraud detection instant and certain.
                            </p>
                        </div>
                    </div>
                )}

                {/* Reset Button */}
                {tamperedData && (
                    <div className="text-center">
                        <button
                            onClick={restoreInvoice}
                            className="bg-slate-700 border border-slate-600 text-slate-300 px-8 py-3 rounded-lg hover:bg-slate-600 transition"
                        >
                            🔄 Reset Demo
                        </button>
                    </div>
                )}

                {/* Explanation */}
                <div className="mt-8 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-slate-200 mb-4">🎓 Demonstration Explanation</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                        <div>
                            <p className="font-bold text-indigo-400 mb-2">1. Visible Tampering</p>
                            <p className="text-slate-300">When you click "View Tampered", you'll see red text that wasn't in the original, proving the PDF was actually modified.</p>
                        </div>
                        <div>
                            <p className="font-bold text-purple-400 mb-2">2. Hash Mismatch</p>
                            <p className="text-slate-300">The tampered PDF produces a completely different hash, which doesn't match the blockchain record.</p>
                        </div>
                        <div>
                            <p className="font-bold text-emerald-400 mb-2">3. Fraud Detection</p>
                            <p className="text-slate-300">The original always verifies successfully. Any modification—no matter how small—causes verification to fail.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}