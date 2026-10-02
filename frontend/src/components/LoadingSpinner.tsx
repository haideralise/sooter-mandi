export function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="text-center py-8">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      {label && <p className="text-neutral-600 mt-4">{label}</p>}
    </div>
  );
}
