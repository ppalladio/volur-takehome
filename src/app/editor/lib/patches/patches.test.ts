import { describe, expect, it } from 'vitest';
import { Block, BlockArray, Patch, PatchOp, Path } from '../types';
import { applyPatch } from './patches';

const createBlock = (id: string, type: 'text' | 'todo', content: string, options?: Partial<Block>): Block => ({
    id,
    type,
    content,
    ...options,
});

const createDoc = (...blocks: Block[]): BlockArray => blocks;

const createPatch = (...ops: PatchOp[]): Patch => ({ ops });

const updateContentOp = (path: Path, value: string, oldValue: string): PatchOp => ({
    type: 'update',
    path,
    field: 'content',
    value,
    oldValue,
});

const updateDoneOp = (path: Path, value: boolean, oldValue: boolean): PatchOp => ({
    type: 'update',
    path,
    field: 'done',
    value,
    oldValue,
});

const insertOp = (parentPath: number[] | null, index: number, block: Block): PatchOp => ({
    type: 'insert',
    parentPath,
    index,
    block,
});

const deleteOp = (parentPath: number[] | null, index: number, deleted: Block): PatchOp => ({
    type: 'delete',
    parentPath,
    index,
    deleted,
});

const moveOp = (fromParentPath: number[] | null, fromIndex: number, toParentPath: number[] | null, toIndex: number): PatchOp => ({
    type: 'move',
    fromParentPath,
    fromIndex,
    toParentPath,
    toIndex,
});

