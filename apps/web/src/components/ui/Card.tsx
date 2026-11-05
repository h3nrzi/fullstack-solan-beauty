import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'muted' | 'outline' | 'interactive';
}

export function Card({
  children,
  className = '',
  variant = 'default',
  ...props
}: CardProps) {
  const variants = {
    default: 'bg-white border border-stone-200/80 shadow-xs',
    muted: 'bg-stone-50/70 border border-stone-200/60',
    outline: 'bg-transparent border border-stone-300',
    interactive:
      'bg-white border border-stone-200/80 shadow-xs hover:shadow-md hover:border-stone-300 transition-all duration-200 cursor-pointer',
  };

  return (
    <div className={`rounded-2xl p-5 ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}
