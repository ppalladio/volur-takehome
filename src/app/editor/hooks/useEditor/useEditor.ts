import { EditorContext, EditorContextType } from '@/app/editor/context/EditorContext';
import { useContext } from 'react';

export const useEditor = () => {
    const context = useContext<EditorContextType | undefined>(EditorContext);
    if (!context) {
        throw new Error('useEditor must be used within EditorProvider');
    }
    return context;
};
