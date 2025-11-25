import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      {/* Hero Section Skeleton */}
      <div className="flex flex-col items-center gap-8">
        <Skeleton className="h-12 w-3/4 max-w-lg" />
        <Skeleton className="h-14 w-full max-w-2xl" />
        
        {/* Daily Verse Skeleton */}
        <div className="w-full max-w-4xl space-y-4 border rounded-lg p-6">
          <Skeleton className="h-8 w-48 mx-auto" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-5/6 mx-auto" />
            <Skeleton className="h-6 w-4/6 mx-auto" />
          </div>
          <div className="flex justify-between pt-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>

      {/* CTA Skeleton */}
      <div className="w-full max-w-4xl mx-auto">
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>

      {/* Posts Grid Skeleton */}
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col space-y-3">
              <Skeleton className="h-48 w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}