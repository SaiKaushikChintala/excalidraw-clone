import { useRef, useCallback } from 'react';

import type { DrawingElement } from '@/types';

const MAX_HISTORY = 100;

export function useHistory(
  elements: DrawingElement[],
  setElements: (els: DrawingElement[]) => void,
): { pushHistory: (snapshot: DrawingElement[]) => void; undo: () => void; redo: () => void } {
  const undoStack = useRef<DrawingElement[][]>([]);
  const redoStack = useRef<DrawingElement[][]>([]);

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
    const prev = undoStack.current.pop()!;
    setElements(prev);
  }, [elements, setElements]);

  const redo = useCallback(() => {
    if (!redoStack.current.length) return;
    undoStack.current.push([...elements]);
    const next = redoStack.current.pop()!;
    setElements(next);
  }, [elements, setElements]);

  return { pushHistory, undo, redo };
}
