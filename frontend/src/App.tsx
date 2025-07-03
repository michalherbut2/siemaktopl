// frontend/src/App.tsx
import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import GuildPage from './pages/GuildPage';
import AuthCallback from './pages/AuthCallback';
import ProtectedRoute from './components/ProtectedRoute';

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout />,
      children: [
        { index: true, element: <HomePage /> },
        { path: 'login', element: <LoginPage /> },
        { path: 'callback', element: <AuthCallback /> },
        {
          path: 'dashboard',
          element: (
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'guild/:guildId',
          element: (
            <ProtectedRoute>
              <GuildPage />
            </ProtectedRoute>
          ),
        },
      ],
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;