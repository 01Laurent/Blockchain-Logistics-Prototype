import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const API_URL = "http://192.168.1.66:3000/api";

export default function PodConfirm() {
  const { token } = useParams();
  const [info, setInfo] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | confirming | done | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API_URL}/pod/info/${token}`);
        setInfo(res.data);
        setStatus('ready');
      } catch (e) {
        setStatus('error');
        setMessage(e?.response?.data?.error || 'Failed to load token info');
      }
    };
    load();
  }, [token]);

  const confirm = async () => {
    try {
      setStatus('confirming');
      const res = await axios.post(`${API_URL}/pod/confirm`, { token });
      setStatus('done');
      setMessage(`Confirmed. Tx: ${res.data.txHash}`);
    } catch (e) {
      setStatus('error');
      setMessage(e?.response?.data?.error || 'Failed to confirm delivery');
    }
  };

  return (
    <div style={{ padding: 18, maxWidth: 520, margin: '0 auto', fontFamily: 'system-ui' }}>
      <h2 style={{ marginBottom: 6 }}>Proof of Delivery</h2>

      {status === 'loading' && <p>Loading…</p>}

      {status === 'error' && (
        <div style={{ background: '#fee2e2', padding: 12, borderRadius: 10 }}>
          <b>Error:</b> {message}
        </div>
      )}

      {info && (
        <div style={{ background: '#f1f5f9', padding: 12, borderRadius: 10, marginTop: 12 }}>
          <div><b>Tracking:</b> {info.trackingNumber}</div>
          <div><b>From:</b> {info.origin}</div>
          <div><b>To:</b> {info.destination}</div>
          <div><b>Status:</b> {info.status}</div>
        </div>
      )}

      {status === 'ready' && (
        <button
          onClick={confirm}
          style={{
            marginTop: 16,
            width: '100%',
            padding: '14px 12px',
            borderRadius: 12,
            border: 0,
            background: 'black',
            color: 'white',
            fontWeight: 700,
            fontSize: 16
          }}
        >
          Confirm Receipt
        </button>
      )}

      {status === 'confirming' && <p style={{ marginTop: 16 }}>Confirming on blockchain…</p>}

      {status === 'done' && (
        <div style={{ marginTop: 16, background: '#dcfce7', padding: 12, borderRadius: 10 }}>
          <b>Success:</b> {message}
          <p style={{ marginTop: 8 }}>You can close this page.</p>
        </div>
      )}
    </div>
  );
}
