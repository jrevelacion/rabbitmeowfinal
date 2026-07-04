import { cn } from "@/lib/utils";

interface MediaSkeletonProps {
  listView?: boolean;
}

export function MediaSkeleton({ listView }: MediaSkeletonProps) {
  return (
    <div className={cn(
      "rounded-lg overflow-hidden",
      listView ? "flex gap-4 w-full" : "flex flex-col"
    )}>
      <div className={cn(
        "bg-accent/10 animate-pulse",
        listView ? "w-[180px] h-[100px]" : "aspect-[2/3] w-full"
      )} />
      <div className={cn(
        "flex flex-col gap-2",
        listView ? "py-2" : "p-4"
      )}>
        <div className="h-4 bg-accent/10 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-accent/10 rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
}

export function MediaGridSkeleton({ listView }: MediaSkeletonProps) {
  return (
    <div className={cn(
      "grid gap-6",
      listView ? "grid-cols-1" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
    )}>
      {Array.from({ length: 20 }).map((_, i) => (
        <MediaSkeleton key={i} listView={listView} />
      ))}
    </div>
  );
}