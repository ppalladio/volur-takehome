'use client';

import { useEditor, useKeyboardShortcuts } from '@/hooks';
import BlockList from './BlockList';
import Toolbar from './Toolbar';

import { FileQuestion } from 'lucide-react';

export default function Editor() {
    const { doc } = useEditor();

    // Enable keyboard shortcuts
    useKeyboardShortcuts();

    return (
        <div className="space-y-4">
            <div className="border rounded-lg bg-card shadow-sm">
                <div className="p-4 border-b bg-muted/30">
                    <Toolbar />
                </div>
                <div className="p-6">
                    {doc.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-12">
                            <FileQuestion className="w-12 h-12 mb-4 opacity-50" />
                            <p className="text-lg font-medium">No blocks yet</p>
                            <p className="text-sm mt-1">Create your first block using the menu or buttons above</p>
                        </div>
                    ) : (
                        <BlockList blocks={doc} parentPath={null} />
                    )}
                </div>
            </div>
        </div>
    );
}
