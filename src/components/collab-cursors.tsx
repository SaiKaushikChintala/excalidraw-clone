import React from 'react';

import type { CollabPeer, CollabCursor, ViewTransform } from '@/types';
import { displayName } from '@/utils/collab-names';

type Props = {
  peers: CollabPeer[];
  cursors: Record<string, CollabCursor>;
  viewTransform: ViewTransform;
};

export function CollabCursors({ peers, cursors, viewTransform }: Props): React.JSX.Element {
  const { scrollX, scrollY, zoom } = viewTransform;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 6 }}>
      {peers.map(peer => {
        const c = cursors[peer.id];
        if (!c) return null;
        return (
          <div
            key={peer.id}
            className="absolute top-0 left-0"
            style={{
              transform: `translate(${c.x * zoom + scrollX}px, ${c.y * zoom + scrollY}px)`,
              transition: 'transform 90ms linear',
            }}
          >
            <svg
              width="16"
              height="20"
              viewBox="0 0 16 20"
              aria-hidden="true"
              style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))' }}
            >
              <path
                d="M1 1 L1 15 L5 11.5 L8 18 L10.5 17 L7.5 10.5 L13 10.5 Z"
                fill={peer.color}
                stroke="#ffffff"
                strokeWidth="1"
                strokeLinejoin="round"
              />
            </svg>
            <span
              className="absolute left-3.5 top-4 px-2 py-1 rounded-full text-[11px] font-medium leading-none whitespace-nowrap text-white"
              style={{
                backgroundColor: peer.color,
                boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
              }}
            >
              {displayName(peer.name)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
