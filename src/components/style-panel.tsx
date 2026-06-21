import React from 'react';

import type {
  AppState,
  ToolType,
  FillStyle,
  StrokeStyle,
  ArrowType,
  Arrowhead,
  FontFamily,
  Roundness,
  LayerOp,
} from '@/types';
import { COLORS } from '@/utils/constants';
import { IconButton } from '@/components/icon-button';
import {
  FillHachureIcon,
  FillCrossHatchIcon,
  FillSolidIcon,
  StrokeWidthThinIcon,
  StrokeWidthBoldIcon,
  StrokeWidthExtraBoldIcon,
  StrokeStyleSolidIcon,
  StrokeStyleDashedIcon,
  StrokeStyleDottedIcon,
  SloppinessArchitectIcon,
  SloppinessArtistIcon,
  SloppinessCartoonistIcon,
  EdgeSharpIcon,
  EdgeRoundIcon,
  SharpArrowIcon,
  RoundArrowIcon,
  ElbowArrowIcon,
  ArrowheadNoneIcon,
  ArrowheadArrowIcon,
  ArrowheadTriangleIcon,
  FontFamilyHandDrawnIcon,
  FontFamilyNormalIcon,
  FontFamilyCodeIcon,
  FontSizeSmallIcon,
  FontSizeMediumIcon,
  FontSizeLargeIcon,
  FontSizeExtraLargeIcon,
  BringToFrontIcon,
  BringForwardIcon,
  SendBackwardIcon,
  SendToBackIcon,
} from '@/components/icons';

type Props = {
  appState: AppState;
  selectedType: ToolType | null;
  onChange: (updates: Partial<AppState>) => void;
  onLayerChange: (op: LayerOp) => void;
};

const hasBackground = (t: string): boolean =>
  t === 'rectangle' || t === 'ellipse' || t === 'diamond' || t === 'line' || t === 'freedraw';
const hasStrokeWidth = (t: string): boolean =>
  t === 'rectangle' || t === 'ellipse' || t === 'diamond' || t === 'freedraw' || t === 'arrow' || t === 'line';
const hasStrokeStyle = (t: string): boolean =>
  t === 'rectangle' || t === 'ellipse' || t === 'diamond' || t === 'arrow' || t === 'line';
const canChangeRoundness = (t: string): boolean => t === 'rectangle' || t === 'diamond';
const toolHasCurve = (t: string): boolean => t === 'arrow' || t === 'line';
const isText = (t: string): boolean => t === 'text';

function Section({ label, children }: { label: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="mb-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--ex-label)' }}>
        {label}
      </p>
      {children}
    </div>
  );
}

const CHECKER =
  'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gGGYhAGBZIA/nYDCgBDAm9BGDWAAJyRCgLaBCAAgXwixzAS0pgAAAABJRU5ErkJggg==")';

function ColorSwatch({ color, selected, onClick }: { color: string; selected: boolean; onClick: () => void }): React.JSX.Element {
  const isTransparent = color === 'transparent';
  return (
    <button
      onClick={onClick}
      title={color}
      className="w-6 h-6 rounded-md transition-all shrink-0 relative overflow-hidden"
      style={{
        backgroundColor: isTransparent ? undefined : color,
        backgroundImage: isTransparent ? CHECKER : undefined,
        backgroundRepeat: isTransparent ? 'repeat' : undefined,
        border: selected ? '1px solid var(--ex-primary)' : '1px solid var(--ex-island-border)',
        boxShadow: selected ? '0 0 0 1px var(--ex-primary)' : undefined,
      }}
    />
  );
}

function ColorRow({ value, onChange, colors }: {
  value: string;
  onChange: (c: string) => void;
  colors: readonly string[];
}): React.JSX.Element {
  return (
    <div className="flex items-center gap-1">
      {colors.map(c => (
        <ColorSwatch key={c} color={c} selected={value === c} onClick={() => onChange(c)} />
      ))}
      <div className="w-px h-6 mx-0.5" style={{ backgroundColor: 'var(--ex-divider)' }} />

      <label
        className="w-6 h-6 rounded-md flex items-center justify-center cursor-pointer shrink-0 relative overflow-hidden"
        title="Custom color"
        style={{
          backgroundColor: value === 'transparent' ? undefined : value,
          backgroundImage: value === 'transparent' ? CHECKER : undefined,
          border: '1px solid var(--ex-island-border)',
        }}
      >
        <input
          type="color"
          className="sr-only"
          value={value === 'transparent' ? '#ffffff' : value}
          onChange={e => onChange(e.target.value)}
        />
      </label>
    </div>
  );
}


