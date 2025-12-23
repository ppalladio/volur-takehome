import { BlockArray, BlockType, Command, Path } from './types';
import { createBlock, getBlockAtPath, getParentArray } from './utils';

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

export function toggleTodoCommand(doc: BlockArray, path: Path): Command | null {
    const block = getBlockAtPath(doc, path);
    if (block?.type !== 'todo') return null;

    const currentDone = block.done ?? false;
    const newDone = !currentDone;
    return {
        forward: {
            ops: [
                {
                    type: 'update',
                    path,
                    field: 'done',
                    value: newDone,
                    oldValue: currentDone,
                },
            ],
        },
        inverse: {
            ops: [
                {
                    type: 'update',
                    path,
                    field: 'done',
                    value: currentDone,
                    oldValue: newDone,
                },
            ],
        },
    };
}

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
export function deleteBlockCommand(doc: BlockArray, parentPath: Path | null, index: number): Command | null {
    const parent = getParentArray(doc, parentPath);
    if (!parent?.[index]) return null;

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
