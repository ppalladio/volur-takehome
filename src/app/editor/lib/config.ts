/**
 * Storage configuration constants
 */
export const STORAGE_CONFIG = {
    /**
     * Key for storing editor state in localStorage
     */
    EDITOR_STATE_KEY: 'mini-notion-editor-state',

    /**
     * Version number for stored state schema
     * Increment this when making breaking changes to the persisted state structure
     */
    STORAGE_VERSION: 1,

    /**
     * Debounce delay for auto-save in milliseconds
     */
    AUTO_SAVE_DELAY_MS: 500,
} as const;
