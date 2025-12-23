import { Block, BlockArray, BlockType, Path } from './types';

export function getParentArray(doc: BlockArray, path: Path | null): Block[] | null {
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
}

/*************  ✨ Windsurf Command ⭐  *************/
/**
 * Retrieves a block from the document given a path.
 * The path is an array of indices, where each index points to a block in the document.
 * If the block at the given path does not exist, returns null.
 * @param doc The document to retrieve the block from.
 * @param path The path to the block to retrieve.
 * @returns The block at the given path, or null if it does not exist.
/*******  68bb2f0f-819c-4de5-bbb0-ada3101de4be  *******/
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
 * Creates a deep clone of a block.
 * @param block The block to clone.
 * @returns A deep clone of the block.
 */
export function cloneBlock(block: Block): Block {
    return structuredClone(block);
}

/**
 * Generates a unique identifier using the crypto.randomUUID() function.
 * @returns A unique identifier as a string.
 */
export function generateId(): string {
    return crypto.randomUUID();
}
/**
 * Creates a new block with the given type and content.
 * If the type is 'todo', the block will also have a 'done' property set to false.
 * @param type The type of block to create.
 * @param content The content of the block to create.
 * @returns A new block with the given type and content.
 */
export function createBlock(type: BlockType, content: string = ''): Block {
    return {
        id: generateId(),
        type,
        content,
        ...(type === 'todo' && { done: false }),
    };
}
/**
 * Retrieves the position of a block in the document given its ID.
 * The position is returned as an object with three properties:
 * - path: The path to the block as an array of indices.
 * - parentPath: The path to the block's parent as an array of indices, or null if the block is at the root of the document.
 * - index: The index of the block in its parent's children array.
 * If the block with the given ID does not exist in the document, returns null.
 * @param doc The document to search in.
 * @param blockId The ID of the block to search for.
 * @returns The position of the block, or null if it does not exist.
 * */
export function getBlockPosition(
    doc: BlockArray,
    blockId: string,
): {
    path: Path;
    parentPath: Path | null;
    index: number;
} | null {
    function search(
        blocks: BlockArray,
        currentPath: Path = [],
    ): {
        path: Path;
        parentPath: Path | null;
        index: number;
    } | null {
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
    }
    return search(doc);
}
