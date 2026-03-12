import { Block, BlockType, createEmptyBlock, mirrorBlocks } from "./types";
import { BlockItem } from "./BlockItem";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Type,
  FileText,
  Image,
  MousePointerClick,
  Quote,
  List,
  Sparkles,
  Copy,
  Minus,
  MessageSquareQuote,
} from "lucide-react";

interface BlockEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  isHebrew?: boolean;
  sourceBlocks?: Block[]; // For mirroring from other language
  onMirror?: () => void; // Callback when mirror button is clicked
}

const blockOptions: { type: BlockType; label: string; icon: React.ReactNode }[] = [
  { type: "title", label: "Title", icon: <Type className="w-4 h-4" /> },
  { type: "text", label: "Rich Text", icon: <FileText className="w-4 h-4" /> },
  { type: "image", label: "Image", icon: <Image className="w-4 h-4" /> },
  { type: "pull_quote", label: "Pull Quote", icon: <MessageSquareQuote className="w-4 h-4" /> },
  { type: "divider", label: "Divider", icon: <Minus className="w-4 h-4" /> },
  { type: "cta", label: "CTA Button", icon: <MousePointerClick className="w-4 h-4" /> },
  { type: "quote", label: "Quote", icon: <Quote className="w-4 h-4" /> },
  { type: "list", label: "Bullet List", icon: <List className="w-4 h-4" /> },
  { type: "experience", label: "Experience Card", icon: <Sparkles className="w-4 h-4" /> },
];

export function BlockEditor({ 
  blocks, 
  onChange, 
  isHebrew = false,
  sourceBlocks,
  onMirror 
}: BlockEditorProps) {
  const addBlock = (type: BlockType, index?: number) => {
    const newBlock = createEmptyBlock(type);
    if (index !== undefined) {
      const newBlocks = [...blocks];
      newBlocks.splice(index + 1, 0, newBlock);
      onChange(newBlocks);
    } else {
      onChange([...blocks, newBlock]);
    }
  };

  const updateBlock = (index: number, block: Block) => {
    const newBlocks = [...blocks];
    newBlocks[index] = block;
    onChange(newBlocks);
  };

  const deleteBlock = (index: number) => {
    onChange(blocks.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    onChange(newBlocks);
  };

  const AddBlockButton = ({ index }: { index?: number }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="w-full border-dashed">
          <Plus className="w-4 h-4 mr-2" />
          Add Block
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-48">
        {blockOptions.map((option) => (
          <DropdownMenuItem
            key={option.type}
            onClick={() => addBlock(option.type, index)}
          >
            {option.icon}
            <span className="ml-2">{option.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-3">
      {/* Mirror button for Hebrew tab */}
      {isHebrew && sourceBlocks && sourceBlocks.length > 0 && onMirror && (
        <div className="flex justify-end mb-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onMirror}
            className="gap-2"
          >
            <Copy className="w-4 h-4" />
            Mirror from English
          </Button>
        </div>
      )}

      {blocks.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <p className="text-muted-foreground mb-4">
            {isHebrew 
              ? "Start building your article by adding blocks, or mirror from English"
              : "Start building your article by adding blocks"
            }
          </p>
          <AddBlockButton />
        </div>
      ) : (
        <>
          {blocks.map((block, index) => (
            <div key={block.id}>
              <BlockItem
                block={block}
                onChange={(updated) => updateBlock(index, updated)}
                onDelete={() => deleteBlock(index)}
                onMoveUp={() => moveBlock(index, "up")}
                onMoveDown={() => moveBlock(index, "down")}
                isFirst={index === 0}
                isLast={index === blocks.length - 1}
                isHebrew={isHebrew}
              />
              {/* Add block button between blocks */}
              <div className="py-2 opacity-0 hover:opacity-100 transition-opacity">
                <AddBlockButton index={index} />
              </div>
            </div>
          ))}
        </>
      )}
      
      {blocks.length > 0 && (
        <AddBlockButton index={blocks.length - 1} />
      )}
    </div>
  );
}
