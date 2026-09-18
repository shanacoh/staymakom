import { ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TrendArrow({ current, previous }: { current: number; previous: number }) {
  if (current === previous) return null;
  return current > previous ? (
    <ArrowUp className="h-4 w-4 text-green-600" />
  ) : (
    <ArrowDown className="h-4 w-4 text-red-500" />
  );
}

export function Tile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="p-3 pb-1">
        <CardTitle className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">{children}</CardContent>
    </Card>
  );
}
