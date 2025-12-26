import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Block, BlockArray, Command, CursorPosition, HistoryNode, Patch } from '../types';
import { clearEditorState, loadEditorState, saveEditorState } from './persistence';

// Test helpers
const createBlock = (id: string, type: 'text' | 'todo', content: string, options?: Partial<Block>): Block => ({
    id,
    type,
    content,
    ...options,
});

const createDoc = (...blocks: Block[]): BlockArray => blocks;

const createCursor = (blockId: string, selectionStart: number, selectionEnd: number): CursorPosition => ({
    blockId,
    selectionStart,
    selectionEnd,
});

const createPatch = (ops: Patch['ops']): Patch => ({ ops });

const createCommand = (forwardOps: Patch['ops'], inverseOps: Patch['ops']): Command => ({
    forward: createPatch(forwardOps),
    inverse: createPatch(inverseOps),
});

const createHistoryNode = (command: Command, parentIndex: number | null, branches: number[] = [], timestamp?: number): HistoryNode => ({
    command,
    parentIndex,
    branches,
    timestamp: timestamp ?? Date.now(),
});

describe('persistence - round-trip tests', () => {
    let localStorageMock: { [key: string]: string } = {};

    beforeEach(() => {
        localStorageMock = {};
        globalThis.localStorage = {
            getItem: vi.fn((key: string) => localStorageMock[key] || null),
            setItem: vi.fn((key: string, value: string) => {
                localStorageMock[key] = value;
            }),
            removeItem: vi.fn((key: string) => {
                delete localStorageMock[key];
            }),
            clear: vi.fn(() => {
                localStorageMock = {};
            }),
            length: 0,
            key: vi.fn(),
        } as Storage;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should save and load empty state', () => {
        saveEditorState(createDoc(), [], -1, null);

        const loaded = loadEditorState();

        expect(loaded).not.toBeNull();
        expect(loaded!.doc).toEqual([]);
        expect(loaded!.historyNodes).toEqual([]);
        expect(loaded!.currentIndex).toBe(-1);
        expect(loaded!.cursor).toBeNull();
    });

    it('should save and load simple document', () => {
        const doc = createDoc(createBlock('1', 'text', 'Hello'), createBlock('2', 'todo', 'Task', { done: false }));

        saveEditorState(doc, [], -1, null);
        const loaded = loadEditorState();

        expect(loaded).not.toBeNull();
        expect(loaded!.doc).toHaveLength(2);
        expect(loaded!.doc[0].content).toBe('Hello');
        expect(loaded!.doc[1].type).toBe('todo');
        expect(loaded!.doc[1].done).toBe(false);
    });

    it('should save and load nested document', () => {
        const doc = createDoc(
            createBlock('1', 'text', 'Parent', {
                children: [
                    createBlock('2', 'text', 'Child1'),
                    createBlock('3', 'text', 'Child2', {
                        children: [createBlock('4', 'todo', 'Nested', { done: true })],
                    }),
                ],
            }),
        );

        saveEditorState(doc, [], -1, null);
        const loaded = loadEditorState();

        expect(loaded).not.toBeNull();
        expect(loaded!.doc[0].children).toHaveLength(2);
        expect(loaded!.doc[0].children![1].children).toHaveLength(1);
        expect(loaded!.doc[0].children![1].children![0].content).toBe('Nested');
        expect(loaded!.doc[0].children![1].children![0].done).toBe(true);
    });

    it('should save and load cursor position', () => {
        const doc = createDoc(createBlock('block-1', 'text', 'Test'));
        const cursor = createCursor('block-1', 2, 4);

        saveEditorState(doc, [], -1, cursor);
        const loaded = loadEditorState();

        expect(loaded!.cursor).not.toBeNull();
        expect(loaded!.cursor!.blockId).toBe('block-1');
        expect(loaded!.cursor!.selectionStart).toBe(2);
        expect(loaded!.cursor!.selectionEnd).toBe(4);
    });

    it('should save and load blocks (autoFocus may be preserved)', () => {
        const doc = createDoc(createBlock('1', 'text', 'Test', { autoFocus: true }), createBlock('2', 'text', 'Normal'));

        saveEditorState(doc, [], -1, null);
        const loaded = loadEditorState();

        expect(loaded!.doc[0].content).toBe('Test');
        expect(loaded!.doc[1].content).toBe('Normal');
    });

    it('should save and load nested blocks', () => {
        const doc = createDoc(
            createBlock('1', 'text', 'Parent', {
                autoFocus: true,
                children: [createBlock('2', 'text', 'Child', { autoFocus: true })],
            }),
        );

        saveEditorState(doc, [], -1, null);
        const loaded = loadEditorState();

        expect(loaded!.doc[0].content).toBe('Parent');
        expect(loaded!.doc[0].children![0].content).toBe('Child');
    });

    it('should save and load history command blocks', () => {
        const block = createBlock('1', 'text', 'New', { autoFocus: true });
        const command = createCommand(
            [{ type: 'insert', parentPath: null, index: 0, block }],
            [{ type: 'delete', parentPath: null, index: 0, deleted: block }],
        );
        const historyNodes = [createHistoryNode(command, null)];

        saveEditorState(createDoc(), historyNodes, 0, null);
        const loaded = loadEditorState();

        const insertOp = loaded!.historyNodes[0].command.forward.ops[0];
        if (insertOp.type === 'insert') {
            expect(insertOp.block.content).toBe('New');
        }
        const deleteOp = loaded!.historyNodes[0].command.inverse.ops[0];
        if (deleteOp.type === 'delete') {
            expect(deleteOp.deleted.content).toBe('New');
        }
    });

    it('should include version in saved state', () => {
        saveEditorState(createDoc(), [], -1, null);

        const stored = localStorage.getItem('mini-notion-editor-state');
        const parsed = JSON.parse(stored!);
        expect(parsed.version).toBe(1);
    });

    it('should reject mismatched version', () => {
        const invalidState = { doc: [], historyNodes: [], currentIndex: -1, cursor: null, version: 999 };
        localStorage.setItem('mini-notion-editor-state', JSON.stringify(invalidState));

        const loaded = loadEditorState();

        expect(loaded).toBeNull();
    });

    it('should return null when no data exists', () => {
        expect(loadEditorState()).toBeNull();
    });

    it('should not load invalid JSON', () => {
        localStorage.setItem('mini-notion-editor-state', 'invalid json {');

        const loaded = loadEditorState();

        expect(loaded).toBeNull();
        expect(localStorage.getItem('mini-notion-editor-state')).toBeNull();
    });

    it('should handle schema validation failures', () => {
        const invalidState = {
            doc: [{ id: 123, type: 'text', content: 'Invalid ID type' }],
            historyNodes: [],
            currentIndex: -1,
            cursor: null,
            version: 1,
        };
        localStorage.setItem('mini-notion-editor-state', JSON.stringify(invalidState));

        const loaded = loadEditorState();

        expect(loaded).toBeNull();
        expect(localStorage.getItem('mini-notion-editor-state')).toBeNull();
    });

    it('should not save invalid state', () => {
        const doc = createDoc(createBlock('', 'text', 'Invalid - empty ID'));

        saveEditorState(doc, [], -1, null);

        expect(localStorage.getItem('mini-notion-editor-state')).toBeNull();
    });

    it('should remove persisted state', () => {
        saveEditorState(createDoc(createBlock('1', 'text', 'Test')), [], -1, null);
        expect(localStorage.getItem('mini-notion-editor-state')).not.toBeNull();

        clearEditorState();

        expect(localStorage.getItem('mini-notion-editor-state')).toBeNull();
    });

    it('should preserve complete editor state through multiple operations', () => {
        const doc1 = createDoc(createBlock('1', 'text', 'Initial'));
        saveEditorState(doc1, [], -1, null);

        let loaded = loadEditorState()!;
        expect(loaded.doc[0].content).toBe('Initial');

        const doc2 = createDoc(createBlock('1', 'text', 'Modified'));
        const command = createCommand(
            [{ type: 'update', path: [0], field: 'content', value: 'Modified', oldValue: 'Initial' }],
            [{ type: 'update', path: [0], field: 'content', value: 'Initial', oldValue: 'Modified' }],
        );
        const cursor = createCursor('1', 8, 8);

        saveEditorState(doc2, [createHistoryNode(command, null)], 0, cursor);

        loaded = loadEditorState()!;
        expect(loaded.doc[0].content).toBe('Modified');
        expect(loaded.historyNodes).toHaveLength(1);
        expect(loaded.currentIndex).toBe(0);
        expect(loaded.cursor!.selectionStart).toBe(8);
    });

    it('should handle large documents', () => {
        const doc = Array.from({ length: 100 }, (_, i) =>
            createBlock(`block-${i}`, i % 2 === 0 ? 'text' : 'todo', `Block ${i}`, i % 2 === 1 ? { done: i % 4 === 1 } : {}),
        );

        saveEditorState(doc, [], -1, null);
        const loaded = loadEditorState();

        expect(loaded!.doc).toHaveLength(100);
        expect(loaded!.doc[50].content).toBe('Block 50');
    });

    it('should handle deeply nested structures', () => {
        let currentBlock: BlockArray = [createBlock('leaf', 'text', 'Leaf')];

        for (let i = 9; i >= 0; i--) {
            currentBlock = [createBlock(`level-${i}`, 'text', `Level ${i}`, { children: currentBlock })];
        }

        saveEditorState(currentBlock, [], -1, null);
        const loaded = loadEditorState();

        let current = loaded!.doc;
        for (let i = 0; i < 10; i++) {
            expect(current[0].content).toBe(`Level ${i}`);
            current = current[0].children!;
        }
        expect(current[0].content).toBe('Leaf');
    });
});
