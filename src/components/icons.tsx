import React from 'react';

type IconProps = { size?: number; className?: string; style?: React.CSSProperties };

function Svg24({ children, size = 20, className = '', style }: { children: React.ReactNode; size?: number; className?: string; style?: React.CSSProperties }): React.JSX.Element {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      role="img"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      {children}
    </svg>
  );
}

function Svg20({ children, size = 20, className = '', style }: { children: React.ReactNode; size?: number; className?: string; style?: React.CSSProperties }): React.JSX.Element {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      role="img"
      viewBox="0 0 20 20"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      {children}
    </svg>
  );
}

function Svg22({ children, size = 20, className = '', style }: { children: React.ReactNode; size?: number; className?: string; style?: React.CSSProperties }): React.JSX.Element {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      role="img"
      viewBox="0 0 22 22"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      {children}
    </svg>
  );
}

function ArrowheadSvg({ size = 20, className = '', children }: IconProps & { children: React.ReactNode }): React.JSX.Element {
  return (
    <svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 40 20" width={(size * 40) / 20} height={size} fill="none" stroke="currentColor" className={className}>
      {children}
    </svg>
  );
}

export function HandIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg24 size={size} className={className}>
      <g strokeWidth={1.25}>
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M8 13v-7.5a1.5 1.5 0 0 1 3 0v6.5" />
        <path d="M11 5.5v-2a1.5 1.5 0 1 1 3 0v8.5" />
        <path d="M14 5.5a1.5 1.5 0 0 1 3 0v6.5" />
        <path d="M17 7.5a1.5 1.5 0 0 1 3 0v8.5a6 6 0 0 1 -6 6h-2h.208a6 6 0 0 1 -5.012 -2.7a69.74 69.74 0 0 1 -.196 -.3c-.312 -.479 -1.407 -2.388 -3.286 -5.728a1.5 1.5 0 0 1 .536 -2.022a1.867 1.867 0 0 1 2.28 .28l1.47 1.47" />
      </g>
    </Svg24>
  );
}

export function SelectionIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg22 size={size} className={className}>
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M6 6l4.153 11.793a0.365 .365 0 0 0 .331 .207a0.366 .366 0 0 0 .332 -.207l2.184 -4.793l4.787 -1.994a0.355 .355 0 0 0 .213 -.323a0.355 .355 0 0 0 -.213 -.323l-11.787 -4.36z" />
        <path d="M13.5 13.5l4.5 4.5" />
      </g>
    </Svg22>
  );
}

export function RectangleIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg24 size={size} className={className}>
      <g strokeWidth="1.5">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <rect x="4" y="4" width="16" height="16" rx="2" />
      </g>
    </Svg24>
  );
}

export function DiamondIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg24 size={size} className={className}>
      <g strokeWidth="1.5">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M10.5 20.4l-6.9 -6.9c-.781 -.781 -.781 -2.219 0 -3l6.9 -6.9c.781 -.781 2.219 -.781 3 0l6.9 6.9c.781 .781 .781 2.219 0 3l-6.9 6.9c-.781 .781 -2.219 .781 -3 0z" />
      </g>
    </Svg24>
  );
}

export function EllipseIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg24 size={size} className={className}>
      <g strokeWidth="1.5">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <circle cx="12" cy="12" r="9" />
      </g>
    </Svg24>
  );
}

export function ArrowIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg24 size={size} className={className}>
      <g strokeWidth="1.5">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <line x1="5" y1="12" x2="19" y2="12" />
        <line x1="15" y1="16" x2="19" y2="12" />
        <line x1="15" y1="8" x2="19" y2="12" />
      </g>
    </Svg24>
  );
}

export function LineIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg20 size={size} className={className}>
      <path d="M4.167 10h11.666" strokeWidth="1.5" />
    </Svg20>
  );
}

