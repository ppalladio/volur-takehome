'use client';
import { BlockArray } from '@/app/editor/lib/types';
import { createBlock } from '@/app/editor/lib/utils';
import { EditorProvider } from './editor/context/EditorContext';
import EditorLayout from './editor/layout';

const initialDoc: BlockArray = [
    createBlock('text', 'Welcome to Mini Notion'),
    {
        ...createBlock('todo', 'Complete the interview task'),
        done: false,
        children: [
            createBlock('text', 'Build the state engine ✓'),
            createBlock('text', 'Implement undo/redo ✓'),
            createBlock('text', 'Create beautiful UI ✓'),
        ],
    },
    {
        ...createBlock('todo', 'Test all features'),
        done: true,
    },
    createBlock('text', 'Have fun! 🎉'),
];

import { useEffect, useState } from 'react';

export default function Home() {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setTimeout(() => {
            setIsMounted(true);
        }, 1000);
    }, []);
    if (!isMounted) return null;
    return (
        <main className="min-h-screen p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-4xl font-bold tracking-tight">Mini JSON Block Editor</h1>
                <p className="text-muted-foreground mt-2">A Notion-lite editor with patch-based undo/redo</p>
            </div>

            <EditorProvider initialDoc={initialDoc}>
                <EditorLayout />
            </EditorProvider>
        </main>
    );
}
