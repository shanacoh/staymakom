export interface AvailabilityRule {
  id: string;
  rule_type: 'days_of_week' | 'date_range' | 'specific_dates' | 'blackout';
  days_of_week: number[] | null;
  date_from: string | null;
  date_to: string | null;
  specific_dates: string[] | null;
}

export function isCheckinDisabled(date: Date, rules: AvailabilityRule[]): boolean {
  const inclusionRules = rules.filter(r => r.rule_type !== 'blackout');
  const blackoutRules = rules.filter(r => r.rule_type === 'blackout');

  for (const rule of blackoutRules) {
    if (rule.date_from && rule.date_to) {
      const from = new Date(rule.date_from); from.setHours(0, 0, 0, 0);
      const to = new Date(rule.date_to); to.setHours(23, 59, 59, 999);
      if (date >= from && date <= to) return true;
    }
  }

  if (inclusionRules.length === 0) return false;

  for (const rule of inclusionRules) {
    if (rule.rule_type === 'specific_dates' && rule.specific_dates) {
      for (const s of rule.specific_dates) {
        const d = new Date(s);
        if (
          date.getFullYear() === d.getFullYear() &&
          date.getMonth() === d.getMonth() &&
          date.getDate() === d.getDate()
        ) return false;
      }
    }
    if (rule.rule_type === 'date_range' && rule.date_from && rule.date_to) {
      const from = new Date(rule.date_from); from.setHours(0, 0, 0, 0);
      const to = new Date(rule.date_to); to.setHours(23, 59, 59, 999);
      if (date >= from && date <= to) return false;
    }
    if (rule.rule_type === 'days_of_week' && rule.days_of_week) {
      if (rule.days_of_week.includes(date.getDay())) return false;
    }
  }

  return true;
}
