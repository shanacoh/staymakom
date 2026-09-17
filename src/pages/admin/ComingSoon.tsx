type ComingSoonProps = {
  title: string;
  description?: string;
};

export default function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card px-8 py-24 text-center">
      <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-destructive">
        Bientôt disponible
      </span>
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      {description && (
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
