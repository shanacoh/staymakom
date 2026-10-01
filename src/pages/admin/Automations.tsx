import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Eye, Loader2, Mail, CreditCard, Star, Activity } from "lucide-react";
import {
  AUTOMATIONS,
  AUTOMATIONS_A_VENIR,
  type Automation,
  type AutomationCategorie,
} from "@/config/automations";

const CATEGORIE_LABELS: Record<AutomationCategorie, string> = {
  email: "Emails",
  paiement: "Paiement",
  avis: "Avis clients",
  monitoring: "Monitoring",
};

const CATEGORIE_ICONS: Record<AutomationCategorie, typeof Mail> = {
  email: Mail,
  paiement: CreditCard,
  avis: Star,
  monitoring: Activity,
};

const STATUT_BADGE: Record<Automation["statut"], { label: string; className: string }> = {
  actif: { label: "Actif", className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" },
  a_confirmer: { label: "À confirmer", className: "bg-amber-100 text-amber-700 hover:bg-amber-100" },
  desactive: { label: "Désactivé", className: "bg-neutral-200 text-neutral-600 hover:bg-neutral-200" },
};

function AutomationCard({ automation, onPreview }: { automation: Automation; onPreview: (a: Automation) => void }) {
  const [loading, setLoading] = useState(false);
  const badge = STATUT_BADGE[automation.statut];

  const handlePreview = async () => {
    setLoading(true);
    try {
      await onPreview(automation);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold">{automation.nom}</CardTitle>
          <Badge variant="secondary" className={badge.className}>{badge.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-2">
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Déclencheur</p>
          <p className="text-sm text-foreground/90">{automation.declencheur}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Action</p>
          <p className="text-sm text-foreground/90">{automation.action}</p>
        </div>
        {automation.destinataire && (
          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Destinataire</p>
            <p className="text-sm text-foreground/90">{automation.destinataire}</p>
          </div>
        )}
        {automation.notes && (
          <p className="text-xs text-muted-foreground italic">{automation.notes}</p>
        )}
        {automation.previewable && (
          <Button size="sm" variant="outline" onClick={handlePreview} disabled={loading} className="mt-2">
            {loading ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Eye className="h-3.5 w-3.5 mr-2" />}
            Voir l'aperçu
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

const AdminAutomations = () => {
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>("");

  const handlePreview = async (automation: Automation) => {
    if (!automation.fonctionEdge) return;
    try {
      const { data, error } = await supabase.functions.invoke(automation.fonctionEdge, {
        body: automation.previewPayload ?? { preview: true },
      });
      if (error) throw error;
      if (!data?.html) {
        toast.error("Aucun aperçu renvoyé par cette automatisation");
        return;
      }
      setPreviewTitle(data.subject || automation.nom);
      setPreviewHtml(data.html);
    } catch (err: any) {
      toast.error(err.message || "Impossible de générer l'aperçu");
    }
  };

  const categories: AutomationCategorie[] = ["email", "paiement", "avis", "monitoring"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Automatisations</h1>
        <p className="text-muted-foreground text-xs mt-1">
          Tout ce qui s'envoie ou se déclenche automatiquement sur le site : emails, paiements, avis, monitoring.
          Chaque nouvelle automatisation doit être ajoutée ici au moment où elle est développée.
        </p>
      </div>

      {categories.map((categorie) => {
        const items = AUTOMATIONS.filter((a) => a.categorie === categorie);
        if (items.length === 0) return null;
        const Icon = CATEGORIE_ICONS[categorie];
        return (
          <div key={categorie} className="space-y-3">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {CATEGORIE_LABELS[categorie]}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((automation) => (
                <AutomationCard key={automation.id} automation={automation} onPreview={handlePreview} />
              ))}
            </div>
          </div>
        );
      })}

      {AUTOMATIONS_A_VENIR.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">À venir</h2>
          <Card>
            <CardContent className="p-4">
              <ul className="space-y-3">
                {AUTOMATIONS_A_VENIR.map((item) => (
                  <li key={item.id}>
                    <p className="text-sm font-medium">{item.nom}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                    <p className="text-[11px] text-muted-foreground/70 mt-0.5">{item.origine}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={!!previewHtml} onOpenChange={(open) => !open && setPreviewHtml(null)}>
        <DialogContent className="!w-[95vw] !max-w-3xl !h-[90vh] !grid-rows-[auto_1fr] p-4">
          <DialogHeader>
            <DialogTitle className="text-sm">{previewTitle}</DialogTitle>
          </DialogHeader>
          {previewHtml && (
            <iframe
              srcDoc={previewHtml}
              className="w-full h-full min-h-0 border rounded-md bg-white"
              title="Aperçu de l'email"
              sandbox=""
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAutomations;
