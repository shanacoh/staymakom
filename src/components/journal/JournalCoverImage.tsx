import { useState, type CSSProperties } from "react";
import fallbackCover from "@/assets/hero-road-desert.jpg";

interface JournalCoverImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Image de couverture d'un article du Journal.
 * Si l'article n'a pas d'image, ou si le fichier est introuvable,
 * on affiche l'image de route du désert (image par défaut du site)
 * au lieu d'un cadre vide avec le texte alternatif.
 */
const JournalCoverImage = ({ src, alt, className, style }: JournalCoverImageProps) => {
  const [failed, setFailed] = useState(false);
  const finalSrc = !src || failed ? fallbackCover : src;

  return (
    <img
      src={finalSrc}
      alt={alt}
      loading="lazy"
      className={className}
      style={style}
      onError={() => setFailed(true)}
    />
  );
};

export default JournalCoverImage;
