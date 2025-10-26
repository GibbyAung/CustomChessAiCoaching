"use client";

import dynamic from "next/dynamic";
import { ToastProvider } from "@/contexts/ToastContext";
import { CoachingProvider } from "@/contexts/CoachingContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Dynamically import ModernChessGame to prevent SSR issues
const ModernChessGame = dynamic(
  () =>
    import("@/components/ModernChessGame").then((mod) => ({
      default: mod.ModernChessGame,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
          <div className="text-white text-lg">Loading Chess Game...</div>
        </div>
      </div>
    ),
  }
);

export default function Home() {
  return (
    <ToastProvider>
      <CoachingProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.02%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>

          {/* Floating Orbs */}
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

          <div className="relative z-10 container mx-auto px-4 py-8">
            {/* Header */}
            <header className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl mb-6">
                <svg
                  className="w-8 h-8 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Chess Engine
              </h1>
              <p className="text-xl text-white/70 max-w-2xl mx-auto">
                A modern chess game with AI coaching capabilities. Experience
                the perfect blend of strategy and technology.
              </p>
            </header>

            {/* Main Game Component */}
            <main>
              <ErrorBoundary>
                <ModernChessGame />
              </ErrorBoundary>
            </main>

            {/* Footer */}
            <footer className="mt-16 text-center">
              <div className="inline-flex items-center space-x-2 text-white/50">
                <span>Built with</span>
                <div className="flex items-center space-x-1">
                  <span className="text-blue-400">Next.js</span>
                  <span>•</span>
                  <span className="text-blue-400">TypeScript</span>
                  <span>•</span>
                  <span className="text-blue-400">chess.js</span>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </CoachingProvider>
    </ToastProvider>
  );
}
