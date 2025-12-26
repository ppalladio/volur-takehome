import { useEffect, useRef } from 'react';

/**
 * Custom hook for debounced localStorage persistence.
 *
 * This hook automatically saves state changes to localStorage with debouncing,
 * and skips the initial save to avoid overwriting on mount.
 *
 * @param storageKey - The localStorage key to use
 * @param value - The value to persist (will be JSON stringified)
 * @param debounceMs - Debounce delay in milliseconds (default: 500)
 */
export const usePersistence = (storageKey: string, value: object, debounceMs: number = 500): void => {
    const isLoadedRef = useRef<boolean>(false);

    // Mark as loaded after initial mount
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            isLoadedRef.current = true;
        }, 0);

        return () => clearTimeout(timeoutId);
    }, []);

    useEffect(() => {
        if (!isLoadedRef.current) return;

        if (globalThis.window === undefined) return;

        const timeoutId = setTimeout(() => {
            try {
                localStorage.setItem(storageKey, JSON.stringify(value));
            } catch (error) {
                console.error(`Failed to persist to localStorage: ${storageKey}`, error);
            }
        }, debounceMs);

        return () => clearTimeout(timeoutId);
    }, [value, storageKey, debounceMs]);
};
