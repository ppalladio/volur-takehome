'use client';

import { createContext, ReactNode, useCallback, useMemo, useState } from 'react';
import { useHistoryTree, usePersistence } from '@/editor/hooks';
import {
    BlockArray,
    BlockType,
    CursorPosition,
    HistoryNode,
    Path,
    RedoBranch,
    STORAGE_CONFIG,
    deleteBlockCommand,
    insertBlockCommand,
    moveBlockCommand,
    toggleTodoCommand,
    updateContentCommand,
    loadEditorState,
} from '@/editor/lib';

export type EditorContextType = {
    // State
    doc: BlockArray;
    canUndo: boolean;
    canRedo: boolean;
    redoBranches: RedoBranch[];
    cursorPosition: CursorPosition;
    historyNodes: HistoryNode[];
    currentIndex: number;

    // Actions
    updateContent: (path: Path, content: string) => void;
    toggleTodo: (path: Path) => void;
    insertBlock: (parentPath: Path | null, index: number, type: BlockType) => void;
    deleteBlock: (parentPath: Path | null, index: number) => void;
    moveBlock: (fromParentPath: Path | null, fromIndex: number, toParentPath: Path | null, toIndex: number) => void;
    setCursorPosition: (cursor: CursorPosition) => void;
    undo: () => void;
    redo: (nodeIndex?: number) => void;
};

export const EditorContext = createContext<EditorContextType | undefined>(undefined);

type EditorProviderProps = Readonly<{
    children: ReactNode;
    initialDoc: BlockArray;
}>;

export function EditorProvider({ children, initialDoc }: EditorProviderProps) {
    // Initialize from localStorage or use defaults
    const persistedState = typeof window !== 'undefined' ? loadEditorState() : null;

    // Use history tree hook for document and history management
    const history = useHistoryTree(persistedState?.doc ?? initialDoc);

    // Cursor position state (managed separately as it's UI-specific)
    const [cursorPosition, setCursorPosition] = useState<CursorPosition>(persistedState?.cursor ?? null);

    // Persist full editor state to localStorage
    usePersistence(
        'editor-state',
        {
            doc: history.doc,
            historyNodes: history.historyNodes,
            currentIndex: history.currentIndex,
            cursor: cursorPosition,
        },
        STORAGE_CONFIG.AUTO_SAVE_DELAY_MS,
    );

    // Action wrappers that create commands and execute them
    const updateContent = useCallback(
        (path: Path, content: string) => {
            console.log('🎯 Action: Update Content', { path, content });
            const command = updateContentCommand(history.doc, path, content);
            history.execute(command);
        },
        [history],
    );

    const toggleTodo = useCallback(
        (path: Path) => {
            console.log('🎯 Action: Toggle Todo', { path });
            const command = toggleTodoCommand(history.doc, path);
            history.execute(command);
        },
        [history],
    );

    const insertBlock = useCallback(
        (parentPath: Path | null, index: number, type: BlockType) => {
            console.log('🎯 Action: Insert Block', { parentPath, index, type });
            const command = insertBlockCommand(parentPath, index, type);
            history.execute(command);
        },
        [history],
    );

    const deleteBlock = useCallback(
        (parentPath: Path | null, index: number) => {
            console.log('🎯 Action: Delete Block', { parentPath, index });
            const command = deleteBlockCommand(history.doc, parentPath, index);
            history.execute(command);
        },
        [history],
    );

    const moveBlock = useCallback(
        (fromParentPath: Path | null, fromIndex: number, toParentPath: Path | null, toIndex: number) => {
            console.log('🎯 Action: Move Block', { fromParentPath, fromIndex, toParentPath, toIndex });
            const command = moveBlockCommand(fromParentPath, fromIndex, toParentPath, toIndex);
            history.execute(command);
        },
        [history],
    );

    // Compose context value from history hook and local state
    const value: EditorContextType = useMemo(
        () => ({
            // State from history hook
            doc: history.doc,
            historyNodes: history.historyNodes,
            currentIndex: history.currentIndex,
            canUndo: history.canUndo,
            canRedo: history.canRedo,
            redoBranches: history.redoBranches,

            // Local cursor state
            cursorPosition,
            setCursorPosition,

            // Actions
            updateContent,
            toggleTodo,
            insertBlock,
            deleteBlock,
            moveBlock,
            undo: history.undo,
            redo: history.redo,
        }),
        [
            history.doc,
            history.historyNodes,
            history.currentIndex,
            history.canUndo,
            history.canRedo,
            history.redoBranches,
            history.undo,
            history.redo,
            cursorPosition,
            updateContent,
            toggleTodo,
            insertBlock,
            deleteBlock,
            moveBlock,
        ],
    );

    return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}
