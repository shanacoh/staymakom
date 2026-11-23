import { describe, expect, it } from "vitest";
import { lineIsRtl, visualRuns } from "./bidi";

const visual = (line: string) => visualRuns(line).map((r) => r.text).join("");

describe("ordre d'affichage hébreu / latin du PDF", () => {
  it("une ligne latine reste telle quelle", () => {
    expect(lineIsRtl("Hotel Test Ltd")).toBe(false);
    expect(visual("Hotel Test Ltd")).toBe("Hotel Test Ltd");
  });
  it("une ligne en hébreu se dessine de droite à gauche", () => {
    expect(lineIsRtl("מלון הים")).toBe(true);
    expect(visual("מלון הים")).toBe("םיה ןולמ");
  });
  it("un nombre garde son ordre dans une ligne en hébreu", () => {
    expect(visual("עמלה 15%")).toBe("15% הלמע");
  });
  it("un nom hébreu dans une phrase anglaise", () => {
    expect(visual("For מלון הים")).toBe("For םיה ןולמ");
  });
  it("le point final d'une phrase en hébreu reste en fin de phrase", () => {
    expect(visual("בתאריך 23/11/2026.")).toBe(".23/11/2026 ךיראתב");
  });
});
