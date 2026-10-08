// Marqueur violet « IA » : posé à côté d'un champ que l'IA vient de remplir. Il disparaît dès que
// Shana modifie le champ ou clique « Tout valider ».
export function AiMark({ show = true }: { show?: boolean }) {
  if (!show) return null;
  return (
    <span
      title="Rempli par l'IA, à relire"
      className="ml-1.5 inline-flex items-center rounded-full border border-[#d9cffd] bg-[#f3efff] px-1.5 align-middle text-[9px] font-semibold leading-4 text-[#5b3fc4]"
    >
      IA
    </span>
  );
}