describe('patches ', () => {
    it('should update block content', () => {
        const doc = createDoc(createBlock('1', 'text', 'Hello'), createBlock('2', 'text', 'World'));
        const patch = createPatch(updateContentOp([0], 'Modified', 'Hello'));

        const result = applyPatch(doc, patch);

        expect(result[0].content).toBe('Modified');
        expect(result[1].content).toBe('World');
        expect(doc[0].content).toBe('Hello');
    });

    it('should update nested block content', () => {
        const doc = createDoc(
            createBlock('1', 'text', 'Parent', {
                children: [createBlock('2', 'text', 'Child'), createBlock('3', 'text', 'Sibling')],
            }),
        );
        const patch = createPatch(updateContentOp([0, 0], 'Updated Child', 'Child'));

        const result = applyPatch(doc, patch);

        expect(result[0].children![0].content).toBe('Updated Child');
        expect(result[0].children![1].content).toBe('Sibling');
    });

    it('should toggle todo done status', () => {
        const doc = createDoc(createBlock('1', 'todo', 'Task', { done: false }));
        const patch = createPatch(updateDoneOp([0], true, false));

        const result = applyPatch(doc, patch);

        expect(result[0].done).toBe(true);
    });

    it('should insert block at root level', () => {
        const doc = createDoc(createBlock('1', 'text', 'First'), createBlock('2', 'text', 'Third'));
        const newBlock = createBlock('3', 'text', 'Second');
        const patch = createPatch(insertOp(null, 1, newBlock));

        const result = applyPatch(doc, patch);

        expect(result).toHaveLength(3);
        expect(result[1].content).toBe('Second');
        expect(result[0].content).toBe('First');
        expect(result[2].content).toBe('Third');
    });

    it('should insert block as child', () => {
        const doc = createDoc(
            createBlock('1', 'text', 'Parent', {
                children: [createBlock('2', 'text', 'Child1')],
            }),
        );
        const newBlock = createBlock('3', 'text', 'Child2');
        const patch = createPatch(insertOp([0], 1, newBlock));

        const result = applyPatch(doc, patch);

        expect(result[0].children).toHaveLength(2);
        expect(result[0].children![1].content).toBe('Child2');
    });

    it('should insert todo block with done status', () => {
        const doc = createDoc();
        const newBlock = createBlock('1', 'todo', 'Task', { done: false });
        const patch = createPatch(insertOp(null, 0, newBlock));

        const result = applyPatch(doc, patch);

        expect(result).toHaveLength(1);
        expect(result[0].type).toBe('todo');
        expect(result[0].done).toBe(false);
    });

    it('should delete block at root level', () => {
        const doc = createDoc(createBlock('1', 'text', 'First'), createBlock('2', 'text', 'Second'), createBlock('3', 'text', 'Third'));
        const patch = createPatch(deleteOp(null, 1, doc[1]));

        const result = applyPatch(doc, patch);

        expect(result).toHaveLength(2);
        expect(result[0].content).toBe('First');
        expect(result[1].content).toBe('Third');
    });

    it('should delete block with children (entire subtree)', () => {
        const doc = createDoc(
            createBlock('1', 'text', 'Parent', {
                children: [createBlock('2', 'text', 'Child1'), createBlock('3', 'text', 'Child2')],
            }),
            createBlock('4', 'text', 'Sibling'),
        );
        const patch = createPatch(deleteOp(null, 0, doc[0]));

        const result = applyPatch(doc, patch);

        expect(result).toHaveLength(1);
        expect(result[0].content).toBe('Sibling');
    });

    it('should delete nested child block', () => {
        const doc = createDoc(
            createBlock('1', 'text', 'Parent', {
                children: [createBlock('2', 'text', 'Child1'), createBlock('3', 'text', 'Child2')],
            }),
        );
        const patch = createPatch(deleteOp([0], 0, doc[0].children![0]));

        const result = applyPatch(doc, patch);

        expect(result[0].children).toHaveLength(1);
        expect(result[0].children![0].content).toBe('Child2');
    });

    it('should move block within same parent (down)', () => {
        const doc = createDoc(createBlock('1', 'text', 'First'), createBlock('2', 'text', 'Second'), createBlock('3', 'text', 'Third'));
        const patch = createPatch(moveOp(null, 0, null, 2));

        const result = applyPatch(doc, patch);

        expect(result[0].content).toBe('Second');
        expect(result[1].content).toBe('First');
        expect(result[2].content).toBe('Third');
    });

    it('should move block within same parent (up)', () => {
        const doc = createDoc(createBlock('1', 'text', 'First'), createBlock('2', 'text', 'Second'), createBlock('3', 'text', 'Third'));
        const patch = createPatch(moveOp(null, 2, null, 0));

        const result = applyPatch(doc, patch);

        expect(result[0].content).toBe('Third');
        expect(result[1].content).toBe('First');
        expect(result[2].content).toBe('Second');
    });

    it('should move block to different parent', () => {
        const doc = createDoc(
            createBlock('1', 'text', 'Parent', {
                children: [createBlock('2', 'text', 'Child')],
            }),
            createBlock('3', 'text', 'Root'),
        );
        const patch = createPatch(moveOp(null, 1, [0], 1));

        const result = applyPatch(doc, patch);

        expect(result).toHaveLength(1);
        expect(result[0].content).toBe('Parent');
        expect(result[0].children).toHaveLength(2);
        expect(result[0].children![0].content).toBe('Child');
        expect(result[0].children![1].content).toBe('Root');
    });

    it('should move block with children (preserving subtree)', () => {
        const doc = createDoc(
            createBlock('1', 'text', 'Parent', {
                children: [createBlock('2', 'text', 'Child1'), createBlock('3', 'text', 'Child2')],
            }),
            createBlock('4', 'text', 'Sibling'),
        );
        const patch = createPatch(moveOp(null, 0, null, 2));

        const result = applyPatch(doc, patch);

        expect(result[0].content).toBe('Sibling');
        expect(result[1].content).toBe('Parent');
        expect(result[1].children).toHaveLength(2);
    });

    it('should apply multiple updates in sequence', () => {
        const doc = createDoc(createBlock('1', 'text', 'First'), createBlock('2', 'text', 'Second'));
        const patch = createPatch(updateContentOp([0], 'Updated First', 'First'), updateContentOp([1], 'Updated Second', 'Second'));

        const result = applyPatch(doc, patch);

        expect(result[0].content).toBe('Updated First');
        expect(result[1].content).toBe('Updated Second');
    });

    it('should apply insert then update', () => {
        const doc = createDoc(createBlock('1', 'text', 'First'));
        const newBlock = createBlock('2', 'text', 'Second');
        const patch = createPatch(insertOp(null, 1, newBlock), updateContentOp([1], 'Modified Second', 'Second'));

        const result = applyPatch(doc, patch);

        expect(result).toHaveLength(2);
        expect(result[1].content).toBe('Modified Second');
    });
    it('should not modify original document', () => {
        const doc = createDoc(createBlock('1', 'text', 'Original'));
        const patch = createPatch(updateContentOp([0], 'Modified', 'Original'));

        const result = applyPatch(doc, patch);

        expect(doc[0].content).toBe('Original');
        expect(result[0].content).toBe('Modified');
        expect(result).not.toBe(doc);
    });
});
