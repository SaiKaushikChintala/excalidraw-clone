import React, { useState, useRef, useEffect } from 'react';

import type { CollabStatus, CollabPeer } from '@/types';
import { Avatar } from '@/components/avatar';
import { QrCode } from '@/components/qr-code';
import { UsersIcon } from '@/components/icons';
import { displayName } from '@/utils/collab-names';

const STATUS_LABEL: Record<CollabStatus, string> = {
  idle: 'Not shared',
  connecting: 'Connecting…',
  connected: 'Live',
  error: 'Connection problem',
};

type Props = {
  roomId: string | null;
  status: CollabStatus;
  configured: boolean;
  me: CollabPeer;
  peers: CollabPeer[];
  onNameChange: (name: string) => void;
  onStart: () => void;
  isHost: boolean;
  onLeave: () => void;
  onLinkCopied: () => void;
};

export function CollabPanel({
  roomId,
  status,
  configured,
  me,
  peers,
  onNameChange,
  onStart,
  isHost,
  onLeave,
  onLinkCopied,
}: Props): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', handle, true);
    return () => document.removeEventListener('pointerdown', handle, true);
  }, [open]);

  const copyLink = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      onLinkCopied();
    } catch {
      void 0;
    }
  };

  const live = roomId !== null;
  const shareUrl = live ? window.location.href : '';
  const dotColor =
    status === 'connected' ? '#2f9e44' : status === 'error' ? '#e03131' : 'var(--ex-label)';
  const everyone = [{ ...me, name: `${displayName(me.name)} (you)` }, ...peers];

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        title="Live collaboration"
        className="h-9 px-3 flex items-center gap-2 rounded-xl text-sm font-medium select-none transition-colors"
        style={{
          backgroundColor: live ? 'var(--ex-primary)' : 'var(--ex-island-bg)',
          color: live ? '#ffffff' : 'var(--ex-text)',
          border: '1px solid var(--ex-island-border)',
          boxShadow: 'var(--ex-shadow)',
        }}
      >
        <UsersIcon size={16} />
        Share
        {live && (
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: status === 'connected' ? '#69db7c' : '#ffd43b' }}
          />
        )}
      </button>

      {open && (
        <div
          className="absolute top-full right-0 mt-2 w-[min(20rem,calc(100vw-1.5rem))] max-h-[80dvh] overflow-y-auto rounded-xl p-4 z-50"
          style={{
            backgroundColor: 'var(--ex-island-bg)',
            border: '1px solid var(--ex-island-border)',
            boxShadow: 'var(--ex-shadow)',
            color: 'var(--ex-text)',
          }}
        >
          {!configured && (
            <p className="text-xs mb-3" style={{ color: '#e03131' }}>
              Live collaboration isn't available right now.
            </p>
          )}

          <label
            htmlFor="collab-name"
            className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5"
            style={{ color: 'var(--ex-label)' }}
          >
            Your name
          </label>
          <div className="flex items-center gap-2 mb-4">
            <Avatar peer={me} size={32} />
            <input
              id="collab-name"
              value={me.name}
              maxLength={24}
              placeholder="Anonymous"
              onChange={e => onNameChange(e.target.value)}
              className="flex-1 min-w-0 h-9 px-3 rounded-lg text-sm outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--ex-surface-high)',
                color: 'var(--ex-text)',
                border: '1px solid var(--ex-island-border)',
              }}
            />
          </div>
          {!live ? (
            <>
              <p className="text-sm mb-1 font-semibold">Live collaboration</p>
              <p className="text-xs mb-3" style={{ color: 'var(--ex-text-muted)' }}>
                Start a session and share the link. Anyone with it can view and edit.
              </p>
              <button
                disabled={!configured}
                onClick={onStart}
                className="w-full h-9 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: 'var(--ex-primary)' }}
              >
                Start session
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold">Live session</p>
                <span
                  className="flex items-center gap-1.5 text-xs"
                  style={{ color: 'var(--ex-text-muted)' }}
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ backgroundColor: dotColor }}
                  />
                  {STATUS_LABEL[status]}
                </span>
              </div>

              <div className="flex gap-1.5 mb-4">
                <input
                  readOnly
                  aria-label="Session link"
                  value={shareUrl}
                  onFocus={e => e.currentTarget.select()}
                  className="flex-1 min-w-0 h-8 px-2 rounded-lg text-xs"
                  style={{
                    backgroundColor: 'var(--ex-surface-high)',
                    color: 'var(--ex-text)',
                    border: '1px solid var(--ex-island-border)',
                  }}
                />
                <button
                  onClick={copyLink}
                  className="h-8 px-3 rounded-lg text-xs font-medium text-white"
                  style={{ backgroundColor: 'var(--ex-primary)' }}
                >
                  Copy link
                </button>
              </div>

              <div className="flex justify-center mb-4">
                <QrCode value={shareUrl} />
              </div>

              <p
                className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                style={{ color: 'var(--ex-label)' }}
              >
                In this session · {everyone.length}
              </p>
              <ul className="flex flex-col gap-2 mb-4 max-h-48 overflow-y-auto">
                {everyone.map(p => (
                  <li key={p.id} className="flex items-center gap-2.5 text-sm">
                    <Avatar peer={p} size={24} />
                    <span className="truncate flex-1">{p.name}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => {
                  onLeave();
                  setOpen(false);
                }}
                className="w-full h-9 rounded-lg text-sm font-medium transition-colors hover:bg-(--ex-surface-high)"
                style={{ border: '1px solid var(--ex-island-border)', color: '#e03131' }}
              >
                {isHost ? 'Stop session' : 'Leave session'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
