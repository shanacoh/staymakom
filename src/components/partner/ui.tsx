// Petites briques d'affichage de l'espace partenaire. Sobre : noir et gris neutres, pensé pour le
// téléphone. Gabarit volontairement compact et aéré (textes 13 px, champs et boutons de 38-40 px) :
// l'espace ne doit pas donner l'impression d'un gros formulaire. Le rouge n'apparaît que pour ce
// qui attend une action.

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-[12px] border border-neutral-200/80 bg-white p-3.5 sm:p-4", className)}>{children}</section>;
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center justify-between gap-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-500">{children}</h2>
      {aside}
    </div>
  );
}

export function Hint({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-[12px] leading-relaxed text-neutral-500", className)}>{children}</p>;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { busy?: boolean };

export function PrimaryButton({ busy, children, className, disabled, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || busy}
      className={cn(
        "inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-full bg-neutral-900 px-5 text-[13px] font-semibold text-white transition-colors",
        "hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300 sm:w-auto",
        className,
      )}
      {...props}
    >
      {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function QuietButton({ busy, children, className, disabled, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || busy}
      className={cn(
        "inline-flex min-h-[36px] items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-4 text-[13px] font-medium text-neutral-900 transition-colors",
        "hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-400",
        className,
      )}
      {...props}
    >
      {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

const FIELD_CLASS =
  "w-full rounded-[9px] border border-neutral-200 bg-white px-3 py-2 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 disabled:bg-neutral-100 disabled:text-neutral-500";

interface FieldShellProps {
  label: string;
  hint?: ReactNode;
  optional?: string;
  children: ReactNode;
}

function FieldShell({ label, hint, optional, children }: FieldShellProps) {
  return (
    <label className="block space-y-1">
      <span className="flex items-baseline gap-2 text-[12px] font-medium text-neutral-700">
        {label}
        {optional && <span className="font-normal text-neutral-400">{optional}</span>}
      </span>
      {children}
      {hint && <span className="block text-[11px] leading-relaxed text-neutral-500">{hint}</span>}
    </label>
  );
}

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  label: string;
  hint?: ReactNode;
  optional?: string;
  onChange: (value: string) => void;
};

export function TextField({ label, hint, optional, onChange, className, ...props }: TextFieldProps) {
  return (
    <FieldShell label={label} hint={hint} optional={optional}>
      <input className={cn(FIELD_CLASS, className)} onChange={(e) => onChange(e.target.value)} {...props} />
    </FieldShell>
  );
}

type TextAreaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> & {
  label: string;
  hint?: ReactNode;
  optional?: string;
  onChange: (value: string) => void;
};

export function TextAreaField({ label, hint, optional, onChange, className, rows = 3, ...props }: TextAreaFieldProps) {
  return (
    <FieldShell label={label} hint={hint} optional={optional}>
      <textarea rows={rows} className={cn(FIELD_CLASS, "resize-y", className)} onChange={(e) => onChange(e.target.value)} {...props} />
    </FieldShell>
  );
}

export function SelectField({
  label,
  hint,
  value,
  onChange,
  options,
}: {
  label: string;
  hint?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <FieldShell label={label} hint={hint}>
      <select className={FIELD_CLASS} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

/** Pastille d'état. `urgent` (rouge) est réservé à ce qui attend une action du partenaire. */
export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "strong" | "muted" | "urgent" }) {
  const tones = {
    neutral: "border border-neutral-300 text-neutral-700",
    strong: "bg-neutral-900 text-white",
    muted: "bg-neutral-100 text-neutral-500",
    urgent: "bg-[#ad1414] text-white",
  };
  return <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold", tones[tone])}>{children}</span>;
}

export function Notice({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "urgent" }) {
  return (
    <div
      className={cn(
        "rounded-[9px] px-3 py-2.5 text-[12px] leading-relaxed",
        tone === "urgent" ? "border border-[#ad1414]/30 bg-[#ad1414]/5 text-[#8a1010]" : "bg-neutral-100 text-neutral-700",
      )}
    >
      {children}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-[12px] border border-dashed border-neutral-300 px-4 py-6 text-center text-[13px] text-neutral-500">{children}</p>;
}

export function PageLoader({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-neutral-500" aria-busy="true">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      {label}
    </div>
  );
}
