import { z } from 'zod';
import { Block, BlockArray, BlockArraySchema, CursorPosition, CursorPositionSchema, HistoryNode, HistoryNodesSchema } from './types';

const PersistedStateSchema = z.object({
    doc: BlockArraySchema,
    historyNodes: HistoryNodesSchema,
    currentIndex: z.number().int(),
    cursor: CursorPositionSchema,
    version: z.number().int().positive(),
});

export type PersistedState = z.infer<typeof PersistedStateSchema>;

const STORAGE_KEY = 'mini-notion-editor-state';
const STORAGE_VERSION = 1;

/**
 * Strip transient flags from blocks (like autoFocus)
 */
function stripTransientFlags(blocks: BlockArray): BlockArray {
    return blocks.map((block) => {
        const { ...cleanBlock } = block;
        return {
            ...cleanBlock,
            children: block.children ? stripTransientFlags(block.children) : undefined,
        } as Block;
    });
}

/**
 * Strip transient flags from history nodes
 */
function stripTransientFlagsFromHistory(nodes: HistoryNode[]): HistoryNode[] {
    return nodes.map((node) => ({
        ...node,
        command: {
            forward: {
                ops: node.command.forward.ops.map((op) => {
                    if (op.type === 'insert') {
                        const { ...cleanBlock } = op.block;
                        return { ...op, block: cleanBlock as Block };
                    }
                    return op;
                }),
            },
            inverse: {
                ops: node.command.inverse.ops.map((op) => {
                    if (op.type === 'insert') {
                        const { ...cleanBlock } = op.block;
                        return { ...op, block: cleanBlock as Block };
                    }
                    if (op.type === 'delete' && op.deleted) {
                        const { ...cleanBlock } = op.deleted;
                        return { ...op, deleted: cleanBlock as Block };
                    }
                    return op;
                }),
            },
        },
    }));
}

/**
 * Save editor state to localStorage with validation
 */
export function saveEditorState(doc: BlockArray, historyNodes: HistoryNode[], currentIndex: number, cursor: CursorPosition): void {
    try {
        const state: PersistedState = {
            doc: stripTransientFlags(doc),
            historyNodes: stripTransientFlagsFromHistory(historyNodes),
            currentIndex,
            cursor,
            version: STORAGE_VERSION,
        };

        // Validate before saving
        const validationResult = PersistedStateSchema.safeParse(state);
        if (!validationResult.success) {
            console.error('❌ Failed to validate state before saving:', validationResult.error.issues);
            return;
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        console.log('💾 Saved editor state:', {
            docBlocks: doc.length,
            historyNodes: historyNodes.length,
            currentIndex,
            cursor: cursor ? `${cursor.blockId} [${cursor.selectionStart}:${cursor.selectionEnd}]` : 'none',
        });
    } catch (error) {
        console.error('Failed to save editor state:', error);
    }
}

/**
 * Load editor state from localStorage with validation
 */
export function loadEditorState(): PersistedState | null {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            console.log('📂 No persisted state found');
            return null;
        }

        const parsed = JSON.parse(stored);

        // Validate with Zod
        const validationResult = PersistedStateSchema.safeParse(parsed);
        if (!validationResult.success) {
            console.error('❌ Persisted state failed validation:', validationResult.error.issues);
            console.warn('⚠️ Clearing invalid persisted state');
            clearEditorState();
            return null;
        }

        const state = validationResult.data;

        // Version check
        if (state.version !== STORAGE_VERSION) {
            console.warn('⚠️ Persisted state version mismatch, ignoring');
            return null;
        }

        console.log('📂 Loaded editor state:', {
            docBlocks: state.doc.length,
            historyNodes: state.historyNodes.length,
            currentIndex: state.currentIndex,
            cursor: state.cursor ? `${state.cursor.blockId} [${state.cursor.selectionStart}:${state.cursor.selectionEnd}]` : 'none',
        });

        return state;
    } catch (error) {
        console.error('Failed to load editor state:', error);
        clearEditorState();
        return null;
    }
}

/**
 * Clear persisted state
 */
export function clearEditorState(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
        console.log('🗑️ Cleared editor state');
    } catch (error) {
        console.error('Failed to clear editor state:', error);
    }
}
