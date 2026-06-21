import React, { useState, useRef, useEffect } from 'react';

import type { AppState } from '@/types';
import { HamburgerMenuIcon, SunIcon, MoonIcon, DeviceDesktopIcon } from '@/components/icons';
import { CANVAS_BACKGROUNDS } from '@/utils/constants';

const THEME_CHOICES = [
  { value: 'light' as const, label: 'Light', Icon: SunIcon },
  { value: 'dark' as const, label: 'Dark', Icon: MoonIcon },
  { value: 'system' as const, label: 'System', Icon: DeviceDesktopIcon },
];

type Props = {
  appState: AppState;
  onAppStateChange: (updates: Partial<AppState>) => void;
};

export function MainMenu({ appState, onAppStateChange }: Props): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <div ref={menuRef} className="relative">

      <button
        onClick={() => setOpen(v => !v)}
        title="Main menu"
        className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors hover:bg-(--ex-surface-high)"
        style={{
          backgroundColor: open ? 'var(--ex-surface-high)' : 'transparent',
          color: 'var(--ex-text-muted)',
        }}
      >
        <HamburgerMenuIcon size={18} />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-1 w-56 rounded-xl py-2 z-50"
          style={{
            backgroundColor: 'var(--ex-island-bg)',
            border: '1px solid var(--ex-island-border)',
            boxShadow: 'var(--ex-shadow)',
            color: 'var(--ex-text)',
          }}
        >

          <div className="px-3 py-1.5">
            <p
              className="text-[10px] font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: 'var(--ex-label)' }}
            >
              Theme
            </p>
            <div
              className="flex gap-0.5 p-0.5 rounded-lg"
              style={{ backgroundColor: 'var(--ex-surface-high)' }}
            >
              {THEME_CHOICES.map(({ value, label, Icon }) => {
                const active = appState.theme === value;
                return (
                  <button
                    key={value}
                    title={label}
                    aria-label={label}
                    onClick={() => onAppStateChange({ theme: value })}
                    className="flex-1 h-8 flex items-center justify-center rounded-md transition-colors"
                    style={{
                      backgroundColor: active ? 'var(--ex-island-bg)' : 'transparent',
                      color: active ? 'var(--ex-active-text)' : 'var(--ex-text-muted)',
                      boxShadow: active ? '0 1px 2px rgba(0,0,0,.12)' : undefined,
                    }}
                  >
                    <Icon size={16} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="my-1 border-t" style={{ borderColor: 'var(--ex-divider)' }} />

          <div className="px-3 py-1.5">
            <p
              className="text-[10px] font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--ex-label)' }}
            >
              Canvas Background
            </p>

            <div className="flex flex-wrap gap-1.5" style={{ filter: 'var(--theme-filter)' }}>
              {CANVAS_BACKGROUNDS.map(({ label, color }) => (
                <button
                  key={color}
                  title={label}
                  onClick={() => {
                    onAppStateChange({ canvasBackground: color });
                    setOpen(false);
                  }}
                  className="w-6 h-6 rounded transition-all"
                  style={{
                    backgroundColor: color,
                    border: appState.canvasBackground === color
                      ? '2px solid var(--ex-primary)'
                      : '1px solid var(--ex-island-border)',
                    transform: appState.canvasBackground === color ? 'scale(1.1)' : undefined,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
