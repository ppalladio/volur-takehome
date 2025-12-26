import { useCallback, useEffect, useRef } from 'react';

/**
 * Creates a debounced version of a callback function.
 *
 * The debounced callback will only execute after the specified delay
 * has passed since the last invocation. Each new call resets the timer.
 *
 * @param callback - The function to debounce
 * @param delay - Delay in milliseconds
 * @returns Object with debounced callback and cancel/flush methods
 *
 * @example
 * const { debouncedCallback, cancel, flush } = useDebouncedCallback(
 *   (value: string) => updateContent(path, value),
 *   300
 * );
 *
 * // Call the debounced function
 * debouncedCallback(newValue);
 *
 * // Cancel pending execution
 * cancel();
 *
 * // Execute immediately
 * flush();
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useDebouncedCallback = <T extends (...args: any[]) => void>(
    callback: T,
    delay: number,
) => {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const callbackRef = useRef(callback);

    // Keep callback ref up to date using useEffect
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    const cancel = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const debouncedCallback = useCallback(
        (...args: Parameters<T>) => {
            cancel();
            timeoutRef.current = setTimeout(() => {
                callbackRef.current(...args);
            }, delay);
        },
        [delay, cancel],
    ) as T;

    const flush = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    return { debouncedCallback, cancel, flush };
};
