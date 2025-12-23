import { BlockArray, BlockType, Command, Path } from './types';
import { createBlock, getBlockAtPath, getParentArray } from './utils';

/**
 * Update block content
 */
export function updateContentCommand(doc: BlockArray, path: Path, newContent: string): Command | null {
    const block = getBlockAtPath(doc, path);
    if (!block) return null;

    return {
        forward: {
            ops: [
                {
                    type: 'update',
                    path,
                    field: 'content',
                    value: newContent,
                    oldValue: block.content,
                },
            ],
        },
        inverse: {
            ops: [
                {
                    type: 'update',
                    path,
                    field: 'content',
                    value: block.content,
                    oldValue: newContent,
                },
            ],
        },
    };
}

/**
 * Toggle todo done state
 */
export function toggleTodoCommand(doc: BlockArray, path: Path): Command | null {
    const block = getBlockAtPath(doc, path);
    if (!block || block.type !== 'todo') return null;

    const currentDone = block.done ?? false;
    const newDone = !currentDone;

    return {
        forward: {
            ops: [
                {
                    type: 'update',
                    path,
                    field: 'done',
                    value: String(newDone),
                    oldValue: String(currentDone),
                },
            ],
        },
        inverse: {
            ops: [
                {
                    type: 'update',
                    path,
                    field: 'done',
                    value: String(currentDone),
                    oldValue: String(newDone),
                },
            ],
        },
    };
}

/**
 * Insert new block as sibling
 */
export function insertBlockCommand(parentPath: Path | null, index: number, type: BlockType): Command {
    const newBlock = createBlock(type);

    return {
        forward: {
            ops: [{ type: 'insert', parentPath, index, block: newBlock }],
        },
        inverse: {
            ops: [
                {
                    type: 'delete',
                    parentPath,
                    index,
                    deleted: newBlock,
                },
            ],
        },
    };
}

/**
 * Delete block and its subtree
 */
export function deleteBlockCommand(doc: BlockArray, parentPath: Path | null, index: number): Command | null {
    const parent = getParentArray(doc, parentPath);
    if (!parent || !parent[index]) return null;

    const deletedBlock = parent[index];

    return {
        forward: {
            ops: [
                {
                    type: 'delete',
                    parentPath,
                    index,
                    deleted: deletedBlock,
                },
            ],
        },
        inverse: {
            ops: [
                {
                    type: 'insert',
                    parentPath,
                    index,
                    block: deletedBlock,
                },
            ],
        },
    };
}

/**
 * Move block to new position
 */
export function moveBlockCommand(fromParentPath: Path | null, fromIndex: number, toParentPath: Path | null, toIndex: number): Command {
    return {
        forward: {
            ops: [
                {
                    type: 'move',
                    fromParentPath,
                    fromIndex,
                    toParentPath,
                    toIndex,
                },
            ],
        },
        inverse: {
            ops: [
                {
                    type: 'move',
                    fromParentPath: toParentPath,
                    fromIndex: toIndex,
                    toParentPath: fromParentPath,
                    toIndex: fromIndex,
                },
            ],
        },
    };
}
