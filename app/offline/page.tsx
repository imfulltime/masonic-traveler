'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="text-6xl mb-6">🔌</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">You're offline</h1>
      <p className="text-gray-600 mb-8 max-w-sm">
        Masonic Traveler needs an internet connection. Please check your connection and try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="bg-primary-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
