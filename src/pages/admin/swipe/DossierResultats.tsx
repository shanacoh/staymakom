import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Download, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  useDossier,
  useDossierPropositions,
  useDossierParticipants,
  useDossierSwipes,
  useSwipeCategories,
} from "@/lib/swipe/queries";

const AdminSwipeDossierResultats = () => {
  const { dossierId } = useParams<{ dossierId: string }>();
  const { data: dossier } = useDossier(dossierId);
  const { data: dossierPropositions } = useDossierPropositions(dossierId);
  const { data: participants } = useDossierParticipants(dossierId);
  const { data: categories } = useSwipeCategories();
  const dossierPropositionIds = (dossierPropositions ?? []).map((dp) => dp.id);
  const { data: swipes } = useDossierSwipes(dossierId, dossierPropositionIds);

  const [filtreCategorie, setFiltreCategorie] = useState<string>("toutes");
  const [triParScore, setTriParScore] = useState(true);

  const lignes = useMemo(() => {
    if (!dossierPropositions || !swipes) return [];
    return dossierPropositions.map((dp) => {
      const swipesDeLaLigne = swipes.filter((s) => s.dossier_proposition_id === dp.id);
      const parParticipant: Record<string, { valeur: boolean | null; coupDeCoeur: boolean }> = {};
      (participants ?? []).forEach((p) => {
        const s = swipesDeLaLigne.find((sw) => sw.participant_id === p.id);
        parParticipant[p.id] = { valeur: s ? s.valeur : null, coupDeCoeur: s?.coup_de_coeur ?? false };
      });
      return {
        dossierProposition: dp,
        parParticipant,
        score: swipesDeLaLigne.filter((s) => s.valeur).length,
        nbIndispensables: swipesDeLaLigne.filter((s) => s.coup_de_coeur).length,
      };
    });
  }, [dossierPropositions, swipes, participants]);

  const lignesFiltrees = useMemo(() => {
    let result = lignes;
    if (filtreCategorie !== "toutes") {
      result = result.filter((l) => l.dossierProposition.propositions.categorie_id === filtreCategorie);
    }
    if (triParScore) {
      result = [...result].sort((a, b) => b.score - a.score);
    }
    return result;
  }, [lignes, filtreCategorie, triParScore]);

  const propositionsAimeesParTous = useMemo(() => {
    if (!participants || participants.length === 0) return [];
    return lignes.filter((l) =>
      participants.every((p) => l.parParticipant[p.id]?.valeur === true)
    );
  }, [lignes, participants]);

  if (!dossier) return <div className="p-6">Chargement...</div>;

  const exporterCsv = () => {
    const entetes = ["Proposition", "Catégorie", "Score", "Indispensables", ...(participants ?? []).map((p) => p.prenom)];
    const lignesCsv = lignesFiltrees.map((l) => {
      const base = [
        l.dossierProposition.propositions.titre,
        l.dossierProposition.propositions.swipe_categories?.nom ?? "",
        l.score.toString(),
        l.nbIndispensables.toString(),
      ];
      const parParticipantValeurs = (participants ?? []).map((p) => {
        const cell = l.parParticipant[p.id];
        if (!cell || cell.valeur === null) return "";
        const base = cell.valeur ? "Aimé" : "Passé";
        return cell.coupDeCoeur ? `${base} (indispensable)` : base;
      });
      return [...base, ...parParticipantValeurs];
    });
    const csv = [entetes, ...lignesCsv]
      .map((ligne) => ligne.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resultats-${dossier.nom_client}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <Link to="/admin/swipe/dossiers" className="text-sm text-muted-foreground hover:underline inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Retour aux dossiers
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Résultats — {dossier.nom_client}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={dossier.statut_lecture === "termine" ? "default" : "outline"}>
              {dossier.statut_lecture === "termine" ? "Terminé" : dossier.statut_lecture === "vu" ? "Vu" : "Envoyé"}
            </Badge>
            {dossier.premiere_ouverture_at && (
              <span className="text-sm text-muted-foreground">
                Première ouverture le {format(new Date(dossier.premiere_ouverture_at), "d MMM yyyy à HH:mm", { locale: fr })}
              </span>
            )}
          </div>
        </div>
        <Button variant="outline" onClick={exporterCsv}>
          <Download className="w-4 h-4 mr-1" /> Exporter en CSV
        </Button>
      </div>

      <div className="flex gap-2 mb-4">
        <Select value={filtreCategorie} onValueChange={setFiltreCategorie}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="toutes">Toutes les catégories</SelectItem>
            {categories?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => setTriParScore((v) => !v)}>
          <ArrowUpDown className="w-4 h-4 mr-1" /> {triParScore ? "Trié par score" : "Trier par score"}
        </Button>
      </div>

      <div className="overflow-x-auto border rounded-md mb-8">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2">Proposition</th>
              <th className="text-left p-2">Score</th>
              <th className="text-left p-2">Indispensables</th>
              {participants?.map((p) => (
                <th key={p.id} className="text-center p-2">
                  {p.prenom}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lignesFiltrees.map((l) => (
              <tr key={l.dossierProposition.id} className="border-t">
                <td className="p-2 font-medium">{l.dossierProposition.propositions.titre}</td>
                <td className="p-2">{l.score}</td>
                <td className="p-2">{l.nbIndispensables}</td>
                {participants?.map((p) => {
                  const cell = l.parParticipant[p.id];
                  return (
                    <td key={p.id} className="text-center p-2">
                      {cell?.valeur === true ? "❤️" : cell?.valeur === false ? "✕" : "—"}
                      {cell?.coupDeCoeur ? " ⭐" : ""}
                    </td>
                  );
                })}
              </tr>
            ))}
            {lignesFiltrees.length === 0 && (
              <tr>
                <td colSpan={3 + (participants?.length ?? 0)} className="p-4 text-center text-muted-foreground">
                  Aucune donnée pour ce filtre.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="border rounded-md p-4">
        <h2 className="text-lg font-semibold mb-2">Générer l'itinéraire</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Propositions aimées par <strong>tous</strong> les participants — la base de l'itinéraire à affiner
          manuellement. Le format d'export final (fichier ou lien dédié) sera branché ici une fois choisi.
        </p>
        {propositionsAimeesParTous.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {(participants?.length ?? 0) === 0
              ? "Aucun participant n'a encore swipé ce dossier."
              : "Aucune proposition n'a encore été aimée par tous les participants."}
          </p>
        ) : (
          <ul className="space-y-1 text-sm list-disc list-inside">
            {propositionsAimeesParTous.map((l) => (
              <li key={l.dossierProposition.id}>
                <strong>{l.dossierProposition.propositions.titre}</strong>
                {l.dossierProposition.propositions.description
                  ? ` — ${l.dossierProposition.propositions.description}`
                  : ""}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminSwipeDossierResultats;
