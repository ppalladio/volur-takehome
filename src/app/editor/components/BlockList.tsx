"use client";

import { Block, Path } from "@/lib";
import BlockNode from "./BlockNode";

type BlockListProps = {
  blocks: Block[];
  parentPath: Path | null;
};

export default function BlockList({ blocks, parentPath }: BlockListProps) {
  return (
    <div className="space-y-1">
      {blocks.map((block, index) => {
        const path = parentPath ? [...parentPath, index] : [index];
        return (
          <BlockNode
            key={block.id}
            block={block}
            path={path}
            index={index}
            parentPath={parentPath}
          />
        );
      })}
    </div>
  );
}