/**
 * Cancellation Policy Analyzer
 * Parses raw HyperGuest cancellationPolicies[] and returns structured info
 */

export interface RawCancellationPolicy {
  daysBefore?: number;
  penaltyType?: string; // "percent" | "currency" | "nights"
  amount?: number;
  timeSetting?: {
    timeFromCheckIn?: number;
    timeFromCheckInType?: string; // "days" | "hours"
  };
  cancellationDeadlineHour?: string; // "HH:mm"
}

export interface CancellationPenalty {
  daysBefore: number;
  penaltyType: string;
  amount: number;
  description: string;
}

export interface CancellationAnalysis {
  isFreeCancellation: boolean;
  isNonRefundable: boolean;
  effectiveDeadline: Date | null;
  penalties: CancellationPenalty[];
  /** Short text for badge display */
  badgeText: string;
  /** Full summary (kept for backwards compat / email) */
  summaryText: string;
  /** Detailed lines for tooltip (intermediate case only) */
  detailLines: string[];
}

type Lang = "en" | "he" | "fr";

/**
 * Calculate the effective cancellation deadline.
 * Formula: checkInDate at cancellationDeadlineHour minus timeFromCheckIn (hours or days)
 */
function calcDeadline(
  checkInDate: string,
  deadlineHour: string | undefined,
  timeSetting: RawCancellationPolicy["timeSetting"]
): Date | null {
  if (!checkInDate) return null;

  const checkIn = new Date(checkInDate + "T00:00:00");
  if (isNaN(checkIn.getTime())) return null;

  // Apply deadline hour (e.g. "19:00")
  if (deadlineHour) {
    const [h, m] = deadlineHour.split(":").map(Number);
    if (!isNaN(h)) checkIn.setHours(h, m || 0, 0, 0);
  }

  // Subtract timeFromCheckIn
  if (timeSetting?.timeFromCheckIn != null && timeSetting.timeFromCheckIn > 0) {
    if (timeSetting.timeFromCheckInType === "hours") {
      checkIn.setTime(checkIn.getTime() - timeSetting.timeFromCheckIn * 60 * 60 * 1000);
    } else {
      // default: days
      checkIn.setDate(checkIn.getDate() - timeSetting.timeFromCheckIn);
    }
  }

  return checkIn;
}

/**
 * Format a deadline date smartly:
 * - If time is midnight (00:00), show date only
 * - Otherwise show date + time in 24h format
 */
function formatDeadline(date: Date, lang: Lang): string {
  const locale = lang === "he" ? "he-IL" : lang === "fr" ? "fr-FR" : "en-US";
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const isMidnight = hours === 0 && minutes === 0;

  const dateStr = date.toLocaleDateString(locale, {
    month: "long",
    day: "numeric",
  });

  if (isMidnight) {
    return dateStr;
  }

  // Format time in 24h for he/fr, 12h for en
  if (lang === "en") {
    const period = hours >= 12 ? "PM" : "AM";
    const displayHour = hours % 12 || 12;
    const timeStr = minutes > 0 ? `${displayHour}:${String(minutes).padStart(2, "0")} ${period}` : `${displayHour} ${period}`;
    return `${dateStr}, ${timeStr}`;
  }

  const timeStr = `${String(hours).padStart(2, "0")}h${minutes > 0 ? String(minutes).padStart(2, "0") : ""}`;

  if (lang === "he") {
    return `${dateStr} בשעה ${timeStr.replace("h", ":")}`;
  }

  return `${dateStr} à ${timeStr}`;
}

function penaltyDescription(p: RawCancellationPolicy, lang: Lang): string {
  const amount = p.amount ?? 0;
  switch (p.penaltyType) {
    case "nights":
      if (lang === "he") return `${amount} ${amount === 1 ? "לילה" : "לילות"} חיוב`;
      if (lang === "fr") return `${amount} nuit${amount > 1 ? "s" : ""} de pénalité`;
      return `${amount} night${amount > 1 ? "s" : ""} penalty`;
    case "percent":
      if (lang === "he") return `${amount}%`;
      if (lang === "fr") return `${amount}%`;
      return `${amount}%`;
    case "currency":
      if (lang === "he") return `${amount} חיוב`;
      if (lang === "fr") return `${amount} de pénalité`;
      return `${amount} penalty`;
    default:
      return `${amount}`;
  }
}

/** Short badge label for penalty */
function penaltyBadgeShort(p: RawCancellationPolicy, lang: Lang): string {
  const amount = p.amount ?? 0;
  switch (p.penaltyType) {
    case "nights":
      if (lang === "he") return `חיוב ${amount} ${amount === 1 ? "לילה" : "לילות"}`;
      if (lang === "fr") return `Pénalité : ${amount} nuit${amount > 1 ? "s" : ""}`;
      return `${amount} night${amount > 1 ? "s" : ""} penalty`;
    case "percent":
      if (lang === "he") return `קנס ${amount}%`;
      if (lang === "fr") return `Pénalité : ${amount}%`;
      return `${amount}% penalty`;
    case "currency":
      if (lang === "he") return `קנס ${amount}`;
      if (lang === "fr") return `Pénalité : ${amount}`;
      return `${amount} penalty`;
    default:
      return `${amount}`;
  }
}

