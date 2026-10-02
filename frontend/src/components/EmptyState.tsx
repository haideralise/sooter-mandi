export function EmptyState({ message, hint }: { message: string; hint?: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-8 text-center">
      <p className="text-neutral-700">{message}</p>
      {hint && <p className="text-sm text-neutral-500 mt-2">{hint}</p>}
    </div>
  );
}
