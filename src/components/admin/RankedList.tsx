import { Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface RankedItem {
  key: string;
  label: string;
  sublabel?: string;
  count: number;
}

export function RankedList({
  title,
  items,
  emptyLabel = "Aucune donnée",
  maxRows = 5,
  icon = <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />,
}: {
  title: string;
  items: RankedItem[];
  emptyLabel?: string;
  maxRows?: number;
  icon?: React.ReactNode;
}) {
  const rows = items.slice(0, maxRows);
  return (
    <Card>
      <CardHeader className="p-3 pb-1">
        <CardTitle className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        {rows.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">{emptyLabel}</p>
        ) : (
          <div className="divide-y">
            {rows.map((item, i) => (
              <div key={item.key} className="flex items-center gap-3 py-2">
                <span className="font-mono text-xs text-muted-foreground w-4 shrink-0">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{item.label}</div>
                  {item.sublabel && (
                    <div className="text-xs text-muted-foreground truncate">{item.sublabel}</div>
                  )}
                </div>
                <span className="flex items-center gap-1 shrink-0 font-mono text-sm font-bold">
                  {icon}
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
