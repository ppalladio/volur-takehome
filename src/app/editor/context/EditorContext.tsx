'use client';

import { deleteBlockCommand, insertBlockCommand, moveBlockCommand, toggleTodoCommand, updateContentCommand } from '@/lib/editor/commands';
import { applyPatch } from '@/lib/editor/patches';
import { BlockArray, BlockType, Command, Path } from '@/lib/editor/types';
import { createContext, ReactNode, useCallback, useState } from 'react';

export type EditorContextType = {
    // State
    doc: BlockArray;
    canUndo: boolean;
    canRedo: boolean;

    // Actions
    updateContent: (path: Path, content: string) => void;
    toggleTodo: (path: Path) => void;
    insertBlock: (parentPath: Path | null, index: number, type: BlockType) => void;
    deleteBlock: (parentPath: Path | null, index: number) => void;
    moveBlock: (fromParentPath: Path | null, fromIndex: number, toParentPath: Path | null, toIndex: number) => void;
    undo: () => void;
    redo: () => void;
};

export const EditorContext = createContext<EditorContextType | undefined>(undefined);

type EditorProviderProps = {
    children: ReactNode;
    initialDoc: BlockArray;
};

export function EditorProvider({ children, initialDoc }: EditorProviderProps) {
    const [doc, setDoc] = useState<BlockArray>(initialDoc);
    const [history, setHistory] = useState<Command[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Execute a command (adds to history)
    const execute = useCallback(
        (command: Command | null) => {
            if (!command) {
                console.warn('Invalid command, skipping execution');
                return;
            }

            const newDoc = applyPatch(doc, command.forward);
            setDoc(newDoc);

            // Clear redo history when new action is performed
            const newHistory = history.slice(0, historyIndex + 1);
            newHistory.push(command);
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        },
        [doc, history, historyIndex],
    );

    // Undo
    const undo = useCallback(() => {
        if (historyIndex < 0) return;

        const command = history[historyIndex];
        const newDoc = applyPatch(doc, command.inverse);
        setDoc(newDoc);
        setHistoryIndex(historyIndex - 1);
    }, [doc, history, historyIndex]);

    // Redo
    const redo = useCallback(() => {
        if (historyIndex >= history.length - 1) return;

        const command = history[historyIndex + 1];
        const newDoc = applyPatch(doc, command.forward);
        setDoc(newDoc);
        setHistoryIndex(historyIndex + 1);
    }, [doc, history, historyIndex]);

    // Action wrappers that create commands and execute them
    const updateContent = useCallback(
        (path: Path, content: string) => {
            const command = updateContentCommand(doc, path, content);
            execute(command);
        },
        [doc, execute],
    );

    const toggleTodo = useCallback(
        (path: Path) => {
            const command = toggleTodoCommand(doc, path);
            execute(command);
        },
        [doc, execute],
    );

    const insertBlock = useCallback(
        (parentPath: Path | null, index: number, type: BlockType) => {
            const command = insertBlockCommand(parentPath, index, type);
            execute(command);
        },
        [execute],
    );

    const deleteBlock = useCallback(
        (parentPath: Path | null, index: number) => {
            const command = deleteBlockCommand(doc, parentPath, index);
            execute(command);
        },
        [doc, execute],
    );

    const moveBlock = useCallback(
        (fromParentPath: Path | null, fromIndex: number, toParentPath: Path | null, toIndex: number) => {
            const command = moveBlockCommand(fromParentPath, fromIndex, toParentPath, toIndex);
            execute(command);
        },
        [execute],
    );

    const canUndo = historyIndex >= 0;
    const canRedo = historyIndex < history.length - 1;

    const value: EditorContextType = {
        doc,
        canUndo,
        canRedo,
        updateContent,
        toggleTodo,
        insertBlock,
        deleteBlock,
        moveBlock,
        undo,
        redo,
    };

    return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}
