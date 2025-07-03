// frontend/src/pages/AuthCallback.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');
      
      if (errorParam) {
        setError('Authentication was cancelled or failed.');
        return;
      }

      if (!code) {
        setError('No authorization code received.');
        return;
      }

      try {
        await login(code);
        navigate('/dashboard');
      } catch (err) {
        // console.error('Login error:', err);
        console.log('Login error');
        setError('Failed to authenticate with Discord.');
      }
    };

    handleCallback();
  }, [searchParams, login, navigate]);

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <div className="bg-red-900/20 border border-red-500 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-red-400 mb-2">Authentication Error</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-discord-blurple mx-auto mb-4"></div>
        <p className="text-gray-300">Authenticating with Discord...</p>
      </div>
    </div>
  );
}