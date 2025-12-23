import { BlockArray } from '@/lib/editor/types';
import { createBlock } from '@/lib/editor/utils';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { EditorProvider } from './editor/context/EditorContext';
import EditorLayout from './editor/layout';
import './globals.css';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'Mini JSON Block Editor',
    description: 'A Notion-lite editor with patch-based undo/redo',
};
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

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <main className="min-h-screen p-8 max-w-4xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold tracking-tight">Mini JSON Block Editor</h1>
                        <p className="text-muted-foreground mt-2">A Notion-lite editor with patch-based undo/redo</p>
                    </div>

                    <EditorProvider initialDoc={initialDoc}>
                        <EditorLayout>{children}</EditorLayout>
                    </EditorProvider>
                </main>
            </body>
        </html>
    );
}