export function FreedrawIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg20 size={size} className={className}>
      <g strokeWidth="1.25">
        <path
          clipRule="evenodd"
          d="m7.643 15.69 7.774-7.773a2.357 2.357 0 1 0-3.334-3.334L4.31 12.357a3.333 3.333 0 0 0-.977 2.357v1.953h1.953c.884 0 1.732-.352 2.357-.977Z"
        />
        <path d="m11.25 5.417 3.333 3.333" />
      </g>
    </Svg20>
  );
}

export function TextIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg24 size={size} className={className}>
      <g strokeWidth="1.5">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <line x1="4" y1="20" x2="7" y2="20" />
        <line x1="14" y1="20" x2="21" y2="20" />
        <line x1="6.9" y1="15" x2="13.8" y2="15" />
        <line x1="10.2" y1="6.3" x2="16" y2="20" />
        <polyline points="5 20 11 4 13 4 20 20" />
      </g>
    </Svg24>
  );
}

export function EraserIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg24 size={size} className={className}>
      <g strokeWidth="1.5">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M19 20h-10.5l-4.21 -4.3a1 1 0 0 1 0 -1.41l10 -10a1 1 0 0 1 1.41 0l5 5a1 1 0 0 1 0 1.41l-9.2 9.3" />
        <path d="M18 13.3l-6.3 -6.3" />
      </g>
    </Svg24>
  );
}

export function LaserPointerIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg24 size={size} className={className}>
      <g strokeWidth="1.5">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M13.5 10.5 4 20" />
        <path d="m14 4 .6 2.1L16.7 7l-2.1.9L14 10l-.6-2.1L11.3 7l2.1-.9z" />
        <path d="m18.5 11 .4 1.3 1.3.5-1.3.5-.4 1.3-.5-1.3-1.2-.5 1.2-.5z" />
      </g>
    </Svg24>
  );
}

export function PaletteIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg24 size={size} className={className}>
      <g strokeWidth="1.5">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M12 21a9 9 0 1 1 0-18c4.97 0 9 3.58 9 8 0 2.21-1.79 3-3.5 3H15a2 2 0 0 0-1.5 3.3c.5.7.2 1.7-1.5 1.7z" />
        <circle cx="7.5" cy="11" r="1" />
        <circle cx="10.5" cy="7" r="1" />
        <circle cx="15.5" cy="7.5" r="1" />
      </g>
    </Svg24>
  );
}

export function UndoIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg20 size={size} className={className}>
      <path
        d="M7.5 10.833 4.167 7.5 7.5 4.167M4.167 7.5h9.166a3.333 3.333 0 0 1 0 6.667H12.5"
        strokeWidth="1.25"
      />
    </Svg20>
  );
}

export function RedoIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg20 size={size} className={className}>
      <path
        d="M12.5 10.833 15.833 7.5 12.5 4.167M15.833 7.5H6.667a3.333 3.333 0 1 0 0 6.667H7.5"
        strokeWidth="1.25"
      />
    </Svg20>
  );
}

export function ZoomInIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg20 size={size} className={className}>
      <path strokeWidth="1.25" d="M10 4.167v11.666M4.167 10h11.666" />
    </Svg20>
  );
}

export function ZoomOutIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg20 size={size} className={className}>
      <path d="M5 10h10" strokeWidth="1.25" />
    </Svg20>
  );
}

export function LockedIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg20 size={size} className={className}>
      <g strokeWidth="1.25">
        <path d="M13.542 8.542H6.458a2.5 2.5 0 0 0-2.5 2.5v3.75a2.5 2.5 0 0 0 2.5 2.5h7.084a2.5 2.5 0 0 0 2.5-2.5v-3.75a2.5 2.5 0 0 0-2.5-2.5Z" />
        <path d="M10 13.958a1.042 1.042 0 1 0 0-2.083 1.042 1.042 0 0 0 0 2.083Z" />
        <path d="M6.667 8.333V5.417C6.667 3.806 8.159 2.5 10 2.5c1.841 0 3.333 1.306 3.333 2.917v2.916" />
      </g>
    </Svg20>
  );
}

