"use client";

import { useMemo, useState } from "react";
import { loginWithSpotify } from "@/lib/spotifyAuth";
import SpotifyPlayer from "@/components/SpotifyPlayer";

type DiscoveryLevel = "Safe" | "Balanced" | "Adventurous";

type DiscoveryTrack = {
  title: string;
  artist: string;
  art: string;
  tag: "Familiar anchor" | "New to you" | "Stretch pick";
  reason: string;
};

type DiscoverApiResponse = {
  tracks: DiscoveryTrack[];
  summary: string;
  usedFallback?: boolean;
  provider?: string;
  error?: string;
};

const promptChips = [
  "Something I've never heard",
  "More new artists",
  "Same vibe, less familiar",
  "Change the energy",
  "Surprise me",
];

const defaultPrompt =
  "Keep this emotional rock vibe, but help me discover artists I haven't heard.";

function getTrackKey(track: Pick<DiscoveryTrack, "title" | "artist">) {
  return `${track.title} - ${track.artist}`;
}

function getTagClasses(tag: DiscoveryTrack["tag"]) {
  if (tag === "Familiar anchor") {
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
      title: "Mostly close to your current taste",
      description:
        "The queue will stay near artists, moods and genres you already know.",
    };
  }

  if (level === "Adventurous") {
    return {
      title: "More unexpected artists and sounds",
      description:
        "The queue will prioritise unfamiliar artists and wider musical distance.",
    };
  }

  return {
    title: "A mix of familiar anchors and new artists",
    description:
      "The queue will target roughly 20% familiar tracks and 80% discoveries.",
  };
}

