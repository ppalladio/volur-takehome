import { Button } from '@/components';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Block, BlockType, Path } from '@/editor/lib';
import { MoreVertical } from 'lucide-react';

type BlockActionsProps = Readonly<{
    block: Block;
    path: Path;
    parentPath: Path | null;
    index: number;
    insertBlock: (parentPath: Path | null, index: number, type: BlockType) => void;
    deleteBlock: (parentPath: Path | null, index: number) => void;
}>;

/**
 * Pure presentation component for block actions dropdown menu.
 * Provides options to add child blocks, add sibling blocks, and delete the block.
 */
export const BlockActions = ({ block, path, parentPath, index, insertBlock, deleteBlock }: BlockActionsProps) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreVertical className="w-4 h-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => insertBlock(path, block.children?.length ?? 0, 'text')}>Add child text block</DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertBlock(path, block.children?.length ?? 0, 'todo')}>Add child todo</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => insertBlock(parentPath, index + 1, 'text')}>Add sibling below</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => deleteBlock(parentPath, index)} className="text-destructive">
                    Delete block
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