export function UnlockedIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg20 size={size} className={className}>
      <g strokeWidth="1.25">
        <path d="M13.542 8.542H6.458a2.5 2.5 0 0 0-2.5 2.5v3.75a2.5 2.5 0 0 0 2.5 2.5h7.084a2.5 2.5 0 0 0 2.5-2.5v-3.75a2.5 2.5 0 0 0-2.5-2.5Z" />
        <path d="M10 13.958a1.042 1.042 0 1 0 0-2.083 1.042 1.042 0 0 0 0 2.083Z" />
        <path d="M6.667 8.333V5.417c0-1.611 1.492-2.917 3.333-2.917 1.35 0 2.516.737 3.073 1.806" />
      </g>
    </Svg20>
  );
}

export function HamburgerMenuIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg24 size={size} className={className}>
      <g strokeWidth="1.5">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <line x1="4" y1="6" x2="20" y2="6" />
        <line x1="4" y1="12" x2="20" y2="12" />
        <line x1="4" y1="18" x2="20" y2="18" />
      </g>
    </Svg24>
  );
}

export function SunIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg20 size={size} className={className}>
      <g stroke="currentColor" strokeLinejoin="round">
        <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM10 4.167V2.5M14.167 5.833l1.166-1.166M15.833 10H17.5M14.167 14.167l1.166 1.166M10 15.833V17.5M5.833 14.167l-1.166 1.166M5 10H3.333M5.833 5.833 4.667 4.667" />
      </g>
    </Svg20>
  );
}

export function MoonIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg20 size={size} className={className}>
      <path
        clipRule="evenodd"
        d="M10 2.5h.328a6.25 6.25 0 0 0 6.6 10.372A7.5 7.5 0 1 1 10 2.493V2.5Z"
        stroke="currentColor"
      />
    </Svg20>
  );
}

export function SloppinessArchitectIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg20 size={size} className={className}>
      <path strokeWidth="1.25" d="M2.5 12.038c1.655-.885 5.9-3.292 8.568-4.354 2.668-1.063.101 2.821 1.32 3.104 1.218.283 5.112-1.814 5.112-1.814" />
    </Svg20>
  );
}

export function SloppinessArtistIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg20 size={size} className={className}>
      <path strokeWidth="1.25" d="M2.5 12.563c1.655-.886 5.9-3.293 8.568-4.355 2.668-1.062.101 2.822 1.32 3.105 1.218.283 5.112-1.814 5.112-1.814m-13.469 2.23c2.963-1.586 6.13-5.62 7.468-4.998 1.338.623-1.153 4.11-.132 5.595 1.02 1.487 6.133-1.43 6.133-1.43" />
    </Svg20>
  );
}

export function SloppinessCartoonistIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg20 size={size} className={className}>
      <path strokeWidth="1.25" d="M2.5 11.936c1.737-.879 8.627-5.346 10.42-5.268 1.795.078-.418 5.138.345 5.736.763.598 3.53-1.789 4.235-2.147M2.929 9.788c1.164-.519 5.47-3.28 6.987-3.114 1.519.165 1 3.827 2.121 4.109 1.122.281 3.839-2.016 4.606-2.42" />
    </Svg20>
  );
}

export function EdgeSharpIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 20 20" width={size} height={size} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <g strokeWidth="1.5">
        <path d="M3.33334 9.99998V6.66665C3.33334 6.04326 3.33403 4.9332 3.33539 3.33646C4.95233 3.33436 6.06276 3.33331 6.66668 3.33331H10" />
        <path d="M13.3333 3.33331V3.34331" />
        <path d="M16.6667 3.33331V3.34331" />
        <path d="M16.6667 6.66669V6.67669" />
        <path d="M16.6667 10V10.01" />
        <path d="M3.33334 13.3333V13.3433" />
        <path d="M16.6667 13.3333V13.3433" />
        <path d="M3.33334 16.6667V16.6767" />
        <path d="M6.66666 16.6667V16.6767" />
        <path d="M10 16.6667V16.6767" />
        <path d="M13.3333 16.6667V16.6767" />
        <path d="M16.6667 16.6667V16.6767" />
      </g>
    </svg>
  );
}

