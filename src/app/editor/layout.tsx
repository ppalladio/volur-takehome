'use client';

import { useKeyboardShortcuts } from '@/hooks';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Editor from './components/Editor';
import { IntegrityCheck } from './components/IntegrationCheck';

export default function EditorLayout() {
    // Global keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z)
    useKeyboardShortcuts();

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="space-y-4">
                <IntegrityCheck />

                <Editor />
            </div>
        </DndProvider>
    );
}
