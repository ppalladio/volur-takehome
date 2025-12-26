'use client';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Editor } from './components/Editor';
import { IntegrityCheckAlert } from './components/IntegrityCheckAlert';
import { useKeyboardShortcuts } from './hooks';

export default function EditorLayout() {
    useKeyboardShortcuts();

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="space-y-4">
                <IntegrityCheckAlert />
                <Editor />
            </div>
        </DndProvider>
    );
}
