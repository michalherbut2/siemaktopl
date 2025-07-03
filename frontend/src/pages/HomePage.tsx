import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  CommandLineIcon, 
  CogIcon, 
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon,
  WifiIcon // Dodajemy ikonkę statusu
} from '@heroicons/react/24/outline';
import { useWebSocket } from '../hooks/useWebSocket'; // 1. Import hooka

export default function HomePage() {
  const { user } = useAuth();
  const { connected } = useWebSocket(); // 2. Używamy WebSocket hooka

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-20">
        <h1 className="text-5xl font-bold text-white mb-6">
          Discord Bot <span className="text-discord-blurple">Dashboard</span>
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Manage your Discord bot with ease. Configure settings, monitor usage, 
          and control your bot across all your servers from one centralized dashboard.
        </p>
        
        {/* Status WebSocketa */}
        <div className="flex justify-center items-center mb-8 space-x-2">
          <WifiIcon className={`h-6 w-6 ${connected ? "text-green-400" : "text-red-400"}`} />
          <span className={`text-sm font-semibold ${connected ? "text-green-400" : "text-red-400"}`}>
            {connected ? "Live" : "Offline"}
          </span>
        </div>
        
        {user ? (
          <Link
            to="/dashboard"
            className="inline-block bg-discord-blurple hover:bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
          >
            Go to Dashboard
          </Link>
        ) : (
          <Link
            to="/login"
            className="inline-block bg-discord-blurple hover:bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
          >
            Get Started
          </Link>
        )}
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 py-16">
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <CommandLineIcon className="h-12 w-12 text-discord-blurple mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Slash Commands</h3>
          <p className="text-gray-400">Modern Discord slash commands with full TypeScript support.</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <CogIcon className="h-12 w-12 text-green-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Easy Configuration</h3>
          <p className="text-gray-400">Configure your bot settings per server with a user-friendly interface.</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <ShieldCheckIcon className="h-12 w-12 text-yellow-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Secure & Reliable</h3>
          <p className="text-gray-400">Built with security best practices and reliable infrastructure.</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <ChatBubbleLeftRightIcon className="h-12 w-12 text-purple-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Interactive Components</h3>
          <p className="text-gray-400">Buttons, modals, select menus and more interactive elements.</p>
        </div>
      </div>
    </div>
  );
}
