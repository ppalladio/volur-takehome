import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: [],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                '.next/',
                'coverage/',
                '**/*.config.*',
                '**/types.ts',
            ],
        },
    },
    resolve: {
        alias: {
            '@/editor/lib': path.resolve(__dirname, './src/app/editor/lib'),
            '@/editor/hooks': path.resolve(__dirname, './src/app/editor/hooks'),
            '@/editor': path.resolve(__dirname, './src/app/editor'),
            '@/hooks': path.resolve(__dirname, './src/hooks'),
            '@/lib': path.resolve(__dirname, './lib'),
            '@': path.resolve(__dirname, './src'),
        },
    },
});
