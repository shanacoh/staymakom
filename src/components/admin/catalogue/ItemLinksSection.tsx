import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { detectPlatform, isHttpUrl } from "@/lib/catalogue/embed";
import {
  errorMessage,
  useAddCatalogueLink,
  useCatalogueLinks,
  useDeleteCatalogueLink,
} from "@/lib/catalogue/queries";
import { LinkPlayer } from "./LinkPlayer";

/** Les liens et vidéos d'un lieu (plusieurs possibles), avec ajout et suppression. */
export function ItemLinksSection({ itemId }: { itemId: string }) {
  const { data: links = [], isLoading } = useCatalogueLinks(itemId);
  const add = useAddCatalogueLink();
  const remove = useDeleteCatalogueLink();
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isHttpUrl(url)) {
      setError("Colle un lien complet, qui commence par https://");
      return;
    }
    setError(null);
    try {
      await add.mutateAsync({ itemId, link: { url, platform: detectPlatform(url), caption } });
      setUrl("");
      setCaption("");
      toast.success("Lien ajouté");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const confirmRemove = (linkId: string) => {
    if (!window.confirm("Supprimer ce lien du catalogue ?")) return;
    remove.mutate(
      { linkId, itemId },
      { onError: (e) => toast.error(errorMessage(e)), onSuccess: () => toast.success("Lien supprimé") }
    );
  };

  return (
    <div className="space-y-3">
      {isLoading && <p className="text-xs text-muted-foreground">Chargement des liens...</p>}
      {!isLoading && links.length === 0 && (
        <p className="text-xs text-muted-foreground">Aucun lien pour l'instant.</p>
      )}
      {links.map((link) => (
        <LinkPlayer
          key={link.id}
          link={link}
          onDelete={() => confirmRemove(link.id)}
          deleting={remove.isPending && remove.variables?.linkId === link.id}
        />
      ))}

      <form onSubmit={submit} className="space-y-2 rounded-lg border border-dashed border-border p-3">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Ajouter un lien (TikTok, Instagram, site...)"
          inputMode="url"
          aria-label="Adresse du lien à ajouter"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        {url.trim() !== "" && (
          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Légende ou note (facultatif)"
            rows={2}
            aria-label="Légende du lien"
          />
        )}
        <Button type="submit" size="sm" variant="outline" disabled={add.isPending || url.trim() === ""}>
          {add.isPending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-1.5 h-3.5 w-3.5" />}
          Ajouter ce lien
        </Button>
      </form>
    </div>
  );
}
