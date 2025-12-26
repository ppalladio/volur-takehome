import { useEditor } from '@/editor/hooks';
import { validateEditorState, ValidationError, ValidationResult } from '@/editor/lib';
import { useCallback, useMemo, useState } from 'react';

export type UseIntegrityCheckReturn = {
    validationResult: ValidationResult;
    errors: ValidationError[];
    dismissedErrors: boolean;
    dismissErrors: () => void;
};

/**
 * Custom hook for checking data integrity of the editor state.
 *
 * Handles:
 * - Validating editor state (doc, history, cursor position)
 * - Logging validation results
 * - Managing dismissed errors state
 *
 * @returns Validation result, errors, and dismiss handlers
 */
export const useIntegrityCheck = (): UseIntegrityCheckReturn => {
    const { doc, historyNodes, currentIndex, cursorPosition } = useEditor();
    const [dismissedErrorCount, setDismissedErrorCount] = useState<number>(0);

    // Compute validation result as derived state (no setState in effect)
    const validationResult = useMemo(() => {
        return validateEditorState(doc, historyNodes, currentIndex, cursorPosition);
    }, [doc, historyNodes, currentIndex, cursorPosition]);

    // Derive dismissed state: errors are dismissed only if error count matches dismissed count
    const dismissedErrors = validationResult.errors.length > 0 && validationResult.errors.length === dismissedErrorCount;

    const dismissErrors = useCallback(() => {
        setDismissedErrorCount(validationResult.errors.length);
    }, [validationResult.errors.length]);

    return {
        validationResult,
        errors: validationResult.errors,
        dismissedErrors,
        dismissErrors,
    };
};
