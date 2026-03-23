'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

const TOAST_VARIANTS = {
  success: {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />,
    colors: { bg: 'bg-green-500/20', text: 'text-green-400', bar: 'bg-green-500' }
  },
  error: {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />,
    colors: { bg: 'bg-red-500/20', text: 'text-red-400', bar: 'bg-red-500' }
  },
  warning: {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
    colors: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', bar: 'bg-yellow-500' }
  }
};

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [show, setShow] = useState(false);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef(null);
  const exitTimerRef = useRef(null);

  const showToast = useCallback((message, type = 'success') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    
    setToast({ visible: true, message, type: TOAST_VARIANTS[type] ? type : 'success' });
    setShow(false);
    setProgress(100);
    
    setTimeout(() => {
      setShow(true);
      setProgress(0);
    }, 10);

    timerRef.current = setTimeout(() => {
      setShow(false);
      
      exitTimerRef.current = setTimeout(() => {
        setToast({ visible: false, message: '', type: 'success' });
      }, 300);
    }, 3000);
  }, []);

  const activeVariant = TOAST_VARIANTS[toast.type];

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast.visible && (
        <div 
          className={`fixed bottom-10 right-10 bg-gray-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 overflow-hidden transition-all duration-300 ease-out transform ${
            show ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'
          }`}
        >
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${activeVariant.colors.bg}`}>
            <svg className={`w-4 h-4 ${activeVariant.colors.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {activeVariant.icon}
            </svg>
          </div>
          <span className="text-sm font-medium">{toast.message}</span>
          <div 
            className={`absolute bottom-0 left-0 h-1 ${activeVariant.colors.bar}`}
            style={{ 
              width: `${progress}%`, 
              transition: progress === 0 ? 'width 3s linear' : 'none' 
            }}
          />
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}