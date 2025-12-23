'use client';

import { deleteBlockCommand, insertBlockCommand, moveBlockCommand, toggleTodoCommand, updateContentCommand } from '@/lib/editor/commands';
import { applyPatch } from '@/lib/editor/patches';
import { BlockArray, BlockType, Command, Path } from '@/lib/editor/types';
import { createContext, ReactNode, useCallback, useMemo, useState } from 'react';

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
    readonly children: ReactNode;
    readonly initialDoc: BlockArray;
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

            console.group('⚡ Execute Command');
            console.log('Forward patch:', command.forward);
            console.log('Inverse patch:', command.inverse);

            // Calculate patch sizes
            const forwardSize = JSON.stringify(command.forward).length;
            const inverseSize = JSON.stringify(command.inverse).length;
            const docSize = JSON.stringify(doc).length;

            console.log('📊 Size Analysis:');
            console.log(`  Forward patch: ${forwardSize} bytes`);
            console.log(`  Inverse patch: ${inverseSize} bytes`);
            console.log(`  Full document: ${docSize} bytes`);
            console.log(`  Efficiency: ${((forwardSize / docSize) * 100).toFixed(2)}% of doc size`);

            const newDoc = applyPatch(doc, command.forward);
            setDoc(newDoc);

            // Clear redo history when new action is performed
            const newHistory = history.slice(0, historyIndex + 1);
            newHistory.push(command);
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);

            console.log(`📚 History: ${newHistory.length} commands, at index ${newHistory.length - 1}`);
            console.groupEnd();
        },
        [doc, history, historyIndex],
    );

    // Undo
    const undo = useCallback(() => {
        if (historyIndex < 0) return;

        console.group('⏪ UNDO');
        const command = history[historyIndex];
        console.log('Applying inverse patch:', command.inverse);

        const newDoc = applyPatch(doc, command.inverse);
        setDoc(newDoc);
        setHistoryIndex(historyIndex - 1);

        console.log(`📚 History position: ${historyIndex} → ${historyIndex - 1}`);
        console.groupEnd();
    }, [doc, history, historyIndex]);

    // Redo
    const redo = useCallback(() => {
        if (historyIndex >= history.length - 1) return;

        console.group('⏩ REDO');
        const command = history[historyIndex + 1];
        console.log('Applying forward patch:', command.forward);

        const newDoc = applyPatch(doc, command.forward);
        setDoc(newDoc);
        setHistoryIndex(historyIndex + 1);

        console.log(`📚 History position: ${historyIndex} → ${historyIndex + 1}`);
        console.groupEnd();
    }, [doc, history, historyIndex]);

    // Action wrappers that create commands and execute them
    const updateContent = useCallback(
        (path: Path, content: string) => {
            console.log('🎯 Action: Update Content', { path, content });
            const command = updateContentCommand(doc, path, content);
            execute(command);
        },
        [doc, execute],
    );

    const toggleTodo = useCallback(
        (path: Path) => {
            console.log('🎯 Action: Toggle Todo', { path });
            const command = toggleTodoCommand(doc, path);
            execute(command);
        },
        [doc, execute],
    );

    const insertBlock = useCallback(
        (parentPath: Path | null, index: number, type: BlockType) => {
            console.log('🎯 Action: Insert Block', { parentPath, index, type });
            const command = insertBlockCommand(parentPath, index, type);
            execute(command);
        },
        [execute],
    );

    const deleteBlock = useCallback(
        (parentPath: Path | null, index: number) => {
            console.log('🎯 Action: Delete Block', { parentPath, index });
            const command = deleteBlockCommand(doc, parentPath, index);
            execute(command);
        },
        [doc, execute],
    );

    const moveBlock = useCallback(
        (fromParentPath: Path | null, fromIndex: number, toParentPath: Path | null, toIndex: number) => {
            console.log('🎯 Action: Move Block', { fromParentPath, fromIndex, toParentPath, toIndex });
            const command = moveBlockCommand(fromParentPath, fromIndex, toParentPath, toIndex);
            execute(command);
        },
        [execute],
    );

    const canUndo = historyIndex >= 0;
    const canRedo = historyIndex < history.length - 1;

    const value = useMemo(
        () => ({
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
        }),
        [doc, canUndo, canRedo, updateContent, toggleTodo, insertBlock, deleteBlock, moveBlock, undo, redo],
    );

    return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}
