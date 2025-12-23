"use client";

import { useEditor } from "@/hooks";
import { Button } from "@/components/ui/button";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { Undo2, Redo2, Plus, FileText, CheckSquare } from "lucide-react";

export default function Toolbar() {
  const { canUndo, canRedo, undo, redo, insertBlock, doc } = useEditor();

  const handleInsertText = () => insertBlock(null, doc.length, "text");
  const handleInsertTodo = () => insertBlock(null, doc.length, "todo");

  return (
    <div className="flex items-center gap-2 pb-4 border-b">
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>Edit</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={undo} disabled={!canUndo}>
              <Undo2 className="w-4 h-4 mr-2" />
              Undo
              <MenubarShortcut>⌘Z</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={redo} disabled={!canRedo}>
              <Redo2 className="w-4 h-4 mr-2" />
              Redo
              <MenubarShortcut>⌘⇧Z</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>Insert</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={handleInsertText}>
              <FileText className="w-4 h-4 mr-2" />
              Text Block
              <MenubarShortcut>⌘T</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={handleInsertTodo}>
              <CheckSquare className="w-4 h-4 mr-2" />
              Todo Block
              <MenubarShortcut>⌘L</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>

      <div className="flex-1" />

      {/* Quick action buttons */}
      <div className="flex items-center gap-2">
        <Button
          onClick={undo}
          disabled={!canUndo}
          variant="ghost"
          size="icon"
          title="Undo"
        >
          <Undo2 className="w-4 h-4" />
        </Button>
        <Button
          onClick={redo}
          disabled={!canRedo}
          variant="ghost"
          size="icon"
          title="Redo"
        >
          <Redo2 className="w-4 h-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button onClick={handleInsertText} variant="ghost" size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Text
        </Button>
        <Button onClick={handleInsertTodo} variant="ghost" size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Todo
        </Button>
      </div>
    </div>
  );
}