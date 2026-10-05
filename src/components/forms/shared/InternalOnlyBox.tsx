import { EyeOff } from "lucide-react";

// Encadré gris-bleu pour tout ce qui est interne (coûts, net rate, marge,
// fournisseur) et ne doit jamais apparaître côté client.
export function InternalOnlyBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#e3e9ef] bg-[#eef2f6] p-3 space-y-3">
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3c4a5c] bg-white border border-[#dbe3ea] rounded-full px-2.5 py-1">
        <EyeOff className="h-3 w-3" /> Interne, jamais visible du client
      </span>
      {children}
    </div>
  );
}
