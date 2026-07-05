"use client";

import { useEffect, useState } from "react";
import { loginWithSpotify, spotifyFetch } from "@/lib/spotifyAuth";
import DiscoverQueueLogo from "@/components/DiscoverQueueLogo";
import SpotifyPlayer from "@/components/SpotifyPlayer";
import DemoSpotifyPlayer from "@/components/DemoSpotifyPlayer";
import SpotifyConnectionSheet from "@/components/SpotifyConnectionSheet";
import DemoTrackCover from "@/components/DemoTrackCover";
import {
  DEFAULT_DEMO_TRACK,
  DEMO_TRACKS,
  type DemoTrack,
} from "@/lib/demoTracks";

type DiscoveryLevel = "Safe" | "Balanced" | "Adventurous";
type AppView = "intro" | "home" | "discover";
type ExperienceMode = "demo" | "live";

type NowPlayingContext = {
  title: string;
  artist: string;
};

type DiscoveryTrack = {
  title: string;
  artist: string;
  art: string;
  tag: "Familiar bridge" | "New to you" | "Stretch pick";
  reason: string;
};

type QueueDisplayTrack = {
  title: string;
  artist: string;
  art: string;
  artwork?: string;
  uri: string;
};

type DiscoverApiResponse = {
  tracks: DiscoveryTrack[];
  summary: string;
  usedFallback?: boolean;
  error?: string;
};

const promptChips = [
  "Something I have never heard",
  "More upbeat",
  "Calmer and acoustic",
  "Same mood, new artists",
  "Less familiar",
  "More adventurous",
  "Party energy",
  "Late-night calm",
];

const defaultPrompt = "";

function getTrackKey(track: Pick<DiscoveryTrack, "title" | "artist">) {
  return `${track.title} - ${track.artist}`;
}

function formatTrackNames(tracks: DiscoveryTrack[]) {
  if (tracks.length === 0) {
    return "none from the previous queue";
  }

  const visibleNames = tracks.slice(0, 3).map((track) => track.title);
  const remaining = tracks.length - visibleNames.length;

  return remaining > 0
    ? `${visibleNames.join(", ")} +${remaining} more`
    : visibleNames.join(", ");
}

function buildQueueDiff(
  previousTracks: DiscoveryTrack[],
  nextTracks: DiscoveryTrack[],
) {
  const previousKeys = new Set(previousTracks.map(getTrackKey));

  const kept = nextTracks.filter((track) =>
    previousKeys.has(getTrackKey(track)),
  );

  const added = nextTracks.filter(
    (track) => !previousKeys.has(getTrackKey(track)),
  );

  return `Kept: ${formatTrackNames(kept)}. Added: ${formatTrackNames(added)}.`;
}

function getTagClasses(tag: DiscoveryTrack["tag"]) {
  if (tag === "Familiar bridge") {
    return "bg-blue-500/15 text-blue-300";
  }

  if (tag === "Stretch pick") {
    return "bg-purple-500/15 text-purple-300";
  }

  return "bg-green-500/15 text-green-400";
}

function getDiscoveryDescription(level: DiscoveryLevel) {
  if (level === "Safe") {
    return {
      title: "40% familiar · 60% discovery",
      description:
        "Two familiar bridges keep the queue close before three new artists.",
    };
  }

  if (level === "Adventurous") {
    return {
      title: "0% familiar · 100% discovery",
      description: "Five discovery tracks, including two wider stretch picks.",
    };
  }

  return {
    title: "20% familiar · 80% discovery",
    description: "One familiar bridge, three new artists and one stretch pick.",
  };
}

function getPromptPlaceholder(nowPlaying: NowPlayingContext | null) {
  if (nowPlaying) {
    return `e.g. Keep the mood of ${nowPlaying.title}, but introduce new artists`;
  }

  return "e.g. Upbeat party tracks from artists I have not heard";
}

