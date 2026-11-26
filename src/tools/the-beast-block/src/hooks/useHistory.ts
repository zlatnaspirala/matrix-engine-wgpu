import { useCallback, useState } from 'react';
import { BlockingVolume, HistoryAction } from '../types/volume';

const MAX_HISTORY = 100;

function applyAction(
  volumes: BlockingVolume[],
  action: HistoryAction,
  direction: 'undo' | 'redo'
): BlockingVolume[] {
  switch (action.type) {
    case 'place': {
      if (direction === 'undo') {
        const removeIds = new Set(action.volumes.map((v) => v.id));
        return volumes.filter((v) => !removeIds.has(v.id));
      }
      const existingIds = new Set(volumes.map((v) => v.id));
      const toAdd = action.volumes.filter((v) => !existingIds.has(v.id));
      return [...volumes, ...toAdd];
    }

    case 'delete': {
      if (direction === 'undo') {
        const existingIds = new Set(volumes.map((v) => v.id));
        const restored = action.volumes.filter((v) => !existingIds.has(v.id));
        return [...volumes, ...restored];
      }
      const removeIds = new Set(action.volumes.map((v) => v.id));
      return volumes.filter((v) => !removeIds.has(v.id));
    }

    case 'transform': {
      const target = direction === 'undo' ? action.before : action.after;
      return volumes.map((v) =>
        v.id === action.volumeId
          ? {
              ...v,
              position: [...target.position],
              rotation: [...target.rotation],
              scale: [...target.scale],
            }
          : v
      );
    }

    case 'category': {
      const nextCat = direction === 'undo' ? action.before : action.after;
      return volumes.map((v) =>
        v.id === action.volumeId ? { ...v, category: nextCat } : v
      );
    }

    case 'replaceAll': {
      const list = direction === 'undo' ? action.before : action.after;
      return list.map((v) => ({
        ...v,
        position: [...v.position],
        rotation: [...v.rotation],
        scale: [...v.scale],
      }));
    }
  }
}

export function useHistory() {
  const [undoStack, setUndoStack] = useState<HistoryAction[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryAction[]>([]);

  const pushAction = useCallback((action: HistoryAction) => {
    setUndoStack((prev) => {
      const next = [...prev, action];
      return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
    });
    setRedoStack([]);
  }, []);

  const undo = useCallback(
    (
      currentVolumes: BlockingVolume[]
    ): { volumes: BlockingVolume[]; action: HistoryAction } | null => {
      if (undoStack.length === 0) return null;
      const action = undoStack[undoStack.length - 1];
      const nextVolumes = applyAction(currentVolumes, action, 'undo');
      setUndoStack((prev) => prev.slice(0, -1));
      setRedoStack((prev) => [...prev, action]);
      return { volumes: nextVolumes, action };
    },
    [undoStack]
  );

  const redo = useCallback(
    (
      currentVolumes: BlockingVolume[]
    ): { volumes: BlockingVolume[]; action: HistoryAction } | null => {
      if (redoStack.length === 0) return null;
      const action = redoStack[redoStack.length - 1];
      const nextVolumes = applyAction(currentVolumes, action, 'redo');
      setRedoStack((prev) => prev.slice(0, -1));
      setUndoStack((prev) => [...prev, action]);
      return { volumes: nextVolumes, action };
    },
    [redoStack]
  );

  const clearHistory = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  return {
    undoStack,
    redoStack,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    pushAction,
    undo,
    redo,
    clearHistory,
  };
}
