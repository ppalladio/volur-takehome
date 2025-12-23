'use client';

import { Button, Input, Switch } from '@/components';
import { useEditor } from '@/hooks';
import { Block, Path } from '@/lib/editor/types';
import { CheckSquare, ChevronDown, FileText, GripVertical, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import BlockList from './BlockList';

type BlockNodeProps = {
    block: Block;
    path: Path;
    index: number;
    parentPath: Path | null;
};

export default function BlockNode({ block, path, index, parentPath }: BlockNodeProps) {
    const { updateContent, toggleTodo, deleteBlock, insertBlock } = useEditor();
    const [isEditing, setIsEditing] = useState(false);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    const hasChildren = block.children && block.children.length > 0;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;

        // Clear previous debounce timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Set new debounce timer (100ms delay)
        debounceTimerRef.current = setTimeout(() => {
            updateContent(path, newValue);
        }, 100);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            // Clear debounce and send immediately
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            updateContent(path, e.currentTarget.value);
            setIsEditing(false);
        }
        if (e.key === 'Escape') {
            // Clear debounce timer
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            setIsEditing(false);
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        // Clear debounce and send immediately on blur
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

    return (
        <div className="group">
            <div className="flex items-start gap-2 p-2 rounded-md hover:bg-accent/50 transition-colors">
                {/* Drag handle */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing mt-1">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                </div>

                {/* Type indicator or switch */}
                <div className="flex items-center gap-2 mt-1">
                    {block.type === 'todo' ? (
                        <div className="flex items-center space-x-2">
                            <Switch id={`todo-${block.id}`} checked={block.done ?? false} onCheckedChange={() => toggleTodo(path)} />
                        </div>
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
                        <div
                            onClick={handleStartEdit}
                            className={`px-2 py-1 cursor-text rounded hover:bg-accent/30 transition-colors ${
                                block.type === 'todo' && block.done ? 'line-through text-muted-foreground' : ''
                            }`}
                        >
                            {block.content || <span className="text-muted-foreground italic">Empty block (click to edit)</span>}
                        </div>
                    )}

                    {/* Children */}
                    {hasChildren && (
                        <div className="ml-6 mt-2 border-l-2 border-border pl-4">
                            <BlockList blocks={block.children!} parentPath={path} />
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        onClick={() => insertBlock(path, block.children?.length ?? 0, 'text')}
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Add child text block"
                    >
                        <FileText className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                        onClick={() => insertBlock(path, block.children?.length ?? 0, 'todo')}
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Add child todo block"
                    >
                        <CheckSquare className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                        onClick={() => insertBlock(parentPath, index + 1, 'text')}
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Add sibling below"
                    >
                        <ChevronDown className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                        onClick={() => deleteBlock(parentPath, index)}
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        title="Delete block"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