export default function Home() {
  const [isStartingDiscoveryQueue, setIsStartingDiscoveryQueue] =
    useState(false);
  const [spotifyQueueError, setSpotifyQueueError] = useState("");

  const [isDiscoverySheetOpen, setIsDiscoverySheetOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [queueReplaced, setQueueReplaced] = useState(false);

  const [prompt, setPrompt] = useState(defaultPrompt);
  const [level, setLevel] = useState<DiscoveryLevel>("Balanced");

  const [generatedTracks, setGeneratedTracks] = useState<DiscoveryTrack[]>([]);
  const [excludedTrackKeys, setExcludedTrackKeys] = useState<string[]>([]);
  const [aiSummary, setAiSummary] = useState("");
  const [aiProvider, setAiProvider] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [usedFallback, setUsedFallback] = useState(false);

  const discoveryDescription = getDiscoveryDescription(level);

  const trackCounts = useMemo(() => {
    return generatedTracks.reduce(
      (counts, track) => {
        if (track.tag === "Familiar anchor") {
          counts.familiar += 1;
        } else if (track.tag === "Stretch pick") {
          counts.stretch += 1;
        } else {
          counts.newToYou += 1;
        }

        return counts;
      },
      {
        familiar: 0,
        stretch: 0,
        newToYou: 0,
      }
    );
  }, [generatedTracks]);

  function openDiscoveryBuilder(prefilledPrompt?: string) {
    setGenerationError("");
    setSpotifyQueueError("");

    if (prefilledPrompt) {
      setPrompt(prefilledPrompt);
    }

    setIsDiscoverySheetOpen(true);
  }

  async function buildDiscoveryQueue() {
    if (!prompt.trim() || isGenerating) {
      return;
    }

    setIsGenerating(true);
    setGenerationError("");
    setSpotifyQueueError("");
    setQueueReplaced(false);
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
          excludedTracks: excludedTrackKeys,
        }),
      });

      const data = (await response.json()) as DiscoverApiResponse;

      if (!response.ok) {
        throw new Error(
          data.error || "Could not generate the discovery queue."
        );
      }

      if (!Array.isArray(data.tracks) || data.tracks.length !== 5) {
        throw new Error("The AI did not return a complete five-song queue.");
      }

      setGeneratedTracks(data.tracks);
      setAiSummary(data.summary);
      setAiProvider(data.provider || "AI recommendation engine");
      setUsedFallback(Boolean(data.usedFallback));

      const newTrackKeys = data.tracks.map(getTrackKey);

      setExcludedTrackKeys((previous) =>
        Array.from(new Set([...previous, ...newTrackKeys])).slice(-25)
      );

      setIsDiscoverySheetOpen(false);
      setShowResults(true);

      window.setTimeout(() => {
        document.getElementById("discovery-results")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch (error) {
      console.error(error);

      setGenerationError(
        error instanceof Error
          ? error.message
          : "The discovery queue could not be generated. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function playDiscoveryQueue() {
    const token = localStorage.getItem("spotify_access_token");
    const deviceId = localStorage.getItem("spotify_device_id");

    if (!token || !deviceId) {
      setSpotifyQueueError(
        "Connect Spotify and activate browser playback first."
      );
      return;
    }

    if (generatedTracks.length === 0) {
      return;
    }

    setIsStartingDiscoveryQueue(true);
    setSpotifyQueueError("");

    try {
      const uris = await Promise.all(
        generatedTracks.map(async (track) => {
          const searchParams = new URLSearchParams({
            q: `track:"${track.title}" artist:"${track.artist}"`,
            type: "track",
            limit: "1",
            market: "from_token",
          });

          const response = await fetch(
            `https://api.spotify.com/v1/search?${searchParams.toString()}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error(`Could not find ${track.title} on Spotify.`);
          }

          const data = (await response.json()) as {
            tracks?: {
              items?: Array<{
                uri?: string;
              }>;
            };
          };

          const uri = data.tracks?.items?.[0]?.uri;

          if (!uri) {
            throw new Error(
              `${track.title} by ${track.artist} was not found on Spotify.`
            );
          }

          return uri;
        })
      );

      const playResponse = await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(
          deviceId
        )}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uris,
          }),
        }
      );

      if (!playResponse.ok && playResponse.status !== 204) {
        const errorText = await playResponse.text();

        throw new Error(
          errorText || `Spotify playback failed: ${playResponse.status}`
        );
      }

      setQueueReplaced(true);

      window.setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }, 250);
    } catch (error) {
      console.error(error);

      setSpotifyQueueError(
        error instanceof Error
          ? error.message
          : "Could not play the discovery queue."
      );
    } finally {
      setIsStartingDiscoveryQueue(false);
    }
  }

  function clearResults() {
    setShowResults(false);
    setQueueReplaced(false);
    setGeneratedTracks([]);
    setAiSummary("");
    setAiProvider("");
    setUsedFallback(false);
    setSpotifyQueueError("");
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto min-h-screen w-full max-w-md bg-[#121212] pb-14">
        <header className="sticky top-0 z-30 border-b border-white/5 bg-[#121212]/95 px-5 py-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-lg font-black text-black">
              D
            </div>

            <div className="text-center">
              <p className="text-sm font-semibold text-white">Discover Next</p>
              <p className="text-xs text-zinc-500">
                Keep the vibe. Find what comes next.
              </p>
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
          <button
            type="button"
            onClick={() => void loginWithSpotify()}
            className="mb-6 w-full rounded-full bg-green-500 px-6 py-4 font-bold text-black"
          >
            Connect Spotify Premium
          </button>

          <SpotifyPlayer onOpenDiscovery={() => openDiscoveryBuilder()} />

          <section className="mt-7 rounded-3xl border border-green-500/25 bg-gradient-to-br from-green-500/10 via-transparent to-transparent p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-500 text-2xl text-black">
                ✨
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-400">
                  AI discovery
                </p>

                <h1 className="mt-1 text-xl font-bold">
                  Build what should play next
                </h1>

                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  Describe the mood, familiarity and direction you want. The AI
                  will turn it into a playable Spotify queue.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => openDiscoveryBuilder()}
              className="mt-5 w-full rounded-full bg-green-500 py-4 font-bold text-black"
            >
              Build a discovery queue
            </button>

            <button
              type="button"
              onClick={() =>
                openDiscoveryBuilder("Something I've never heard")
              }
              className="mt-3 w-full rounded-full border border-zinc-700 py-4 font-semibold text-white"
            >
              Surprise me with something new
            </button>
          </section>

          {showResults && (
            <section
              id="discovery-results"
              className="mt-8 scroll-mt-24 border-t border-zinc-800 pt-7"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-400">
                    AI-generated
                  </p>

                  <h2 className="mt-2 text-2xl font-bold">
                    Your discovery queue
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-zinc-400">
                    {trackCounts.newToYou} new-to-you
                    {trackCounts.familiar > 0
                      ? ` · ${trackCounts.familiar} familiar`
                      : ""}
                    {trackCounts.stretch > 0
                      ? ` · ${trackCounts.stretch} stretch`
                      : ""}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={clearResults}
                  className="text-sm font-semibold text-zinc-400"
                >
                  Clear
                </button>
              </div>

              <div className="mt-4 rounded-2xl bg-[#1a1a1a] p-4">
                <p className="text-sm font-semibold text-white">
                  What the AI understood
                </p>

                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  {aiSummary || prompt}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                    Discovery level: {level}
                  </span>

                  <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                    {aiProvider || "AI recommendation engine"}
                  </span>
                </div>
              </div>

              {usedFallback && (
                <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                  <p className="text-sm font-semibold text-amber-300">
                    Demo fallback used
                  </p>

                  <p className="mt-1 text-xs text-zinc-300">
                    The live Groq request was unavailable, so the app kept the
                    demo working with its curated recommendation logic.
                  </p>
                </div>
              )}

              <div className="mt-5 space-y-4">
                {generatedTracks.map((track) => (
                  <article
                    key={`${track.title}-${track.artist}`}
                    className="rounded-3xl bg-[#181818] p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-3xl">
                        {track.art}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{track.title}</p>

                        <p className="mt-1 truncate text-sm text-zinc-400">
                          {track.artist}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getTagClasses(
                          track.tag
                        )}`}
                      >
                        {track.tag}
                      </span>

                      <p className="mt-3 text-sm leading-6 text-zinc-400">
                        {track.reason}
                      </p>
                    </div>
                  </article>
                ))}
              </div>

              {queueReplaced ? (
                <div className="mt-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-4">
                  <p className="font-semibold text-green-400">
                    Discovery queue is now playing
                  </p>

                  <p className="mt-1 text-sm text-zinc-300">
                    The AI-generated songs are playing through Spotify.
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => void playDiscoveryQueue()}
                  disabled={isStartingDiscoveryQueue}
                  className="mt-6 w-full rounded-full bg-green-500 py-4 font-bold text-black disabled:bg-zinc-600 disabled:text-zinc-400"
                >
                  {isStartingDiscoveryQueue
                    ? "Starting discovery queue..."
                    : "▶ Play discovery queue"}
                </button>
              )}

              {spotifyQueueError && (
                <p className="mt-3 text-center text-sm text-red-400">
                  {spotifyQueueError}
                </p>
              )}

              <button
                type="button"
                onClick={() => openDiscoveryBuilder()}
                className="mt-3 w-full rounded-full border border-zinc-700 py-4 font-semibold"
              >
                Refine this queue
              </button>
            </section>
          )}
        </div>

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
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-400">
                    AI discovery builder
                  </p>

                  <h2 className="mt-2 text-2xl font-bold">
                    What should come next?
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    Tell us what to keep and how far you want to branch out.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDiscoverySheetOpen(false)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xl"
                >
                  ×
                </button>
              </div>

              <label
                htmlFor="discovery-prompt"
                className="mt-6 block text-sm font-semibold"
              >
                Your prompt
              </label>

              <textarea
                id="discovery-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                className="mt-2 h-32 w-full resize-none rounded-2xl border border-zinc-700 bg-[#121212] p-4 text-sm leading-6 outline-none focus:border-green-500"
              />

              <div className="mt-4 flex flex-wrap gap-2">
                {promptChips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setPrompt(chip)}
                    className="rounded-full bg-zinc-700 px-4 py-2 text-sm"
                  >
                    {chip}
                  </button>
                ))}
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
                disabled={!prompt.trim() || isGenerating}
                className="mt-7 w-full rounded-full bg-green-500 py-4 font-bold text-black disabled:bg-zinc-600 disabled:text-zinc-400"
              >
                {isGenerating
                  ? "Building your discovery queue..."
                  : "Build discovery queue"}
              </button>

              {generationError && (
                <p className="mt-3 text-center text-sm text-red-400">
                  {generationError}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
