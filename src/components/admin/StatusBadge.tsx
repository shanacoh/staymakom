import { Badge } from "@/components/ui/badge";

type StatusType = "published" | "draft" | "archived" | "hidden" | "pending" | string;

const statusStyles: Record<string, string> = {
  published: "bg-[#DCFCE7] text-[#16A34A] border-[#DCFCE7] hover:bg-[#DCFCE7]",
  draft: "bg-[#FEF9C3] text-[#CA8A04] border-[#FEF9C3] hover:bg-[#FEF9C3]",
  pending: "bg-[#FEF9C3] text-[#CA8A04] border-[#FEF9C3] hover:bg-[#FEF9C3]",
  archived: "bg-[#F3F4F6] text-[#6B7280] border-[#F3F4F6] hover:bg-[#F3F4F6]",
  hidden: "bg-[#F3F4F6] text-[#6B7280] border-[#F3F4F6] hover:bg-[#F3F4F6]",
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const style = statusStyles[status] || statusStyles.draft;

  return (
    <Badge
      variant="outline"
      className={`rounded-md font-medium capitalize ${style} ${className || ""}`}
    >
      {status}
    </Badge>
  );
};

/** Warning badge for missing data */
export const WarningBadge = ({ label, tooltip }: { label: string; tooltip?: string }) => (
  <span
    className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 border border-red-200"
    title={tooltip}
  >
    ⚠ {label}
  </span>
);
