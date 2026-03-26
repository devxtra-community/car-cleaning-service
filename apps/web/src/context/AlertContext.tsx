import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { GlobalAlertDialog } from '../components/shared/GlobalAlertDialog';
import Toast from '../components/shared/Toast';

interface AlertContextType {
  showAlert: (message: string, title?: string) => Promise<void>;
  showConfirm: (message: string, title?: string, confirmText?: string, cancelText?: string) => Promise<boolean>;
  showPrompt: (message: string, title?: string, defaultValue?: string, inputType?: string) => Promise<string | null>;
  showToast: (message: string, type?: 'success' | 'error', duration?: number) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

interface AlertState {
  isOpen: boolean;
  type: 'alert' | 'confirm' | 'prompt';
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  defaultValue?: string;
  inputType?: string;
  resolve?: (value: any) => void;
}

interface ToastState {
  isOpen: boolean;
  message: string;
  type: 'success' | 'error';
  duration: number;
}

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [alertState, setAlertState] = useState<AlertState>({
    isOpen: false,
    type: 'alert',
    message: '',
  });

  const [toastState, setToastState] = useState<ToastState>({
    isOpen: false,
    message: '',
    type: 'success',
    duration: 3000,
  });

  const showAlert = useCallback((message: string, title = 'Notification') => {
    return new Promise<void>((resolve) => {
      setAlertState({
        isOpen: true,
        type: 'alert',
        message,
        title,
        resolve: () => resolve(undefined),
      });
    });
  }, []);

  const showConfirm = useCallback((
    message: string, 
    title = 'Confirm Action', 
    confirmText = 'Yes, I am sure', 
    cancelText = 'Cancel'
  ) => {
    return new Promise<boolean>((resolve) => {
      setAlertState({
        isOpen: true,
        type: 'confirm',
        message,
        title,
        confirmText,
        cancelText,
        resolve,
      });
    });
  }, []);

  const showPrompt = useCallback((message: string, title = 'Input Required', defaultValue = '', inputType = 'text') => {
    return new Promise<string | null>((resolve) => {
      setAlertState({
        isOpen: true,
        type: 'prompt',
        message,
        title,
        defaultValue,
        inputType,
        resolve,
      });
    });
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success', duration = 3000) => {
    setToastState({
      isOpen: true,
      message,
      type,
      duration,
    });
  }, []);

  const handleConfirm = useCallback((value?: any) => {
    setAlertState((prev) => ({ ...prev, isOpen: false }));
    if (alertState.resolve) {
      if (alertState.type === 'confirm') alertState.resolve(true);
      else if (alertState.type === 'prompt') alertState.resolve(value);
      else alertState.resolve(undefined);
    }
  }, [alertState]);

  const handleCancel = useCallback(() => {
    setAlertState((prev) => ({ ...prev, isOpen: false }));
    if (alertState.resolve) {
      if (alertState.type === 'confirm') alertState.resolve(false);
      else if (alertState.type === 'prompt') alertState.resolve(null);
    }
  }, [alertState]);

  const handleToastClose = useCallback(() => {
    setToastState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm, showPrompt, showToast }}>
      {children}
      <GlobalAlertDialog
        isOpen={alertState.isOpen}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        confirmText={alertState.confirmText}
        cancelText={alertState.cancelText}
        defaultValue={alertState.defaultValue}
        inputType={alertState.inputType}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
      {toastState.isOpen && (
        <Toast
          message={toastState.message}
          type={toastState.type}
          duration={toastState.duration}
          onClose={handleToastClose}
        />
      )}
    </AlertContext.Provider>
  );
};
