import React, { useEffect, useState } from 'react';
import { FiAlertCircle, FiInfo, FiEdit3 } from 'react-icons/fi';

export interface GlobalAlertDialogProps {
  isOpen: boolean;
  type: 'alert' | 'confirm' | 'prompt';
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  defaultValue?: string;
  inputType?: string;
  onConfirm: (value?: string) => void;
  onCancel: () => void;
}

export const GlobalAlertDialog: React.FC<GlobalAlertDialogProps> = ({
  isOpen,
  type,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  defaultValue = '',
  inputType = 'text',
  onConfirm,
  onCancel,
}) => {
  const [inputValue, setInputValue] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) {
      setInputValue(defaultValue);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const isAlert = type === 'alert';
  const isPrompt = type === 'prompt';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-300 animate-in fade-in" 
        onClick={isAlert ? () => onConfirm() : onCancel}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-[0_32px_64px_-16px_rgba(15,23,42,0.5)] w-full max-w-sm transform transition-all overflow-hidden border border-slate-200/50 animate-in zoom-in-95 duration-200">
        <div className="p-8">
          <div className="flex flex-col items-center text-center gap-5">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm animate-bounce-subtle ${isAlert ? 'bg-indigo-50 text-indigo-600' : isPrompt ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
              {isAlert ? <FiInfo className="w-8 h-8" /> : isPrompt ? <FiEdit3 className="w-8 h-8" /> : <FiAlertCircle className="w-8 h-8" />}
            </div>
            
            <div className="w-full">
              {title && <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">{title}</h3>}
              <p className="text-slate-500 text-sm leading-relaxed font-medium mb-6">{message}</p>
              
              {isPrompt && (
                <input
                  autoFocus
                  type={inputType}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  placeholder="Enter value..."
                  onKeyDown={(e) => e.key === 'Enter' && onConfirm(inputValue)}
                />
              )}
            </div>
          </div>
        </div>

        <div className="bg-slate-50/50 px-8 py-5 flex flex-col gap-3 border-t border-slate-100">
          <button
            className={`w-full py-3.5 rounded-2xl text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98] ${isAlert ? 'bg-indigo-600 shadow-indigo-500/25 hover:bg-indigo-700' : isPrompt ? 'bg-amber-600 shadow-amber-500/25 hover:bg-amber-700' : 'bg-rose-600 shadow-rose-500/25 hover:bg-rose-700'}`}
            onClick={() => onConfirm(isPrompt ? inputValue : undefined)}
          >
            {isPrompt ? 'Submit' : confirmText}
          </button>
          
          {!isAlert && (
            <button
              className="w-full py-3.5 rounded-2xl bg-white text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 transition-all active:scale-[0.98]"
              onClick={onCancel}
            >
              {cancelText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