function MusicalAnchorIcon() {
  return (
    <div
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-green-400"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="5" r="2.25" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M12 7.5v10M8.5 11.5h7M5 14.5c.8 3.2 3.4 5 7 5s6.2-1.8 7-5M5 14.5l-1.5 2M5 14.5l2 1M19 14.5l1.5 2M19 14.5l-2 1"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<AppView>("intro");
  const [experienceMode, setExperienceMode] =
    useState<ExperienceMode | null>(null);
  const [connectDestination, setConnectDestination] =
    useState<AppView>("home");
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [demoNotice, setDemoNotice] = useState("");

  const [authState, setAuthState] = useState<
    "checking" | "signedOut" | "signedIn"
  >("checking");
  const [isConnecting, setIsConnecting] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [isUpdatingQueue, setIsUpdatingQueue] = useState(false);
  const [spotifyQueueError, setSpotifyQueueError] = useState("");
  const [queuedTracks, setQueuedTracks] = useState<QueueDisplayTrack[]>([]);
  const [nowPlaying, setNowPlaying] = useState<NowPlayingContext | null>(null);
  const [selectedDemoTrack, setSelectedDemoTrack] =
    useState<DemoTrack>(DEFAULT_DEMO_TRACK);

  const [isDiscoverySheetOpen, setIsDiscoverySheetOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [queueUpdated, setQueueUpdated] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [resultMode, setResultMode] = useState<"first" | "refine">("first");
  const [queueChangeSummary, setQueueChangeSummary] = useState("");

  const [prompt, setPrompt] = useState(defaultPrompt);
  const [level, setLevel] = useState<DiscoveryLevel>("Balanced");

  const [generatedTracks, setGeneratedTracks] = useState<DiscoveryTrack[]>([]);
  const [excludedTrackKeys, setExcludedTrackKeys] = useState<string[]>([]);
  const [aiSummary, setAiSummary] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [usedFallback, setUsedFallback] = useState(false);

  useEffect(() => {
    const hasSpotifySession = Boolean(
      localStorage.getItem("spotify_access_token") ||
        localStorage.getItem("spotify_refresh_token"),
    );

    setAuthState(hasSpotifySession ? "signedIn" : "signedOut");

    const returnView =
      localStorage.getItem("discover_queue_return_view") ??
      localStorage.getItem("discover_next_return_view");

    const storedMode =
      localStorage.getItem("discover_queue_experience_mode") ??
      localStorage.getItem("discover_next_experience_mode");

    if (
      hasSpotifySession &&
      storedMode === "live" &&
      (returnView === "home" || returnView === "discover")
    ) {
      localStorage.removeItem("discover_queue_return_view");
      localStorage.removeItem("discover_next_return_view");
      setExperienceMode("live");
      setView(returnView);
    }
  }, []);

  async function connectSpotify() {
    setIsConnecting(true);
    setLoginError("");

    localStorage.setItem(
      "discover_queue_experience_mode",
      "live",
    );
    localStorage.setItem(
      "discover_queue_return_view",
      connectDestination,
    );

    try {
      await loginWithSpotify();
    } catch (error) {
      console.error(error);

      setLoginError(
        error instanceof Error
          ? error.message
          : "Could not start Spotify login.",
      );

      setIsConnecting(false);
    }
  }

  function startInteractiveDemo(destination: AppView = "home") {
    setExperienceMode("demo");
    setIsConnectModalOpen(false);
    setLoginError("");
    setView(destination);
    setDemoNotice("");
  }

  function openLiveConnection(destination: AppView = "home") {
    setConnectDestination(destination);

    if (authState === "signedIn") {
      setExperienceMode("live");
      setView(destination);
      return;
    }

    setIsConnectModalOpen(true);
  }

  function openDiscoverNext() {
    if (experienceMode === "demo") {
      setView("discover");
      return;
    }

    if (experienceMode === "live" && authState === "signedIn") {
      setView("discover");
      return;
    }

    openLiveConnection("discover");
  }

  function useInteractiveDemoInstead() {
    startInteractiveDemo(connectDestination);
  }

  function chooseAnotherMode() {
    setView("intro");
    setExperienceMode(null);
    setIsConnectModalOpen(false);
    setDemoNotice("");
  }

  function playDemoTrack(track: DemoTrack) {
    setExperienceMode("demo");
    setSelectedDemoTrack(track);
    setQueuedTracks([]);
    setGeneratedTracks([]);
    setShowResults(false);
    setQueueUpdated(false);
    setQueueChangeSummary("");
    setResultMode("first");
    setPrompt("");
    setView("discover");
  }

  function showDemoNotice(message = "This area is not available in the demo.") {
    setDemoNotice(message);

    window.setTimeout(() => {
      setDemoNotice("");
    }, 2400);
  }

  const discoveryDescription = getDiscoveryDescription(level);

  function openDiscoveryBuilder(
    prefilledPrompt?: string,
    refineMode = false,
  ) {
    setGenerationError("");
    setSpotifyQueueError("");
    setIsRefining(refineMode);

    if (prefilledPrompt) {
      setPrompt(prefilledPrompt);
    }

    setIsDiscoverySheetOpen(true);
  }

  async function buildDiscoveryQueue() {
    if (isGenerating) {
      return;
    }

    const previousTracks =
      isRefining && generatedTracks.length > 0 ? generatedTracks : [];

    const currentQueueKeys = new Set(previousTracks.map(getTrackKey));

    const exclusionsForRequest = isRefining
      ? excludedTrackKeys.filter((key) => !currentQueueKeys.has(key))
      : excludedTrackKeys;

    setIsGenerating(true);
    setGenerationError("");
    setSpotifyQueueError("");
    setQueueUpdated(false);
    setUsedFallback(false);

    try {
      const response = await fetch("/api/discover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          level,
          excludedTracks: exclusionsForRequest,
          previousTracks: previousTracks.map(getTrackKey),
          nowPlaying,
        }),
      });

      const data = (await response.json()) as DiscoverApiResponse;

      if (!response.ok) {
        throw new Error(
          data.error || "Could not generate Discover Queue.",
        );
      }

      if (!Array.isArray(data.tracks) || data.tracks.length !== 5) {
        throw new Error("The AI did not return a complete five-song queue.");
      }

      const refinedExistingQueue = previousTracks.length > 0;

      setResultMode(refinedExistingQueue ? "refine" : "first");
      setQueueChangeSummary(
        refinedExistingQueue
          ? buildQueueDiff(previousTracks, data.tracks)
          : "",
      );

      setGeneratedTracks(data.tracks);
      setAiSummary(data.summary);
      setUsedFallback(Boolean(data.usedFallback));

      const newTrackKeys = data.tracks.map(getTrackKey);

      setExcludedTrackKeys((previous) =>
        Array.from(new Set([...previous, ...newTrackKeys])).slice(-25),
      );

      setIsDiscoverySheetOpen(false);
      setShowResults(true);
      setIsRefining(false);
    } catch (error) {
      console.error(error);

      setGenerationError(
        error instanceof Error
          ? error.message
          : "Discover Queue could not be generated. Please try again.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function updatePlaybackQueue() {
    if (experienceMode === "demo") {
      if (generatedTracks.length === 0) {
        return;
      }

      setIsUpdatingQueue(true);
      setSpotifyQueueError("");

      await new Promise((resolve) => window.setTimeout(resolve, 500));

      setQueuedTracks(
        generatedTracks.map((track, index) => ({
          title: track.title,
          artist: track.artist,
          art: track.art,
          uri: `demo:generated:${index}:${getTrackKey(track)}`,
        })),
      );

      setQueueUpdated(true);
      setIsUpdatingQueue(false);
      return;
    }

    const deviceId = localStorage.getItem("spotify_device_id");

    if (!deviceId) {
      setSpotifyQueueError(
        "Connect Spotify and start playback before updating the queue.",
      );
      return;
    }

    if (generatedTracks.length === 0) {
      return;
    }

    setIsUpdatingQueue(true);
    setSpotifyQueueError("");

    try {
      const resolvedTracks = await Promise.all(
        generatedTracks.map(async (track) => {
          const searchParams = new URLSearchParams({
            q: `track:"${track.title}" artist:"${track.artist}"`,
            type: "track",
            limit: "1",
            market: "from_token",
          });

          const response = await spotifyFetch(
            `https://api.spotify.com/v1/search?${searchParams.toString()}`,
          );

          if (!response.ok) {
            throw new Error(`Could not find ${track.title} on Spotify.`);
          }

          const data = (await response.json()) as {
            tracks?: {
              items?: Array<{
                name?: string;
                uri?: string;
                artists?: Array<{ name?: string }>;
                album?: {
                  images?: Array<{ url?: string }>;
                };
              }>;
            };
          };

          const spotifyTrack = data.tracks?.items?.[0];
          const uri = spotifyTrack?.uri;

          if (!uri) {
            throw new Error(
              `${track.title} by ${track.artist} was not found on Spotify.`,
            );
          }

          return {
            title: spotifyTrack.name || track.title,
            artist:
              spotifyTrack.artists
                ?.map((artist) => artist.name)
                .filter(Boolean)
                .join(", ") || track.artist,
            art: track.art,
            artwork: spotifyTrack.album?.images?.[0]?.url,
            uri,
          } satisfies QueueDisplayTrack;
        }),
      );

      for (const track of resolvedTracks) {
        const queueParams = new URLSearchParams({
          uri: track.uri,
          device_id: deviceId,
        });

        const queueResponse = await spotifyFetch(
          `https://api.spotify.com/v1/me/player/queue?${queueParams.toString()}`,
          {
            method: "POST",
          },
        );

        if (!queueResponse.ok && queueResponse.status !== 204) {
          const errorText = await queueResponse.text();

          throw new Error(
            errorText ||
              `Could not add ${track.title} to the Spotify queue.`,
          );
        }
      }

      setQueuedTracks(resolvedTracks);
      setQueueUpdated(true);
    } catch (error) {
      console.error(error);

      setSpotifyQueueError(
        error instanceof Error
          ? error.message
          : "Could not update what plays next.",
      );
    } finally {
      setIsUpdatingQueue(false);
    }
  }


  function refineDiscoveryQueue() {
    setShowResults(false);
    openDiscoveryBuilder(undefined, true);
  }

  function clearResults() {
    setShowResults(false);
    setQueueUpdated(false);
    setGeneratedTracks([]);
    setAiSummary("");
    setQueueChangeSummary("");
    setResultMode("first");
    setIsRefining(false);
    setUsedFallback(false);
    setSpotifyQueueError("");
  }

  if (view === "intro") {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-[#121212]">
          <div className="relative flex flex-1 flex-col px-6 pb-8 pt-10">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top_right,rgba(29,185,84,0.24),transparent_58%)]" />

            <div className="relative">
              <div className="flex items-center gap-3">
                <DiscoverQueueLogo size="medium" />

                <div>
                  <p className="font-bold">Discover Queue</p>
                  <p className="text-xs text-zinc-500">
                    Discover Queue demo
                  </p>
                </div>
              </div>

              <div className="mt-12">
                <span className="inline-flex rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400">
                  Choose how to explore
                </span>

                <h1 className="mt-5 text-5xl font-black leading-[1.02] tracking-tight">
                  Your taste leads.
                  <span className="block text-green-400">
                    AI builds what plays next.
                  </span>
                </h1>

                <p className="mt-6 max-w-sm text-base leading-7 text-zinc-300">
                  Try the complete Discover Queue flow without an account, or
                  connect Spotify for real browser playback.
                </p>
              </div>

              <section className="mt-8 rounded-3xl border border-green-500/30 bg-gradient-to-br from-green-500/15 to-transparent p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-500 text-xl font-black text-black">
                    1
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-green-400">
                      Recommended for evaluators
                    </p>
                    <h2 className="mt-1 text-xl font-black">
                      Interactive demo
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-zinc-300">
                      No Spotify account required. Explore simulated playback,
                      build a live AI queue and update what plays next.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => startInteractiveDemo("home")}
                  className="mt-5 w-full rounded-full bg-green-500 py-4 font-bold text-black"
                >
                  Start interactive demo
                </button>
              </section>

              <section className="mt-4 rounded-3xl bg-[#1a1a1a] p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-700 text-xl font-black text-white">
                    2
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                      Optional live integration
                    </p>
                    <h2 className="mt-1 text-xl font-black">
                      Live Spotify playback
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      Connect Spotify Premium to play real tracks and add the
                      generated recommendations to the live queue.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openLiveConnection("home")}
                  className="mt-5 w-full rounded-full border border-zinc-600 py-4 font-bold text-white"
                >
                  Connect Spotify for live playback
                </button>

                <p className="mt-3 text-center text-xs leading-5 text-zinc-500">
                  Spotify handles sign-in. We never receive your password or
                  verification code.
                </p>
              </section>

              <p className="mt-5 text-xs leading-5 text-zinc-500">
                The AI recommendations are live in both paths. Only playback is
                simulated in the interactive demo.
              </p>
            </div>
          </div>

          <SpotifyConnectionSheet
            open={isConnectModalOpen}
            isConnecting={isConnecting}
            error={loginError}
            onClose={() => setIsConnectModalOpen(false)}
            onConnect={() => void connectSpotify()}
            onUseDemo={useInteractiveDemoInstead}
          />
        </div>
      </main>
    );
  }

  if (view === "home") {
    const quickTracks = DEMO_TRACKS.slice(0, 7);
    const jumpBackInTracks = DEMO_TRACKS.slice(7, 13);
    const madeForYouTracks = DEMO_TRACKS.slice(13, 19);

    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto min-h-screen w-full max-w-md bg-gradient-to-b from-[#24352a] via-[#121212] to-[#121212] pb-32">
          <header className="px-5 pt-8">
            <div className="flex items-center justify-between">
              <div>
                <button
                  type="button"
                  onClick={chooseAnotherMode}
                  className="rounded-full bg-black/30 px-3 py-1 text-xs font-semibold text-green-400"
                >
                  {experienceMode === "demo"
                    ? "Interactive demo"
                    : "Live Spotify"}
                </button>
                <h1 className="mt-2 text-3xl font-black">Good evening</h1>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    showDemoNotice(
                      "Notifications are not available in the demo.",
                    )
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-lg"
                  aria-label="Notifications"
                >
                  ◉
                </button>

                <button
                  type="button"
                  onClick={() =>
                    showDemoNotice("Settings are not available in the demo.")
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-lg"
                  aria-label="Settings"
                >
                  ⚙
                </button>
              </div>
            </div>
          </header>

          <div className="px-5 pt-7">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={openDiscoverNext}
                className="flex min-h-20 items-center overflow-hidden rounded-lg bg-green-500 text-left text-black"
              >
                <div className="flex h-20 w-20 shrink-0 items-center justify-center bg-green-400">
                  <DiscoverQueueLogo size="small" />
                </div>

                <div className="min-w-0 px-3">
                  <p className="truncate text-sm font-bold">Discover Queue</p>
                  <p className="mt-1 truncate text-xs text-black/65">
                    Shape what plays next
                  </p>
                </div>
              </button>

              {quickTracks.map((track) => (
                <button
                  key={track.uri}
                  type="button"
                  onClick={() => playDemoTrack(track)}
                  className="flex min-h-20 items-center overflow-hidden rounded-lg bg-white/10 text-left text-white"
                >
                  <DemoTrackCover
                    track={track}
                    compact
                    className="h-20 w-20 shrink-0"
                  />

                  <div className="min-w-0 px-3">
                    <p className="truncate text-sm font-bold">{track.title}</p>
                    <p className="mt-1 truncate text-xs text-zinc-400">
                      {track.artist}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <section className="mt-9">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-400">
                    New feature
                  </p>
                  <h2 className="mt-1 text-2xl font-black">
                    Find what comes next
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={openDiscoverNext}
                  className="text-sm font-semibold text-zinc-300"
                >
                  Open
                </button>
              </div>

              <button
                type="button"
                onClick={openDiscoverNext}
                className="mt-4 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 via-green-600 to-emerald-950 p-5 text-left text-black"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em]">
                      Discover Queue
                    </p>

                    <h3 className="mt-3 text-3xl font-black leading-tight">
                      Your taste leads.
                      <span className="block">AI builds what plays next.</span>
                    </h3>

                    <p className="mt-4 max-w-xs text-sm leading-6 text-black/70">
                      Start from the current song, describe what you want, and
                      generate a five-track Discover Queue.
                    </p>
                  </div>

                  <DiscoverQueueLogo size="large" />
                </div>

                <div className="mt-6 inline-flex rounded-full bg-black px-5 py-3 text-sm font-bold text-white">
                  Try Discover Queue
                </div>
              </button>
            </section>

            <section className="mt-9">
              <h2 className="text-2xl font-black">Jump back in</h2>

              <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
                {jumpBackInTracks.map((track) => (
                  <button
                    key={track.uri}
                    type="button"
                    onClick={() => playDemoTrack(track)}
                    className="w-36 shrink-0 text-left"
                  >
                    <DemoTrackCover
                      track={track}
                      className="aspect-square w-36 rounded-xl"
                    />
                    <p className="mt-2 truncate text-sm font-semibold">
                      {track.title}
                    </p>
                    <p className="mt-1 truncate text-xs text-zinc-500">
                      {track.artist}
                    </p>
                  </button>
                ))}
              </div>
            </section>

            <section className="mt-9">
              <h2 className="text-2xl font-black">Made for you</h2>

              <div className="mt-4 grid grid-cols-3 gap-3">
                {madeForYouTracks.map((track) => (
                  <button
                    key={track.uri}
                    type="button"
                    onClick={() => playDemoTrack(track)}
                    className="text-left"
                  >
                    <DemoTrackCover
                      track={track}
                      className="aspect-square rounded-xl"
                    />
                    <p className="mt-2 truncate text-sm font-semibold">
                      {track.title}
                    </p>
                    <p className="mt-1 truncate text-xs text-zinc-500">
                      {track.artist}
                    </p>
                  </button>
                ))}
              </div>
            </section>
          </div>

          <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md">
            <button
              type="button"
              onClick={() =>
                experienceMode === "demo"
                  ? playDemoTrack(selectedDemoTrack)
                  : openDiscoverNext()
              }
              className="mx-2 flex w-[calc(100%-1rem)] items-center gap-3 rounded-lg bg-[#333333] p-2 text-left"
            >
              <DemoTrackCover
                track={selectedDemoTrack}
                compact
                className="h-12 w-12 shrink-0 rounded"
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {selectedDemoTrack.title} · {selectedDemoTrack.artist}
                </p>
                <p className="truncate text-xs text-zinc-400">
                  {experienceMode === "demo"
                    ? "Discover Queue demo"
                    : "Live Spotify playback"}
                </p>
              </div>

              <span className="px-3 text-xl">▶</span>
            </button>

            <nav className="mt-1 grid grid-cols-3 border-t border-white/5 bg-[#121212]/98 px-4 pb-4 pt-3 backdrop-blur">
              <button type="button" className="text-center text-white">
                <span className="block text-xl">⌂</span>
                <span className="mt-1 block text-xs font-semibold">Home</span>
              </button>

              <button
                type="button"
                onClick={() => showDemoNotice()}
                className="text-center text-zinc-500"
              >
                <span className="block text-xl">⌕</span>
                <span className="mt-1 block text-xs font-semibold">Search</span>
              </button>

              <button
                type="button"
                onClick={() => showDemoNotice()}
                className="text-center text-zinc-500"
              >
                <span className="block text-xl">▤</span>
                <span className="mt-1 block text-xs font-semibold">
                  Your Library
                </span>
              </button>
            </nav>
          </div>

          {demoNotice && (
            <div className="fixed inset-x-0 bottom-28 z-50 mx-auto w-full max-w-md px-5">
              <div className="rounded-full bg-white px-5 py-3 text-center text-sm font-semibold text-black shadow-2xl">
                {demoNotice}
              </div>
            </div>
          )}

          <SpotifyConnectionSheet
            open={isConnectModalOpen}
            isConnecting={isConnecting}
            error={loginError}
            onClose={() => setIsConnectModalOpen(false)}
            onConnect={() => void connectSpotify()}
            onUseDemo={useInteractiveDemoInstead}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto min-h-screen w-full max-w-md bg-[#121212] pb-14">
        <header className="sticky top-0 z-30 border-b border-white/5 bg-[#121212]/95 px-5 py-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setView("home")}
              aria-label="Back to Spotify home"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-xl"
            >
              ←
            </button>

            <div className="flex items-center gap-2">
              <DiscoverQueueLogo size="tiny" />

              <div className="text-left">
                <p className="text-sm font-semibold text-white">Discover Queue</p>
                <p className="text-xs text-zinc-500">Shape what plays next</p>
              </div>
            </div>

            <button
              type="button"
              aria-label="Open menu"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-xl"
            >
              •••
            </button>
          </div>
        </header>

        <div className="px-5 pt-6">
          {experienceMode === "demo" ? (
            <DemoSpotifyPlayer
              onOpenDiscovery={() => openDiscoveryBuilder()}
              onTrackChange={setNowPlaying}
              queuedTracks={queuedTracks}
              initialTrack={selectedDemoTrack}
            />
          ) : authState === "signedIn" ? (
            <SpotifyPlayer
              onOpenDiscovery={() => openDiscoveryBuilder()}
              onTrackChange={setNowPlaying}
              queuedTracks={queuedTracks}
            />
          ) : (
            <section className="mb-6 rounded-3xl border border-zinc-700 bg-[#181818] p-5">
              <p className="text-sm font-semibold">
                Connect Spotify for live playback
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Spotify handles the sign-in screen. Discover Queue never sees
                your password or verification code.
              </p>

              <button
                type="button"
                onClick={() => openLiveConnection("discover")}
                className="mt-4 w-full rounded-full bg-green-500 px-5 py-3 text-sm font-bold text-black"
              >
                Continue securely with Spotify
              </button>

              <button
                type="button"
                onClick={() => startInteractiveDemo("discover")}
                className="mt-3 w-full rounded-full border border-zinc-600 px-5 py-3 text-sm font-semibold"
              >
                Use interactive demo instead
              </button>
            </section>
          )}

        </div>

        {showResults && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/80"
            role="dialog"
            aria-modal="true"
            aria-label="Discover Queue results"
          >
            <button
              type="button"
              aria-label="Close discovery results"
              onClick={() => setShowResults(false)}
              className="absolute inset-0"
            />

            <section className="relative z-10 flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-[32px] bg-[#181818]">
              <div className="border-b border-white/5 px-5 pb-4 pt-3">
                <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-zinc-500" />

                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <DiscoverQueueLogo size="small" />

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-400">
                        Discover Queue
                      </p>

                      <h2 className="mt-1 text-2xl font-black">
                        Your Discover Queue
                      </h2>

                      <p className="mt-1 text-sm text-zinc-400">
                        {discoveryDescription.title}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowResults(false)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xl"
                    aria-label="Close results"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto px-5 py-5">
                <div className="rounded-2xl border border-green-500/25 bg-green-500/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-green-400">
                    {resultMode === "refine"
                      ? "How the queue changed"
                      : "What the AI understood"}
                  </p>

                  <p className="mt-2 text-sm font-semibold leading-6 text-white">
                    {resultMode === "refine"
                      ? queueChangeSummary
                      : aiSummary}
                  </p>

                </div>

                {nowPlaying && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
                    <span>Starting from</span>
                    <span className="font-semibold text-zinc-300">
                      {nowPlaying.title} · {nowPlaying.artist}
                    </span>
                  </div>
                )}

                {usedFallback && (
                  <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3">
                    <p className="text-xs leading-5 text-amber-200">
                      Live AI was unavailable, so the demo used its curated
                      recommendation fallback.
                    </p>
                  </div>
                )}

                <div className="mt-5 space-y-3">
                  {generatedTracks.map((track) => (
                    <article
                      key={`${track.title}-${track.artist}`}
                      className="rounded-2xl bg-[#242424] p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-2xl">
                          {track.art}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-white">
                            {track.title}
                          </p>

                          <p className="mt-0.5 truncate text-xs text-zinc-400">
                            {track.artist}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${getTagClasses(
                            track.tag,
                          )}`}
                        >
                          {track.tag}
                        </span>
                      </div>

                      <p className="mt-2 whitespace-normal break-words text-xs leading-5 text-zinc-400">
                        <span className="font-semibold text-zinc-300">
                          Why this fits:
                        </span>{" "}
                        {track.reason}
                      </p>
                    </article>
                  ))}
                </div>

              </div>

              <div className="border-t border-white/5 bg-[#181818] px-5 pb-6 pt-4">
                {queueUpdated ? (
                  <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-4">
                    <div className="flex items-center gap-3">
                      <DiscoverQueueLogo size="small" />
                      <div>
                        <p className="font-semibold text-green-400">
                          Added by Discover Queue
                        </p>
                        <p className="mt-1 text-sm text-zinc-300">
                          Your current song keeps playing. The next skip—or the
                          end of this song—starts the five-track Discover Queue.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : experienceMode === "demo" || authState === "signedIn" ? (
                  <button
                    type="button"
                    onClick={() => void updatePlaybackQueue()}
                    disabled={isUpdatingQueue}
                    className="w-full rounded-full bg-green-500 py-4 font-bold text-black disabled:bg-zinc-600 disabled:text-zinc-400"
                  >
                    {isUpdatingQueue
                      ? "Updating what plays next..."
                      : "Update what’s next"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => openLiveConnection("discover")}
                    className="w-full rounded-full bg-green-500 py-4 font-bold text-black"
                  >
                    Connect Spotify for live queue updates
                  </button>
                )}

                {spotifyQueueError && (
                  <p className="mt-3 text-center text-sm text-red-400">
                    {spotifyQueueError}
                  </p>
                )}

                <button
                  type="button"
                  onClick={refineDiscoveryQueue}
                  className="mt-3 w-full rounded-full border border-zinc-700 py-4 font-semibold"
                >
                  Refine this queue
                </button>
              </div>
            </section>
          </div>
        )}

        {isDiscoverySheetOpen && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/80"
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              aria-label="Close discovery builder"
              onClick={() => setIsDiscoverySheetOpen(false)}
              className="absolute inset-0"
            />

            <div className="relative z-10 max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[32px] bg-[#242424] px-5 pb-8 pt-3">
              <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-zinc-500" />

              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <DiscoverQueueLogo size="small" />

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-400">
                      Discover Queue
                    </p>

                    <h2 className="mt-1 text-2xl font-bold">
                      {isRefining
                        ? "Refine your Discover Queue"
                        : "What should come next?"}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      Describe the direction—or choose a quick prompt below.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDiscoverySheetOpen(false)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xl"
                >
                  ×
                </button>
              </div>

              {nowPlaying && (
                <div className="mt-5 flex items-start gap-3 rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
                  <MusicalAnchorIcon />

                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-green-400">
                      Musical anchor
                    </p>

                    <p className="mt-2 truncate text-sm font-semibold text-white">
                      {nowPlaying.title}
                    </p>

                    <p className="mt-1 truncate text-sm text-zinc-400">
                      {nowPlaying.artist}
                    </p>
                  </div>
                </div>
              )}

              <label
                htmlFor="discovery-prompt"
                className="mt-6 block text-sm font-semibold"
              >
                Your prompt <span className="text-zinc-500">(optional)</span>
              </label>

              <textarea
                id="discovery-prompt"
                value={prompt}
                placeholder={getPromptPlaceholder(nowPlaying)}
                onChange={(event) => setPrompt(event.target.value)}
                className="mt-2 h-28 w-full resize-none rounded-2xl border border-zinc-700 bg-[#121212] p-4 text-sm leading-6 outline-none placeholder:text-zinc-600 focus:border-green-500"
              />

              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Quick prompts
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  {promptChips.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setPrompt(chip)}
                      className={`min-h-11 rounded-xl px-3 py-2.5 text-left text-xs font-medium leading-4 transition ${
                        prompt === chip
                          ? "bg-green-500 text-black"
                          : "bg-zinc-700 text-white"
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-7">
                <p className="font-semibold">Discovery level</p>

                <p className="mt-1 text-sm leading-6 text-zinc-400">
                  Control how familiar or unexpected the recommendations feel.
                </p>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  {(
                    ["Safe", "Balanced", "Adventurous"] as DiscoveryLevel[]
                  ).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setLevel(item)}
                      className={`rounded-full px-2 py-3 text-sm font-bold ${
                        level === item
                          ? "bg-green-500 text-black"
                          : "bg-zinc-700 text-white"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <div className="mt-4 rounded-2xl bg-[#181818] p-4">
                  <p className="text-sm font-semibold">
                    {discoveryDescription.title}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-zinc-400">
                    {discoveryDescription.description}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void buildDiscoveryQueue()}
                disabled={isGenerating}
                className="mt-7 w-full rounded-full bg-green-500 py-4 font-bold text-black disabled:bg-zinc-600 disabled:text-zinc-400"
              >
                {isGenerating
                  ? "Building your Discover Queue..."
                  : prompt.trim()
                    ? "Build with Discover Queue"
                    : nowPlaying
                      ? "Build from current song"
                      : "Surprise me"}
              </button>

              {generationError && (
                <p className="mt-3 text-center text-sm text-red-400">
                  {generationError}
                </p>
              )}
            </div>
          </div>
        )}

        {demoNotice && (
          <div className="fixed inset-x-0 bottom-8 z-50 mx-auto w-full max-w-md px-5">
            <div className="rounded-full bg-white px-5 py-3 text-center text-sm font-semibold text-black shadow-2xl">
              {demoNotice}
            </div>
          </div>
        )}

        <SpotifyConnectionSheet
          open={isConnectModalOpen}
          isConnecting={isConnecting}
          error={loginError}
          onClose={() => setIsConnectModalOpen(false)}
          onConnect={() => void connectSpotify()}
          onUseDemo={useInteractiveDemoInstead}
        />
      </div>
    </main>
  );
}