export function EdgeRoundIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg24 size={size} className={className}>
      <g strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M4 12v-4a4 4 0 0 1 4 -4h4" />
        <line x1="16" y1="4" x2="16" y2="4.01" />
        <line x1="20" y1="4" x2="20" y2="4.01" />
        <line x1="20" y1="8" x2="20" y2="8.01" />
        <line x1="20" y1="12" x2="20" y2="12.01" />
        <line x1="4" y1="16" x2="4" y2="16.01" />
        <line x1="20" y1="16" x2="20" y2="16.01" />
        <line x1="4" y1="20" x2="4" y2="20.01" />
        <line x1="8" y1="20" x2="8" y2="20.01" />
        <line x1="12" y1="20" x2="12" y2="20.01" />
        <line x1="16" y1="20" x2="16" y2="20.01" />
        <line x1="20" y1="20" x2="20" y2="20.01" />
      </g>
    </Svg24>
  );
}

export function BringForwardIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg24 size={size} className={className}>
      <g strokeWidth="1.5">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M12 5l0 14" />
        <path d="M16 9l-4 -4" />
        <path d="M8 9l4 -4" />
      </g>
    </Svg24>
  );
}

export function SendBackwardIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg24 size={size} className={className} style={{ transform: 'rotate(180deg)' } as React.CSSProperties}>
      <g strokeWidth="1.5">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M12 5l0 14" />
        <path d="M16 9l-4 -4" />
        <path d="M8 9l4 -4" />
      </g>
    </Svg24>
  );
}

export function BringToFrontIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg24 size={size} className={className}>
      <g strokeWidth="1.5">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M12 10l0 10" />
        <path d="M12 10l4 4" />
        <path d="M12 10l-4 4" />
        <path d="M4 4l16 0" />
      </g>
    </Svg24>
  );
}

export function SendToBackIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg24 size={size} className={className} style={{ transform: 'rotate(180deg)' } as React.CSSProperties}>
      <g strokeWidth="1.5">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M12 10l0 10" />
        <path d="M12 10l4 4" />
        <path d="M12 10l-4 4" />
        <path d="M4 4l16 0" />
      </g>
    </Svg24>
  );
}

export function FillHachureIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg20 size={size} className={className}>
      <path d="M5.879 2.625h8.242a3.254 3.254 0 0 1 3.254 3.254v8.242a3.254 3.254 0 0 1-3.254 3.254H5.88a3.254 3.254 0 0 1-3.254-3.254V5.88a3.254 3.254 0 0 1 3.254-3.254Z" stroke="currentColor" strokeWidth="1.25" />
      <mask id="fillHachure" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x={2} y={2} width={16} height={16}>
        <path d="M5.879 2.625h8.242a3.254 3.254 0 0 1 3.254 3.254v8.242a3.254 3.254 0 0 1-3.254 3.254H5.88a3.254 3.254 0 0 1-3.254-3.254V5.88a3.254 3.254 0 0 1 3.254-3.254Z" fill="currentColor" stroke="currentColor" strokeWidth="1.25" />
      </mask>
      <g mask="url(#fillHachure)">
        <path d="M2.258 15.156 15.156 2.258M7.324 20.222 20.222 7.325m-20.444 5.35L12.675-.222m-8.157 18.34L17.416 5.22" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </Svg20>
  );
}

