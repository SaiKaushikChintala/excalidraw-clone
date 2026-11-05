import { useEffect } from 'react';

import { getVisibleBackground } from '@/utils/theme-color';

export function useThemeColor(isDark: boolean, canvasBackground: string): void {
  useEffect(() => {
    const color = getVisibleBackground(canvasBackground, isDark);
    document.documentElement.style.backgroundColor = color;
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';

    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = color;
  }, [isDark, canvasBackground]);
}
