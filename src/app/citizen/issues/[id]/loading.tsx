import { SkeletonCard } from "@/components/ui/Spinner";
export default function IssueDetailLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
    </div>
  );
}