import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string;
  label: string;
  error?: string | null;
  helperText?: string;
}

export function Textarea({
  id,
  label,
  error,
  helperText,
  className = '',
  required,
  rows = 3,
  ...props
}: TextareaProps) {
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;

  return (
    <div className="space-y-1.5 text-right">
      <label htmlFor={id} className="block text-xs sm:text-sm font-medium text-stone-700">
        {label}
        {required && <span className="text-rose-700 mr-1" aria-hidden="true">*</span>}
      </label>
      <textarea
        id={id}
        rows={rows}
        required={required}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : helperText ? helperId : undefined}
        className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-stone-900 transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-800 focus-visible:border-rose-800 resize-none ${
          error ? 'border-red-400 focus-visible:ring-red-600' : 'border-stone-300'
        } ${className}`}
        {...props}
      />
      {helperText && !error && (
        <p id={helperId} className="text-[11px] text-stone-500 leading-normal">
          {helperText}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-red-600 font-medium leading-normal" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
