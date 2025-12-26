import { z } from 'zod';

// Zod schemas
export const BlockTypeSchema = z.enum(['text', 'todo']);

export const BaseBlockSchema: z.ZodType<BaseBlock> = z.lazy(() =>
    z.object({
        id: z.string().min(1),
        type: BlockTypeSchema,
        content: z.string(),
        done: z.boolean().optional(),
        children: z.array(BlockSchema).optional(),
    }),
);

export const BlockSchema: z.ZodType<Block> = z.lazy(() =>
    z.object({
        id: z.string().min(1),
        type: BlockTypeSchema,
        content: z.string(),
        done: z.boolean().optional(),
        children: z.array(BlockSchema).optional(),
        autoFocus: z.boolean().optional(),
    }),
);

export const BlockArraySchema = z.array(BlockSchema);

export const PathSchema = z.array(z.number().int().min(0));

export const CursorPositionSchema = z
    .object({
        blockId: z.string().min(1),
        selectionStart: z.number().int().min(0),
        selectionEnd: z.number().int().min(0),
    })
    .nullable();

export const PatchOpUpdateContentSchema = z.object({
    type: z.literal('update'),
    path: PathSchema,
    field: z.literal('content'),
    value: z.string(),
    oldValue: z.string(),
});

export const PatchOpUpdateDoneSchema = z.object({
    type: z.literal('update'),
    path: PathSchema,
    field: z.literal('done'),
    value: z.boolean(),
    oldValue: z.boolean(),
});

export const PatchOpInsertSchema = z.object({
    type: z.literal('insert'),
    parentPath: PathSchema.nullable(),
    index: z.number().int().min(0),
    block: BlockSchema,
});

export const PatchOpDeleteSchema = z.object({
    type: z.literal('delete'),
    parentPath: PathSchema.nullable(),
    index: z.number().int().min(0),
    deleted: BlockSchema,
});

export const PatchOpMoveSchema = z.object({
    type: z.literal('move'),
    fromParentPath: PathSchema.nullable(),
    fromIndex: z.number().int().min(0),
    toParentPath: PathSchema.nullable(),
    toIndex: z.number().int().min(0),
});

export const PatchOpSchema = z.union([
    PatchOpUpdateContentSchema,
    PatchOpUpdateDoneSchema,
    PatchOpInsertSchema,
    PatchOpDeleteSchema,
    PatchOpMoveSchema,
]);

export const PatchSchema = z.object({
    ops: z.array(PatchOpSchema),
});

export const CommandSchema = z.object({
    forward: PatchSchema,
    inverse: PatchSchema,
});

export const HistoryNodeSchema = z.object({
    command: CommandSchema,
    parentIndex: z.number().int().nullable(),
    branches: z.array(z.number().int().min(0)),
    timestamp: z.number().int().positive(),
});

export const HistoryNodesSchema = z.array(HistoryNodeSchema);

export const HistoryTreeSchema = z.object({
    nodes: HistoryNodesSchema,
    currentIndex: z.number().int(),
});
export type BlockType = 'text' | 'todo';

export type BaseBlock = {
    id: string;
    type: BlockType;
    content: string;
    done?: boolean;
    children?: Block[];
};

export type Block = BaseBlock & {
    autoFocus?: boolean;
};

export type BlockArray = Block[];

export type HistoryNode = {
    command: Command;
    parentIndex: number | null;
    branches: number[];
    timestamp: number;
};

export type HistoryTree = {
    nodes: HistoryNode[];
    currentIndex: number;
};

export type Path = number[];

export type PatchOp =
    | {
          type: 'update';
          path: Path;
          field: 'content';
          value: string;
          oldValue: string;
      }
    | {
          type: 'update';
          path: Path;
          field: 'done';
          value: boolean;
          oldValue: boolean;
      }
    | {
          type: 'insert';
          parentPath: Path | null;
          index: number;
          block: Block;
      }
    | {
          type: 'delete';
          parentPath: Path | null;
          index: number;
          deleted: Block;
      }
    | {
          type: 'move';
          fromParentPath: Path | null;
          fromIndex: number;
          toParentPath: Path | null;
          toIndex: number;
      };

export type Patch = {
    ops: PatchOp[];
};

export type Command = {
    forward: Patch;
    inverse: Patch;
};

export type CursorPosition = {
    blockId: string;
    selectionStart: number;
    selectionEnd: number;
} | null;

export type RedoBranch = {
    node: HistoryNode;
    nodeIndex: number;
};
