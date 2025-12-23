import { EditorProvider } from "./editor/context/EditorContext";
import Editor from "./editor/components/Editor";
import { BlockArray } from "@/lib/editor/types";
import { createBlock } from "@/lib/editor/utils";

// Sample initial document
const initialDoc: BlockArray = [
  createBlock("text", "Welcome to Mini Notion"),
  {
    ...createBlock("todo", "Complete the interview task"),
    done: false,
    children: [
      createBlock("text", "Build the state engine"),
      createBlock("text", "Implement undo/redo"),
    ],
  },
  createBlock("text", "Good luck!"),
];

export default function Home() {
  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Mini JSON Block Editor</h1>
      <EditorProvider initialDoc={initialDoc}>
        <Editor />
      </EditorProvider>
    </main>
  );
}