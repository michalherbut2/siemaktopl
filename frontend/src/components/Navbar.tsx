// frontend/src/components/Navbar.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserCircleIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-discord-darker border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link 
            to="/" 
            className="text-xl font-bold text-discord-blurple hover:text-blue-400 transition-colors"
          >
            Discord Bot Dashboard
          </Link>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                >
                  <Cog6ToothIcon className="h-5 w-5" />
                  <span>Dashboard</span>
                </Link>
                                
                <div className="flex items-center space-x-2 text-gray-300">
                  <UserCircleIcon className="h-6 w-6" />
                  <span>{user.username}</span>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="bg-discord-blurple hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Login with Discord
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}