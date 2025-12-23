import { BlockArray, Patch, PatchOp } from './types';
import { getBlockAtPath, getParentArray } from './utils';

function applyUpdateOp(doc: BlockArray, op: Extract<PatchOp, { type: 'update' }>) {
    const block = getBlockAtPath(doc, op.path);
    if (block) {
        if (op.field === 'content') {
            block.content = op.value;
        } else if (op.field === 'done') {
            block.done = op.value;
        }
    }
}

function applyInsertOp(doc: BlockArray, op: Extract<PatchOp, { type: 'insert' }>) {
    const parent = getParentArray(doc, op.parentPath);
    if (parent) {
        parent.splice(op.index, 0, structuredClone(op.block));
    }
}

function applyDeleteOp(doc: BlockArray, op: Extract<PatchOp, { type: 'delete' }>) {
    const parent = getParentArray(doc, op.parentPath);
    if (parent) {
        parent.splice(op.index, 1);
    }
}

function applyMoveOp(doc: BlockArray, op: Extract<PatchOp, { type: 'move' }>) {
    const fromParent = getParentArray(doc, op.fromParentPath);
    if (!fromParent?.[op.fromIndex]) return;

    const blockToMove = fromParent[op.fromIndex];
    fromParent.splice(op.fromIndex, 1);

    let adjustedToIndex = op.toIndex;
    const isSameParent = JSON.stringify(op.fromParentPath) === JSON.stringify(op.toParentPath);
    if (isSameParent && op.fromIndex < op.toIndex) {
        adjustedToIndex--;
    }

    const toParent = getParentArray(doc, op.toParentPath);
    if (toParent) {
        toParent.splice(adjustedToIndex, 0, blockToMove);
    }
}

export function applyPatch(doc: BlockArray, patch: Patch): BlockArray {
    const result = structuredClone(doc);

    for (const op of patch.ops) {
        switch (op.type) {
            case 'update':
                applyUpdateOp(result, op);
                break;
            case 'insert':
                applyInsertOp(result, op);
                break;
            case 'delete':
                applyDeleteOp(result, op);
                break;
            case 'move':
                applyMoveOp(result, op);
                break;
        }
    }

    return result;
}
