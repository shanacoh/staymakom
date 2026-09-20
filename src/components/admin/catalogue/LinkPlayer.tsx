import { useState } from "react";
import { ExternalLink, Play, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getEmbed, isHttpUrl } from "@/lib/catalogue/embed";
import { PLATFORM_LABELS, type CatalogueLink } from "@/lib/catalogue/types";

interface LinkPlayerProps {
  link: CatalogueLink;
  onDelete: () => void;
  deleting?: boolean;
}

/**
 * Un lien ou une vidéo d'un lieu. Le lecteur officiel (TikTok, Instagram, YouTube) ne se charge
 * qu'au clic : on n'appelle pas ces sites tant qu'on n'a pas demandé à voir la vidéo.
 */
export function LinkPlayer({ link, onDelete, deleting }: LinkPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const embed = getEmbed(link.url);
  const safe = isHttpUrl(link.url);

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-start gap-3">
        {link.thumbnail_url && (
          <img
            src={link.thumbnail_url}
            alt=""
            loading="lazy"
            className="h-16 w-12 shrink-0 rounded object-cover"
          />
        )}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-medium">
              {PLATFORM_LABELS[link.platform]}
            </Badge>
            {link.author && <span className="truncate text-xs text-muted-foreground">{link.author}</span>}
          </div>
          {link.caption ? (
            <p className="line-clamp-3 text-xs text-foreground">{link.caption}</p>
          ) : (
            <p className="truncate text-xs text-muted-foreground">{link.url}</p>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {embed && (
          <Button type="button" size="sm" variant="outline" onClick={() => setPlaying((p) => !p)}>
            <Play className="mr-1.5 h-3.5 w-3.5" />
            {playing ? "Masquer la vidéo" : "Lire la vidéo"}
          </Button>
        )}
        {safe && (
          <Button asChild size="sm" variant="ghost">
            <a href={link.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Ouvrir
            </a>
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="ml-auto text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          disabled={deleting}
          aria-label="Supprimer ce lien"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {!embed && link.platform === "tiktok" && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Lien court TikTok : le lecteur intégré n'est pas disponible pour l'instant, ouvre la vidéo directement dans
          TikTok.
        </p>
      )}

      {playing && embed && (
        <iframe
          src={embed.src}
          title="Lecteur vidéo"
          loading="lazy"
          allow="encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="mt-3 w-full rounded-lg border-0 bg-muted"
          style={{ height: embed.height, maxWidth: embed.maxWidth }}
        />
      )}
    </div>
  );
}
