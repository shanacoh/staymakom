import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Link as TiptapLink } from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { useEffect, useRef, useCallback } from 'react';
import { 
  Bold, 
  Italic, 
  Strikethrough,
  List, 
  ListOrdered, 
  Link as LinkIcon,
  Palette,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  RemoveFormatting,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  dir?: 'ltr' | 'rtl';
}

const COLORS = [
  { hex: '#1a2c3d', label: 'Navy' },
  { hex: '#1d4ed8', label: 'Blue' },
  { hex: '#15803d', label: 'Green' },
  { hex: '#b45309', label: 'Amber' },
  { hex: '#b91c1c', label: 'Red' },
  { hex: '#7c3aed', label: 'Purple' },
  { hex: '#0f766e', label: 'Teal' },
  { hex: '#9f1239', label: 'Rose' },
  { hex: '#78350f', label: 'Brown' },
  { hex: '#374151', label: 'Gray' },
];

const RichTextEditor = ({ content, onChange, placeholder, dir = 'ltr' }: RichTextEditorProps) => {
  // Track whether the change originated from the editor itself (user typing/formatting)
  const isInternalChange = useRef(false);

  const handleUpdate = useCallback(({ editor }: { editor: any }) => {
    isInternalChange.current = true;
    onChange(editor.getHTML());
  }, [onChange]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right'],
        defaultAlignment: 'left',
      }),
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
    ],
    content,
    onUpdate: handleUpdate,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4',
          'prose-headings:font-bold prose-headings:text-foreground',
          'prose-p:text-foreground prose-p:leading-relaxed',
          'prose-strong:text-foreground prose-strong:font-bold',
          'prose-em:italic',
          'prose-ul:list-disc prose-ul:pl-5',
          'prose-ol:list-decimal prose-ol:pl-5',
          'prose-li:text-foreground',
          'prose-a:text-primary prose-a:underline',
          'prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg',
        ),
        dir,
        'data-placeholder': placeholder || '',
      },
    },
  });

  // Sync content prop changes with editor ONLY when the change comes from outside
  // (e.g. async data loading), never when the user is actively editing
  useEffect(() => {
    if (!editor) return;

    // If the change originated from the editor's own onUpdate, skip the sync
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }

    // External content change (form reset, async load) — sync it
    const currentHTML = editor.getHTML();
    if (content !== currentHTML) {
      // Preserve cursor position when possible
      const { from, to } = editor.state.selection;
      editor.commands.setContent(content || '', { emitUpdate: false });
      // Try to restore selection if the doc is long enough
      try {
        const maxPos = editor.state.doc.content.size;
        const safeFrom = Math.min(from, maxPos);
        const safeTo = Math.min(to, maxPos);
        editor.commands.setTextSelection({ from: safeFrom, to: safeTo });
      } catch {
        // Selection restore failed, that's fine
      }
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL:', previousUrl || '');
    if (url === null) return; // cancelled
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const ToolbarButton = ({ 
    onClick, 
    isActive, 
    title, 
    children 
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    title: string; 
    children: React.ReactNode 
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      title={title}
      className={cn(
        "h-8 w-8 p-0 hover:bg-accent/50",
        isActive && "bg-primary text-primary-foreground hover:bg-primary/90"
      )}
    >
      {children}
    </Button>
  );

  const Separator = () => <div className="w-px h-6 bg-border mx-1 self-center" />;

  return (
    <div className="border border-input rounded-lg overflow-hidden bg-card shadow-sm">
      {/* Toolbar */}
      <div className="border-b border-border p-1.5 flex flex-wrap gap-0.5 bg-muted/20 items-center">
        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Titre H1"
        >
          <Heading1 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Titre H2"
        >
          <Heading2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Titre H3"
        >
          <Heading3 className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Separator />

        {/* Text Formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Gras"
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italique"
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Barré"
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Separator />

        {/* Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="Aligner à gauche"
        >
          <AlignLeft className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Centrer"
        >
          <AlignCenter className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Aligner à droite"
        >
          <AlignRight className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Separator />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Liste à puces"
        >
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Liste numérotée"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Separator />

        {/* Link */}
        <ToolbarButton
          onClick={setLink}
          isActive={editor.isActive('link')}
          title="Lien"
        >
          <LinkIcon className="h-3.5 w-3.5" />
        </ToolbarButton>

        {/* Color Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              title="Couleur du texte"
              className="h-8 w-8 p-0 hover:bg-accent/50 relative"
            >
              <Palette className="h-3.5 w-3.5" />
              <span
                className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-4 rounded-sm"
                style={{ backgroundColor: editor.getAttributes('textStyle').color || '#1a2c3d' }}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Couleur du texte</p>
            <div className="grid grid-cols-5 gap-1.5">
              {COLORS.map(({ hex, label }) => (
                <button
                  key={hex}
                  type="button"
                  title={label}
                  className={cn(
                    "w-7 h-7 rounded-md border-2 transition-transform hover:scale-110",
                    editor.isActive('textStyle', { color: hex }) 
                      ? "border-primary scale-110" 
                      : "border-transparent"
                  )}
                  style={{ backgroundColor: hex }}
                  onClick={() => editor.chain().focus().setColor(hex).run()}
                />
              ))}
            </div>
            <button
              type="button"
              className="mt-2 text-xs text-muted-foreground hover:text-foreground w-full text-left"
              onClick={() => editor.chain().focus().unsetColor().run()}
            >
              ✕ Réinitialiser la couleur
            </button>
          </PopoverContent>
        </Popover>

        <Separator />

        {/* Clear formatting */}
        <ToolbarButton
          onClick={() => {
            editor.chain().focus().clearNodes().unsetAllMarks().run();
            // Also reset alignment to default
            editor.chain().focus().setTextAlign('left').run();
          }}
          title="Effacer la mise en forme"
        >
          <RemoveFormatting className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div className="flex-1" />

        {/* Undo / Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          title="Annuler"
        >
          <Undo className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          title="Rétablir"
        >
          <Redo className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>

      {/* Editor Content */}
      <div className="relative">
        <EditorContent editor={editor} />
        {/* Placeholder */}
        {editor.isEmpty && placeholder && (
          <p className="absolute top-4 left-4 text-muted-foreground/50 text-sm pointer-events-none select-none">
            {placeholder}
          </p>
        )}
      </div>

      {/* Preview label */}
      <div className="border-t border-border px-4 py-1.5 bg-muted/10 flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wide font-medium">Rendu en direct</span>
        <div className="flex-1 h-px bg-border" />
        <span className="text-[10px] text-muted-foreground/50">HTML</span>
      </div>
    </div>
  );
};

export default RichTextEditor;
