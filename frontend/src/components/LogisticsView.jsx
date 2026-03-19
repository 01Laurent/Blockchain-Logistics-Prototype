import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from '../components/Toast';

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
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [showDocumentsModal, setShowDocumentsModal] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    const [itemDetails, setItemDetails] = useState({});
    const [loading, setLoading] = useState(false);
    
    // Document upload states
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const [documents, setDocuments] = useState([]);
    const [loadingDocs, setLoadingDocs] = useState(false);

    useEffect(() => {
        if (showDocumentsModal) {
            loadDocuments();
        }
    }, [showDocumentsModal]);

    const loadDocuments = async () => {
        setLoadingDocs(true);
        try {
            const res = await axios.get(`${API_URL}/shipments/${shipment.shipment_id}/documents`);
            setDocuments(res.data.documents || []);
        } catch (err) {
            console.error('Failed to load documents:', err);
        }
        setLoadingDocs(false);
    };

    const toggleItem = (item) => {
        if (selectedItems.find(i => i.id === item.id)) {
            setSelectedItems(selectedItems.filter(i => i.id !== item.id));
            const newDetails = { ...itemDetails };
            delete newDetails[item.id];
            setItemDetails(newDetails);
        } else {
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
        const incomplete = selectedItems.some(item => 
            !itemDetails[item.id]?.qty || !itemDetails[item.id]?.weight
        );
        
        if (incomplete) {
            toast.warning("Please fill in quantity and weight for all selected items");
            return;
        }

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
            toast.success("Invoice draft submitted to Admin for approval! 📋");
            setShowInvoiceModal(false);
            setSelectedItems([]);
            setItemDetails({});
            refreshData();
        } catch (err) {
            toast.error("Failed to submit draft. Please try again.");
        }
        setLoading(false);
    };

    const handleDocumentUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size must be less than 10MB');
            return;
        }

        const formData = new FormData();
        formData.append('document', file);
        formData.append('shipmentId', shipment.shipment_id);
        formData.append('documentType', getDocumentType(file.name));
        formData.append('userId', user.id);

        setUploadingDoc(true);
        try {
            const res = await axios.post(`${API_URL}/logistics/upload-document`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            toast.success(`${file.name} uploaded and hash registered on blockchain! 🔗`);
            loadDocuments();
            event.target.value = '';
        } catch (err) {
            toast.error('Failed to upload document. Please try again.');
        }
        setUploadingDoc(false);
    };

    const getDocumentType = (filename) => {
        const lower = filename.toLowerCase();
        if (lower.includes('bill') || lower.includes('lading')) return 'Bill of Lading';
        if (lower.includes('packing')) return 'Packing List';
        if (lower.includes('certificate')) return 'Certificate';
        if (lower.includes('customs')) return 'Customs Declaration';
        return 'Other Document';
    };

    const verifyDocument = async (documentId) => {
        try {
            const res = await axios.get(`${API_URL}/documents/${documentId}/verify`);
            
            if (res.data.verified) {
                toast.success('✅ Document verified! Hash matches blockchain record.');
            } else {
                toast.error('⚠️ TAMPER DETECTED! Document has been modified!');
            }
        } catch (err) {
            toast.error('Verification failed. Please try again.');
        }
    };

    const downloadDocument = (doc) => {
        window.open(`http://localhost:3000/uploads/${doc.filename}`, '_blank');
        toast.info(`Downloading ${doc.original_name}...`);
    };

    return (
        <>
            {/* ✅ DISTINCT DARK COLORS: Each button has unique color */}
            <div className="flex gap-2">
                {/* Invoice Status/Action - Dark Purple/Indigo */}
                {shipment.invoice_status === 'Pending' || shipment.invoice_status === null ? (
                    <button 
                        onClick={() => setShowInvoiceModal(true)} 
                        className="bg-gradient-to-r from-indigo-800 to-indigo-900 hover:from-indigo-700 hover:to-indigo-800 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg border-2 border-indigo-700 transition-all hover:scale-105 flex items-center"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Create Invoice
                    </button>
                ) : shipment.invoice_status === 'Draft' ? (
                    <span className="bg-gradient-to-r from-amber-800 to-amber-900 text-amber-300 px-4 py-2 rounded-lg text-sm font-bold shadow-lg border-2 border-amber-700 flex items-center">
                        <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Pending Approval
                    </span>
                ) : (
                    <span className="bg-gradient-to-r from-teal-800 to-teal-900 text-teal-300 px-4 py-2 rounded-lg text-sm font-bold shadow-lg border-2 border-teal-700 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Approved
                    </span>
                )}

                {/* Document Upload Button - Dark Cyan/Blue */}
                <button 
                    onClick={() => setShowDocumentsModal(true)} 
                    className="bg-gradient-to-r from-cyan-800 to-cyan-900 hover:from-cyan-700 hover:to-cyan-800 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg border-2 border-cyan-700 transition-all hover:scale-105 flex items-center"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Documents
                    {documents.length > 0 && (
                        <span className="ml-2 bg-cyan-950/80 rounded-full px-2 py-0.5 text-xs border border-cyan-600">
                            {documents.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Invoice Builder Modal */}
            {showInvoiceModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl w-full max-w-4xl my-8 border border-slate-700">
                        <div className="border-b border-slate-700 p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="bg-indigo-900/50 p-3 rounded-xl mr-4">
                                        <svg className="w-6 h-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-200">Invoice Builder</h3>
                                        <p className="text-sm text-slate-400">Select tea grades for {shipment.tracking_number}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setShowInvoiceModal(false)}
                                    className="text-slate-400 hover:text-slate-200 transition"
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
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
                                                        ? 'border-indigo-500 bg-indigo-500/10' 
                                                        : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                                                }`}
                                            >
                                                <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${item.color} rounded-full blur-2xl opacity-20`}></div>
                                                
                                                <div className="relative">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <p className="text-lg font-bold text-slate-200">{item.name}</p>
                                                            <p className="text-xs text-slate-400">{item.fullName}</p>
                                                        </div>
                                                        {isSelected && (
                                                            <div className="bg-indigo-600 rounded-full p-1">
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
                                                            className="w-full bg-slate-700/50 border-slate-600 text-slate-200 placeholder-slate-500 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                                                            className="w-full bg-slate-700/50 border-slate-600 text-slate-200 placeholder-slate-500 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                        />
                                                    </div>
                                                </div>

                                                {itemDetails[item.id]?.weight && (
                                                    <div className="mt-2 text-right">
                                                        <span className="text-xs text-slate-400">Estimated: </span>
                                                        <span className="text-sm font-bold text-indigo-300">
                                                            ${(parseFloat(itemDetails[item.id].weight) * item.price).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedItems.length === 0 && (
                                <div className="text-center py-12 text-slate-500">
                                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                    <p className="text-sm">Select tea grades above to begin</p>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-slate-700 p-6 flex justify-between items-center">
                            <div className="text-sm text-slate-400">
                                {selectedItems.length > 0 && (
                                    <span>{selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected</span>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setShowInvoiceModal(false)} 
                                    className="px-5 py-2.5 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700/50 font-medium transition"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={submitDraft} 
                                    disabled={loading || selectedItems.length === 0} 
                                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-700 to-indigo-800 text-white rounded-lg hover:from-indigo-600 hover:to-indigo-700 font-bold shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center border-2 border-indigo-600"
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

            {/* Documents Modal */}
            {showDocumentsModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl w-full max-w-3xl my-8 border border-slate-700">
                        <div className="border-b border-slate-700 p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="bg-cyan-900/50 p-3 rounded-xl mr-4">
                                        <svg className="w-6 h-6 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-200">Shipping Documents</h3>
                                        <p className="text-sm text-slate-400">{shipment.tracking_number}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setShowDocumentsModal(false)}
                                    className="text-slate-400 hover:text-slate-200 transition"
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 hover:border-cyan-600 transition bg-slate-800/30">
                                <input
                                    type="file"
                                    id="doc-upload"
                                    onChange={handleDocumentUpload}
                                    disabled={uploadingDoc}
                                    className="hidden"
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                />
                                <label 
                                    htmlFor="doc-upload" 
                                    className="cursor-pointer flex flex-col items-center"
                                >
                                    <div className="bg-cyan-900/50 p-4 rounded-full mb-4">
                                        <svg className="w-8 h-8 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                    </div>
                                    <p className="text-slate-200 font-semibold mb-1">
                                        {uploadingDoc ? 'Uploading...' : 'Click to upload document'}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        Bill of Lading, Packing List, Certificates, Customs (PDF, DOC, JPG - Max 10MB)
                                    </p>
                                </label>
                            </div>

                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                                    Uploaded Documents ({documents.length})
                                </p>

                                {loadingDocs ? (
                                    <div className="text-center py-8">
                                        <svg className="animate-spin h-8 w-8 mx-auto text-cyan-400" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    </div>
                                ) : documents.length === 0 ? (
                                    <div className="text-center py-12 text-slate-500">
                                        <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                        <p className="text-sm">No documents uploaded yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {documents.map(doc => (
                                            <div 
                                                key={doc.document_id}
                                                className="bg-slate-700/30 border border-slate-600 rounded-lg p-4 flex items-center justify-between hover:bg-slate-700/50 transition"
                                            >
                                                <div className="flex items-center flex-1 min-w-0">
                                                    <div className="bg-cyan-900/50 p-2 rounded-lg mr-3">
                                                        <svg className="w-5 h-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-slate-200 truncate">
                                                            {doc.original_name}
                                                        </p>
                                                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                                                            <span>{doc.document_type}</span>
                                                            <span>•</span>
                                                            <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                                                            {doc.blockchain_hash && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="text-cyan-300">🔗 On Blockchain</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Dark Purple Verify & Dark Rose Download */}
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => verifyDocument(doc.document_id)}
                                                        className="bg-gradient-to-r from-purple-800 to-purple-900 hover:from-purple-700 hover:to-purple-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition border border-purple-700"
                                                    >
                                                        Verify
                                                    </button>
                                                    <button
                                                        onClick={() => downloadDocument(doc)}
                                                        className="bg-gradient-to-r from-rose-800 to-rose-900 hover:from-rose-700 hover:to-rose-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition border border-rose-700"
                                                    >
                                                        Download
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="border-t border-slate-700 p-6">
                            <button 
                                onClick={() => setShowDocumentsModal(false)} 
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