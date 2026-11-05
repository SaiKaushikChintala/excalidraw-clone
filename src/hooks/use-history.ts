import { useRef, useCallback } from 'react';

import type { DrawingElement } from '@/types';
import { restoreOwnElements } from '@/utils/collab-utils';

const MAX_HISTORY = 100;

export function useHistory(
  elements: DrawingElement[],
  setElements: (els: DrawingElement[]) => void,
  isOwnElement?: (id: string) => boolean,
): {
  pushHistory: (snapshot: DrawingElement[]) => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
} {
  const undoStack = useRef<DrawingElement[][]>([]);
  const redoStack = useRef<DrawingElement[][]>([]);

  const restore = useCallback(
    (snapshot: DrawingElement[]): void => {
      setElements(isOwnElement ? restoreOwnElements(elements, snapshot, isOwnElement) : snapshot);
    },
    [elements, setElements, isOwnElement],
  );

  const pushHistory = useCallback((snapshot: DrawingElement[]) => {
    undoStack.current.push(snapshot);
    if (undoStack.current.length > MAX_HISTORY) {
      undoStack.current.shift();
    }
    redoStack.current = [];
  }, []);

  const undo = useCallback(() => {
    if (!undoStack.current.length) return;
    redoStack.current.push([...elements]);
    restore(undoStack.current.pop()!);
  }, [elements, restore]);

  const redo = useCallback(() => {
    if (!redoStack.current.length) return;
    undoStack.current.push([...elements]);
    restore(redoStack.current.pop()!);
  }, [elements, restore]);

  const clearHistory = useCallback(() => {
    undoStack.current = [];
    redoStack.current = [];
  }, []);

  return { pushHistory, undo, redo, clearHistory };
}
