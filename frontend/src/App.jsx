import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './features/AuthContext.jsx';
import AppShell from './components/AppShell.jsx';
import AppRoutes from './routes/AppRoutes.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppShell>
          <AppRoutes />
        </AppShell>
      </BrowserRouter>
    </AuthProvider>
  );
}
