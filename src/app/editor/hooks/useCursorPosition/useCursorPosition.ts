import { CursorPosition } from '@/editor/lib';
import { useCallback, useRef } from 'react';

export type UseCursorPositionReturn = {
    handleSelectionChange: (e: React.SyntheticEvent<HTMLInputElement>) => void;
};

/**
 * Custom hook for managing cursor position tracking and restoration.
 *
 * Handles:
 * - Selection change tracking
 * - Cursor position save/restore
 * - Auto-focus on edit start
 *
 * @param blockId - ID of the block
 * @param isEditing - Whether the block is currently in editing mode
 * @param inputRef - Ref to the input element (nullable)
 * @param cursorPosition - Current cursor position from context
 * @param setCursorPosition - Function to update cursor position in context
 * @returns Handlers for cursor position management
 */
export const useCursorPosition = (
    blockId: string,
    setCursorPosition: (pos: CursorPosition | null) => void,
): UseCursorPositionReturn => {
    const hasRestoredRef = useRef<boolean>(false);

    // Save cursor position when selection changes
    const handleSelectionChange = useCallback(
        (e: React.SyntheticEvent<HTMLInputElement>) => {
            // Don't save during initial restoration
            if (!hasRestoredRef.current) {
                hasRestoredRef.current = true;
                return;
            }

            const input = e.currentTarget;
            setCursorPosition({
                blockId,
                selectionStart: input.selectionStart ?? 0,
                selectionEnd: input.selectionEnd ?? 0,
            });
        },
        [blockId, setCursorPosition],
    );

    return {
        handleSelectionChange,
    };
};
