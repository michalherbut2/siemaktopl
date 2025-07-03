// frontend/src/pages/AuthCallback.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { connected } = useWebSocket();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Authenticating with Discord...');

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
        setStatus('Logging in...');
        await login(code);
        
        setStatus('Establishing real-time connection...');
        
        // Wait a bit for WebSocket connection
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } catch (err) {
        console.log('Login error');
        setError('Failed to authenticate with Discord.');
      }
    };

    handleCallback();
  }, [searchParams, login, navigate]);

  // Update status based on WebSocket connection
  useEffect(() => {
    if (connected) {
      setStatus('Connected! Redirecting to dashboard...');
    }
  }, [connected]);

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
        <p className="text-gray-300 mb-2">{status}</p>
        {connected && (
          <div className="flex items-center justify-center space-x-2 text-green-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm">Real-time connection established</span>
          </div>
        )}
      </div>
    </div>
  );
}
