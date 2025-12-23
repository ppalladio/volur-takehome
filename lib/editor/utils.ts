import { Block, BlockArray, BlockType, Path } from './types';

/**
 * Get the array containing blocks at the given path
 * null/empty path = root document array
 */
export function getParentArray(doc: BlockArray, path: Path | null): Block[] | null {
    if (path === null || path.length === 0) {
        return doc;
    }

    let current: Block[] = doc;

    for (let i = 0; i < path.length; i++) {
        const index = path[i];
        if (!current[index]) return null;

        if (i === path.length - 1) {
            // Last index points to the parent block whose children we want
            if (!current[index].children) {
                current[index].children = [];
            }
            return current[index].children;
        }

        if (!current[index].children) {
            return null;
        }
        current = current[index].children;
    }

    return null;
}

/**
 * Get block at specific path
 */
export function getBlockAtPath(doc: BlockArray, path: Path): Block | null {
    if (path.length === 0) return null;

    let current: Block[] = doc;

    for (let i = 0; i < path.length; i++) {
        const index = path[i];
        if (!current[index]) return null;

        if (i === path.length - 1) {
            return current[index];
        }

        if (!current[index].children) {
            return null;
        }
        current = current[index].children;
    }

    return null;
}

/**
 * Deep clone a block (for storing in patches)
 */
export function cloneBlock(block: Block): Block {
    return structuredClone(block);
}

/**
 * Generate unique ID
 */
export function generateId(): string {
    return crypto.randomUUID();
}

/**
 * Create new block
 */
export function createBlock(type: BlockType, content: string = ''): Block {
    return {
        id: generateId(),
        type,
        content,
        ...(type === 'todo' && { done: false }),
    };
}