/** Detailed line for tooltip: "More than X days before: Y% penalty" */
function penaltyDetailLine(p: RawCancellationPolicy, lang: Lang): string {
  const days = p.daysBefore ?? 0;
  const desc = penaltyDescription(p, lang);

  if (lang === "he") {
    return `יותר מ-${days} ימים לפני: ${desc}`;
  }
  if (lang === "fr") {
    return `Plus de ${days} jour${days > 1 ? "s" : ""} avant : pénalité de ${desc}`;
  }
  return `More than ${days} day${days > 1 ? "s" : ""} before: ${desc} penalty`;
}

export function analyzeCancellationPolicies(
  policies: RawCancellationPolicy[] | undefined | null,
  checkInDate: string | undefined | null,
  lang: Lang = "en"
): CancellationAnalysis {
  const empty: CancellationAnalysis = {
    isFreeCancellation: false,
    isNonRefundable: false,
    effectiveDeadline: null,
    penalties: [],
    badgeText: "",
    summaryText: "",
    detailLines: [],
  };

  if (!policies || policies.length === 0) {
    return empty;
  }

  // Detect non-refundable: daysBefore >= 999 & amount === 100 & penaltyType === "percent"
  const nonRefundable = policies.some(
    (p) => (p.daysBefore ?? 0) >= 999 && p.amount === 100 && p.penaltyType === "percent"
  );

  if (nonRefundable) {
    const text =
      lang === "he" ? "ללא החזר" :
      lang === "fr" ? "Non remboursable" :
      "Non-refundable";
    return {
      isFreeCancellation: false,
      isNonRefundable: true,
      effectiveDeadline: null,
      penalties: policies.map((p) => ({
        daysBefore: p.daysBefore ?? 0,
        penaltyType: p.penaltyType ?? "percent",
        amount: p.amount ?? 0,
        description: penaltyDescription(p, lang),
      })),
      badgeText: text,
      summaryText: text,
      detailLines: [],
    };
  }

  // Sort by daysBefore descending to find the earliest applicable rule
  const sorted = [...policies].sort((a, b) => (b.daysBefore ?? 0) - (a.daysBefore ?? 0));

  // Find deadline from the first policy that has timing info
  let deadline: Date | null = null;
  for (const p of sorted) {
    if (checkInDate && (p.timeSetting || p.cancellationDeadlineHour)) {
      deadline = calcDeadline(checkInDate, p.cancellationDeadlineHour, p.timeSetting);
      if (deadline) break;
    }
  }

  // If no specific timing, try to derive from daysBefore
  if (!deadline && checkInDate && sorted.length > 0) {
    const firstWithDays = sorted.find((p) => p.daysBefore != null && p.daysBefore < 999);
    if (firstWithDays) {
      const d = new Date(checkInDate + "T00:00:00");
      d.setDate(d.getDate() - (firstWithDays.daysBefore ?? 0));
      deadline = d;
    }
  }

  // Determine if currently free cancellation
  const now = new Date();
  const isFree = deadline ? now < deadline : policies.every((p) => (p.amount ?? 0) === 0);

  const penaltiesList = policies
    .filter((p) => (p.amount ?? 0) > 0 && (p.daysBefore ?? 0) < 999)
    .sort((a, b) => (b.daysBefore ?? 0) - (a.daysBefore ?? 0))
    .map((p) => ({
      daysBefore: p.daysBefore ?? 0,
      penaltyType: p.penaltyType ?? "percent",
      amount: p.amount ?? 0,
      description: penaltyDescription(p, lang),
    }));

  // Build texts
  let badgeText = "";
  let summaryText = "";
  let detailLines: string[] = [];

  if (isFree && deadline) {
    const deadlineStr = formatDeadline(deadline, lang);
    badgeText =
      lang === "he" ? `ביטול חינם עד ${deadlineStr}` :
      lang === "fr" ? `Annulation gratuite jusqu'au ${deadlineStr}` :
      `Free cancellation until ${deadlineStr}`;
    summaryText = badgeText;
  } else if (isFree) {
    badgeText =
      lang === "he" ? "ביטול חינם" :
      lang === "fr" ? "Annulation gratuite" :
      "Free cancellation";
    summaryText = badgeText;
  } else if (penaltiesList.length > 0) {
    // Short badge: show first (most lenient / earliest) penalty only
    const firstPenalty = sorted.find((p) => (p.amount ?? 0) > 0 && (p.daysBefore ?? 0) < 999);
    if (firstPenalty) {
      badgeText = penaltyBadgeShort(firstPenalty, lang);
    }

    // Full summary for email/recap
    const penaltyStr = penaltiesList.map((p) => p.description).join("; ");
    summaryText =
      lang === "he" ? `תנאי ביטול: ${penaltyStr}` :
      lang === "fr" ? `Conditions d'annulation : ${penaltyStr}` :
      `Cancellation terms: ${penaltyStr}`;

    // Detail lines for tooltip
    detailLines = sorted
      .filter((p) => (p.amount ?? 0) > 0 && (p.daysBefore ?? 0) < 999)
      .map((p) => penaltyDetailLine(p, lang));
  }

  return {
    isFreeCancellation: isFree,
    isNonRefundable: false,
    effectiveDeadline: deadline,
    penalties: penaltiesList,
    badgeText,
    summaryText,
    detailLines,
  };
}
