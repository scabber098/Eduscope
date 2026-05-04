// === FILE: client/src/components/Skeleton.jsx ===
export default function Skeleton({ className = '' }) {
  return <div className={`shimmer ${className}`}/>;
}
export function SkeletonCard() {
  return <div className="glass p-6"><Skeleton className="h-4 w-1/3 mb-4"/><Skeleton className="h-8 w-2/3 mb-3"/><Skeleton className="h-4 w-full mb-2"/><Skeleton className="h-4 w-4/5"/></div>;
}
export function SkeletonRow() {
  return <div className="flex items-center gap-4 py-3"><Skeleton className="h-10 w-10 rounded-full"/><div className="flex-1"><Skeleton className="h-4 w-1/3 mb-2"/><Skeleton className="h-3 w-1/2"/></div></div>;
}
