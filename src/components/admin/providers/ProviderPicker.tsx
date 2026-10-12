import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronsUpDown, ExternalLink, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useProviders } from "@/lib/providers/queries";
import { providerTypeLabel, providerUrl, type Provider, type ProviderType } from "@/lib/providers/types";
import { cn } from "@/lib/utils";
import { ProviderStatusBadge } from "./ProviderBadges";
import { QuickProviderDialog } from "./QuickProviderDialog";

interface ProviderPickerProps {
  value: string | null;
  onChange: (providerId: string | null, provider: Provider | null) => void;
  /** Type proposé d'office dans « Créer un prestataire ». */
  createType?: ProviderType;
  /** Texte affiché quand aucun prestataire n'est choisi. */
  placeholder?: string;
  disabled?: boolean;
  /** Version serrée, pour une cellule de tableau. */
  compact?: boolean;
  /** Affiche le lien « Voir la fiche » sous le champ. */
  showLink?: boolean;
  className?: string;
  "aria-label"?: string;
}

/** Choisir un prestataire : recherche dans la liste, ou création sur place. */
export function ProviderPicker({
  value,
  onChange,
  createType = "experience",
  placeholder = "Choisir un prestataire",
  disabled,
  compact,
  showLink = true,
  className,
  "aria-label": ariaLabel,
}: ProviderPickerProps) {
  const { providers, isLoading } = useProviders();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  // null = fenêtre de création fermée ; sinon le nom proposé d'office.
  const [creatingName, setCreatingName] = useState<string | null>(null);

  const selected = value ? (providers.find((p) => p.id === value) ?? null) : null;
  const pick = (provider: Provider | null) => {
    onChange(provider?.id ?? null, provider);
    setOpen(false);
    setSearch("");
  };

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center gap-1">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-label={ariaLabel ?? "Prestataire"}
              disabled={disabled}
              className={cn("min-w-0 flex-1 justify-between gap-2 font-normal", compact ? "h-8 px-2 text-xs" : "h-10")}
            >
              <span className={cn("truncate", !selected && "text-muted-foreground")}>
                {selected ? selected.name : value && isLoading ? "Chargement…" : placeholder}
              </span>
              <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <Command>
              <CommandInput placeholder="Rechercher un prestataire…" value={search} onValueChange={setSearch} />
              <CommandList>
                <CommandEmpty>Aucun prestataire à ce nom.</CommandEmpty>
                <CommandGroup>
                  {providers.map((p) => (
                    <CommandItem key={p.id} value={`${p.name} ${p.id}`} onSelect={() => pick(p)} className="gap-2">
                      <Check className={cn("h-3.5 w-3.5 shrink-0", p.id === value ? "opacity-100" : "opacity-0")} />
                      <span className="min-w-0 flex-1 truncate">{p.name}</span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{providerTypeLabel(p.provider_type)}</span>
                      <ProviderStatusBadge status={p.status} />
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup forceMount>
                  <CommandItem
                    forceMount
                    value="creer-un-prestataire"
                    onSelect={() => {
                      setCreatingName(search.trim());
                      setOpen(false);
                    }}
                    className="gap-2"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Créer un prestataire{search.trim() && ` « ${search.trim()} »`}
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {selected && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("shrink-0 text-muted-foreground", compact ? "h-8 w-8" : "h-10 w-10")}
            aria-label="Retirer le prestataire"
            title="Retirer le prestataire"
            onClick={() => pick(null)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      {showLink && selected && (
        <Link
          to={providerUrl(selected.id)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          Voir la fiche de {selected.name}
          <ExternalLink className="h-3 w-3" />
        </Link>
      )}

      {creatingName !== null && (
        <QuickProviderDialog
          defaultName={creatingName}
          defaultType={createType}
          onClose={() => setCreatingName(null)}
          onCreated={(provider) => {
            setCreatingName(null);
            pick(provider);
          }}
        />
      )}
    </div>
  );
}
