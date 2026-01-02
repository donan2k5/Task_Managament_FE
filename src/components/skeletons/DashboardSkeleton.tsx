import { Skeleton } from "@/components/ui/skeleton";

export const DashboardCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-8 w-8 rounded-lg" />
    </div>
    <div className="space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  </div>
);

export const DashboardHeaderSkeleton = () => (
  <div className="mb-6">
    <Skeleton className="h-8 w-48 mb-2" />
    <Skeleton className="h-4 w-32" />
  </div>
);

export const DashboardSkeleton = () => (
  <div className="p-6 max-w-7xl mx-auto">
    <DashboardHeaderSkeleton />
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Left Column */}
      <div className="lg:col-span-3 space-y-6">
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
      </div>
      {/* Right Column */}
      <div className="lg:col-span-2 space-y-6">
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
      </div>
    </div>
  </div>
);
