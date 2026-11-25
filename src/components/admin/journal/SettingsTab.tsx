// Onglet « Réglages » du Journal : interrupteur de publication automatique, heure de
// publication, dates clés vérifiées, mots interdits (3 langues), noms de prestataires.
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface Settings {
  auto_publish: boolean;
  publish_hour: number;
  manual_review_remaining: number;
  forbidden_words: Record<string, string[]>;
  provider_aliases: string[];
  provider_allowlist: string[];
  notify_email: string;
  key_dates: string;
  chain_names: string[];
}

const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

export function SettingsTab() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-journal-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("journal_settings" as any).select("*").eq("id", true).single();
      if (error) throw error;
      return data as unknown as Settings;
    },
  });
  const [form, setForm] = useState<Settings | null>(null);
  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = useMutation({
    mutationFn: async (fields: Partial<Settings>) => {
      const { error } = await supabase.from("journal_settings" as any).update(fields).eq("id", true);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-journal-settings"] });
      toast.success("Réglages enregistrés");
    },
    onError: (e: any) => toast.error(e?.message || "Enregistrement impossible"),
  });

  if (!form) return <div className="py-12 text-center">Chargement...</div>;

  const words = (lang: string) => (form.forbidden_words?.[lang] || []).join("\n");
  const setWords = (lang: string, value: string) => setForm({ ...form, forbidden_words: { ...form.forbidden_words, [lang]: lines(value) } });

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-start justify-between gap-6 border rounded-lg p-4">
        <div>
          <p className="font-medium">Publication automatique</p>
          <p className="text-sm text-muted-foreground">
            Éteint = plus rien ne se publie tout seul (les articles programmés attendent). Les articles continuent d'être rédigés chaque matin.
          </p>
          {form.manual_review_remaining > 0 && (
            <p className="text-sm mt-2">
              Calibrage en cours : les {form.manual_review_remaining} prochain(s) article(s) attendront ta validation, même s'ils passent les contrôles.
            </p>
          )}
        </div>
        <Switch
          checked={form.auto_publish}
          onCheckedChange={(checked) => {
            setForm({ ...form, auto_publish: checked });
            save.mutate({ auto_publish: checked });
          }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Heure de publication (heure d'Israël)</Label>
          <Input type="number" min={0} max={23} value={form.publish_hour} onChange={(e) => setForm({ ...form, publish_hour: Number(e.target.value) })} />
          <p className="text-xs text-muted-foreground mt-1">Rédaction à 05:00, publication à cette heure le même jour.</p>
        </div>
        <div>
          <Label>Email qui reçoit le compte rendu</Label>
          <Input value={form.notify_email} onChange={(e) => setForm({ ...form, notify_email: e.target.value })} />
        </div>
      </div>

      <div>
        <Label>Dates clés vérifiées (fêtes, événements)</Label>
        <Textarea rows={4} value={form.key_dates} onChange={(e) => setForm({ ...form, key_dates: e.target.value })} />
        <p className="text-xs text-muted-foreground mt-1">
          Le rédacteur n'écrit que ces dates-là. Une ligne par date, en anglais (ex. « Passover 2027: from the evening of ... »).
        </p>
      </div>

      <div>
        <Label>Mots interdits (sécurité, guerre, politique), un par ligne</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
          {(["en", "fr", "he"] as const).map((lang) => (
            <div key={lang}>
              <p className="text-xs text-muted-foreground mb-1">{lang === "en" ? "Anglais" : lang === "fr" ? "Français" : "Hébreu"}</p>
              <Textarea rows={12} dir={lang === "he" ? "rtl" : undefined} value={words(lang)} onChange={(e) => setWords(lang, e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Autres noms de prestataires à bloquer</Label>
          <Textarea rows={8} value={form.provider_aliases.join("\n")} onChange={(e) => setForm({ ...form, provider_aliases: lines(e.target.value) })} />
          <p className="text-xs text-muted-foreground mt-1">En plus de la liste des prestataires du back-office (variantes, noms en hébreu...).</p>
        </div>
        <div>
          <Label>Prestataires autorisés (sites publics)</Label>
          <Textarea rows={8} value={form.provider_allowlist.join("\n")} onChange={(e) => setForm({ ...form, provider_allowlist: lines(e.target.value) })} />
          <p className="text-xs text-muted-foreground mt-1">Ex. « City of David » : c'est aussi le nom d'un lieu public.</p>
        </div>
      </div>

      <div>
        <Label>Grandes chaînes jamais citées (une par ligne)</Label>
        <Textarea rows={6} value={(form.chain_names || []).join("\n")} onChange={(e) => setForm({ ...form, chain_names: lines(e.target.value) })} />
        <p className="text-xs text-muted-foreground mt-1">Un article qui en cite une est bloqué. Le rédacteur ne recommande que des adresses de chef, nouvelles ou citées par la presse.</p>
      </div>

      <Button
        onClick={() =>
          save.mutate({
            publish_hour: Math.min(23, Math.max(0, form.publish_hour)),
            notify_email: form.notify_email.trim(),
            key_dates: form.key_dates,
            forbidden_words: form.forbidden_words,
            provider_aliases: form.provider_aliases,
            provider_allowlist: form.provider_allowlist,
            chain_names: form.chain_names,
          })
        }
        disabled={save.isPending}
      >
        Enregistrer les réglages
      </Button>
    </div>
  );
}
