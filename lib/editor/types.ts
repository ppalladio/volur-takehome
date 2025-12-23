export type BlockType = 'text' | 'todo';

export type Block = {
    id: string;
    type: BlockType;
    content: string;
    done?: boolean;
    children?: Block[];
};

export type BlockArray = Block[];

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
