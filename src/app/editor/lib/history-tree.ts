import { Command, HistoryNode } from './types';

/**
 * Get indices of all redo branches available from the current position.
 * If currentIndex is -1 (initial state), returns all root nodes.
 * Otherwise, returns the branches of the current node.
 */
export const getRedoBranches = (historyNodes: HistoryNode[], currentIndex: number): number[] => {
    if (currentIndex >= 0) {
        // We're at a specific node - return its branches
        const currentNode = historyNodes[currentIndex];
        return currentNode ? currentNode.branches : [];
    } else {
        // We're at the initial state (before any history) - return all root nodes
        return getRootNodeIndices(historyNodes);
    }
};

/**
 * Get indices of all root nodes (nodes with parentIndex === null).
 */
export const getRootNodeIndices = (historyNodes: HistoryNode[]): number[] => {
    return historyNodes.map((node, idx) => (node.parentIndex === null ? idx : -1)).filter((idx) => idx !== -1);
};

/**
 * Check if undo is available.
 * Undo is available when currentIndex >= 0 (we have a node to undo from).
 */
export const canUndo = (currentIndex: number): boolean => {
    return currentIndex >= 0;
};

/**
 * Check if redo is available.
 * Redo is available when there are redo branches from the current position.
 */
export const canRedo = (historyNodes: HistoryNode[], currentIndex: number): boolean => {
    const branches = getRedoBranches(historyNodes, currentIndex);
    return branches.length > 0;
};

/**
 * Add a new history node to the tree.
 * Creates a new node as a child of the current node (or as a root if currentIndex is -1).
 * Updates the parent node's branches array to include the new node.
 *
 * Returns the updated nodes array and the index of the new node.
 */
export const addHistoryNode = (historyNodes: HistoryNode[], currentIndex: number, command: Command): { nodes: HistoryNode[]; newIndex: number } => {
    // Create new history node
    const newNode: HistoryNode = {
        command,
        parentIndex: currentIndex >= 0 ? currentIndex : null,
        branches: [],
        timestamp: Date.now(),
    };

    // Clone the nodes array
    const updatedNodes = [...historyNodes];

    // If we have a parent, add this new node to its branches
    if (currentIndex >= 0) {
        updatedNodes[currentIndex] = {
            ...updatedNodes[currentIndex],
            branches: [...updatedNodes[currentIndex].branches, updatedNodes.length],
        };
    }

    // Add the new node
    updatedNodes.push(newNode);
    const newIndex = updatedNodes.length - 1;

    return { nodes: updatedNodes, newIndex };
};

/**
 * Get the parent index for undo operation.
 * Returns the parent index of the current node, or -1 if at a root node.
 */
export const getUndoTargetIndex = (historyNodes: HistoryNode[], currentIndex: number): number => {
    if (currentIndex < 0) return -1;
    const currentNode = historyNodes[currentIndex];
    return currentNode ? currentNode.parentIndex ?? -1 : -1;
};

/**
 * Get the target index for redo operation.
 * If nodeIndex is provided, uses that; otherwise uses the last branch (most recent).
 * Returns -1 if no valid redo target exists.
 */
export const getRedoTargetIndex = (historyNodes: HistoryNode[], currentIndex: number, nodeIndex?: number): number => {
    const branchIndices = getRedoBranches(historyNodes, currentIndex);

    if (branchIndices.length === 0) return -1;

    // If nodeIndex provided and valid, use it
    if (nodeIndex !== undefined && historyNodes[nodeIndex]) {
        return nodeIndex;
    }

    // Otherwise use last branch (most recent)
    const targetIndex = branchIndices.at(-1) ?? -1;
    return historyNodes[targetIndex] ? targetIndex : -1;
};
