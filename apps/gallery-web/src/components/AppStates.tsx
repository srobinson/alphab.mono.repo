interface AppStatesProps {
  isLoading: boolean;
  error: string | null;
  isEmpty: boolean;
  totalImages: number;
}

export function LoadingState({ totalImages }: { totalImages: number }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-lg">Loading gallery...</p>
        <p className="text-sm text-white/60 mt-2">
          {totalImages > 0 ? `Fetching ${totalImages} images...` : "Fetching images..."}
        </p>
      </div>
    </div>
  );
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

export function EmptyState() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">🖼️</div>
        <p className="text-lg">No images found in gallery</p>
      </div>
    </div>
  );
}

export function AppStates({ isLoading, error, isEmpty, totalImages }: AppStatesProps) {
  if (isLoading) return <LoadingState totalImages={totalImages} />;
  if (error) return <ErrorState error={error} />;
  if (isEmpty) return <EmptyState />;
  return null;
}
