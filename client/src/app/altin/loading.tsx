import { SkeletonTable } from '@/components/ui/Skeleton';
import { Skeleton } from '@/components/ui/Skeleton';

export default function AltinLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
      <Skeleton className="mb-2 h-8 w-48" />
      <Skeleton className="mb-6 h-5 w-80" />
      <div className="mb-4 flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-lg" />
        ))}
      </div>
      <SkeletonTable rows={8} cols={5} />
    </div>
  );
}
