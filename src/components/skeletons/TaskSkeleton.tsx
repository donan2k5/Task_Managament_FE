import { Skeleton } from "@/components/ui/skeleton";

export const TaskCardSkeleton = () => (
  <div className="p-3 rounded-xl border border-slate-200 bg-white flex gap-3 items-start">
    <Skeleton className="w-1 h-8 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-20 rounded" />
        <Skeleton className="h-5 w-16 rounded" />
      </div>
    </div>
    <Skeleton className="w-6 h-6 rounded-full" />
  </div>
);

export const TaskListSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: count }).map((_, i) => (
      <TaskCardSkeleton key={i} />
    ))}
  </div>
);

export const TaskMatrixSkeleton = () => (
  <div className="flex flex-1 gap-6 min-h-0">
    {/* Backlog Column */}
    <div className="w-80 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex justify-between items-center mb-3">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-6 rounded-full" />
        </div>
        <Skeleton className="h-9 w-full rounded-xl" />
        <div className="flex gap-2 mt-2">
          <Skeleton className="h-7 flex-1 rounded-lg" />
          <Skeleton className="h-7 flex-1 rounded-lg" />
          <Skeleton className="h-7 w-7 rounded-lg" />
        </div>
      </div>
      <div className="flex-1 p-2 space-y-2">
        <TaskListSkeleton count={4} />
      </div>
    </div>

    {/* Matrix Grid */}
    <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-5">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-slate-200 flex flex-col bg-white/50"
        >
          <div className="flex justify-between items-center px-4 py-3 border-b bg-slate-50">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="flex-1 p-3 space-y-2">
            <TaskListSkeleton count={2} />
          </div>
        </div>
      ))}
    </div>
  </div>
);
