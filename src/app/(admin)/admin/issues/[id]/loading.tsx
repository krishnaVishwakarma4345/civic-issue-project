import { SkeletonCard } from "@/components/ui/Spinner";
export default function AdminIssueDetailLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
    </div>
  );
}