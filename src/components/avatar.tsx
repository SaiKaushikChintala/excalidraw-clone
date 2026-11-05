import React from 'react';

import type { CollabPeer } from '@/types';
import { initialsOf } from '@/utils/collab-names';

type Props = {
  peer: CollabPeer;
  size?: number;
  ring?: boolean;
  ringColor?: string;
};

export function Avatar({ peer, size = 28, ring = false, ringColor }: Props): React.JSX.Element {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-semibold text-white select-none shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        backgroundColor: peer.color,
        boxShadow: ring
          ? `0 0 0 2px var(--ex-island-bg), 0 0 0 4px ${ringColor ?? 'var(--ex-primary)'}`
          : '0 0 0 2px var(--ex-island-bg)',
      }}
    >
      {initialsOf(peer.name)}
    </span>
  );
}
