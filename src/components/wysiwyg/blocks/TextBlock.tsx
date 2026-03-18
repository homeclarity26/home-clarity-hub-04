import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";
import type { TextContent } from "../types";

interface TextBlockProps {
  content: TextContent;
  editable?: boolean;
  onChange?: (content: TextContent) => void;
}

const TextBlock = ({ content, editable, onChange }: TextBlockProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Placeholder.configure({ placeholder: "Start writing..." }),
    ],
    content: content.html || "",
    editable: !!editable,
    onUpdate: ({ editor: e }) => {
      onChange?.({ html: e.getHTML() });
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[60px]",
      },
    },
  });

  // Sync editable state
  useEffect(() => {
    if (editor && editor.isEditable !== !!editable) {
      editor.setEditable(!!editable);
    }
  }, [editor, editable]);

  if (!editable) {
    return (
      <div
        className="prose prose-sm sm:prose-base max-w-none text-foreground"
        dangerouslySetInnerHTML={{ __html: content.html || "" }}
      />
    );
  }

  return <EditorContent editor={editor} />;
};

export default TextBlock;
