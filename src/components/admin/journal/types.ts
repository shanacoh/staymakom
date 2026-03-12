export type BlockType = 'title' | 'text' | 'image' | 'cta' | 'quote' | 'list' | 'experience' | 'pull_quote' | 'divider';

export interface BaseBlock {
  id: string;
  type: BlockType;
}

export interface TitleBlock extends BaseBlock {
  type: 'title';
  content: string;
  level: 'h1' | 'h2' | 'h3';
}

export interface TextBlock extends BaseBlock {
  type: 'text';
  content: string; // Now stores HTML from rich text editor
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  url: string;
  alt: string;
  caption: string;
}

export interface CTABlock extends BaseBlock {
  type: 'cta';
  text: string;
  url: string;
}

export interface QuoteBlock extends BaseBlock {
  type: 'quote';
  content: string;
  author: string;
}

export interface ListBlock extends BaseBlock {
  type: 'list';
  items: string[];
  style: 'bullet' | 'numbered';
}

export interface ExperienceBlock extends BaseBlock {
  type: 'experience';
  experience_id: string;
}

export interface PullQuoteBlock extends BaseBlock {
  type: 'pull_quote';
  content: string;
}

export interface DividerBlock extends BaseBlock {
  type: 'divider';
}

export type Block = TitleBlock | TextBlock | ImageBlock | CTABlock | QuoteBlock | ListBlock | ExperienceBlock | PullQuoteBlock | DividerBlock;

export interface ArticleData {
  title_en: string;
  title_he: string;
  slug: string;
  cover_image: string;
  category: string;
  excerpt_en: string;
  excerpt_he: string;
  blocks_en: Block[];
  blocks_he: Block[];
  author_name: string;
  status: string;
  seo_title_en: string;
  seo_title_he: string;
  seo_title_fr: string;
  meta_description_en: string;
  meta_description_he: string;
  meta_description_fr: string;
  og_title_en: string;
  og_title_he: string;
  og_title_fr: string;
  og_description_en: string;
  og_description_he: string;
  og_description_fr: string;
  og_image: string;
}

export function generateBlockId(): string {
  return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function createEmptyBlock(type: BlockType): Block {
  const id = generateBlockId();
  
  switch (type) {
    case 'title':
      return { id, type: 'title', content: '', level: 'h2' };
    case 'text':
      return { id, type: 'text', content: '' };
    case 'image':
      return { id, type: 'image', url: '', alt: '', caption: '' };
    case 'cta':
      return { id, type: 'cta', text: '', url: '' };
    case 'quote':
      return { id, type: 'quote', content: '', author: '' };
    case 'list':
      return { id, type: 'list', items: [''], style: 'bullet' };
    case 'experience':
      return { id, type: 'experience', experience_id: '' };
    case 'pull_quote':
      return { id, type: 'pull_quote', content: '' };
    case 'divider':
      return { id, type: 'divider' };
  }
}

// Mirror blocks from one language to another (copy structure, clear text content for translation)
export function mirrorBlocks(sourceBlocks: Block[]): Block[] {
  return sourceBlocks.map(block => {
    const newId = generateBlockId();
    
    switch (block.type) {
      case 'title':
        return { ...block, id: newId, content: '' };
      case 'text':
        return { ...block, id: newId, content: '' };
      case 'image':
        // Keep image URL, clear alt and caption for translation
        return { ...block, id: newId, alt: '', caption: '' };
      case 'cta':
        // Keep URL, clear text for translation
        return { ...block, id: newId, text: '' };
      case 'quote':
        return { ...block, id: newId, content: '', author: '' };
      case 'list':
        return { ...block, id: newId, items: block.items.map(() => '') };
      case 'experience':
        // Experience blocks are copied as-is (same experience)
        return { ...block, id: newId };
      case 'pull_quote':
        return { ...block, id: newId, content: '' };
      case 'divider':
        return { ...block, id: newId };
    }
  });
}

export function calculateReadingTime(blocks: Block[]): { words: number; minutes: number } {
  let text = '';
  
  blocks.forEach(block => {
    switch (block.type) {
      case 'title':
      case 'quote':
      case 'pull_quote':
        text += ' ' + (block as any).content;
        break;
      case 'text':
        // Strip HTML tags for word count
        text += ' ' + block.content.replace(/<[^>]*>/g, '');
        break;
      case 'cta':
        text += ' ' + block.text;
        break;
      case 'list':
        text += ' ' + block.items.join(' ');
        break;
    }
  });
  
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  
  return { words, minutes };
}
