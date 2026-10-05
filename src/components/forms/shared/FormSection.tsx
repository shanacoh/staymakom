import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/forms/styled";
import { cn } from "@/lib/utils";

// Une section repliable de la page qui défile (formulaires expérience seule
// et hôtel + expérience).
export function FormSection({
  id,
  title,
  description,
  defaultOpen = true,
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card id={id}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2.5 px-2.5 py-2.5 text-left"
      >
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription className="mt-0.5">{description}</CardDescription>}
        </div>
        <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-[#6f6a63] transition-transform", open && "rotate-180")} />
      </button>
      {open && <CardContent className="pt-0">{children}</CardContent>}
    </Card>
  );
}
