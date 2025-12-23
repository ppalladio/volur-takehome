import { BlockArray, Patch, PatchOp } from './types';
import { cloneBlock, getBlockAtPath, getParentArray } from './utils';

/**
 * Apply a patch to a document (pure function, returns new doc)
 */
export function applyPatch(doc: BlockArray, patch: Patch): BlockArray {
    // Deep clone to ensure immutability
    let newDoc = structuredClone(doc);

    for (const op of patch.ops) {
        newDoc = applyOperation(newDoc, op);
    }

    return newDoc;
}

/**
 * Apply single operation
 */
function applyOperation(doc: BlockArray, op: PatchOp): BlockArray {
    const newDoc = structuredClone(doc);

    switch (op.type) {
        case 'update':
            return applyUpdate(newDoc, op);
        case 'insert':
            return applyInsert(newDoc, op);
        case 'delete':
            return applyDelete(newDoc, op);
        case 'move':
            return applyMove(newDoc, op);
        default:
            return newDoc;
    }
}

function applyUpdate(doc: BlockArray, op: Extract<PatchOp, { type: 'update' }>): BlockArray {
    const block = getBlockAtPath(doc, op.path);
    if (!block) {
        console.warn('Update failed: block not found at path', op.path);
        return doc;
    }

    // @ts-expect-error - dynamic field access
    block[op.field] = op.value;
    return doc;
}

function applyInsert(doc: BlockArray, op: Extract<PatchOp, { type: 'insert' }>): BlockArray {
    const parent = getParentArray(doc, op.parentPath);
    if (!parent) {
        console.warn('Insert failed: parent not found');
        return doc;
    }

    parent.splice(op.index, 0, cloneBlock(op.block));
    return doc;
}

function applyDelete(doc: BlockArray, op: Extract<PatchOp, { type: 'delete' }>): BlockArray {
    const parent = getParentArray(doc, op.parentPath);
    if (!parent) {
        console.warn('Delete failed: parent not found');
        return doc;
    }

    parent.splice(op.index, 1);
    return doc;
}

function applyMove(doc: BlockArray, op: Extract<PatchOp, { type: 'move' }>): BlockArray {
    const fromParent = getParentArray(doc, op.fromParentPath);
    const toParent = getParentArray(doc, op.toParentPath);

    if (!fromParent || !toParent) {
        console.warn('Move failed: parent not found');
        return doc;
    }

    // Remove from source
    const [block] = fromParent.splice(op.fromIndex, 1);

    // Adjust target index if moving within same parent and moving forward
    let adjustedToIndex = op.toIndex;
    if (JSON.stringify(op.fromParentPath) === JSON.stringify(op.toParentPath) && op.fromIndex < op.toIndex) {
        adjustedToIndex--;
    }

    // Insert at destination
    toParent.splice(adjustedToIndex, 0, block);

    return doc;
}
