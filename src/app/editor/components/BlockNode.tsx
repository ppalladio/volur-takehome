'use client';

import {
    Button,
    Checkbox,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    Input,
} from '@/components';

import { useEditor } from '@/hooks';
import { Block, Path } from '@/lib/editor/types';
import { FileText, GripVertical, MoreVertical } from 'lucide-react';
import { useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import BlockList from './BlockList';

type BlockNodeProps = Readonly<{
    block: Block;
    path: Path;
    index: number;
    parentPath: Path | null;
}>;

type DragItem = {
    type: string;
    path: Path;
    parentPath: Path | null;
    index: number;
    blockId: string;
};

type DropPosition = 'before' | 'after' | 'child';

export default function BlockNode({ block, path, index, parentPath }: BlockNodeProps) {
    const { updateContent, toggleTodo, deleteBlock, insertBlock, moveBlock } = useEditor();
    const [isEditing, setIsEditing] = useState(false);
    const [dropPosition, setDropPosition] = useState<DropPosition | null>(null);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const elementRef = useRef<HTMLDivElement>(null);

    const hasChildren = block.children && block.children.length > 0;

    // Drag and drop
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

    const [{ isOver, canDrop }, drop] = useDrop({
        accept: 'BLOCK',
        canDrop: (item: DragItem) => {
            // Can't drop on itself
            if (item.blockId === block.id) return false;
            // Can't drop parent into its own child
            if (path.length > item.path.length) {
                const isDescendant = item.path.every((p, i) => p === path[i]);
                if (isDescendant) return false;
            }
            return true;
        },
        hover: (item: DragItem, monitor) => {
            if (!elementRef.current) return;

            const hoverBoundingRect = elementRef.current.getBoundingClientRect();
            const clientOffset = monitor.getClientOffset();

            if (!clientOffset) return;

            const hoverClientY = clientOffset.y - hoverBoundingRect.top;
            const hoverHeight = hoverBoundingRect.height;

            // Determine drop position based on mouse position
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

            if (dropPosition === 'before') {
                // Insert before this block (as sibling)
                toParentPath = parentPath;
                toIndex = index;
            } else if (dropPosition === 'after') {
                // Insert after this block (as sibling)
                toParentPath = parentPath;
                toIndex = index + 1;
            } else {
                // Insert as child (append to children)
                toParentPath = path;
                toIndex = block.children?.length ?? 0;
            }

            // Only move if position actually changed
            if (JSON.stringify(item.parentPath) !== JSON.stringify(toParentPath) || item.index !== toIndex) {
                moveBlock(item.parentPath, item.index, toParentPath, toIndex);
            }

            setDropPosition(null);
        },
        collect: (monitor) => ({
            isOver: monitor.isOver({ shallow: true }),
            canDrop: monitor.canDrop(),
        }),
    });

    // Combine drag and drop refs using callback ref
    const setRefs = (element: HTMLDivElement | null) => {
        elementRef.current = element;
        drag(element);
        preview(drop(element));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            updateContent(path, newValue);
        }, 300);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            updateContent(path, e.currentTarget.value);
            setIsEditing(false);
        }
        if (e.key === 'Escape') {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            setIsEditing(false);
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        const currentValue = e.currentTarget.value;
        if (currentValue !== block.content) {
            updateContent(path, currentValue);
        }
        setIsEditing(false);
    };

    const handleStartEdit = () => {
        setIsEditing(true);
    };

    const opacity = isDragging ? 0.4 : 1;

    const getDropIndicatorClasses = () => {
        if (!isOver || !canDrop) return '';

        if (dropPosition === 'before') {
            return 'border-t-2 border-blue-500';
        } else if (dropPosition === 'after') {
            return 'border-b-2 border-blue-500';
        } else {
            return 'ring-2 ring-blue-500 bg-blue-50';
        }
    };

    return (
        <div ref={setRefs} style={{ opacity }} className={`group ${getDropIndicatorClasses()}`}>
            <div className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/50 transition-colors">
                {/* Drag handle */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing mt-1 shrink-0">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                </div>

                {/* Type indicator or checkbox */}
                <div className="flex items-center  gap-2 mt-1 shrink-0">
                    {block.type === 'todo' ? (
                        <Checkbox checked={block.done ?? false} onCheckedChange={() => toggleTodo(path)} />
                    ) : (
                        <FileText className="w-4 h-4 text-muted-foreground" />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {isEditing ? (
                        <Input
                            type="text"
                            defaultValue={block.content}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                            className="h-8"
                            autoFocus
                        />
                    ) : (
                        <Button
                            onClick={handleStartEdit}
                            className={`px-2 py-1 cursor-text rounded hover:bg-accent/30 transition-colors truncate text-left w-full justify-start ${
                                block.type === 'todo' && block.done ? 'line-through text-muted-foreground' : ''
                            }`}
                            title={block.content}
                            variant="ghost"
                        >
                            {block.content || <span className="text-muted-foreground italic">Empty block (click to edit)</span>}
                        </Button>
                    )}
                </div>

                {/* Actions dropdown */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => insertBlock(path, block.children?.length ?? 0, 'text')}>
                                Add child text block
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => insertBlock(path, block.children?.length ?? 0, 'todo')}>Add child todo</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => insertBlock(parentPath, index + 1, 'text')}>Add sibling below</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => deleteBlock(parentPath, index)} className="text-destructive">
                                Delete block
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {hasChildren && (
                <div className="ml-6 mt-2 border-l-2 border-border pl-4">
                    <BlockList blocks={block.children!} parentPath={path} />
                </div>
            )}
        </div>
    );
}
