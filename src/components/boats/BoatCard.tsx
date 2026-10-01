/**
 * Carte d'un bateau : la carte standard d'expérience seule, avec les 3 bulles
 * fixes (durée, capacité, skipper) et le prix total du bateau. Un clic ne
 * navigue pas : il demande d'ouvrir la pop-up de détail (BoatDetailModal).
 * Partagée entre la vitrine /boat et la page catégorie Bateaux.
 */
import StandaloneExperienceCard from "@/components/StandaloneExperienceCard";

interface BoatCardProps {
  boat: any;
  index: number;
  onSelect: (boatId: string) => void;
  badge?: string | null;
}

const BoatCard = ({ boat, index, onSelect, badge }: BoatCardProps) => (
  <div
    onClickCapture={(e) => { e.preventDefault(); onSelect(boat.id); }}
    role="button"
    tabIndex={0}
  >
    <StandaloneExperienceCard
      experience={boat}
      index={index}
      linkPrefix="/boat"
      showTotalPrice
      isBoat
      badge={badge}
    />
  </div>
);

export default BoatCard;
