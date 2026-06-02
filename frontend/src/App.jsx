import React from 'react';
import AppRoutes from './routes';
import { AuthProvider } from './store/authContext';

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
