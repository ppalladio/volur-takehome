import { Block, Path, pathEquals } from '@/editor/lib';
import { useCallback, useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';

type DropPosition = 'before' | 'after' | 'child';

type DragItem = {
    type: string;
    path: Path;
    parentPath: Path | null;
    index: number;
    blockId: string;
};

export type UseBlockDragDropReturn = {
    isDragging: boolean;
    isOver: boolean;
    canDrop: boolean;
    dropPosition: DropPosition | null;
    setRefs: (element: HTMLDivElement | null) => void;
    getDropIndicatorClasses: () => string;
    opacity: number;
};

/**
 * Custom hook for managing block drag and drop functionality.
 *
 * Handles:
 * - Drag initiation
 * - Drop validation (prevent self-drop, descendant drop)
 * - Drop position calculation (before, after, child)
 * - Visual feedback (drop indicators, opacity)
 * - Ref composition for react-dnd
 *
 * @param block - The block being dragged/dropped
 * @param path - Path to the block in the document
 * @param index - Index of the block in its parent
 * @param parentPath - Path to the parent block
 * @param moveBlock - Function to move blocks
 * @returns Drag and drop state and handlers
 */
export const useBlockDragDrop = (
    block: Block,
    path: Path,
    index: number,
    parentPath: Path | null,
    moveBlock: (fromParentPath: Path | null, fromIndex: number, toParentPath: Path | null, toIndex: number) => void,
): UseBlockDragDropReturn => {
    const [dropPosition, setDropPosition] = useState<DropPosition | null>(null);
    const elementRef = useRef<HTMLDivElement>(null);

    // Drag configuration
    const [{ isDragging }, drag, preview] = useDrag({
        type: 'BLOCK',
        item: (): DragItem => ({
            type: 'BLOCK',
            path,
            parentPath,
            index,
            blockId: block.id,
        }),
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    // Drop configuration
    const [{ isOver, canDrop }, drop] = useDrop({
        accept: 'BLOCK',
        canDrop: (item: DragItem) => {
            // Can't drop on itself
            if (item.blockId === block.id) return false;

            // Can't drop a parent on its descendant
            if (path.length > item.path.length) {
                const isDescendant = item.path.every((p, i) => p === path[i]);
                if (isDescendant) return false;
            }

            return true;
        },
        hover: (_item: DragItem, monitor) => {
            if (!elementRef.current) return;

            const hoverBoundingRect = elementRef.current.getBoundingClientRect();
            const clientOffset = monitor.getClientOffset();

            if (!clientOffset) return;

            // Calculate drop position based on mouse Y position
            const hoverClientY = clientOffset.y - hoverBoundingRect.top;
            const hoverHeight = hoverBoundingRect.height;

            // Divide the element into three zones:
            // - Top 25%: drop before
            // - Middle 50%: drop as child
            // - Bottom 25%: drop after
            if (hoverClientY < hoverHeight * 0.25) {
                setDropPosition('before');
            } else if (hoverClientY > hoverHeight * 0.75) {
                setDropPosition('after');
            } else {
                setDropPosition('child');
            }
        },
        drop: (item: DragItem, monitor) => {
            if (!monitor.canDrop()) return;

            let toParentPath: Path | null;
            let toIndex: number;

            // Calculate target position based on drop position
            if (dropPosition === 'before') {
                toParentPath = parentPath;
                toIndex = index;
            } else if (dropPosition === 'after') {
                toParentPath = parentPath;
                toIndex = index + 1;
            } else {
                // child
                toParentPath = path;
                toIndex = block.children?.length ?? 0;
            }

            // Only move if position actually changed
            if (!pathEquals(item.parentPath, toParentPath) || item.index !== toIndex) {
                moveBlock(item.parentPath, item.index, toParentPath, toIndex);
            }

            setDropPosition(null);
        },
        collect: (monitor) => ({
            isOver: monitor.isOver({ shallow: true }),
            canDrop: monitor.canDrop(),
        }),
    });

    // Combine drag and drop refs - react-dnd connectors are stable
    const combinedRef = useCallback(
        (element: HTMLDivElement | null) => {
            elementRef.current = element;
            const dropElement = drop(element);
            drag(element);
            preview(dropElement);
        },
        [drag, drop, preview],
    );

    // Get CSS classes for drop indicator
    const getDropIndicatorClasses = useCallback(() => {
        if (!isOver || !canDrop) return '';

        if (dropPosition === 'before') {
            return 'border-t-2 border-blue-500';
        } else if (dropPosition === 'after') {
            return 'border-b-2 border-blue-500';
        } else {
            return 'ring-2 ring-blue-500 bg-blue-50';
        }
    }, [isOver, canDrop, dropPosition]);

    const opacity = isDragging ? 0.4 : 1;

    return {
        isDragging,
        isOver,
        canDrop,
        dropPosition,
        setRefs: combinedRef,
        getDropIndicatorClasses,
        opacity,
    };
};
