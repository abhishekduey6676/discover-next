"use client";

import DiscoverNextLogo from "@/components/DiscoverNextLogo";

type SpotifyConnectionSheetProps = {
  open: boolean;
  isConnecting: boolean;
  error: string;
  onClose: () => void;
  onConnect: () => void;
  onUseDemo: () => void;
};

export default function SpotifyConnectionSheet({
  open,
  isConnecting,
  error,
  onClose,
  onConnect,
  onUseDemo,
}: SpotifyConnectionSheetProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/80">
      <button
        type="button"
        aria-label="Close Spotify connection dialog"
        onClick={onClose}
        className="absolute inset-0"
      />

      <section className="relative z-10 max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[32px] bg-[#242424] px-6 pb-8 pt-3 text-white">
        <div className="mx-auto h-1.5 w-12 rounded-full bg-zinc-500" />

        <div className="mt-6">
          <DiscoverNextLogo size="large" />
        </div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-green-400">
          Live Spotify playback
        </p>

        <h2 className="mt-2 text-2xl font-black">
          Connect securely through Spotify
        </h2>

        <p className="mt-3 text-sm leading-6 text-zinc-300">
          Spotify opens its own sign-in and consent screen. Discover Next never
          receives or stores your Spotify password or verification code.
        </p>

        <div className="mt-5 space-y-3 rounded-2xl bg-black/25 p-4">
          <div className="flex gap-3">
            <span className="mt-0.5 text-green-400">✓</span>
            <p className="text-sm leading-5 text-zinc-300">
              Your password and any verification step stay with Spotify.
            </p>
          </div>

          <div className="flex gap-3">
            <span className="mt-0.5 text-green-400">✓</span>
            <p className="text-sm leading-5 text-zinc-300">
              After approval, Spotify returns an authorization code—not your
              password.
            </p>
          </div>

          <div className="flex gap-3">
            <span className="mt-0.5 text-green-400">✓</span>
            <p className="text-sm leading-5 text-zinc-300">
              Playback tokens are stored only in this browser so the session
              can continue.
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs leading-5 text-zinc-500">
          Live playback requires Spotify Premium. Because this is a developer
          prototype, the Spotify account must also be authorized for this app.
        </p>

        <button
          type="button"
          onClick={onConnect}
          disabled={isConnecting}
          className="mt-6 w-full rounded-full bg-green-500 py-4 font-bold text-black disabled:bg-zinc-600 disabled:text-zinc-400"
        >
          {isConnecting
            ? "Opening Spotify..."
            : "Continue securely with Spotify"}
        </button>

        <button
          type="button"
          onClick={onUseDemo}
          className="mt-3 w-full rounded-full border border-zinc-600 py-4 font-semibold text-white"
        >
          Use interactive demo instead
        </button>

        {error && (
          <p className="mt-3 text-center text-sm text-red-400">{error}</p>
        )}
      </section>
    </div>
  );
}