export function FillCrossHatchIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg20 size={size} className={className}>
      <g clipPath="url(#fillCrossClip)">
        <path d="M5.879 2.625h8.242a3.254 3.254 0 0 1 3.254 3.254v8.242a3.254 3.254 0 0 1-3.254 3.254H5.88a3.254 3.254 0 0 1-3.254-3.254V5.88a3.254 3.254 0 0 1 3.254-3.254Z" stroke="currentColor" strokeWidth="1.25" />
        <mask id="fillCross" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x={-1} y={-1} width={22} height={22}>
          <path d="M2.426 15.044 15.044 2.426M7.383 20 20 7.383M0 12.617 12.617 0m-7.98 17.941L17.256 5.324m-2.211 12.25L2.426 4.956M20 12.617 7.383 0m5.234 20L0 7.383m17.941 7.98L5.324 2.745" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
        </mask>
        <g mask="url(#fillCross)">
          <path d="M14.121 2H5.88A3.879 3.879 0 0 0 2 5.879v8.242A3.879 3.879 0 0 0 5.879 18h8.242A3.879 3.879 0 0 0 18 14.121V5.88A3.879 3.879 0 0 0 14.121 2Z" fill="currentColor" />
        </g>
      </g>
      <defs><clipPath id="fillCrossClip"><path fill="#fff" d="M0 0h20v20H0z" /></clipPath></defs>
    </Svg20>
  );
}

export function FillSolidIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg20 size={size} className={className}>
      <path d="M4.91 2.625h10.18a2.284 2.284 0 0 1 2.285 2.284v10.182a2.284 2.284 0 0 1-2.284 2.284H4.909a2.284 2.284 0 0 1-2.284-2.284V4.909a2.284 2.284 0 0 1 2.284-2.284Z" stroke="currentColor" fill="currentColor" strokeWidth="1.25" />
    </Svg20>
  );
}

export function StrokeWidthThinIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg20 size={size} className={className}>
      <path d="M4.167 10h11.666" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </Svg20>
  );
}

export function StrokeWidthBoldIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg20 size={size} className={className}>
      <path d="M5 10h10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg20>
  );
}

export function StrokeWidthExtraBoldIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg20 size={size} className={className}>
      <path d="M5 10h10" stroke="currentColor" strokeWidth="3.75" strokeLinecap="round" strokeLinejoin="round" />
    </Svg20>
  );
}

export function StrokeStyleSolidIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg24 size={size} className={className}>
      <g strokeWidth="2"><path d="M5 12h14" /></g>
    </Svg24>
  );
}

export function StrokeStyleDashedIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg24 size={size} className={className}>
      <g strokeWidth="2">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M5 12h2" /><path d="M17 12h2" /><path d="M11 12h2" />
      </g>
    </Svg24>
  );
}

export function StrokeStyleDottedIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg24 size={size} className={className}>
      <g strokeWidth="2">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M4 12v.01" /><path d="M8 12v.01" /><path d="M12 12v.01" /><path d="M16 12v.01" /><path d="M20 12v.01" />
      </g>
    </Svg24>
  );
}

export function SharpArrowIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg24 size={size} className={className}>
      <g>
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M6 18l12 -12" /><path d="M18 10v-4h-4" />
      </g>
    </Svg24>
  );
}

export function RoundArrowIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg24 size={size} className={className}>
      <g>
        <path d="M16,12L20,9L16,6" /><path d="M6 20c0 -6.075 4.925 -11 11 -11h3" />
      </g>
    </Svg24>
  );
}

export function ElbowArrowIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg24 size={size} className={className}>
      <g>
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M4,19L10,19C11.097,19 12,18.097 12,17L12,9C12,7.903 12.903,7 14,7L21,7" />
        <path d="M18 4l3 3l-3 3" />
      </g>
    </Svg24>
  );
}

export function ArrowheadNoneIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <ArrowheadSvg size={size} className={className}>
      <g stroke="currentColor" opacity={0.3} strokeWidth={2} fill="none" strokeLinecap="round">
        <path d="M7,11 H19" /><path d="M25,6 L33,16 M33,6 L25,16" />
      </g>
    </ArrowheadSvg>
  );
}

export function ArrowheadArrowIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <ArrowheadSvg size={size} className={className}>
      <g stroke="currentColor" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7,11 H33 M23,5 L33,11 L23,17" />
      </g>
    </ArrowheadSvg>
  );
}

