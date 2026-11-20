/**
 * Référence courte d'un clic « Demander sur WhatsApp » (cartes bateau).
 * Glissée dans le message pré-rempli, puis tapée par Shana dans la recherche
 * du back-office pour retrouver la ligne correspondante.
 */
export const whatsappReference = (requestId: string): string => requestId.slice(0, 6).toUpperCase();
