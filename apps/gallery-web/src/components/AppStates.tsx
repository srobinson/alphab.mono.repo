import { LoadingProgress } from "./LoadingProgress";
interface AppStatesProps {
  isLoading: boolean;
  error: string | null;
  isEmpty: boolean;
  totalImages: number;
}

export function AppStates({ isLoading, error, isEmpty, totalImages }: AppStatesProps) {
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (isEmpty) return <EmptyState />;
  return null;
}

export function EmptyState() {
  return <LoadingProgress isLoaded={false} />;
}

export function LoadingState() {
  return <LoadingProgress isLoaded={false} />;
}

export function ErrorState({ error }: { error: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="text-red-400 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold mb-4">Failed to Load Gallery</h2>
        <p className="text-white/70 mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
