import React from 'react';
import BlockchainVerifier from '../components/BlockchainVerifier';

export default function PublicVerifier() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500 rounded-full blur-3xl opacity-5 animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500 rounded-full blur-3xl opacity-5 animate-pulse" style={{animationDelay: '1s'}}></div>
            
            <div className="relative z-10 w-full max-w-4xl">
                {/* Header */}
                <div className="mb-12 text-center">
                    {/* Logo */}
                    <div className="flex items-center justify-center space-x-3 mb-6">
                        <div className="relative">
                            {/* Glow effect */}
                            <div className="absolute inset-0 bg-emerald-500 rounded-2xl blur-xl opacity-40"></div>
                            {/* Icon */}
                            <div className="relative p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-2xl shadow-emerald-500/30">
                                <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    
                    {/* Title */}
                    <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-3 bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                        Eastern Produce Verification
                    </h1>
                    <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto">
                        Verify the authenticity and integrity of tea export invoices secured by blockchain technology
                    </p>
                    
                    {/* Trust Badges */}
                    <div className="flex items-center justify-center gap-6 mt-8">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Ethereum Secured</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">SHA-256 Verified</span>
                        </div>
                    </div>
                </div>

                {/* Verifier Component */}
                <div className="w-full">
                    <BlockchainVerifier />
                </div>

                {/* Footer */}
                <div className="mt-12 text-center space-y-4">
                    {/* How it works */}
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 max-w-3xl mx-auto">
                        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">How Verification Works</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                            <div className="flex items-start gap-3">
                                <div className="bg-indigo-500/20 p-2 rounded-lg flex-shrink-0">
                                    <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-300 mb-1">1. Document Hash</p>
                                    <p className="text-xs text-slate-500">Invoice is cryptographically hashed using SHA-256</p>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                                <div className="bg-purple-500/20 p-2 rounded-lg flex-shrink-0">
                                    <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-300 mb-1">2. Blockchain Lock</p>
                                    <p className="text-xs text-slate-500">Hash is stored immutably on Ethereum</p>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                                <div className="bg-emerald-500/20 p-2 rounded-lg flex-shrink-0">
                                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-300 mb-1">3. Verification</p>
                                    <p className="text-xs text-slate-500">Any tampering changes the hash, proving forgery</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Copyright */}
                    <div className="text-slate-600 text-xs space-y-1">
                        <p className="flex items-center justify-center gap-2">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Secured by Ethereum Smart Contracts
                        </p>
                        <p>&copy; 2026 Eastern Produce Logistics. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}