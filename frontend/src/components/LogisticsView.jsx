import React, { useState } from 'react';
import axios from 'axios';

const TEA_CATALOG = [
    { id: 'bp1', name: 'BP1', fullName: 'Broken Pekoe 1', price: 6.40, color: 'from-amber-600 to-amber-500' },
    { id: 'pf1', name: 'PF1', fullName: 'Pekoe Fannings 1', price: 5.50, color: 'from-orange-600 to-orange-500' },
    { id: 'pd', name: 'PD', fullName: 'Pekoe Dust', price: 3.90, color: 'from-yellow-600 to-yellow-500' },
    { id: 'd1', name: 'D1', fullName: 'Dust 1', price: 3.90, color: 'from-stone-600 to-stone-500' },
    { id: 'green', name: 'Green Tea', fullName: 'Green Tea Extract', price: 8.50, color: 'from-emerald-600 to-emerald-500' },
    { id: 'purple', name: 'Purple Tea', fullName: 'Purple Tea (Specialty)', price: 14.20, color: 'from-purple-600 to-purple-500' },
];

const API_URL = 'http://localhost:3000/api'; 

export default function LogisticsView({ shipment, user, refreshData }) {
    const [showModal, setShowModal] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    const [itemDetails, setItemDetails] = useState({});
    const [loading, setLoading] = useState(false);

    const toggleItem = (item) => {
        if (selectedItems.find(i => i.id === item.id)) {
            // Remove item
            setSelectedItems(selectedItems.filter(i => i.id !== item.id));
            const newDetails = { ...itemDetails };
            delete newDetails[item.id];
            setItemDetails(newDetails);
        } else {
            // Add item
            setSelectedItems([...selectedItems, item]);
            setItemDetails({
                ...itemDetails,
                [item.id]: { qty: '', weight: '' }
            });
        }
    };

    const updateItemDetail = (itemId, field, value) => {
        setItemDetails({
            ...itemDetails,
            [itemId]: {
                ...itemDetails[itemId],
                [field]: value
            }
        });
    };

    const submitDraft = async () => {
        // Validate all selected items have qty and weight
        const incomplete = selectedItems.some(item => 
            !itemDetails[item.id]?.qty || !itemDetails[item.id]?.weight
        );
        
        if (incomplete) {
            return alert("Please fill in quantity and weight for all selected items");
        }

        // Format data for backend
        const packingList = selectedItems.map(item => ({
            grade: item.fullName,
            qty: itemDetails[item.id].qty,
            weight: itemDetails[item.id].weight
        }));

        setLoading(true);
        try {
            await axios.post(`${API_URL}/logistics/draft-invoice/${shipment.shipment_id}`, { 
                packingList, 
                userId: user.id 
            });
            alert("Draft Submitted to Admin!");
            setShowModal(false);
            setSelectedItems([]);
            setItemDetails({});
            refreshData();
        } catch (err) { alert("Failed to submit draft"); }
        setLoading(false);
    };

    return (
        <>
            {/* Action Button */}
            {shipment.invoice_status === 'Pending' || shipment.invoice_status === null ? (
                <button 
                    onClick={() => setShowModal(true)} 
                    className="bg-amber-500/20 text-amber-300 px-3 py-1.5 rounded-lg text-xs font-bold border border-amber-500/30 hover:bg-amber-500/30 transition flex items-center"
                >
                    <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Create Invoice
                </button>
            ) : shipment.invoice_status === 'Draft' ? (
                <span className="text-xs text-amber-400 italic font-medium bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 flex items-center">
                    <svg className="animate-spin w-3 h-3 mr-1.5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Pending Approval
                </span>
            ) : (
                <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 flex items-center">
                    <svg className="w-3 h-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Approved
                </span>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl w-full max-w-4xl my-8 border border-slate-700">
                        {/* Header */}
                        <div className="border-b border-slate-700 p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="bg-amber-500/20 p-3 rounded-xl mr-4">
                                        <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-200">Invoice Builder</h3>
                                        <p className="text-sm text-slate-400">Select tea grades for {shipment.tracking_number}</p>
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

                        <div className="p-6 space-y-6">
                            {/* Step 1: Tea Catalog Selection */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Step 1: Select Tea Grades</p>
                                    <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-1 rounded">
                                        {selectedItems.length} selected
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {TEA_CATALOG.map(item => {
                                        const isSelected = selectedItems.find(i => i.id === item.id);
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => toggleItem(item)}
                                                className={`relative overflow-hidden rounded-xl p-4 border-2 transition-all ${
                                                    isSelected 
                                                        ? 'border-amber-500 bg-amber-500/10' 
                                                        : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                                                }`}
                                            >
                                                {/* Gradient background */}
                                                <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${item.color} rounded-full blur-2xl opacity-20`}></div>
                                                
                                                <div className="relative">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <p className="text-lg font-bold text-slate-200">{item.name}</p>
                                                            <p className="text-xs text-slate-400">{item.fullName}</p>
                                                        </div>
                                                        {isSelected && (
                                                            <div className="bg-amber-500 rounded-full p-1">
                                                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-300">${item.price}/kg</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Step 2: Enter Details for Selected Items */}
                            {selectedItems.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Step 2: Enter Quantities</p>
                                    
                                    <div className="space-y-3">
                                        {selectedItems.map(item => (
                                            <div key={item.id} className="bg-slate-700/30 border border-slate-600 rounded-xl p-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div>
                                                        <p className="font-bold text-slate-200">{item.fullName}</p>
                                                        <p className="text-xs text-slate-400">${item.price}/kg</p>
                                                    </div>
                                                    <button
                                                        onClick={() => toggleItem(item)}
                                                        className="text-red-400 hover:text-red-300 transition"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-xs text-slate-400 block mb-1">Quantity (bags)</label>
                                                        <input
                                                            type="number"
                                                            placeholder="e.g., 40"
                                                            value={itemDetails[item.id]?.qty || ''}
                                                            onChange={(e) => updateItemDetail(item.id, 'qty', e.target.value)}
                                                            className="w-full bg-slate-700/50 border-slate-600 text-slate-200 placeholder-slate-500 p-2.5 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-slate-400 block mb-1">Weight (KG)</label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="e.g., 400"
                                                            value={itemDetails[item.id]?.weight || ''}
                                                            onChange={(e) => updateItemDetail(item.id, 'weight', e.target.value)}
                                                            className="w-full bg-slate-700/50 border-slate-600 text-slate-200 placeholder-slate-500 p-2.5 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Estimated value */}
                                                {itemDetails[item.id]?.weight && (
                                                    <div className="mt-2 text-right">
                                                        <span className="text-xs text-slate-400">Estimated: </span>
                                                        <span className="text-sm font-bold text-amber-400">
                                                            ${(parseFloat(itemDetails[item.id].weight) * item.price).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Empty State */}
                            {selectedItems.length === 0 && (
                                <div className="text-center py-12 text-slate-500">
                                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                    <p className="text-sm">Select tea grades above to begin</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="border-t border-slate-700 p-6 flex justify-between items-center">
                            <div className="text-sm text-slate-400">
                                {selectedItems.length > 0 && (
                                    <span>{selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected</span>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setShowModal(false)} 
                                    className="px-5 py-2.5 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700/50 font-medium transition"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={submitDraft} 
                                    disabled={loading || selectedItems.length === 0} 
                                    className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-lg hover:from-amber-500 hover:to-amber-600 font-bold shadow-lg shadow-amber-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Submit Draft to Admin
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}