import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

type Props = {
  value: string;
  size?: number;
};

export function QrCode({ value, size = 168 }: Props): React.JSX.Element {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, { margin: 1, width: size * 2, errorCorrectionLevel: 'M' })
      .then(url => {
        if (!cancelled) setSrc(url);
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
      });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (!src) {
    return (
      <div
        aria-hidden="true"
        className="rounded-lg animate-pulse"
        style={{ width: size, height: size, backgroundColor: 'var(--ex-surface-high)' }}
      />
    );
  }

  return (
    <img
      src={src}
      width={size}
      height={size}
      alt="QR code that opens this session"
      className="rounded-lg bg-white"
    />
  );
}