function ButtonRow({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <div className="flex gap-1">{children}</div>;
}

export function StylePanel({ appState, selectedType, onChange, onLayerChange }: Props): React.JSX.Element {
  const t = selectedType ?? appState.activeTool;

  const showBackground = hasBackground(t);
  const showFill = showBackground;
  const showStrokeWidth = hasStrokeWidth(t);
  const showStrokeStyle = hasStrokeStyle(t);
  const showSloppiness = hasStrokeStyle(t);
  const showEdges = canChangeRoundness(t);
  const showArrowType = toolHasCurve(t);
  const showArrowhead = t === 'arrow';
  const showText = isText(t);

  return (
    <div
      className="w-56 rounded-xl p-3 text-sm select-none max-h-[calc(100vh-7rem)] overflow-y-auto"
      style={{
        backgroundColor: 'var(--ex-island-bg)',
        border: '1px solid var(--ex-island-border)',
        boxShadow: 'var(--ex-shadow)',
        color: 'var(--ex-text)',
      }}
    >

      <Section label="Stroke">
        <ColorRow value={appState.strokeColor} onChange={strokeColor => onChange({ strokeColor })} colors={COLORS.stroke} />
      </Section>

      {showBackground && (
        <Section label="Background">
          <ColorRow value={appState.backgroundColor} onChange={backgroundColor => onChange({ backgroundColor })} colors={COLORS.background} />
        </Section>
      )}

      {showFill && (
        <Section label="Fill">
          <ButtonRow>
            <IconButton active={appState.fillStyle === 'hachure'} onClick={() => onChange({ fillStyle: 'hachure' as FillStyle })} title="Hachure">
              <FillHachureIcon size={20} />
            </IconButton>
            <IconButton active={appState.fillStyle === 'cross-hatch'} onClick={() => onChange({ fillStyle: 'cross-hatch' as FillStyle })} title="Cross-hatch">
              <FillCrossHatchIcon size={20} />
            </IconButton>
            <IconButton active={appState.fillStyle === 'solid'} onClick={() => onChange({ fillStyle: 'solid' as FillStyle })} title="Solid">
              <FillSolidIcon size={20} />
            </IconButton>
          </ButtonRow>
        </Section>
      )}

      {showStrokeWidth && (
        <Section label="Stroke width">
          <ButtonRow>
            <IconButton active={appState.strokeWidth === 1} onClick={() => onChange({ strokeWidth: 1 })} title="Thin">
              <StrokeWidthThinIcon size={20} />
            </IconButton>
            <IconButton active={appState.strokeWidth === 2} onClick={() => onChange({ strokeWidth: 2 })} title="Bold">
              <StrokeWidthBoldIcon size={20} />
            </IconButton>
            <IconButton active={appState.strokeWidth === 4} onClick={() => onChange({ strokeWidth: 4 })} title="Extra bold">
              <StrokeWidthExtraBoldIcon size={20} />
            </IconButton>
          </ButtonRow>
        </Section>
      )}

      {showStrokeStyle && (
        <Section label="Stroke style">
          <ButtonRow>
            <IconButton active={appState.strokeStyle === 'solid'} onClick={() => onChange({ strokeStyle: 'solid' as StrokeStyle })} title="Solid">
              <StrokeStyleSolidIcon size={20} />
            </IconButton>
            <IconButton active={appState.strokeStyle === 'dashed'} onClick={() => onChange({ strokeStyle: 'dashed' as StrokeStyle })} title="Dashed">
              <StrokeStyleDashedIcon size={20} />
            </IconButton>
            <IconButton active={appState.strokeStyle === 'dotted'} onClick={() => onChange({ strokeStyle: 'dotted' as StrokeStyle })} title="Dotted">
              <StrokeStyleDottedIcon size={20} />
            </IconButton>
          </ButtonRow>
        </Section>
      )}

      {showSloppiness && (
        <Section label="Sloppiness">
          <ButtonRow>
            <IconButton active={appState.roughness === 0} onClick={() => onChange({ roughness: 0 })} title="Architect">
              <SloppinessArchitectIcon size={20} />
            </IconButton>
            <IconButton active={appState.roughness === 1} onClick={() => onChange({ roughness: 1 })} title="Artist">
              <SloppinessArtistIcon size={20} />
            </IconButton>
            <IconButton active={appState.roughness === 2} onClick={() => onChange({ roughness: 2 })} title="Cartoonist">
              <SloppinessCartoonistIcon size={20} />
            </IconButton>
          </ButtonRow>
        </Section>
      )}

      {showEdges && (
        <Section label="Edges">
          <ButtonRow>
            <IconButton active={appState.roundness === 'sharp'} onClick={() => onChange({ roundness: 'sharp' as Roundness })} title="Sharp">
              <EdgeSharpIcon size={20} />
            </IconButton>
            <IconButton active={appState.roundness === 'round'} onClick={() => onChange({ roundness: 'round' as Roundness })} title="Round">
              <EdgeRoundIcon size={20} />
            </IconButton>
          </ButtonRow>
        </Section>
      )}

      {showArrowType && (
        <Section label="Curve">
          <ButtonRow>
            <IconButton active={appState.arrowType === 'sharp'} onClick={() => onChange({ arrowType: 'sharp' as ArrowType })} title="Sharp">
              <SharpArrowIcon size={20} />
            </IconButton>
            <IconButton active={appState.arrowType === 'round'} onClick={() => onChange({ arrowType: 'round' as ArrowType })} title="Curved">
              <RoundArrowIcon size={20} />
            </IconButton>
            <IconButton active={appState.arrowType === 'elbow'} onClick={() => onChange({ arrowType: 'elbow' as ArrowType })} title="Elbowed">
              <ElbowArrowIcon size={20} />
            </IconButton>
          </ButtonRow>
        </Section>
      )}

      {showArrowhead && (
        <Section label="Arrowheads">
          <ButtonRow>
            <IconButton active={appState.arrowheadEnd === 'none'} onClick={() => onChange({ arrowheadEnd: 'none' as Arrowhead })} title="None">
              <ArrowheadNoneIcon size={20} />
            </IconButton>
            <IconButton active={appState.arrowheadEnd === 'arrow'} onClick={() => onChange({ arrowheadEnd: 'arrow' as Arrowhead })} title="Arrow">
              <ArrowheadArrowIcon size={20} />
            </IconButton>
            <IconButton active={appState.arrowheadEnd === 'triangle'} onClick={() => onChange({ arrowheadEnd: 'triangle' as Arrowhead })} title="Triangle">
              <ArrowheadTriangleIcon size={20} />
            </IconButton>
          </ButtonRow>
        </Section>
      )}

      {showText && (
        <>
          <Section label="Font family">
            <ButtonRow>
              <IconButton active={appState.fontFamily === 'hand-drawn'} onClick={() => onChange({ fontFamily: 'hand-drawn' as FontFamily })} title="Hand-drawn">
                <FontFamilyHandDrawnIcon size={20} />
              </IconButton>
              <IconButton active={appState.fontFamily === 'normal'} onClick={() => onChange({ fontFamily: 'normal' as FontFamily })} title="Normal">
                <FontFamilyNormalIcon size={20} />
              </IconButton>
              <IconButton active={appState.fontFamily === 'code'} onClick={() => onChange({ fontFamily: 'code' as FontFamily })} title="Code">
                <FontFamilyCodeIcon size={20} />
              </IconButton>
            </ButtonRow>
          </Section>

          <Section label="Font size">
            <ButtonRow>
              <IconButton active={appState.fontSize === 16} onClick={() => onChange({ fontSize: 16 })} title="Small">
                <FontSizeSmallIcon size={20} />
              </IconButton>
              <IconButton active={appState.fontSize === 20} onClick={() => onChange({ fontSize: 20 })} title="Medium">
                <FontSizeMediumIcon size={20} />
              </IconButton>
              <IconButton active={appState.fontSize === 28} onClick={() => onChange({ fontSize: 28 })} title="Large">
                <FontSizeLargeIcon size={20} />
              </IconButton>
              <IconButton active={appState.fontSize === 36} onClick={() => onChange({ fontSize: 36 })} title="Extra large">
                <FontSizeExtraLargeIcon size={20} />
              </IconButton>
            </ButtonRow>
          </Section>
        </>
      )}

      <Section label="Opacity">
        <input
          type="range"
          min={0}
          max={100}
          step={10}
          value={appState.opacity}
          onChange={e => onChange({ opacity: Number(e.target.value) })}
          className="w-full"
          style={{ accentColor: 'var(--ex-primary)' }}
        />
        <div className="flex justify-between mt-0.5">
          <span className="text-[10px]" style={{ color: 'var(--ex-label)' }}>0</span>
          <span className="text-[10px]" style={{ color: 'var(--ex-label)' }}>100</span>
        </div>
      </Section>

      <Section label="Layers">
        <ButtonRow>
          <IconButton onClick={() => onLayerChange('sendToBack')} title="Send to back">
            <SendToBackIcon size={16} />
          </IconButton>
          <IconButton onClick={() => onLayerChange('sendBackward')} title="Send backward">
            <SendBackwardIcon size={16} />
          </IconButton>
          <IconButton onClick={() => onLayerChange('bringForward')} title="Bring forward">
            <BringForwardIcon size={16} />
          </IconButton>
          <IconButton onClick={() => onLayerChange('bringToFront')} title="Bring to front">
            <BringToFrontIcon size={16} />
          </IconButton>
        </ButtonRow>
      </Section>
    </div>
  );
}
