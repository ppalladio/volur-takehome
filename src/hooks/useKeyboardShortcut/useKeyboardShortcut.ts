'use client';

import { useEditor } from '@/hooks';
import { useEffect } from 'react';

export function useKeyboardShortcuts() {
    const { undo, redo, canUndo, canRedo } = useEditor();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check if we're in an input/textarea to avoid conflicts
            const target = e.target as HTMLElement;
            const isInInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

            // Undo: Ctrl+Z (Windows/Linux) or Cmd+Z (Mac)
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                if (canUndo) {
                    e.preventDefault();
                    undo();
                }
            }

            // Redo: Ctrl+Shift+Z (Windows/Linux) or Cmd+Shift+Z (Mac)
            // Also support Ctrl+Y (Windows alternative)
            if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') || (e.ctrlKey && e.key === 'y' && !e.metaKey)) {
                if (canRedo) {
                    e.preventDefault();
                    redo();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [undo, redo, canUndo, canRedo]);
}
