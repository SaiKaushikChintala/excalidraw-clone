import React from 'react';

import type { CollabPeer } from '@/types';
import { Avatar } from '@/components/avatar';
import { displayName } from '@/utils/collab-names';

const MAX_VISIBLE = 4;

type Props = {
  me: CollabPeer;
  peers: CollabPeer[];
};

export function CollabAvatars({ me, peers }: Props): React.JSX.Element {
  const visible = peers.slice(0, MAX_VISIBLE);
  const hidden = peers.length - visible.length;

  return (
    <div
      className="flex items-center pl-2 pr-3 h-9 rounded-xl select-none"
      style={{
        backgroundColor: 'var(--ex-island-bg)',
        border: '1px solid var(--ex-island-border)',
        boxShadow: 'var(--ex-shadow)',
      }}
    >
      <div className="flex items-center -space-x-1.5">
        {visible.map(peer => (
          <span key={peer.id} title={displayName(peer.name)}>
            <Avatar peer={peer} size={24} />
          </span>
        ))}
        {hidden > 0 && (
          <span
            title={peers.slice(MAX_VISIBLE).map(p => p.name).join(', ')}
            className="inline-flex items-center justify-center rounded-full text-[10px] font-semibold shrink-0"
            style={{
              width: 24,
              height: 24,
              backgroundColor: 'var(--ex-surface-high)',
              color: 'var(--ex-text-muted)',
              boxShadow: '0 0 0 2px var(--ex-island-bg)',
            }}
          >
            +{hidden}
          </span>
        )}
        <span title={`${displayName(me.name)} (you)`}>
          <Avatar peer={me} size={24} ring ringColor="var(--ex-label)" />
        </span>
      </div>
    </div>
  );
}
