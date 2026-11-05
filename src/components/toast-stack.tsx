import React from 'react';

import type { Toast } from '@/types';

type Props = {
  toasts: Toast[];
};

export function ToastStack({ toasts }: Props): React.JSX.Element {
  return (
    <div
      aria-live="polite"
      className="absolute bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 pointer-events-none"
    >
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="px-4 py-2 rounded-xl text-sm"
          style={{
            backgroundColor: 'var(--ex-island-bg)',
            border: '1px solid var(--ex-island-border)',
            boxShadow: 'var(--ex-shadow)',
            color: 'var(--ex-text)',
          }}
        >
          {toast.text}
        </div>
      ))}
    </div>
  );
}
