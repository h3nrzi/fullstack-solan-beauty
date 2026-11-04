import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
}

export function Button({
  children,
  loading = false,
  disabled,
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed select-none';

  const variants = {
    primary:
      'bg-rose-900 text-white hover:bg-rose-800 focus-visible:ring-rose-800 active:scale-[0.99] shadow-sm hover:shadow',
    secondary:
      'bg-stone-100 text-stone-800 hover:bg-stone-200 focus-visible:ring-stone-500',
    outline:
      'border border-stone-300 text-stone-700 bg-transparent hover:bg-stone-50 focus-visible:ring-rose-800',
    danger:
      'bg-red-700 text-white hover:bg-red-800 focus-visible:ring-red-600',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 ml-2 animate-spin" aria-hidden="true" />
          <span>در حال پردازش...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
