'use client';

import { Checkbox } from '@/components';
import { useBlockDragDrop, useBlockEdit, useCursorPosition, useEditor } from '@/editor/hooks';
import { Block, Path, isTodoBlock } from '@/editor/lib';
import { FileText, GripVertical } from 'lucide-react';
import { BlockList } from '../BlockList';
import { BlockActions } from './BlockActions';
import { BlockContent } from './BlockContent';

type BlockNodeProps = Readonly<{
    block: Block;
    path: Path;
    index: number;
    parentPath: Path | null;
}>;

/**
 * BlockNode component - renders a single block with drag/drop, editing, and actions.
 * Refactored to use extracted hooks for better separation of concerns.
 */
export const BlockNode = ({ block, path, index, parentPath }: BlockNodeProps) => {
    const { updateContent, toggleTodo, deleteBlock, insertBlock, moveBlock, setCursorPosition } = useEditor();

    // Use extracted hooks for different concerns
    const { setRefs: dragDropRef, opacity: dragOpacity, getDropIndicatorClasses } = useBlockDragDrop(block, path, index, parentPath, moveBlock);

    const editing = useBlockEdit(block, path, updateContent);
    const cursor = useCursorPosition(block.id, setCursorPosition);

    const hasChildren = block.children && block.children.length > 0;
    const dropClasses = getDropIndicatorClasses();

    return (
        <div ref={dragDropRef} style={{ opacity: dragOpacity }} className={`group ${dropClasses}`}>
            <div className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/50 transition-colors">
                {/* Drag handle */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing mt-1 shrink-0">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                </div>

                {/* Block icon/checkbox */}
                <div className="flex items-center gap-2 mt-1 shrink-0">
                    {isTodoBlock(block) ? (
                        <Checkbox checked={block.done ?? false} onCheckedChange={() => toggleTodo(path)} />
                    ) : (
                        <FileText className="w-4 h-4 text-muted-foreground" />
                    )}
                </div>

                {/* Block content */}
                <div className="flex-1 min-w-0">
                    <BlockContent
                        isEditing={editing.isEditing}
                        block={block}
                        localContent={editing.localContent}
                        inputRef={editing.inputRef}
                        handleChange={editing.handleChange}
                        handleBlur={editing.handleBlur}
                        handleKeyDown={editing.handleKeyDown}
                        handleSelectionChange={cursor.handleSelectionChange}
                        onStartEdit={editing.startEdit}
                    />
                </div>

                {/* Block actions menu */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <BlockActions
                        block={block}
                        path={path}
                        parentPath={parentPath}
                        index={index}
                        insertBlock={insertBlock}
                        deleteBlock={deleteBlock}
                    />
                </div>
            </div>

            {/* Child blocks */}
            {hasChildren && (
                <div className="ml-6 mt-2 border-l-2 border-border pl-4">
                    <BlockList blocks={block.children!} parentPath={path} />
                </div>
            )}
        </div>
    );
};
