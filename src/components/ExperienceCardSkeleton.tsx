import { Skeleton } from "@/components/ui/skeleton";

export default function ExperienceCardSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Image */}
      <Skeleton className="aspect-[4/3] rounded-xl mb-2" />

      {/* Tags */}
      <div className="flex gap-1 px-0.5 -mt-0.5 mb-1">
        <Skeleton className="h-3.5 w-12 rounded-full" />
        <Skeleton className="h-3.5 w-10 rounded-full" />
      </div>

      {/* Métadonnées */}
      <div className="space-y-1.5 px-0.5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-8" />
        </div>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}
