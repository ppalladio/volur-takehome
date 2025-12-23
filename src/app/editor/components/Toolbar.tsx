'use client';

import { Button } from '@/components';
import { useEditor } from '@/hooks';
import { BranchSelector } from './BranchSelector';

import { Plus, Undo2 } from 'lucide-react';

export default function Toolbar() {
    const { canUndo, undo, insertBlock, doc } = useEditor();

    const handleInsertText = () => insertBlock(null, doc.length, 'text');
    const handleInsertTodo = () => insertBlock(null, doc.length, 'todo');

    return (
        <div className="flex items-center justify-end gap-2 pb-4 border-b">
            <div className="flex items-center gap-2">
                <Button onClick={undo} disabled={!canUndo} variant="ghost" size="icon" title="Undo">
                    <Undo2 className="w-4 h-4" />
                </Button>
                <BranchSelector />

                <div className="w-px h-6 bg-border mx-1" />
                <Button onClick={handleInsertText} variant="ghost" size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Text
                </Button>
                <Button onClick={handleInsertTodo} variant="ghost" size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Todo
                </Button>
            </div>
        </div>
    );
}
