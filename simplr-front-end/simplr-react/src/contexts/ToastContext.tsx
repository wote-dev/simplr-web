import React, { createContext } from 'react';
import { toast as shadcnToast } from '@/hooks/use-toast';
import { CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import type { NotificationType } from '@/types';

interface ToastContextType {
  showToast: (message: string, type?: NotificationType, duration?: number) => void;
  removeToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const getToastIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getToastVariant = (type: NotificationType) => {
    switch (type) {
      case 'error':
        return 'destructive' as const;
      default:
        return 'default' as const;
    }
  };

  const getToastClassName = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20';
      case 'warning':
        return 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20';
      case 'info':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20';
      case 'error':
      default:
        return '';
    }
  };

  const showToast = (message: string, type: NotificationType = 'info', duration: number = 2500) => {
    const icon = getToastIcon(type);
    const variant = getToastVariant(type);
    const className = getToastClassName(type);

    shadcnToast({
      description: (
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium">{message}</span>
        </div>
      ),
      variant,
      className,
      duration: duration > 0 ? duration : undefined,
    });
  };

  // Note: removeToast is handled internally by shadcn toast
  const removeToast = () => {
    // This is a no-op as shadcn toast handles removal internally
  };

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}