import { Block, BlockArray, BlockType, Command, Path } from './types';

export const getParentArray = (doc: BlockArray, path: Path | null): Block[] | null => {
    if (path === null || path.length === 0) {
        return doc;
    }

    let current: Block[] = doc;

    for (let i = 0; i < path.length; i++) {
        const index = path[i];
        if (!current[index]) return null;

        if (i === path.length - 1) {
            current[index].children ??= [];
            return current[index].children;
        }

        if (!current[index].children) {
            return null;
        }
        current = current[index].children;
    }

    return null;
};

export const getBlockAtPath = (doc: BlockArray, path: Path): Block | null => {
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
};

export const cloneBlock = (block: Block): Block => {
    return structuredClone(block);
};

export const generateId = (): string => {
    return crypto.randomUUID();
};

export const createBlock = (type: BlockType, content: string = '', autoFocus: boolean = false): Block => {
    return {
        id: generateId(),
        type,
        content,
        ...(type === 'todo' && { done: false }),
        ...(autoFocus && { autoFocus: true }),
    };
};

export const getBlockPosition = (
    doc: BlockArray,
    blockId: string,
): {
    path: Path;
    parentPath: Path | null;
    index: number;
} | null => {
    const search = (
        blocks: BlockArray,
        currentPath: Path = [],
    ): {
        path: Path;
        parentPath: Path | null;
        index: number;
    } | null => {
        for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i];
            if (block.id === blockId) {
                return {
                    path: [...currentPath, i],
                    parentPath: currentPath.length > 0 ? currentPath : null,
                    index: i,
                };
            }
            if (block.children) {
                const found = search(block.children, [...currentPath, i]);
                if (found) return found;
            }
        }
        return null;
    };
    return search(doc);
};

/**
 * Get human-readable time ago string from timestamp
 */
export const getTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
};

/**
 * Get a preview/description of what a command does
 */
export const getCommandPreview = (command: Command): string => {
    const op = command.forward.ops[0];

    if (!op) return 'Unknown';

    switch (op.type) {
        case 'update':
            if (op.field === 'content') {
                const preview = op.value.slice(0, 30);
                return `Edit: "${preview}${op.value.length > 30 ? '...' : ''}"`;
            }
            if (op.field === 'done') return op.value ? 'Complete todo' : 'Uncomplete todo';
            return 'Update';
        case 'insert':
            return `Insert ${op.block.type}`;
        case 'delete':
            return `Delete ${op.deleted.type}`;
        case 'move':
            return 'Move block';
        default:
            return 'Unknown';
    }
};

/**
 * Compare two paths for equality
 */
export const pathEquals = (path1: Path | null, path2: Path | null): boolean => {
    if (path1 === null && path2 === null) return true;
    if (path1 === null || path2 === null) return false;
    if (path1.length !== path2.length) return false;
    return path1.every((val, idx) => val === path2[idx]);
};

/**
 * Find a block by ID in a block tree
 */
export const findBlockById = (blocks: BlockArray, blockId: string): Block | null => {
    for (const block of blocks) {
        if (block.id === blockId) {
            return block;
        }
        if (block.children) {
            const found = findBlockById(block.children, blockId);
            if (found) return found;
        }
    }
    return null;
};

/**
 * Check if a block is a todo type
 */
export const isTodoBlock = (block: Block): boolean => {
    return block.type === 'todo';
};

/**
 * Strip transient flags from a block
 */
export const stripTransientFlags = (block: Block): Block => {
    const { autoFocus: _autoFocus, ...cleanBlock } = block;
    return cleanBlock as Block;
};

/**
 * Strip transient flags from a block array recursively
 */
export const stripTransientFlagsFromBlocks = (blocks: BlockArray): BlockArray => {
    return blocks.map((block) => {
        const cleanBlock = stripTransientFlags(block);
        return {
            ...cleanBlock,
            children: block.children ? stripTransientFlagsFromBlocks(block.children) : undefined,
        } as Block;
    });
};
