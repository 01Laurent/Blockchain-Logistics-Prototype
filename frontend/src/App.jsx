import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { Toast } from './components/Toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PublicVerifier from './pages/PublicVerifier';
import TamperingDemo from './pages/TamperingDemo';
import PodConfirm from './pages/PodConfirm';

function App() {
  const [user, setUser] = useState(null);

  return (
    <BrowserRouter>
      <Toast />

      <Routes>
        <Route path="/verify" element={<PublicVerifier />} />
        <Route path="/pod/:token" element={<PodConfirm />} />
        <Route
          path="/"
          element={!user ? <Login setUser={setUser} /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/dashboard"
          element={user ? <Dashboard user={user} logout={() => setUser(null)} /> : <Navigate to="/" replace />}
        />
        <Route path="/demo" element={<TamperingDemo />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;