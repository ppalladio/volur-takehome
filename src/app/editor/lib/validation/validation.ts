import { ZodError } from 'zod';
import { Block, BlockArray, BlockArraySchema, CursorPosition, CursorPositionSchema, HistoryNode, HistoryNodesSchema, Path } from '../types';
import { findBlockById } from '../utils';

export type ValidationError = {
    type: 'duplicate_id' | 'invalid_block' | 'invalid_history' | 'invalid_cursor' | 'orphaned_parent' | 'schema_error';
    message: string;
    details?: object;
};

export type ValidationResult = {
    isValid: boolean;
    errors: ValidationError[];
};

/**
 * Convert Zod error to validation errors
 */
const zodErrorToValidationErrors = (zodError: ZodError, errorType: ValidationError['type']): ValidationError[] => {
    return zodError.issues.map((issue) => ({
        type: errorType,
        message: issue.message,
        details: {
            ...issue,
            path: issue.path,
            code: issue.code,
        },
    }));
};

/**
 * Validate document integrity using Zod + custom checks
 */
export const validateDocument = (doc: BlockArray): ValidationResult => {
    const errors: ValidationError[] = [];

    // Schema validation
    const schemaResult = BlockArraySchema.safeParse(doc);
    if (!schemaResult.success) {
        errors.push(...zodErrorToValidationErrors(schemaResult.error, 'schema_error'));
        // Return early if schema is invalid
        return { isValid: false, errors };
    }

    // Custom validations
    const seenIds = new Set<string>();

    function validateBlock(block: Block, path: Path): void {
        // Check for duplicate IDs
        if (seenIds.has(block.id)) {
            errors.push({
                type: 'duplicate_id',
                message: `Duplicate block ID found: ${block.id}`,
                details: { blockId: block.id, path },
            });
        }
        seenIds.add(block.id);

        // Recursively validate children
        if (block.children) {
            block.children.forEach((child, index) => {
                validateBlock(child, [...path, index]);
            });
        }
    }

    doc.forEach((block, index) => validateBlock(block, [index]));

    return {
        isValid: errors.length === 0,
        errors,
    };
};

/**
 * Validate history graph integrity using Zod + custom checks
 */
export const validateHistory = (historyNodes: HistoryNode[], currentIndex: number): ValidationResult => {
    const errors: ValidationError[] = [];

    // Schema validation
    const schemaResult = HistoryNodesSchema.safeParse(historyNodes);
    if (!schemaResult.success) {
        errors.push(...zodErrorToValidationErrors(schemaResult.error, 'schema_error'));
        return { isValid: false, errors };
    }

    // Validate current index
    if (currentIndex < -1 || currentIndex >= historyNodes.length) {
        errors.push({
            type: 'invalid_history',
            message: `Invalid current index: ${currentIndex}`,
            details: { currentIndex, historyLength: historyNodes.length },
        });
    }

    historyNodes.forEach((node, index) => {
        if (node.parentIndex !== null) {
            if (node.parentIndex < 0 || node.parentIndex >= historyNodes.length) {
                errors.push({
                    type: 'invalid_history',
                    message: `Invalid parent index: ${node.parentIndex}`,
                    details: { nodeIndex: index, parentIndex: node.parentIndex },
                });
            } else if (node.parentIndex >= index) {
                errors.push({
                    type: 'invalid_history',
                    message: `Parent index must be less than current index (no cycles)`,
                    details: { nodeIndex: index, parentIndex: node.parentIndex },
                });
            }
        }

        node.branches.forEach((branchIndex) => {
            if (branchIndex < 0 || branchIndex >= historyNodes.length) {
                errors.push({
                    type: 'invalid_history',
                    message: `Invalid branch index: ${branchIndex}`,
                    details: { nodeIndex: index, branchIndex },
                });
            }
        });

        if (node.timestamp > Date.now() + 60000) {
            // Allow 1 minute in future for clock skew
            errors.push({
                type: 'invalid_history',
                message: `Timestamp is too far in the future: ${node.timestamp}`,
                details: { nodeIndex: index, timestamp: node.timestamp },
            });
        }
    });

    // Check for orphaned branches (branches that don't point back to parent)
    historyNodes.forEach((node, index) => {
        node.branches.forEach((branchIndex) => {
            const childNode = historyNodes[branchIndex];
            if (childNode && childNode.parentIndex !== index) {
                errors.push({
                    type: 'orphaned_parent',
                    message: `Branch ${branchIndex} doesn't point back to parent ${index}`,
                    details: { parentIndex: index, branchIndex, childParentIndex: childNode.parentIndex },
                });
            }
        });
    });

    return {
        isValid: errors.length === 0,
        errors,
    };
};

/**
 * Validate cursor position using Zod + custom checks
 */
export const validateCursor = (cursor: CursorPosition, doc: BlockArray): ValidationResult => {
    const errors: ValidationError[] = [];

    if (cursor === null) {
        return { isValid: true, errors: [] };
    }

    // Schema validation
    const schemaResult = CursorPositionSchema.safeParse(cursor);
    if (!schemaResult.success) {
        errors.push(...zodErrorToValidationErrors(schemaResult.error, 'schema_error'));
        return { isValid: false, errors };
    }

    // Find block with cursor's blockId
    const blockFound = findBlockById(doc, cursor.blockId);

    if (blockFound === null) {
        errors.push({
            type: 'invalid_cursor',
            message: `Cursor references non-existent block: ${cursor.blockId}`,
            details: { cursor },
        });
    } else {
        // Validate selection ranges are within content length
        const contentLength = (blockFound as Block).content.length ?? 0;
        if (cursor.selectionStart > contentLength) {
            errors.push({
                type: 'invalid_cursor',
                message: `Cursor selectionStart (${cursor.selectionStart}) exceeds content length (${contentLength})`,
                details: { cursor, contentLength },
            });
        }
        if (cursor.selectionEnd > contentLength) {
            errors.push({
                type: 'invalid_cursor',
                message: `Cursor selectionEnd (${cursor.selectionEnd}) exceeds content length (${contentLength})`,
                details: { cursor, contentLength },
            });
        }
        if (cursor.selectionStart > cursor.selectionEnd) {
            errors.push({
                type: 'invalid_cursor',
                message: `Cursor selectionStart cannot be greater than selectionEnd`,
                details: { cursor },
            });
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

/**
 * Validate entire editor state
 */
export const validateEditorState = (doc: BlockArray, historyNodes: HistoryNode[], currentIndex: number, cursor: CursorPosition): ValidationResult => {
    const errors: ValidationError[] = [];

    // Validate document
    const docResult = validateDocument(doc);
    errors.push(...docResult.errors);

    // Validate history
    const historyResult = validateHistory(historyNodes, currentIndex);
    errors.push(...historyResult.errors);

    // Validate cursor
    const cursorResult = validateCursor(cursor, doc);
    errors.push(...cursorResult.errors);

    return {
        isValid: errors.length === 0,
        errors,
    };
};
