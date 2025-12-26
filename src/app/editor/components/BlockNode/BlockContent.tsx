import { Button, Input } from '@/components';
import { Block, isTodoBlock } from '@/editor/lib';

type BlockContentProps = Readonly<{
    isEditing: boolean;
    block: Block;
    localContent: string;
    inputRef: React.RefObject<HTMLInputElement | null>;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
    handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    handleSelectionChange: (e: React.SyntheticEvent<HTMLInputElement>) => void;
    onStartEdit: () => void;
}>;

/**
 * Pure presentation component for block content.
 * Renders either an input (when editing) or a button (when not editing).
 */
export const BlockContent = ({
    isEditing,
    block,
    localContent,
    inputRef,
    handleChange,
    handleBlur,
    handleKeyDown,
    handleSelectionChange,
    onStartEdit,
}: BlockContentProps) => {
    if (isEditing) {
        return (
            <Input
                ref={inputRef}
                type="text"
                value={localContent}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                onSelect={handleSelectionChange}
                onClick={handleSelectionChange}
                onKeyUp={handleSelectionChange}
                className="h-8"
            />
        );
    }

    return (
        <Button
            onClick={onStartEdit}
            className={`px-2 py-1 cursor-text rounded hover:bg-accent/30 transition-colors truncate text-left w-full justify-start ${
                isTodoBlock(block) && block.done ? 'line-through text-muted-foreground' : ''
            }`}
            title={block.content}
            variant="ghost"
        >
            {block.content || <span className="text-muted-foreground italic">Empty block (click to edit)</span>}
        </Button>
    );
};
