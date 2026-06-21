import React from 'react';

import type { ToolType } from '@/types';
import { IconButton } from '@/components/icon-button';
import {
  HandIcon,
  SelectionIcon,
  RectangleIcon,
  DiamondIcon,
  EllipseIcon,
  ArrowIcon,
  LineIcon,
  FreedrawIcon,
  TextIcon,
  EraserIcon,
  LockedIcon,
  UnlockedIcon,
} from '@/components/icons';

type Tool = {
  type: ToolType;
  label: string;
  shortcut: string;
  badge?: string;
  Icon: React.FC<{ size?: number }>;
};

const TOOLS: Tool[] = [
  { type: 'hand', label: 'Hand', shortcut: 'H', Icon: HandIcon },
  { type: 'select', label: 'Selection', shortcut: 'V / 1', badge: '1', Icon: SelectionIcon },
  { type: 'rectangle', label: 'Rectangle', shortcut: 'R / 2', badge: '2', Icon: RectangleIcon },
  { type: 'diamond', label: 'Diamond', shortcut: 'D / 3', badge: '3', Icon: DiamondIcon },
  { type: 'ellipse', label: 'Ellipse', shortcut: 'O / 4', badge: '4', Icon: EllipseIcon },
  { type: 'arrow', label: 'Arrow', shortcut: 'A / 5', badge: '5', Icon: ArrowIcon },
  { type: 'line', label: 'Line', shortcut: 'L / 6', badge: '6', Icon: LineIcon },
  { type: 'freedraw', label: 'Draw', shortcut: 'P / 7', badge: '7', Icon: FreedrawIcon },
  { type: 'text', label: 'Text', shortcut: 'T / 8', badge: '8', Icon: TextIcon },
  { type: 'eraser', label: 'Eraser', shortcut: 'E / 0', badge: '0', Icon: EraserIcon },
];

type Props = {
  activeTool: ToolType;
  toolLocked: boolean;
  onToolChange: (tool: ToolType) => void;
  onLockToggle: () => void;
};

export function Toolbar({ activeTool, toolLocked, onToolChange, onLockToggle }: Props): React.JSX.Element {
  const isActive = (type: string): boolean => activeTool === type;
  const isLockActive = toolLocked;

  return (
    <div
      className="absolute bottom-3 left-3 right-3 z-20 flex items-center gap-0.5 select-none rounded-xl border px-2 py-1 overflow-x-auto md:bottom-auto md:top-3 md:left-1/2 md:right-auto md:-translate-x-1/2 md:p-1"
      style={{
        backgroundColor: 'var(--ex-island-bg)',
        borderColor: 'var(--ex-island-border)',
        boxShadow: 'var(--ex-shadow)',
      }}
    >

      <IconButton title="Keep active tool — Q" onClick={onLockToggle} active={isLockActive}>
        {isLockActive ? <LockedIcon size={16} /> : <UnlockedIcon size={16} />}
      </IconButton>

      <div className="w-px h-6 mx-0.5 self-center" style={{ backgroundColor: 'var(--ex-divider)' }} />

      {TOOLS.map(({ type, label, shortcut, badge, Icon }) => (
        <IconButton
          key={type}
          title={`${label} — ${shortcut}`}
          onClick={() => onToolChange(type)}
          active={isActive(type)}
          className="relative"
        >
          <Icon size={18} />
          {badge && (
            <span
              className="absolute pointer-events-none hidden md:inline"
              style={{
                bottom: 2,
                right: 3,
                fontSize: 8,
                lineHeight: 1,
                color: isActive(type) ? 'var(--ex-active-text)' : 'var(--ex-label)',
              }}
            >
              {badge}
            </span>
          )}
        </IconButton>
      ))}
    </div>
  );
}
