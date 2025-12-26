import { describe, expect, it } from 'vitest';
import { BlockArray, CursorPosition, HistoryNode } from '../types';
import { validateCursor, validateDocument, validateEditorState, validateHistory } from './validation';

describe('validation - corrupted data recovery', () => {
    describe('validateDocument', () => {
        it('should pass for valid document', () => {
            const doc: BlockArray = [
                { id: '1', type: 'text', content: 'Hello' },
                { id: '2', type: 'todo', content: 'Task', done: false },
            ];

            const result = validateDocument(doc);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should detect duplicate IDs', () => {
            const doc: BlockArray = [
                { id: 'duplicate', type: 'text', content: 'First' },
                { id: 'duplicate', type: 'text', content: 'Second' },
            ];

            const result = validateDocument(doc);

            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].type).toBe('duplicate_id');
            expect(result.errors[0].message).toContain('duplicate');
        });

        it('should detect duplicate IDs in nested blocks', () => {
            const doc: BlockArray = [
                {
                    id: 'parent',
                    type: 'text',
                    content: 'Parent',
                    children: [
                        { id: 'child-id', type: 'text', content: 'Child1' },
                        { id: 'child-id', type: 'text', content: 'Child2' },
                    ],
                },
            ];

            const result = validateDocument(doc);

            expect(result.isValid).toBe(false);
            expect(result.errors[0].type).toBe('duplicate_id');
        });

        it('should detect duplicate ID between parent and child', () => {
            const doc: BlockArray = [
                {
                    id: 'same-id',
                    type: 'text',
                    content: 'Parent',
                    children: [{ id: 'same-id', type: 'text', content: 'Child' }],
                },
            ];

            const result = validateDocument(doc);

            expect(result.isValid).toBe(false);
            expect(result.errors[0].type).toBe('duplicate_id');
        });

        it('should detect invalid block type', () => {
            const doc = [{ id: '1', type: 'invalid-type', content: 'Test' }] as unknown as BlockArray;

            const result = validateDocument(doc);

            expect(result.isValid).toBe(false);
            expect(result.errors[0].type).toBe('schema_error');
        });

        it('should detect empty block ID', () => {
            const doc = [{ id: '', type: 'text', content: 'Test' }] as unknown as BlockArray;

            const result = validateDocument(doc);

            expect(result.isValid).toBe(false);
            expect(result.errors[0].type).toBe('schema_error');
        });

        it('should detect missing required fields', () => {
            const doc = [{ id: '1', type: 'text' }] as unknown as BlockArray;

            const result = validateDocument(doc);

            expect(result.isValid).toBe(false);
            expect(result.errors[0].type).toBe('schema_error');
        });

        it('should validate nested children recursively', () => {
            const doc: BlockArray = [
                {
                    id: '1',
                    type: 'text',
                    content: 'Parent',
                    children: [
                        {
                            id: '2',
                            type: 'text',
                            content: 'Child',
                            children: [{ id: '3', type: 'text', content: 'Grandchild' }],
                        },
                    ],
                },
            ];

            const result = validateDocument(doc);

            expect(result.isValid).toBe(true);
        });

        it('should detect multiple errors', () => {
            const doc = [
                { id: 'dup', type: 'text', content: 'First' },
                { id: 'dup', type: 'invalid', content: 'Second' },
            ] as unknown as BlockArray;

            const result = validateDocument(doc);

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });

    describe('validateHistory', () => {
        it('should pass for valid history', () => {
            const historyNodes: HistoryNode[] = [
                {
                    command: {
                        forward: { ops: [] },
                        inverse: { ops: [] },
                    },
                    parentIndex: null,
                    branches: [1, 2],
                    timestamp: Date.now() - 1000,
                },
                {
                    command: {
                        forward: { ops: [] },
                        inverse: { ops: [] },
                    },
                    parentIndex: 0,
                    branches: [],
                    timestamp: Date.now() - 500,
                },
                {
                    command: {
                        forward: { ops: [] },
                        inverse: { ops: [] },
                    },
                    parentIndex: 0,
                    branches: [],
                    timestamp: Date.now(),
                },
            ];

            const result = validateHistory(historyNodes, 2);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should detect invalid currentIndex (too large)', () => {
            const historyNodes: HistoryNode[] = [
                {
                    command: {
                        forward: { ops: [] },
                        inverse: { ops: [] },
                    },
                    parentIndex: null,
                    branches: [],
                    timestamp: Date.now(),
                },
            ];

            const result = validateHistory(historyNodes, 10);

            expect(result.isValid).toBe(false);
            expect(result.errors[0].type).toBe('invalid_history');
            expect(result.errors[0].message).toContain('Invalid current index');
        });

        it('should detect invalid currentIndex (too small)', () => {
            const historyNodes: HistoryNode[] = [];

            const result = validateHistory(historyNodes, -2);

            expect(result.isValid).toBe(false);
            expect(result.errors[0].type).toBe('invalid_history');
        });

        it('should detect invalid parentIndex (out of bounds)', () => {
            const historyNodes: HistoryNode[] = [
                {
                    command: {
                        forward: { ops: [] },
                        inverse: { ops: [] },
                    },
                    parentIndex: 99,
                    branches: [],
                    timestamp: Date.now(),
                },
            ];

            const result = validateHistory(historyNodes, 0);

            expect(result.isValid).toBe(false);
            expect(result.errors[0].type).toBe('invalid_history');
            expect(result.errors[0].message).toContain('Invalid parent index');
        });

        it('should detect cycle (parent >= current)', () => {
            const historyNodes: HistoryNode[] = [
                {
                    command: {
                        forward: { ops: [] },
                        inverse: { ops: [] },
                    },
                    parentIndex: null,
                    branches: [],
                    timestamp: Date.now() - 1000,
                },
                {
                    command: {
                        forward: { ops: [] },
                        inverse: { ops: [] },
                    },
                    parentIndex: 1,
                    branches: [],
                    timestamp: Date.now(),
                },
            ];

            const result = validateHistory(historyNodes, 1);

            expect(result.isValid).toBe(false);
            expect(result.errors[0].type).toBe('invalid_history');
            expect(result.errors[0].message).toContain('no cycles');
        });

        it('should detect invalid branch index', () => {
            const historyNodes: HistoryNode[] = [
                {
                    command: {
                        forward: { ops: [] },
                        inverse: { ops: [] },
                    },
                    parentIndex: null,
                    branches: [99],
                    timestamp: Date.now(),
                },
            ];

            const result = validateHistory(historyNodes, 0);

            expect(result.isValid).toBe(false);
            expect(result.errors[0].type).toBe('invalid_history');
            expect(result.errors[0].message).toContain('Invalid branch index');
        });

        it('should detect orphaned branches', () => {
            const historyNodes: HistoryNode[] = [
                {
                    command: {
                        forward: { ops: [] },
                        inverse: { ops: [] },
                    },
                    parentIndex: null,
                    branches: [1],
                    timestamp: Date.now() - 1000,
                },
                {
                    command: {
                        forward: { ops: [] },
                        inverse: { ops: [] },
                    },
                    parentIndex: null, // Should be 0
                    branches: [],
                    timestamp: Date.now(),
                },
            ];

            const result = validateHistory(historyNodes, 1);

            expect(result.isValid).toBe(false);
            expect(result.errors[0].type).toBe('orphaned_parent');
            expect(result.errors[0].message).toContain("doesn't point back to parent");
        });

        it('should detect timestamp in far future', () => {
            const historyNodes: HistoryNode[] = [
                {
                    command: {
                        forward: { ops: [] },
                        inverse: { ops: [] },
                    },
                    parentIndex: null,
                    branches: [],
                    timestamp: Date.now() + 120000, // 2 minutes in future
                },
            ];

            const result = validateHistory(historyNodes, 0);

            expect(result.isValid).toBe(false);
            expect(result.errors[0].type).toBe('invalid_history');
            expect(result.errors[0].message).toContain('too far in the future');
        });

        it('should accept empty history with currentIndex -1', () => {
            const result = validateHistory([], -1);

            expect(result.isValid).toBe(true);
        });

        it('should detect invalid schema in history nodes', () => {
            const historyNodes = [
                {
                    command: {
                        forward: { ops: [] },
                        inverse: { ops: [] },
                    },
                    parentIndex: 'invalid',
                    branches: [],
                    timestamp: Date.now(),
                },
            ] as unknown as HistoryNode[];

            const result = validateHistory(historyNodes, 0);

            expect(result.isValid).toBe(false);
            expect(result.errors[0].type).toBe('schema_error');
        });
    });

    describe('validateCursor', () => {
        it('should pass for null cursor', () => {
            const doc: BlockArray = [{ id: '1', type: 'text', content: 'Test' }];
            const cursor: CursorPosition = null;

            const result = validateCursor(cursor, doc);

            expect(result.isValid).toBe(true);
        });

        it('should pass for valid cursor', () => {
            const doc: BlockArray = [{ id: 'block-1', type: 'text', content: 'Hello World' }];
            const cursor: CursorPosition = {
                blockId: 'block-1',
                selectionStart: 0,
                selectionEnd: 5,
            };

            const result = validateCursor(cursor, doc);

            expect(result.isValid).toBe(true);
        });

        it('should detect cursor referencing non-existent block', () => {
            const doc: BlockArray = [{ id: 'block-1', type: 'text', content: 'Test' }];
            const cursor: CursorPosition = {
                blockId: 'non-existent',
                selectionStart: 0,
                selectionEnd: 2,
            };

            const result = validateCursor(cursor, doc);

            expect(result.isValid).toBe(false);
            expect(result.errors[0].type).toBe('invalid_cursor');
            expect(result.errors[0].message).toContain('non-existent block');
        });

        it('should detect selectionStart beyond content length', () => {
            const doc: BlockArray = [{ id: 'block-1', type: 'text', content: 'Short' }];
            const cursor: CursorPosition = {
                blockId: 'block-1',
                selectionStart: 100,
                selectionEnd: 100,
            };

            const result = validateCursor(cursor, doc);

            expect(result.isValid).toBe(false);
            expect(result.errors[0].type).toBe('invalid_cursor');
            expect(result.errors[0].message).toContain('selectionStart');
        });

        it('should detect selectionEnd beyond content length', () => {
            const doc: BlockArray = [{ id: 'block-1', type: 'text', content: 'Short' }];
            const cursor: CursorPosition = {
                blockId: 'block-1',
                selectionStart: 0,
                selectionEnd: 100,
            };

            const result = validateCursor(cursor, doc);

            expect(result.isValid).toBe(false);
            expect(result.errors[0].message).toContain('selectionEnd');
        });

        it('should detect selectionStart > selectionEnd', () => {
            const doc: BlockArray = [{ id: 'block-1', type: 'text', content: 'Test' }];
            const cursor: CursorPosition = {
                blockId: 'block-1',
                selectionStart: 3,
                selectionEnd: 1,
            };

            const result = validateCursor(cursor, doc);

            expect(result.isValid).toBe(false);
            expect(result.errors[0].type).toBe('invalid_cursor');
            expect(result.errors[0].message).toContain('cannot be greater');
        });

        it('should find cursor in nested blocks', () => {
            const doc: BlockArray = [
                {
                    id: 'parent',
                    type: 'text',
                    content: 'Parent',
                    children: [{ id: 'child', type: 'text', content: 'Child content' }],
                },
            ];
            const cursor: CursorPosition = {
                blockId: 'child',
                selectionStart: 0,
                selectionEnd: 5,
            };

            const result = validateCursor(cursor, doc);

            expect(result.isValid).toBe(true);
        });

        it('should detect invalid cursor schema', () => {
            const doc: BlockArray = [{ id: 'block-1', type: 'text', content: 'Test' }];
            const cursor = {
                blockId: 123,
                selectionStart: 0,
                selectionEnd: 2,
            } as unknown as CursorPosition;

            const result = validateCursor(cursor, doc);

            expect(result.isValid).toBe(false);
            expect(result.errors[0].type).toBe('schema_error');
        });

        it('should detect negative selection values', () => {
            const doc: BlockArray = [{ id: 'block-1', type: 'text', content: 'Test' }];
            const cursor = {
                blockId: 'block-1',
                selectionStart: -1,
                selectionEnd: 2,
            } as unknown as CursorPosition;

            const result = validateCursor(cursor, doc);

            expect(result.isValid).toBe(false);
            expect(result.errors[0].type).toBe('schema_error');
        });
    });

    describe('validateEditorState', () => {
        it('should pass for complete valid state', () => {
            const doc: BlockArray = [
                { id: '1', type: 'text', content: 'Hello' },
                { id: '2', type: 'todo', content: 'Task', done: false },
            ];
            const historyNodes: HistoryNode[] = [
                {
                    command: {
                        forward: { ops: [] },
                        inverse: { ops: [] },
                    },
                    parentIndex: null,
                    branches: [],
                    timestamp: Date.now(),
                },
            ];
            const currentIndex = 0;
            const cursor: CursorPosition = {
                blockId: '1',
                selectionStart: 0,
                selectionEnd: 5,
            };

            const result = validateEditorState(doc, historyNodes, currentIndex, cursor);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should accumulate all validation errors', () => {
            const doc: BlockArray = [
                { id: 'dup', type: 'text', content: 'First' },
                { id: 'dup', type: 'text', content: 'Second' },
            ];
            const historyNodes: HistoryNode[] = [
                {
                    command: {
                        forward: { ops: [] },
                        inverse: { ops: [] },
                    },
                    parentIndex: 99,
                    branches: [],
                    timestamp: Date.now(),
                },
            ];
            const currentIndex = 0;
            const cursor: CursorPosition = {
                blockId: 'non-existent',
                selectionStart: 0,
                selectionEnd: 5,
            };

            const result = validateEditorState(doc, historyNodes, currentIndex, cursor);

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThanOrEqual(3);

            const errorTypes = result.errors.map((e) => e.type);
            expect(errorTypes).toContain('duplicate_id');
            expect(errorTypes).toContain('invalid_history');
            expect(errorTypes).toContain('invalid_cursor');
        });

        it('should validate all components independently', () => {
            const doc: BlockArray = [{ id: 'valid', type: 'text', content: 'Valid' }];
            const historyNodes: HistoryNode[] = [];
            const currentIndex = 10; // Invalid
            const cursor: CursorPosition = null;

            const result = validateEditorState(doc, historyNodes, currentIndex, cursor);

            expect(result.isValid).toBe(false);
            expect(result.errors[0].type).toBe('invalid_history');
        });
    });

    describe('recovery scenarios', () => {
        it('should identify recoverable vs non-recoverable errors', () => {
            const doc: BlockArray = [
                { id: 'dup', type: 'text', content: 'First' },
                { id: 'dup', type: 'text', content: 'Second' },
            ];

            const result = validateDocument(doc);

            expect(result.isValid).toBe(false);
            expect(result.errors[0].type).toBe('duplicate_id');
            // This error would require document reset or ID regeneration
        });

        it('should provide detailed error information for debugging', () => {
            const doc: BlockArray = [
                { id: 'id1', type: 'text', content: 'A' },
                { id: 'id1', type: 'text', content: 'B' },
                { id: 'id1', type: 'text', content: 'C' },
            ];

            const result = validateDocument(doc);

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBe(2);
            result.errors.forEach((error) => {
                expect(error).toHaveProperty('message');
                expect(error).toHaveProperty('type');
                expect(error).toHaveProperty('details');
            });
        });

        it('should detect corrupted history that can be reset', () => {
            const doc: BlockArray = [{ id: '1', type: 'text', content: 'Valid doc' }];
            const historyNodes: HistoryNode[] = [
                {
                    command: {
                        forward: { ops: [] },
                        inverse: { ops: [] },
                    },
                    parentIndex: 5, // Points to non-existent node
                    branches: [],
                    timestamp: Date.now(),
                },
            ];
            const currentIndex = 0;
            const cursor: CursorPosition = null;

            const result = validateEditorState(doc, historyNodes, currentIndex, cursor);

            expect(result.isValid).toBe(false);
            const historyErrors = result.errors.filter((e) => e.type === 'invalid_history' || e.type === 'orphaned_parent');
            expect(historyErrors.length).toBeGreaterThan(0);
            // Document is valid, only history needs reset
        });

        it('should detect cursor pointing to deleted block', () => {
            const doc: BlockArray = [{ id: 'existing', type: 'text', content: 'Exists' }];
            const cursor: CursorPosition = {
                blockId: 'deleted-block-id',
                selectionStart: 0,
                selectionEnd: 0,
            };

            const result = validateCursor(cursor, doc);

            expect(result.isValid).toBe(false);
            expect(result.errors[0].type).toBe('invalid_cursor');
            // Cursor can be reset to null without losing document
        });
    });

    describe('edge cases', () => {
        it('should handle empty document', () => {
            const result = validateDocument([]);

            expect(result.isValid).toBe(true);
        });

        it('should handle deeply nested valid structure', () => {
            let nested: BlockArray = [{ id: 'leaf', type: 'text', content: 'Leaf' }];
            for (let i = 0; i < 10; i++) {
                nested = [
                    {
                        id: `level-${i}`,
                        type: 'text',
                        content: `Level ${i}`,
                        children: nested,
                    },
                ];
            }

            const result = validateDocument(nested);

            expect(result.isValid).toBe(true);
        });

        it('should handle large documents efficiently', () => {
            const doc: BlockArray = Array.from({ length: 1000 }, (_, i) => ({
                id: `block-${i}`,
                type: 'text' as const,
                content: `Block ${i}`,
            }));

            const startTime = Date.now();
            const result = validateDocument(doc);
            const duration = Date.now() - startTime;

            expect(result.isValid).toBe(true);
            expect(duration).toBeLessThan(1000); // Should complete in < 1s
        });
    });
});