export function ArrowheadTriangleIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <ArrowheadSvg size={size} className={className}>
      <g stroke="currentColor" fill="currentColor" strokeLinejoin="round">
        <path d="M7,11 H23" strokeWidth={2} strokeLinecap="round" />
        <path d="M23,5 L35,11 L23,17 Z" />
      </g>
    </ArrowheadSvg>
  );
}

export function FontSizeSmallIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg20 size={size} className={className}>
      <path d="M14.167 6.667a3.333 3.333 0 0 0-3.334-3.334H9.167a3.333 3.333 0 0 0 0 6.667h1.666a3.333 3.333 0 0 1 0 6.667H9.167a3.333 3.333 0 0 1-3.334-3.334" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </Svg20>
  );
}

export function FontSizeMediumIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg20 size={size} className={className}>
      <path d="M5 16.667V3.333L10 15l5-11.667v13.334" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </Svg20>
  );
}

export function FontSizeLargeIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg20 size={size} className={className}>
      <path d="M5.833 3.333v13.334h8.334" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </Svg20>
  );
}

export function FontSizeExtraLargeIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg20 size={size} className={className}>
      <path d="m1.667 3.333 6.666 13.334M8.333 3.333 1.667 16.667M11.667 3.333v13.334h6.666" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </Svg20>
  );
}

export function FontFamilyHandDrawnIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg24 size={size} className={className}>
      <g strokeWidth="1.5">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M3 19c3.333 -2 5 -4 5 -6c0 -3 -1 -3 -2 -3s-2.032 1.085 -2 3c.034 2.048 1.658 4.877 2.5 6c1.5 2 2.5 2.5 3.5 1l2 -3c.333 1.667 1.333 2.5 3 2.5h2" />
      </g>
    </Svg24>
  );
}

export function FontFamilyNormalIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg24 size={size} className={className}>
      <g strokeWidth="1.5">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M4 20l3 0" /><path d="M14 20l7 0" /><path d="M6.9 15l6.9 0" />
        <path d="M10.2 6.3l5.8 13.7" /><path d="M5 20l6 -16l2 0l7 16" />
      </g>
    </Svg24>
  );
}

export function FontFamilyCodeIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg24 size={size} className={className}>
      <g strokeWidth="1.5">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M7 8l-4 4l4 4" /><path d="M17 8l4 4l-4 4" /><path d="M14 4l-4 16" />
      </g>
    </Svg24>
  );
}

export function TextAlignLeftIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg24 size={size} className={className}>
      <g strokeWidth="2">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <line x1="4" y1="8" x2="20" y2="8" /><line x1="4" y1="12" x2="12" y2="12" /><line x1="4" y1="16" x2="16" y2="16" />
      </g>
    </Svg24>
  );
}

export function TextAlignCenterIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg24 size={size} className={className}>
      <g strokeWidth="2">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <line x1="4" y1="8" x2="20" y2="8" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="6" y1="16" x2="18" y2="16" />
      </g>
    </Svg24>
  );
}

export function TextAlignRightIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg24 size={size} className={className}>
      <g strokeWidth="2">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <line x1="4" y1="8" x2="20" y2="8" /><line x1="10" y1="12" x2="20" y2="12" /><line x1="8" y1="16" x2="20" y2="16" />
      </g>
    </Svg24>
  );
}

export function UsersIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg24 size={size} className={className}>
      <g strokeWidth="1.5">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <circle cx="9" cy="8" r="3" />
        <path d="M3 19v-1a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1" />
        <path d="M16 5.2a3 3 0 0 1 0 5.6M18.5 14.4A4 4 0 0 1 21 18v1" />
      </g>
    </Svg24>
  );
}

export function DeviceDesktopIcon({ size = 20, className = '' }: IconProps): React.JSX.Element {
  return (
    <Svg24 size={size} className={className}>
      <g strokeWidth="1.5">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M3 5a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-16a1 1 0 0 1-1-1v-10zM7 20h10M9 16v4M15 16v4" />
      </g>
    </Svg24>
  );
}
