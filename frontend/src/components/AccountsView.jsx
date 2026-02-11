import React from 'react';

const FILE_URL = 'http://192.168.1.67:3000/uploads';

export default function AccountsView({ shipment }) {
    const viewInvoice = () => {
        if(!shipment.file_path) return alert("Invoice not generated yet.");
        const cleanName = shipment.file_path.split('/').pop().split('\\').pop();
        window.open(`${FILE_URL}/${cleanName}`, '_blank');
    };

    if (shipment.invoice_status === 'Approved') {
        return (
            <button onClick={viewInvoice} className="bg-slate-700 text-white px-3 py-1 rounded-lg text-xs font-bold shadow hover:bg-slate-800 transition flex items-center">
                <span className="mr-1">📄</span> View PDF
            </button>
        );
    }

    return <span className="text-xs text-slate-400 italic">Waiting Approval</span>;
}