'use client';

import { Button } from '@/components';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useEditor } from '@/editor/hooks';
import { getCommandPreview, getTimeAgo } from '@/editor/lib';
import { ChevronDown, Redo2 } from 'lucide-react';

export const BranchSelector = () => {
    const { redoBranches, redo, canRedo } = useEditor();

    if (!canRedo) {
        return (
            <Button disabled variant="ghost" size="icon" title="Redo">
                <Redo2 className="w-4 h-4" />
            </Button>
        );
    }

    // Single branch - just show regular redo button
    if (redoBranches.length === 1) {
        return (
            <Button onClick={() => redo(redoBranches[0].nodeIndex)} variant="ghost" size="icon" title="Redo">
                <Redo2 className="w-4 h-4" />
            </Button>
        );
    }

    // Multiple branches - show dropdown
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" title={`Redo (${redoBranches.length} branches)`}>
                    <div className="relative">
                        <Redo2 className="w-4 h-4" />
                        <ChevronDown className="w-2 h-2 absolute -bottom-1 -right-1" />
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {redoBranches.map((branch) => {
                    const timeAgo = getTimeAgo(branch.node.timestamp);
                    const preview = getCommandPreview(branch.node.command);

                    return (
                        <DropdownMenuItem key={branch.nodeIndex} onClick={() => redo(branch.nodeIndex)}>
                            <div className="flex flex-col gap-1">
                                <span className="font-medium">{preview}</span>
                                <span className="text-xs text-muted-foreground">{timeAgo}</span>
                            </div>
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
