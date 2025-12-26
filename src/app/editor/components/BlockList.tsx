'use client';

import { Block, Path } from '@/editor/lib';
import { BlockNode } from './BlockNode/BlockNode';

type BlockListProps = Readonly<{
    blocks: Block[];
    parentPath: Path | null;
}>;

export const BlockList = ({ blocks, parentPath }: BlockListProps) => {
    return (
        <div className="space-y-1">
            {blocks.map((block, index) => {
                const path = parentPath ? [...parentPath, index] : [index];
                return <BlockNode key={block.id} block={block} path={path} index={index} parentPath={parentPath} />;
            })}
        </div>
    );
};
