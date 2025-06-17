import React from 'react';

export function ScrollArea({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`h-[calc(100vh-8rem)] overflow-y-auto scrollbar-thin ${className}`}>
      {children}
    </div>
  );
} 