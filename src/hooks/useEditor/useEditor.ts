import { EditorContext } from '@/app/editor/context/EditorContext';
import { useContext } from 'react';

export function useEditor() {
    const context = useContext(EditorContext);
    if (!context) {
        throw new Error('useEditor must be used within EditorProvider');
    }
    return context;
}
