// Le PDF du contrat hôtel signé : texte tel que signé, signatures STAYMAKOM et hôtel côte à côte,
// trace de la signature électronique. Les lettres hébraïques sont écrites avec Noto Sans Hebrew,
// le reste avec Helvetica, et chaque ligne est remise dans l'ordre d'affichage (droite-à-gauche pour
// une ligne en hébreu, alignée à droite). Sans police hébraïque disponible, une lettre hébraïque est
// remplacée par « ? » (l'original reste dans la trace en base).

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "npm:pdf-lib@1.17.1";
import fontkit from "npm:@pdf-lib/fontkit@1.1.1";
import { isHebrew, lineIsRtl, visualRuns } from "./bidi.ts";

export interface ContractAcceptance {
  id: string;
  user_id: string | null;
  version: number;
  signer_name: string;
  signer_title: string | null;
  signature_data: string | null;
  accepted_at: string;
  ip_address: string | null;
  user_agent: string | null;
  commission_snapshot: Record<string, unknown> | null;
  contract_variables: Record<string, string> | null;
  rendered_text: string | null;
}

export interface ContractPdfInput {
  acceptance: ContractAcceptance;
  /** Noto Sans Hebrew (normal et gras), facultatives. */
  hebrewRegular?: Uint8Array | null;
  hebrewBold?: Uint8Array | null;
  /** Signature STAYMAKOM (PNG), facultative. */
  staymakomSignature?: Uint8Array | null;
}

interface FontPair {
  latin: PDFFont;
  hebrew: PDFFont | null;
}

const BRAND: [number, number, number] = [0.678, 0.078, 0.078];
const INK: [number, number, number] = [0.1, 0.1, 0.1];
const GREY: [number, number, number] = [0.42, 0.42, 0.42];

/** Ce que Helvetica sait écrire ; le reste devient « ? ». */
function latinSafe(char: string): string {
  if (char === "‘" || char === "’") return "'";
  if (char === "“" || char === "”") return '"';
  if (char === "–" || char === "—") return "-";
  return /[\x20-\x7E -ÿ]/.test(char) ? char : "?";
}

/** Découpe un morceau en segments écrits chacun avec une seule police. */
function segments(text: string, fonts: FontPair): { text: string; font: PDFFont }[] {
  const out: { text: string; font: PDFFont }[] = [];
  for (const raw of text) {
    const useHebrew = !!fonts.hebrew && isHebrew(raw);
    const font = useHebrew ? fonts.hebrew! : fonts.latin;
    const char = useHebrew ? raw : latinSafe(raw);
    const last = out[out.length - 1];
    if (last && last.font === font) last.text += char;
    else out.push({ text: char, font });
  }
  return out;
}

function measure(text: string, fonts: FontPair, size: number): number {
  return segments(text.replace(/\t/g, "  "), fonts).reduce((sum, s) => sum + s.font.widthOfTextAtSize(s.text, size), 0);
}

/** Dessine une ligne (ordre de lecture) à partir de x, ou alignée à droite si elle est en hébreu. */
function drawLine(page: PDFPage, line: string, opts: { x: number; y: number; width: number; size: number; fonts: FontPair; color: [number, number, number]; align?: "auto" | "left" }) {
  const text = line.replace(/\t/g, "  ");
  const rtl = lineIsRtl(text);
  const total = measure(text, opts.fonts, opts.size);
  let x = rtl && opts.align !== "left" ? opts.x + opts.width - total : opts.x;
  for (const run of visualRuns(text, rtl)) {
    for (const seg of segments(run.text, opts.fonts)) {
      // La police hébraïque (mise en page fontkit) dessine elle-même l'hébreu de droite à gauche :
      // on lui donne donc le mot dans l'ordre de lecture, seul l'ordre des mots vient de visualRuns.
      const drawn = seg.font === opts.fonts.hebrew ? [...seg.text].reverse().join("") : seg.text;
      page.drawText(drawn, { x, y: opts.y, size: opts.size, font: seg.font, color: rgb(...opts.color) });
      x += seg.font.widthOfTextAtSize(seg.text, opts.size);
    }
  }
}

