'use client';

import { applyPatch } from '@/lib/editor/patches';
import { BlockArray, Command } from '@/lib/editor/types';
import { useCallback, useState } from 'react';

export function useHistory(initialDoc: BlockArray) {
    const [doc, setDoc] = useState<BlockArray>(initialDoc);
    const [history, setHistory] = useState<Command[]>([]); // Changed from BlockArray[]
    const [historyIndex, setHistoryIndex] = useState(-1);

    const execute = useCallback(
        (command: Command | null) => {
            if (!command) return;

            const newDoc = applyPatch(doc, command.forward);
            setDoc(newDoc);

            // Clear any redo history
            const newHistory = history.slice(0, historyIndex + 1);
            newHistory.push(command); // Store the command, not the doc
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        },
        [doc, history, historyIndex],
    );

    const undo = useCallback(() => {
        if (historyIndex < 0) return;

        const command = history[historyIndex];
        const newDoc = applyPatch(doc, command.inverse); // Apply inverse patch
        setDoc(newDoc);
        setHistoryIndex(historyIndex - 1);
    }, [doc, history, historyIndex]);

    const redo = useCallback(() => {
        if (historyIndex >= history.length - 1) return;

        const command = history[historyIndex + 1];
        const newDoc = applyPatch(doc, command.forward); // Apply forward patch
        setDoc(newDoc);
        setHistoryIndex(historyIndex + 1);
    }, [doc, history, historyIndex]);

    const canUndo = historyIndex >= 0;
    const canRedo = historyIndex < history.length - 1;

    return {
        doc,
        execute,
        undo,
        redo,
        canUndo,
        canRedo,
    };
}
