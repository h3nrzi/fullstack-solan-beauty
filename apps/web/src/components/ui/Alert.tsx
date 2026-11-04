import React from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

interface AlertProps {
  type?: 'error' | 'success' | 'info';
  children: React.ReactNode;
  id?: string;
}

export function Alert({ type = 'error', children, id }: AlertProps) {
  const styles = {
    error: 'bg-red-50/90 border-red-200 text-red-800',
    success: 'bg-green-50/90 border-green-200 text-green-800',
    info: 'bg-stone-50 border-stone-200 text-stone-800',
  };

  const icons = {
    error: <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" aria-hidden="true" />,
    success: <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-600" aria-hidden="true" />,
    info: <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-stone-600" aria-hidden="true" />,
  };

  return (
    <div
      id={id}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      className={`p-3.5 rounded-xl text-xs sm:text-sm border flex items-start gap-2.5 transition-all duration-200 ${styles[type]}`}
    >
      {icons[type]}
      <div className="flex-1 leading-relaxed">{children}</div>
    </div>
  );
}
