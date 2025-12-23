'use client';

import { deleteBlockCommand, insertBlockCommand, moveBlockCommand, toggleTodoCommand, updateContentCommand } from '@/lib/editor/commands';
import { applyPatch } from '@/lib/editor/patches';
import { BlockArray, BlockType, Command, HistoryNode, Path } from '@/lib/editor/types';
import { createContext, ReactNode, useCallback, useMemo, useState } from 'react';

export type RedoBranch = {
    node: HistoryNode;
    nodeIndex: number;
};

export type EditorContextType = {
    // State
    doc: BlockArray;
    canUndo: boolean;
    canRedo: boolean;
    redoBranches: RedoBranch[];

    // Actions
    updateContent: (path: Path, content: string) => void;
    toggleTodo: (path: Path) => void;
    insertBlock: (parentPath: Path | null, index: number, type: BlockType) => void;
    deleteBlock: (parentPath: Path | null, index: number) => void;
    moveBlock: (fromParentPath: Path | null, fromIndex: number, toParentPath: Path | null, toIndex: number) => void;
    undo: () => void;
    redo: (nodeIndex?: number) => void;
};

export const EditorContext = createContext<EditorContextType | undefined>(undefined);

type EditorProviderProps = Readonly<{
    children: ReactNode;
    initialDoc: BlockArray;
}>;

export function EditorProvider({ children, initialDoc }: EditorProviderProps) {
    const [doc, setDoc] = useState<BlockArray>(initialDoc);
    const [historyNodes, setHistoryNodes] = useState<HistoryNode[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number>(-1);

    // Execute a command (adds to history tree)
    const execute = useCallback(
        (command: Command | null) => {
            if (!command) {
                console.warn('Invalid command, skipping execution');
                return;
            }

            console.group('⚡ Execute Command');
            console.log('Forward patch:', command.forward);
            console.log('Inverse patch:', command.inverse);

            const newDoc = applyPatch(doc, command.forward);
            setDoc(newDoc);

            // Create new history node
            const newNode: HistoryNode = {
                command,
                parentIndex: currentIndex >= 0 ? currentIndex : null, // FIX: Use null instead of -1
                branches: [],
                timestamp: Date.now(),
            };

            // If we have a parent, add this as a branch
            const updatedNodes = [...historyNodes];
            if (currentIndex >= 0) {
                updatedNodes[currentIndex] = {
                    ...updatedNodes[currentIndex],
                    branches: [...updatedNodes[currentIndex].branches, updatedNodes.length],
                };
            }

            updatedNodes.push(newNode);
            setHistoryNodes(updatedNodes);
            setCurrentIndex(updatedNodes.length - 1);

            console.log(`📚 History: ${updatedNodes.length} nodes, at index ${updatedNodes.length - 1}`);
            console.groupEnd();
        },
        [doc, historyNodes, currentIndex],
    );

    // Undo
    const undo = useCallback(() => {
        if (currentIndex < 0) return;

        console.group('⏪ UNDO');
        const node = historyNodes[currentIndex];
        console.log('Applying inverse patch:', node.command.inverse);

        const newDoc = applyPatch(doc, node.command.inverse);
        setDoc(newDoc);
        setCurrentIndex(node.parentIndex ?? -1);

        console.log(`📚 History position: ${currentIndex} → ${node.parentIndex ?? -1}`);
        console.groupEnd();
    }, [doc, historyNodes, currentIndex]);

    // Redo (with optional node index selection)
    const redo = useCallback(
        (nodeIndex?: number) => {
            const currentNode = currentIndex >= 0 ? historyNodes[currentIndex] : null;
            let branchIndices: number[];

            if (currentNode) {
                // We're at a specific node - show its branches
                branchIndices = currentNode.branches;
                console.log('🔍 Redo from node', currentIndex, 'branches:', branchIndices);
            } else {
                // We're at the initial state (before any history) - show all root nodes
                branchIndices = historyNodes.map((node, idx) => (node.parentIndex === null ? idx : -1)).filter((idx) => idx !== -1);
                console.log('🔍 Redo from initial state, root nodes:', branchIndices);
                console.log(
                    '🔍 All history nodes:',
                    historyNodes.map((n, i) => ({ idx: i, parentIndex: n.parentIndex })),
                );
            }

            if (branchIndices.length === 0) {
                console.log('❌ No branches available');
                return;
            }

            // If nodeIndex provided, use it; otherwise use last branch (most recent)
            const targetIndex = nodeIndex ?? branchIndices.at(-1) ?? -1;
            if (!historyNodes[targetIndex]) {
                console.log('❌ Target node not found:', targetIndex);
                return;
            }

            console.group('⏩ REDO');
            const node = historyNodes[targetIndex];
            console.log('Applying forward patch:', node.command.forward);

            const newDoc = applyPatch(doc, node.command.forward);
            setDoc(newDoc);
            setCurrentIndex(targetIndex);

            console.log(`📚 History position: ${currentIndex} → ${targetIndex}`);
            console.groupEnd();
        },
        [doc, historyNodes, currentIndex],
    );

    // Action wrappers
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

    const canUndo = currentIndex >= 0;

    // Get available redo branches with their indices
    const currentNode = currentIndex >= 0 ? historyNodes[currentIndex] : null;
    let redoBranchIndices: number[];

    if (currentNode) {
        // We're at a specific node - show its branches
        redoBranchIndices = currentNode.branches;
    } else {
        // We're at the initial state (before any history) - show all root nodes
        redoBranchIndices = historyNodes.map((node, idx) => (node.parentIndex === null ? idx : -1)).filter((idx) => idx !== -1);
    }

    console.log('🔍 Current index:', currentIndex);
    console.log('🔍 History nodes count:', historyNodes.length);
    console.log('🔍 Redo branch indices:', redoBranchIndices);

    const redoBranches: RedoBranch[] = redoBranchIndices
        .map((nodeIndex) => ({
            node: historyNodes[nodeIndex],
            nodeIndex,
        }))
        .filter((branch) => branch.node);

    const canRedo = redoBranches.length > 0;

    console.log('🔍 Can redo:', canRedo, 'Branches:', redoBranches.length);

    const value = useMemo(
        () => ({
            doc,
            canUndo,
            canRedo,
            redoBranches,
            updateContent,
            toggleTodo,
            insertBlock,
            deleteBlock,
            moveBlock,
            undo,
            redo,
        }),
        [doc, canUndo, canRedo, redoBranches, updateContent, toggleTodo, insertBlock, deleteBlock, moveBlock, undo, redo],
    );

    return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}
