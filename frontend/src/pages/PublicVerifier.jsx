import React from 'react';
import BlockchainVerifier from '../components/BlockchainVerifier';

export default function PublicVerifier() {
    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
            {/* Public Header */}
            <div className="mb-8 text-center">
                <div className="flex items-center justify-center space-x-3 mb-4">
                    <div className="p-3 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20">
                        <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                </div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Eastern Produce Verification</h1>
                <p className="text-slate-400 mt-2 text-sm">Public Blockchain Authenticity Portal</p>
            </div>

            {/* The Verifier Component */}
            <div className="w-full max-w-2xl">
                <BlockchainVerifier />
            </div>

            {/* Footer */}
            <div className="mt-8 text-center text-slate-500 text-xs">
                <p>Secured by Ethereum Smart Contracts.</p>
                <p>&copy; 2026 Eastern Produce Logistics.</p>
            </div>
        </div>
    );
}