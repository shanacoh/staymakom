// Calculette de prix d'une expérience (back-office, encadré interne).
// Deux façons de remplir, côte à côte, sur une seule ligne par tarif :
// - « Marge % » : on tape le prix d'achat et la marge, le prix client se calcule ;
// - « Achat + vente » : on tape le prix d'achat et le prix client, la marge se déduit.
// Le composant n'enregistre rien lui-même : il affiche les valeurs reçues et remonte chaque saisie.

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export type PriceMode = "markup" | "price";

interface PriceLine {
  cost: number;
  sale: number | undefined;
}

interface PriceCalculatorProps {
  mode: PriceMode;
  onModeChange: (mode: PriceMode) => void;
  currencySymbol: string;
  isFixed: boolean;
  /** Taille de groupe utilisée pour le « à partir de » d'un forfait (0 = inconnue). */
  groupSize: number;
  markupPercent: number;
  onMarkupChange: (value: number) => void;
  adult: PriceLine;
  child: PriceLine;
  hasChildPrice: boolean;
  onHasChildPriceChange: (value: boolean) => void;
  onCostChange: (line: "adult" | "child", value: number) => void;
  onSaleChange: (line: "adult" | "child", value: number | undefined) => void;
  costError?: string;
  disabled?: boolean;
}

const toNumber = (raw: string): number | undefined => (raw === "" ? undefined : parseFloat(raw));
const formatPercent = (value: number) => `${Math.round(value * 10) / 10} %`;

function MoneyInput({ value, onChange, symbol, disabled, strong, ariaLabel }: {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  symbol: string;
  disabled?: boolean;
  strong?: boolean;
  ariaLabel: string;
}) {
  return (
    <div className="relative">
      <input
        type="number"
        min={0}
        step="0.01"
        aria-label={ariaLabel}
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => onChange(toNumber(e.target.value))}
        className={cn(
          "h-9 w-full rounded-md border border-input bg-background pl-2.5 pr-7 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50",
          strong && "font-semibold",
        )}
      />
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{symbol}</span>
    </div>
  );
}

export function PriceCalculator(props: PriceCalculatorProps) {
  const {
    mode, onModeChange, currencySymbol, isFixed, groupSize, markupPercent, onMarkupChange,
    adult, child, hasChildPrice, onHasChildPriceChange, onCostChange, onSaleChange, costError, disabled,
  } = props;

  const lines: { key: "adult" | "child"; label: string; line: PriceLine }[] = [
    { key: "adult", label: isFixed ? "Forfait groupe" : "Adulte", line: adult },
    ...(!isFixed && hasChildPrice ? [{ key: "child" as const, label: "Enfant", line: child }] : []),
  ];

  const marginOf = (line: PriceLine) => (line.sale ?? 0) - line.cost;
  const percentOf = (line: PriceLine) => (line.cost > 0 && line.sale ? ((line.sale - line.cost) / line.cost) * 100 : 0);
  const perPerson = isFixed && groupSize > 0 && adult.sale ? Math.ceil(adult.sale / groupSize) : null;

  return (
    <div className="space-y-3">
      {/* Les deux façons de remplir, au même niveau */}
      <div className="inline-flex rounded-full border bg-muted/40 p-0.5 text-xs font-medium">
        {([
          ["markup", "Marge %"],
          ["price", "Achat + vente"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            disabled={disabled}
            onClick={() => onModeChange(value)}
            className={cn(
              "rounded-full px-3 py-1 transition-colors",
              mode === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[96px_minmax(0,1fr)_88px_minmax(0,1fr)_72px] items-center gap-x-2 gap-y-2 max-w-2xl">
        <span />
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Achat</span>
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Marge</span>
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Prix client</span>
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground text-right">Gain</span>

        {lines.map(({ key, label, line }) => (
          <div key={key} className="contents">
            <span className="text-sm text-muted-foreground">{label}</span>
            <MoneyInput
              ariaLabel={`Prix d'achat ${label}`}
              value={line.cost || undefined}
              onChange={(v) => onCostChange(key, v ?? 0)}
              symbol={currencySymbol}
              disabled={disabled}
            />
            {mode === "markup" && key === "adult" ? (
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={999}
                  step="0.5"
                  aria-label="Marge en pourcentage"
                  value={markupPercent}
                  disabled={disabled}
                  onChange={(e) => onMarkupChange(Math.min(999, Math.max(0, toNumber(e.target.value) ?? 0)))}
                  className="h-9 w-full rounded-md border border-input bg-background pl-2.5 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                />
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground pl-1">
                {formatPercent(percentOf(line))}
              </span>
            )}
            {mode === "price" ? (
              <MoneyInput
                ariaLabel={`Prix client ${label}`}
                value={line.sale}
                onChange={(v) => onSaleChange(key, v)}
                symbol={currencySymbol}
                disabled={disabled}
                strong
              />
            ) : (
              <span className="text-base font-semibold pl-1">
                {line.sale ?? 0} <span className="text-xs font-normal text-muted-foreground">{currencySymbol}</span>
              </span>
            )}
            <span className={cn("text-sm text-right", marginOf(line) < 0 ? "text-destructive" : "text-[#1f7a4d]")}>
              {marginOf(line) >= 0 ? "+" : ""}{Math.round(marginOf(line))} {currencySymbol}
            </span>
          </div>
        ))}
      </div>

      {costError && <p className="text-destructive text-xs">{costError}</p>}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
        {!isFixed && (
          <label className="flex items-center gap-2 cursor-pointer">
            <Switch checked={hasChildPrice} onCheckedChange={onHasChildPriceChange} disabled={disabled} />
            Tarif enfant différent
          </label>
        )}
        {isFixed && (
          <span>
            {perPerson !== null
              ? `Affiché « à partir de ${perPerson} ${currencySymbol} / pers. » (groupe de ${groupSize})`
              : "Renseigne le nombre max de personnes pour le « à partir de » par personne"}
          </span>
        )}
        <span>
          {mode === "markup"
            ? "Tape le prix d'achat et la marge : le prix client se calcule."
            : "Tape le prix d'achat et le prix client : la marge se calcule."}
        </span>
      </div>
    </div>
  );
}
