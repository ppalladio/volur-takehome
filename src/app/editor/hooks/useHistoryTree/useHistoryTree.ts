import {
    BlockArray,
    Command,
    HistoryNode,
    RedoBranch,
    addHistoryNode,
    applyPatch,
    canRedo as canRedoFn,
    canUndo as canUndoFn,
    getRedoBranches,
    getRedoTargetIndex,
    getUndoTargetIndex,
} from '@/editor/lib';
import { useCallback, useMemo, useState } from 'react';

export type UseHistoryTreeReturn = {
    doc: BlockArray;
    historyNodes: HistoryNode[];
    currentIndex: number;
    execute: (command: Command | null) => void;
    undo: () => void;
    redo: (nodeIndex?: number) => void;
    canUndo: boolean;
    canRedo: boolean;
    redoBranches: RedoBranch[];
};

/**
 * Custom hook for managing a branching history tree with undo/redo functionality.
 *
 * This hook implements a command pattern with patches, allowing for:
 * - Execute commands with forward patches
 * - Undo with inverse patches
 * - Redo with branch selection (supports branching history)
 *
 * @param initialDoc - The initial document state
 * @returns History tree state and operations
 */
export const useHistoryTree = (initialDoc: BlockArray): UseHistoryTreeReturn => {
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

            // Apply forward patch to document
            const newDoc = applyPatch(doc, command.forward);
            setDoc(newDoc);

            // Add to history tree
            const { nodes: updatedNodes, newIndex } = addHistoryNode(historyNodes, currentIndex, command);
            setHistoryNodes(updatedNodes);
            setCurrentIndex(newIndex);
        },
        [doc, historyNodes, currentIndex],
    );

    // Undo the current command
    const undo = useCallback(() => {
        const targetIndex = getUndoTargetIndex(historyNodes, currentIndex);

        if (currentIndex < 0) {
            console.warn('Cannot undo: already at initial state');
            return;
        }

        const node = historyNodes[currentIndex];

        // Apply inverse patch
        const newDoc = applyPatch(doc, node.command.inverse);
        setDoc(newDoc);
        setCurrentIndex(targetIndex);
    }, [doc, historyNodes, currentIndex]);

    // Redo with optional branch selection
    const redo = useCallback(
        (nodeIndex?: number) => {
            const targetIndex = getRedoTargetIndex(historyNodes, currentIndex, nodeIndex);

            if (targetIndex === -1) {
                console.warn('Cannot redo: no redo branches available');
                return;
            }

            const node = historyNodes[targetIndex];

            // Apply forward patch
            const newDoc = applyPatch(doc, node.command.forward);
            setDoc(newDoc);
            setCurrentIndex(targetIndex);
        },
        [doc, historyNodes, currentIndex],
    );

    // Derived state
    const canUndo = canUndoFn(currentIndex);
    const canRedo = canRedoFn(historyNodes, currentIndex);

    const redoBranches: RedoBranch[] = useMemo(() => {
        const branchIndices = getRedoBranches(historyNodes, currentIndex);
        return branchIndices
            .map((nodeIndex) => ({
                node: historyNodes[nodeIndex],
                nodeIndex,
            }))
            .filter((branch) => branch.node !== undefined);
    }, [historyNodes, currentIndex]);

    return {
        doc,
        historyNodes,
        currentIndex,
        execute,
        undo,
        redo,
        canUndo,
        canRedo,
        redoBranches,
    };
};
