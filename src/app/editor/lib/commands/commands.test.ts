import { describe, expect, it } from 'vitest';
import { applyPatch } from '../patches/patches';
import { Block, BlockArray } from '../types';

import { deleteBlockCommand, insertBlockCommand, moveBlockCommand, toggleTodoCommand, updateContentCommand } from './commands';

const createBlock = (id: string, type: 'text' | 'todo', content: string, options?: Partial<Block>): Block => ({
    id,
    type,
    content,
    ...options,
});

const createDoc = (...blocks: Block[]): BlockArray => blocks;

describe('commands', () => {
    describe('updateContentCommand', () => {
        it('should create forward/inverse patches and restore state', () => {
            const doc = createDoc(createBlock('1', 'text', 'Original'));
            const command = updateContentCommand(doc, [0], 'Modified')!;

            // Verify patch structure
            expect(command.forward.ops[0]).toMatchObject({
                type: 'update',
                path: [0],
                field: 'content',
                value: 'Modified',
                oldValue: 'Original',
            });
            expect(command.inverse.ops[0]).toMatchObject({
                type: 'update',
                path: [0],
                field: 'content',
                value: 'Original',
                oldValue: 'Modified',
            });

            const modified = applyPatch(doc, command.forward);
            expect(modified[0].content).toBe('Modified');
            const restored = applyPatch(modified, command.inverse);
            expect(restored[0].content).toBe('Original');
        });

        it('should handle nested block updates', () => {
            const doc = createDoc(
                createBlock('1', 'text', 'Parent', {
                    children: [createBlock('2', 'text', 'Child')],
                }),
            );

            const command = updateContentCommand(doc, [0, 0], 'Updated Child')!;
            const modified = applyPatch(doc, command.forward);
            expect(modified[0].children![0].content).toBe('Updated Child');
            const restored = applyPatch(modified, command.inverse);
            expect(restored[0].children![0].content).toBe('Child');
        });
    });

    describe('toggleTodoCommand', () => {
        it('should create forward/inverse patches and toggle done state', () => {
            const doc = createDoc(createBlock('1', 'todo', 'Task', { done: false }));
            const command = toggleTodoCommand(doc, [0])!;

            expect(command.forward.ops[0]).toMatchObject({
                type: 'update',
                path: [0],
                field: 'done',
                value: true,
                oldValue: false,
            });
            expect(command.inverse.ops[0]).toMatchObject({
                type: 'update',
                path: [0],
                field: 'done',
                value: false,
                oldValue: true,
            });

            const toggled = applyPatch(doc, command.forward);
            expect(toggled[0].done).toBe(true);
            const restored = applyPatch(toggled, command.inverse);
            expect(restored[0].done).toBe(false);
        });
    });

    describe('insertBlockCommand', () => {
        it('should create forward/inverse patches and restore state', () => {
            const original = createDoc(createBlock('1', 'text', 'Existing'));
            const command = insertBlockCommand(null, 1, 'text');

            // Verify patch structure
            expect(command.forward.ops[0]).toMatchObject({
                type: 'insert',
                parentPath: null,
                index: 1,
            });
            expect(command.inverse.ops[0]).toMatchObject({
                type: 'delete',
                parentPath: null,
                index: 1,
            });

            // Apply forward and restore
            const withInsert = applyPatch(original, command.forward);
            expect(withInsert).toHaveLength(2);
            expect(withInsert[0].content).toBe('Existing');
            const restored = applyPatch(withInsert, command.inverse);
            expect(restored).toHaveLength(1);
            expect(restored[0].content).toBe('Existing');
        });

        it('should insert todo block with done property', () => {
            const command = insertBlockCommand(null, 0, 'todo');
            const result = applyPatch([], command.forward);
            expect(result[0].type).toBe('todo');
            expect(result[0]).toHaveProperty('done');
        });

        it('should insert as child and restore', () => {
            const original = createDoc(createBlock('1', 'text', 'Parent', { children: [] }));
            const command = insertBlockCommand([0], 0, 'text');

            const withInsert = applyPatch(original, command.forward);
            expect(withInsert[0].children).toHaveLength(1);
            const restored = applyPatch(withInsert, command.inverse);
            expect(restored[0].children).toHaveLength(0);
        });
    });

    describe('deleteBlockCommand', () => {
        it('should create forward/inverse patches and restore block', () => {
            const original = createDoc(createBlock('1', 'text', 'First'), createBlock('2', 'text', 'Second'));
            const command = deleteBlockCommand(original, null, 0)!;

            // Verify patch structure
            expect(command.forward.ops[0]).toMatchObject({
                type: 'delete',
                parentPath: null,
                index: 0,
            });
            expect(command.inverse.ops[0]).toMatchObject({
                type: 'insert',
                parentPath: null,
                index: 0,
            });

            // Apply forward and restore
            const afterDelete = applyPatch(original, command.forward);
            expect(afterDelete).toHaveLength(1);
            expect(afterDelete[0].content).toBe('Second');
            const restored = applyPatch(afterDelete, command.inverse);
            expect(restored).toHaveLength(2);
            expect(restored[0].content).toBe('First');
            expect(restored[1].content).toBe('Second');
        });

        it('should delete and restore block with children (subtree)', () => {
            const original = createDoc(
                createBlock('1', 'text', 'Parent', {
                    children: [createBlock('2', 'text', 'Child1'), createBlock('3', 'text', 'Child2')],
                }),
            );

            const command = deleteBlockCommand(original, null, 0)!;
            const afterDelete = applyPatch(original, command.forward);
            expect(afterDelete).toHaveLength(0);
            const restored = applyPatch(afterDelete, command.inverse);
            expect(restored).toHaveLength(1);
            expect(restored[0].content).toBe('Parent');
            expect(restored[0].children).toHaveLength(2);
            expect(restored[0].children![0].content).toBe('Child1');
            expect(restored[0].children![1].content).toBe('Child2');
        });
    });

    describe('moveBlockCommand', () => {
        it('should create forward/inverse patches', () => {
            const command = moveBlockCommand(null, 0, null, 2);

            expect(command.forward.ops[0]).toMatchObject({
                type: 'move',
                fromParentPath: null,
                fromIndex: 0,
                toParentPath: null,
                toIndex: 2,
            });
            expect(command.inverse.ops[0]).toMatchObject({
                type: 'move',
                fromParentPath: null,
                fromIndex: 2,
                toParentPath: null,
                toIndex: 0,
            });
        });

        it('should move blocks within same parent', () => {
            const original = createDoc(createBlock('1', 'text', 'First'), createBlock('2', 'text', 'Second'));
            const command = moveBlockCommand(null, 1, null, 0);

            const moved = applyPatch(original, command.forward);
            expect(moved[0].content).toBe('Second');
            expect(moved[1].content).toBe('First');
        });

        it('should move between parents', () => {
            const original = createDoc(
                createBlock('1', 'text', 'Parent', {
                    children: [createBlock('2', 'text', 'Child1'), createBlock('3', 'text', 'Child2')],
                }),
            );

            const command = moveBlockCommand([0], 1, null, 1);
            const moved = applyPatch(original, command.forward);
            expect(moved).toHaveLength(2);
            expect(moved[0].content).toBe('Parent');
            expect(moved[0].children).toHaveLength(1);
            expect(moved[0].children![0].content).toBe('Child1');
            expect(moved[1].content).toBe('Child2');
        });

        it('should preserve subtree when moving', () => {
            const original = createDoc(
                createBlock('1', 'text', 'MovableParent', {
                    children: [createBlock('2', 'text', 'Child')],
                }),
                createBlock('3', 'text', 'Sibling'),
            );

            const command = moveBlockCommand(null, 1, null, 0);
            const moved = applyPatch(original, command.forward);
            expect(moved[0].content).toBe('Sibling');
            expect(moved[1].content).toBe('MovableParent');
            expect(moved[1].children).toHaveLength(1);
            expect(moved[1].children![0].content).toBe('Child');
        });
    });
});
