import { Block } from "./types";
import { Button } from "@/components/ui/button";
import DOMPurify from "dompurify";

interface ArticlePreviewProps {
  title: string;
  coverImage: string;
  excerpt: string;
  blocks: Block[];
  author: string;
  category: string;
}

export function ArticlePreview({
  title,
  coverImage,
  excerpt,
  blocks,
  author,
  category,
}: ArticlePreviewProps) {
  const renderBlock = (block: Block) => {
    switch (block.type) {
      case "title":
        const TitleTag = block.level;
        return block.content ? (
          <TitleTag
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: block.level === "h2" ? "28px" : block.level === "h3" ? "24px" : "32px",
              fontWeight: 400,
              color: "#1A1814",
              marginTop: "48px",
              marginBottom: "16px",
            }}
          >
            {block.content}
          </TitleTag>
        ) : null;

      case "text":
        return block.content ? (
          <div
            style={{ fontSize: "17px", lineHeight: 1.8, color: "#2C2825", marginBottom: "24px" }}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(block.content) }}
          />
        ) : null;

      case "image":
        return block.url ? (
          <figure className="my-6">
            <img
              src={block.url}
              alt={block.alt || "Article image"}
              className="w-full rounded-lg shadow-md"
            />
            {block.caption && (
              <figcaption className="text-sm text-center mt-2" style={{ color: "#8A8580" }}>
                {block.caption}
              </figcaption>
            )}
          </figure>
        ) : null;

      case "cta":
        return block.text ? (
          <div className="my-8 text-center">
            <Button size="lg" asChild>
              <a href={block.url} target="_blank" rel="noopener noreferrer">
                {block.text}
              </a>
            </Button>
          </div>
        ) : null;

      case "quote":
        return block.content ? (
          <blockquote className="my-6 pl-6 border-l-4" style={{ borderColor: "#B8935A" }}>
            <p className="text-xl italic" style={{ color: "#5C4A3A" }}>{block.content}</p>
            {block.author && (
              <cite className="block mt-2 text-sm font-medium">— {block.author}</cite>
            )}
          </blockquote>
        ) : null;

      case "pull_quote":
        return block.content ? (
          <blockquote
            className="italic"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "24px",
              borderLeft: "3px solid #B8935A",
              paddingLeft: "24px",
              margin: "48px auto",
              maxWidth: "560px",
              color: "#5C4A3A",
              lineHeight: 1.5,
            }}
          >
            {block.content}
          </blockquote>
        ) : null;

      case "divider":
        return (
          <div className="text-center my-12" style={{ color: "#B8935A", letterSpacing: "0.3em", fontSize: "14px" }}>
            — ✦ —
          </div>
        );

      case "list":
        const ListTag = block.style === "bullet" ? "ul" : "ol";
        const listClass =
          block.style === "bullet"
            ? "list-disc list-inside"
            : "list-decimal list-inside";
        return block.items.some((item) => item) ? (
          <ListTag className={`${listClass} my-4 space-y-2 text-lg`}>
            {block.items
              .filter((item) => item)
              .map((item, i) => (
                <li key={i}>{item}</li>
              ))}
          </ListTag>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <article className="max-w-3xl mx-auto">
      {/* Category Badge */}
      <div className="mb-4">
        <span className="inline-block px-3 py-1 text-[11px] font-medium uppercase tracking-[0.1em] rounded-full bg-[#E8E0D4] text-[#1A1814]">
          {category}
        </span>
      </div>

      {/* Title */}
      <h1
        className="mb-4"
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "clamp(32px, 5vw, 48px)",
          fontWeight: 400,
          color: "#1A1814",
        }}
      >
        {title || "Untitled Article"}
      </h1>

      {/* Author */}
      <p className="mb-6" style={{ color: "#8A8580" }}>By {author || "Unknown"}</p>

      {/* Cover Image */}
      {coverImage && (
        <img
          src={coverImage}
          alt={title}
          className="w-full aspect-video object-cover rounded-xl mb-8"
        />
      )}

      {/* Excerpt */}
      {excerpt && (
        <p
          className="mb-8 leading-relaxed"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "20px",
            color: "#5C4A3A",
          }}
        >
          {excerpt}
        </p>
      )}

      {/* Content Blocks */}
      <div style={{ maxWidth: "680px" }}>
        {blocks.map((block) => (
          <div key={block.id}>{renderBlock(block)}</div>
        ))}
      </div>

      {blocks.length === 0 && (
        <p className="text-muted-foreground text-center py-12">
          No content blocks yet. Start adding blocks to see the preview.
        </p>
      )}
    </article>
  );
}
