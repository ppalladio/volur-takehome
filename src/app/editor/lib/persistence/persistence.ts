import { z } from 'zod';
import { STORAGE_CONFIG } from '../config';
import { BlockArray, BlockArraySchema, CursorPosition, CursorPositionSchema, HistoryNode, HistoryNodesSchema } from '../types';
import { stripTransientFlags, stripTransientFlagsFromBlocks } from '../utils';

const PersistedStateSchema = z.object({
    doc: BlockArraySchema,
    historyNodes: HistoryNodesSchema,
    currentIndex: z.number().int(),
    cursor: CursorPositionSchema,
    version: z.number().int().positive(),
});

export type PersistedState = z.infer<typeof PersistedStateSchema>;

/**
 * Strip transient flags from history nodes
 */
const stripTransientFlagsFromHistory = (nodes: HistoryNode[]): HistoryNode[] => {
    return nodes.map((node) => ({
        ...node,
        command: {
            forward: {
                ops: node.command.forward.ops.map((op) => {
                    if (op.type === 'insert') {
                        return { ...op, block: stripTransientFlags(op.block) };
                    }
                    return op;
                }),
            },
            inverse: {
                ops: node.command.inverse.ops.map((op) => {
                    if (op.type === 'insert') {
                        return { ...op, block: stripTransientFlags(op.block) };
                    }
                    if (op.type === 'delete' && op.deleted) {
                        return { ...op, deleted: stripTransientFlags(op.deleted) };
                    }
                    return op;
                }),
            },
        },
    }));
};

/**
 * Save editor state to localStorage with validation
 */
export const saveEditorState = (doc: BlockArray, historyNodes: HistoryNode[], currentIndex: number, cursor: CursorPosition): void => {
    try {
        const state: PersistedState = {
            doc: stripTransientFlagsFromBlocks(doc),
            historyNodes: stripTransientFlagsFromHistory(historyNodes),
            currentIndex,
            cursor,
            version: STORAGE_CONFIG.STORAGE_VERSION,
        };

        // Validate before saving
        const validationResult = PersistedStateSchema.safeParse(state);
        if (!validationResult.success) {
            console.error('  Failed to validate state before saving:', validationResult.error.issues);
            return;
        }

        localStorage.setItem(STORAGE_CONFIG.EDITOR_STATE_KEY, JSON.stringify(state));
    } catch (error) {
        console.error('Failed to save editor state:', error);
    }
};

/**
 * Load editor state from localStorage with validation
 */
export const loadEditorState = (): PersistedState | null => {
    try {
        const stored = localStorage.getItem(STORAGE_CONFIG.EDITOR_STATE_KEY);
        if (!stored) {
            return null;
        }

        const parsed = JSON.parse(stored);

        const validationResult = PersistedStateSchema.safeParse(parsed);
        if (!validationResult.success) {
            console.error('  Persisted state failed validation:', validationResult.error.issues);
            console.warn(' Clearing invalid persisted state');
            clearEditorState();
            return null;
        }

        const state = validationResult.data;

        // Version check
        if (state.version !== STORAGE_CONFIG.STORAGE_VERSION) {
            console.warn('  Persisted state version mismatch, ignoring');
            return null;
        }

        return state;
    } catch (error) {
        console.error('Failed to load editor state:', error);
        clearEditorState();
        return null;
    }
};

/**
 * Clear persisted state
 */
export const clearEditorState = (): void => {
    try {
        localStorage.removeItem(STORAGE_CONFIG.EDITOR_STATE_KEY);
    } catch (error) {
        console.error('Failed to clear editor state:', error);
    }
};
