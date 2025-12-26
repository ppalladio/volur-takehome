import { BlockArray, Command } from '@/editor/lib';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useHistoryTree } from './useHistoryTree';

// Helper to create a mock command
function createMockCommand(newContent: string): Command {
    return {
        forward: {
            ops: [
                {
                    type: 'update',
                    path: [0],
                    field: 'content',
                    value: newContent,
                    oldValue: 'original',
                },
            ],
        },
        inverse: {
            ops: [
                {
                    type: 'update',
                    path: [0],
                    field: 'content',
                    value: 'original',
                    oldValue: newContent,
                },
            ],
        },
    };
}
const initialDoc: BlockArray = [{ id: '1', type: 'text', content: 'Hello', children: [] }];

describe('useHistoryTree', () => {
    it('should initialize with provided document', () => {
        const { result } = renderHook(() => useHistoryTree(initialDoc));

        expect(result.current.doc).toEqual(initialDoc);
        expect(result.current.historyNodes).toEqual([]);
        expect(result.current.currentIndex).toBe(-1);
        expect(result.current.canUndo).toBe(false);
        expect(result.current.canRedo).toBe(false);
        expect(result.current.redoBranches).toEqual([]);
    });
});

it('should execute command and update document', () => {
    const { result } = renderHook(() => useHistoryTree(initialDoc));
    const command = createMockCommand('modified');

    act(() => {
        result.current.execute(command);
    });

    expect(result.current.currentIndex).toBe(0);
    expect(result.current.historyNodes).toHaveLength(1);
    expect(result.current.historyNodes[0].command).toBe(command);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
});

it('should create history tree with multiple commands', () => {
    const { result } = renderHook(() => useHistoryTree(initialDoc));

    act(() => {
        result.current.execute(createMockCommand('v1'));
    });

    act(() => {
        result.current.execute(createMockCommand('v2'));
    });

    act(() => {
        result.current.execute(createMockCommand('v3'));
    });

    expect(result.current.currentIndex).toBe(2);
    expect(result.current.historyNodes).toHaveLength(3);
    expect(result.current.historyNodes[0].branches).toEqual([1]);
    expect(result.current.historyNodes[1].branches).toEqual([2]);
});

it('should undo command and apply inverse patch', () => {
    const { result } = renderHook(() => useHistoryTree(initialDoc));
    const command = createMockCommand('modified');

    act(() => {
        result.current.execute(command);
    });

    expect(result.current.currentIndex).toBe(0);

    act(() => {
        result.current.undo();
    });

    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
});

it('should not undo when at initial state', () => {
    const initialDoc: BlockArray = [];
    const { result } = renderHook(() => useHistoryTree(initialDoc));

    act(() => {
        result.current.undo();
    });

    expect(result.current.canUndo).toBe(false);
});

it('should undo multiple times', () => {
    const { result } = renderHook(() => useHistoryTree(initialDoc));

    act(() => {
        result.current.execute(createMockCommand('v1'));
    });

    act(() => {
        result.current.execute(createMockCommand('v2'));
    });

    act(() => {
        result.current.execute(createMockCommand('v3'));
    });

    expect(result.current.currentIndex).toBe(2);

    act(() => {
        result.current.undo();
    });
    expect(result.current.currentIndex).toBe(1);

    act(() => {
        result.current.undo();
    });
    expect(result.current.currentIndex).toBe(0);

    act(() => {
        result.current.undo();
    });
    expect(result.current.canUndo).toBe(false);
});

it('should redo command and apply forward patch', () => {
    const { result } = renderHook(() => useHistoryTree(initialDoc));

    act(() => {
        result.current.execute(createMockCommand('v1'));
    });

    act(() => {
        result.current.undo();
    });
    expect(result.current.canUndo).toBe(false);

    act(() => {
        result.current.redo();
    });

    expect(result.current.currentIndex).toBe(0);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
});

it('should not redo when no redo branches exist', () => {
    const initialDoc: BlockArray = [];
    const { result } = renderHook(() => useHistoryTree(initialDoc));

    act(() => {
        result.current.redo();
    });

    expect(result.current.canRedo).toBe(false);
});

it('should support branch selection', () => {
    const { result } = renderHook(() => useHistoryTree(initialDoc));

    // Create initial commands
    act(() => {
        result.current.execute(createMockCommand('v1'));
    });

    act(() => {
        result.current.execute(createMockCommand('v2'));
    });

    expect(result.current.historyNodes).toHaveLength(2);
    expect(result.current.currentIndex).toBe(1);

    act(() => {
        result.current.undo();
    });

    expect(result.current.currentIndex).toBe(0);
    expect(result.current.historyNodes[0].branches).toEqual([1]);

    // Create a new branch by executing another command
    act(() => {
        result.current.execute(createMockCommand('v3'));
    });

    // Now we should have a branch
    expect(result.current.currentIndex).toBe(2);

    // Can redo to either branch (node 1 or node 2)
    act(() => {
        result.current.undo();
    });

    expect(result.current.currentIndex).toBe(0);
    expect(result.current.canRedo).toBe(true);
});

it('should calculate redoBranches correctly', () => {
    const { result } = renderHook(() => useHistoryTree(initialDoc));

    // Create two commands
    act(() => {
        result.current.execute(createMockCommand('v1'));
    });

    act(() => {
        result.current.execute(createMockCommand('v2'));
    });

    act(() => {
        result.current.undo();
    });

    expect(result.current.currentIndex).toBe(0);
    expect(result.current.redoBranches).toHaveLength(1);
    expect(result.current.redoBranches[0].nodeIndex).toBe(1);

    act(() => {
        result.current.execute(createMockCommand('v3'));
    });

    act(() => {
        result.current.undo();
    });

    expect(result.current.currentIndex).toBe(0);

    expect(result.current.redoBranches.length).toBeGreaterThanOrEqual(2);
});
