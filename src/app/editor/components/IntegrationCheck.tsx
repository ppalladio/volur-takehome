'use client';

import { Button } from '@/components';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useEditor } from '@/hooks';
import { clearEditorState } from '@/lib/editor/persistence';
import { validateEditorState, ValidationError } from '@/lib/editor/validation';
import { AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

export function IntegrityCheck() {
    const { doc, historyNodes, currentIndex, cursorPosition } = useEditor();
    const [errors, setErrors] = useState<ValidationError[]>([]);

    // Check integrity whenever state changes
    useEffect(() => {
        const result = validateEditorState(doc, historyNodes, currentIndex, cursorPosition);
        setErrors(result.errors);

        if (result.isValid === false) {
            console.error('🚨 Integrity check failed:', result.errors);
        } else {
            console.log('✅ Integrity check passed');
        }
    }, [doc, historyNodes, currentIndex, cursorPosition]);

    const handleResetHistory = () => {
        if (confirm('Reset undo/redo history? This will keep your current document but clear all undo/redo.')) {
            clearEditorState();
            globalThis.window.location.reload();
        }
    };

    const handleResetAll = () => {
        if (confirm('⚠️ Reset everything? This will delete all your data and history. This cannot be undone!')) {
            clearEditorState();
            globalThis.window.location.reload();
        }
    };

    const handleDismiss = () => {
        setErrors([]);
    };

    if (errors.length === 0) {
        return null;
    }

    return (
        <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Data Integrity Error Detected</AlertTitle>
            <AlertDescription>
                <div className="mt-2">
                    <p className="mb-2 font-medium">The editor detected {errors.length} integrity error(s):</p>
                    <ul className="list-disc list-inside mb-4 text-sm space-y-1">
                        {errors.slice(0, 5).map((error, i) => (
                            <li key={i} className="text-xs">
                                <span className="font-semibold">{error.type}:</span> {error.message}
                            </li>
                        ))}
                        {errors.length > 5 && <li className="text-xs italic">...and {errors.length - 5} more errors</li>}
                    </ul>
                    <div className="flex gap-2 flex-wrap">
                        <Button onClick={handleDismiss} variant="outline" size="sm">
                            Dismiss (Risky)
                        </Button>
                        <Button onClick={handleResetHistory} variant="outline" size="sm">
                            Reset History Only
                        </Button>
                        <Button onClick={handleResetAll} variant="destructive" size="sm">
                            Reset Everything
                        </Button>
                    </div>
                    <p className="text-xs mt-2 text-muted-foreground">
                        Tip: Export your document before resetting if you want to preserve your content.
                    </p>
                </div>
            </AlertDescription>
        </Alert>
    );
}
