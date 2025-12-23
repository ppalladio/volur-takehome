import Editor from '@/app/editor/components/Editor';
import { EditorProvider } from '@/app/editor/context/EditorContext';
import { BlockArray } from '@/lib/editor/types';
import { createBlock } from '@/lib/editor/utils';

// Sample initial document
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
        done: false,
    },
    createBlock('text', 'Have fun! 🎉'),
];

export default function Home() {
    return (
        <main className="min-h-screen p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-4xl font-bold tracking-tight">Mini JSON Block Editor</h1>
                <p className="text-muted-foreground mt-2">A Notion-lite editor with patch-based undo/redo</p>
            </div>
            <EditorProvider initialDoc={initialDoc}>
                <Editor />
            </EditorProvider>
        </main>
    );
}
