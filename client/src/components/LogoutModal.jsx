import React from 'react';
import { LogOut, X } from 'lucide-react';

const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-6 text-center">
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <LogOut className="text-red-500" size={32} />
          </div>
          
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Sign Out</h3>
          <p className="text-gray-600">Are you sure you want to log out of your account?</p>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row gap-3 p-6 bg-gray-50/50">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 text-gray-700 font-semibold bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3 text-white font-semibold bg-red-500 rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 active:scale-[0.98]"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