/** Coupe un paragraphe en lignes qui tiennent dans la largeur (dans l'ordre de lecture). */
function wrap(text: string, fonts: FontPair, size: number, width: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    if (paragraph.trim() === "") {
      lines.push("");
      continue;
    }
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (measure(candidate, fonts, size) <= width) line = candidate;
      else {
        if (line) lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines;
}

function dataUrlBytes(dataUrl: string | null): Uint8Array | null {
  const match = dataUrl?.match(/^data:image\/png;base64,(.+)$/);
  if (!match) return null;
  return Uint8Array.from(atob(match[1]), (c) => c.charCodeAt(0));
}

export async function buildContractPdf(input: ContractPdfInput): Promise<Uint8Array> {
  const a = input.acceptance;
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const regular: FontPair = {
    latin: await pdf.embedFont(StandardFonts.Helvetica),
    hebrew: input.hebrewRegular ? await pdf.embedFont(input.hebrewRegular, { subset: true }) : null,
  };
  const bold: FontPair = {
    latin: await pdf.embedFont(StandardFonts.HelveticaBold),
    hebrew: input.hebrewBold ? await pdf.embedFont(input.hebrewBold, { subset: true }) : regular.hebrew,
  };

  const margin = 56;
  const size = 10;
  const leading = 14;
  let page = pdf.addPage([595.28, 841.89]);
  let y = page.getHeight() - margin;
  const width = page.getWidth() - margin * 2;
  const newPageIfNeeded = (needed: number) => {
    if (y - needed < margin) {
      page = pdf.addPage([595.28, 841.89]);
      y = page.getHeight() - margin;
    }
  };
  const write = (text: string, o: { fonts?: FontPair; s?: number; color?: [number, number, number] } = {}) => {
    const fonts = o.fonts ?? regular;
    const s = o.s ?? size;
    for (const line of wrap(text, fonts, s, width)) {
      newPageIfNeeded(leading);
      drawLine(page, line, { x: margin, y, width, size: s, fonts, color: o.color ?? INK });
      y -= s === size ? leading : s + 6;
    }
  };

  write("STAYMAKOM", { fonts: bold, s: 18, color: BRAND });
  write("Hotel Partner Agreement", { fonts: bold, s: 13 });
  write(`Contract version ${a.version} · Reference ${a.id}`, { s: 9, color: GREY });
  y -= 8;
  write(a.rendered_text ?? "");
  y -= 16;

  // Signatures côte à côte : STAYMAKOM à gauche, l'hôtel à droite.
  newPageIfNeeded(170);
  const colWidth = width / 2 - 10;
  const right = margin + colWidth + 20;
  const top = y;
  drawLine(page, "For STAYMAKOM", { x: margin, y: top, width: colWidth, size, fonts: bold, color: INK, align: "left" });
  drawLine(page, `For ${a.contract_variables?.hotel_name ?? "the hotel"}`, { x: right, y: top, width: colWidth, size, fonts: bold, color: INK, align: "left" });

  const drawSignature = async (bytes: Uint8Array | null | undefined, x: number) => {
    if (!bytes) return;
    const image = await pdf.embedPng(bytes);
    const scaled = image.scaleToFit(colWidth, 70);
    page.drawImage(image, { x, y: top - 16 - scaled.height, width: scaled.width, height: scaled.height });
  };
  await drawSignature(input.staymakomSignature, margin);
  await drawSignature(dataUrlBytes(a.signature_data), right);

  const signedAt = new Date(a.accepted_at).toLocaleString("en-GB", { timeZone: "Asia/Jerusalem", dateStyle: "long", timeStyle: "short" });
  drawLine(page, a.signer_name, { x: right, y: top - 100, width: colWidth, size: 9, fonts: regular, color: INK, align: "left" });
  if (a.signer_title) drawLine(page, a.signer_title, { x: right, y: top - 112, width: colWidth, size: 9, fonts: regular, color: INK, align: "left" });
  drawLine(page, `Signed on ${signedAt} (Israel time)`, { x: right, y: top - 124, width: colWidth, size: 9, fonts: regular, color: GREY, align: "left" });
  y = top - 150;

  write("Electronic signature record", { fonts: bold, s: 10 });
  for (const line of [
    `Signed at: ${a.accepted_at} (UTC)`,
    `Signer: ${a.signer_name}${a.signer_title ? `, ${a.signer_title}` : ""} · declared authorized to sign on behalf of the hotel`,
    `User account: ${a.user_id ?? "-"}`,
    `IP address: ${a.ip_address ?? "-"}`,
    `Browser: ${a.user_agent ?? "-"}`,
    `Commission recorded: ${JSON.stringify(a.commission_snapshot ?? {})}`,
  ]) {
    write(line, { s: 8, color: GREY });
  }
  return await pdf.save();
}
