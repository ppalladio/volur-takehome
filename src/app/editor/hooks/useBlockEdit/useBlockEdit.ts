import { Block, Path } from '@/editor/lib';
import { useDebouncedCallback } from '@/hooks';
import { useCallback, useRef, useState } from 'react';

export type UseBlockEditReturn = {
    isEditing: boolean;
    localContent: string;
    inputRef: React.RefObject<HTMLInputElement | null>;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    handleBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
    startEdit: () => void;
};

/**
 * Custom hook for managing block editing state.
 *
 * Handles:
 * - Editing mode state
 * - Local content synchronization with block content
 * - Debounced content updates
 * - Keyboard shortcuts (Enter to save, Escape to cancel)
 * - Blur to save
 *
 * @param block - The block being edited
 * @param path - The path to the block in the document
 * @param updateContent - Function to update block content
 * @returns Editing state and handlers
 */
export const useBlockEdit = (block: Block, path: Path, updateContent: (path: Path, content: string) => void): UseBlockEditReturn => {
    const [isEditing, setIsEditing] = useState<boolean>(false);
    // Only store content while editing - otherwise use block.content directly
    const [editingContent, setEditingContent] = useState<string>('');
    const inputRef = useRef<HTMLInputElement>(null);
    const hasRestoredRef = useRef<boolean>(false);

    // Use editingContent while editing, otherwise use block.content
    const localContent = isEditing ? editingContent : block.content;

    const { debouncedCallback: debouncedUpdate, cancel: cancelDebounce } = useDebouncedCallback(
        (newValue: string) => updateContent(path, newValue),
        100,
    );

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = e.target.value;
            setEditingContent(newValue);
            debouncedUpdate(newValue);
        },
        [debouncedUpdate],
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                cancelDebounce();
                updateContent(path, e.currentTarget.value);
                setIsEditing(false);
            }
            if (e.key === 'Escape') {
                cancelDebounce();
                setIsEditing(false);
            }
        },
        [path, updateContent, cancelDebounce],
    );

    const handleBlur = useCallback(
        (e: React.FocusEvent<HTMLInputElement>) => {
            cancelDebounce();

            // Always save on blur (debounced update may not have fired yet)
            const currentValue = e.currentTarget.value;
            if (currentValue !== block.content) {
                updateContent(path, currentValue);
            }

            setIsEditing(false);
        },
        [path, block.content, updateContent, cancelDebounce],
    );

    const startEdit = useCallback(() => {
        setEditingContent(block.content);
        setIsEditing(true);
        hasRestoredRef.current = true;
    }, [block.content]);

    return {
        isEditing,
        localContent,
        inputRef,
        handleChange,
        handleKeyDown,
        handleBlur,
        startEdit,
    };
};
