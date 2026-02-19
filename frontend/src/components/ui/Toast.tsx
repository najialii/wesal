import React, { useEffect, useState } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { ToastNotification } from '../../contexts/ToastContext';

interface ToastProps {
  toastNotification: ToastNotification;
  onRemove: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toastNotification, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(toastNotification.id), 300); // Match animation duration
  };

  const getIcon = () => {
    switch (toastNotification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (toastNotification.type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getTextColor = () => {
    switch (toastNotification.type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-gray-800';
    }
  };

  return (
    <div
      className={`
        relative flex items-start p-4 mb-3 border rounded-lg shadow-lg max-w-sm w-full
        transition-all duration-300 ease-in-out transform
        ${getBackgroundColor()}
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${isExiting ? 'translate-x-full opacity-0' : ''}
      `}
    >
      <div className="flex-shrink-0 mr-3 mt-0.5">
        {getIcon()}
      </div>
      
      <div className={`flex-1 ${getTextColor()}`}>
        {toastNotification.title && (
          <h4 className="font-medium text-sm mb-1">
            {toastNotification.title}
          </h4>
        )}
        <p className="text-sm">
          {toastNotification.message}
        </p>
      </div>
      
      {toastNotification.dismissible && (
        <button
          onClick={handleRemove}
          className={`
            flex-shrink-0 ml-3 p-1 rounded-md transition-colors
            hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2
            ${toastNotification.type === 'success' ? 'focus:ring-green-500' : ''}
            ${toastNotification.type === 'error' ? 'focus:ring-red-500' : ''}
            ${toastNotification.type === 'warning' ? 'focus:ring-yellow-500' : ''}
            ${toastNotification.type === 'info' ? 'focus:ring-blue-500' : ''}
          `}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Toast; 
      <div className={`flex-1 ${getTextColor()}`}>
        {toast.title && (
          <h4 className="font-medium text-sm mb-1">
            {toast.title}
          </h4>
        )}
        <p className="text-sm">
          {toast.message}
        </p>
      </div>
      
      {toast.dismissible && (
        <button
          onClick={handleRemove}
          className={`
            flex-shrink-0 ml-3 p-1 rounded-md transition-colors
            hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2
            ${toast.type === 'success' ? 'focus:ring-green-500' : ''}
            ${toast.type === 'error' ? 'focus:ring-red-500' : ''}
            ${toast.type === 'warning' ? 'focus:ring-yellow-500'