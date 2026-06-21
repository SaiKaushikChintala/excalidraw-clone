import React from 'react';

import { cn } from '@/lib/utils';

type Props = {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  active?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  style?: React.CSSProperties;
};

export function IconButton({ onClick, title, children, active, size = 'md', className, style }: Props): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'rounded-lg flex items-center justify-center transition-colors hover:bg-(--ex-surface-high)',
        size === 'sm' ? 'w-8 h-8' : 'w-9 h-9',
        className,
      )}
      style={{
        backgroundColor: active ? 'var(--ex-active-bg)' : 'transparent',
        color: active ? 'var(--ex-active-text)' : 'var(--ex-text-muted)',
        ...style,
      }}
    >
      {children}
    </button>
  );
}
