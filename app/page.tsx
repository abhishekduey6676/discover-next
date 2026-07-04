"use client";

import { useState } from "react";

type DiscoveryLevel = "Safe" | "Balanced" | "Adventurous";

type Track = {
  title: string;
  artist: string;
  art: string;
};

type DiscoveryTrack = Track & {
  tag: "Familiar anchor" | "New to you" | "Stretch pick";
  reason: string;
};

const currentTracks: Track[] = [
  {
    title: "A Message",
    artist: "Coldplay",
    art: "🟦",
  },
  {
    title: "The Zephyr Song",
    artist: "Red Hot Chili Peppers",
    art: "🎨",
  },
  {
    title: "Across The Universe",
    artist: "The Beatles",
    art: "🖼️",
  },
  {
    title: "Iridescent",
    artist: "Linkin Park",
    art: "⚫",
  },
  {
    title: "Human",
    artist: "The Killers",
    art: "🌆",
  },
];

const chips = [
  "More new artists",
  "Same vibe, less familiar",
  "Change the energy",
  "Surprise me",
];

const discoveryTracks: DiscoveryTrack[] = [
  {
    title: "The Silence",
    artist: "Manchester Orchestra",
    tag: "New to you",
    reason:
      "Matches the emotional build of Linkin Park, but introduces a new artist.",
    art: "🌌",
  },
  {
    title: "Sweet Disposition",
    artist: "The Temper Trap",
    tag: "New to you",
    reason: "Keeps the nostalgic, soaring alternative-rock feeling.",
    art: "🌅",
  },
  {
    title: "Fix You",
    artist: "Coldplay",
    tag: "Familiar anchor",
    reason: "Keeps the queue grounded in a sound you already like.",
    art: "🟦",
  },
  {
    title: "First Day of My Life",
    artist: "Bright Eyes",
    tag: "Stretch pick",
    reason:
      "Moves into a softer, more intimate sound while staying emotionally aligned.",
    art: "🌙",
  },
  {
    title: "Open Your Eyes",
    artist: "Snow Patrol",
    tag: "New to you",
    reason:
      "Fits the melodic rock direction without repeating the same artists.",
    art: "❄️",
  },
];

function getTagClasses(tag: DiscoveryTrack["tag"]) {
  switch (tag) {
    case "Familiar anchor":
      return "bg-blue-500/15 text-blue-300";
    case "Stretch pick":
      return "bg-purple-500/15 text-purple-300";
    default:
      return "bg-green-500/15 text-green-400";
  }
}

export default function Home() {
  const [isDiscoverySheetOpen, setIsDiscoverySheetOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [queueReplaced, setQueueReplaced] = useState(false);

  const [prompt, setPrompt] = useState(
    "Keep this emotional rock vibe, but help me discover artists I haven't heard."
  );

  const [level, setLevel] = useState<DiscoveryLevel>("Balanced");

  function buildDiscoveryQueue() {
    if (!prompt.trim()) {
      return;
    }

    setIsDiscoverySheetOpen(false);
    setShowResults(true);
    setQueueReplaced(false);

    window.setTimeout(() => {
      document
        .getElementById("discovery-results")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  function replaceCurrentQueue() {
    setQueueReplaced(true);

    window.setTimeout(() => {
      document
        .getElementById("discovery-results")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto min-h-screen w-full max-w-md bg-[#121212] pb-12">
        <header className="sticky top-0 z-20 border-b border-white/5 bg-[#121212]/95 px-5 py-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <button
              type="button"
              aria-label="Go back"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-xl"
            >
              ←
            </button>

            <p className="text-sm font-semibold text-zinc-300">
              Discover Next
            </p>

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
          <section>
            <div className="rounded-3xl bg-gradient-to-br from-red-900 via-rose-950 to-zinc-950 p-6">
              <div className="flex h-48 items-center justify-center rounded-2xl bg-black/25 text-7xl shadow-2xl">
                🎵
              </div>

              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-300">
                  Playlist
                </p>

                <h1 className="mt-2 text-4xl font-black tracking-tight">
                  Buildings do Cry
                </h1>

                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  Emotional rock, nostalgic melodies and songs with a slow
                  build.
                </p>

                <div className="mt-4 flex items-center gap-2 text-sm text-zinc-300">
                  <span className="font-semibold text-white">Abhishek</span>
                  <span>•</span>
                  <span>5 songs</span>
                  <span>•</span>
                  <span>21 min</span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-full text-2xl text-zinc-400"
                aria-label="Shuffle playlist"
              >
                ⇄
              </button>

              <button
                type="button"
                className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-2xl text-black shadow-lg shadow-green-500/20 transition hover:scale-105"
                aria-label="Play playlist"
              >
                ▶
              </button>
            </div>
          </section>

          <section className="mt-8">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold">Current queue</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Songs already lined up to play
                </p>
              </div>

              <button
                type="button"
                className="text-sm font-semibold text-zinc-400"
              >
                Edit
              </button>
            </div>

            <div className="mt-5 space-y-2">
              {currentTracks.map((track, index) => (
                <div
                  key={`${track.title}-${track.artist}`}
                  className="group flex items-center gap-4 rounded-2xl p-2 transition hover:bg-white/5"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-2xl">
                    {track.art}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate font-semibold ${
                        index === 0 ? "text-green-400" : "text-white"
                      }`}
                    >
                      {track.title}
                    </p>
                    <p className="mt-1 truncate text-sm text-zinc-400">
                      {track.artist}
                    </p>
                  </div>

                  <button
                    type="button"
                    aria-label={`Reorder ${track.title}`}
                    className="px-2 text-xl text-zinc-500"
                  >
                    ☰
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-8 border-t border-zinc-800 pt-7">
            <div>
              <h2 className="text-2xl font-bold">Recommended songs</h2>
              <p className="mt-1 text-sm leading-6 text-zinc-400">
                Based on this playlist and your recent listening
              </p>
            </div>

            <div className="mt-5 rounded-3xl border border-green-500/30 bg-gradient-to-br from-green-500/10 to-transparent p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-500 text-2xl text-black">
                  ✨
                </div>

                <div>
                  <h3 className="text-lg font-bold">Discover with AI</h3>
                  <p className="mt-1 text-sm leading-6 text-zinc-300">
                    Tell us what to keep and how far you want to branch out.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDiscoverySheetOpen(true)}
                className="mt-5 w-full rounded-full bg-green-500 py-4 font-bold text-black transition hover:bg-green-400"
              >
                Build a discovery queue
              </button>
            </div>
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
                    3 new-to-you tracks · 1 familiar anchor · 1 stretch pick
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowResults(false);
                    setQueueReplaced(false);
                  }}
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
                  {prompt}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                    Discovery level: {level}
                  </span>
                  <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                    Emotional rock
                  </span>
                  <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                    Medium energy
                  </span>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {discoveryTracks.map((track) => (
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

                      <button
                        type="button"
                        aria-label={`Add ${track.title}`}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-green-500 text-xl text-green-400"
                      >
                        +
                      </button>
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

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded-full bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-200"
                      >
                        More like this
                      </button>

                      <button
                        type="button"
                        className="rounded-full bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-200"
                      >
                        Not for me
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {queueReplaced ? (
                <div className="mt-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-4">
                  <p className="font-semibold text-green-400">
                    Discovery queue added
                  </p>
                  <p className="mt-1 text-sm leading-6 text-zinc-300">
                    Your current queue has been updated with these five songs.
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={replaceCurrentQueue}
                  className="mt-6 w-full rounded-full bg-green-500 py-4 font-bold text-black transition hover:bg-green-400"
                >
                  Replace current queue
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsDiscoverySheetOpen(true)}
                className="mt-3 w-full rounded-full border border-zinc-700 py-4 font-semibold text-white"
              >
                Refine this queue
              </button>
            </section>
          )}
        </div>

        {isDiscoverySheetOpen && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 px-0"
            role="dialog"
            aria-modal="true"
            aria-labelledby="discovery-sheet-title"
          >
            <button
              type="button"
              aria-label="Close discovery builder"
              onClick={() => setIsDiscoverySheetOpen(false)}
              className="absolute inset-0 cursor-default"
            />

            <div className="relative z-10 max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[32px] bg-[#242424] px-5 pb-8 pt-3 shadow-2xl">
              <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-zinc-500" />

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2
                    id="discovery-sheet-title"
                    className="text-2xl font-bold"
                  >
                    What should come next?
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    Describe what to keep and how far you want the queue to
                    branch out.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDiscoverySheetOpen(false)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-lg text-white"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <label
                htmlFor="discovery-prompt"
                className="mt-6 block text-sm font-semibold text-zinc-200"
              >
                Your prompt
              </label>

              <textarea
                id="discovery-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Same mood, but help me discover newer artists."
                className="mt-2 h-32 w-full resize-none rounded-2xl border border-zinc-700 bg-[#121212] p-4 text-sm leading-6 text-white outline-none transition placeholder:text-zinc-500 focus:border-green-500"
              />

              <div className="mt-4 flex flex-wrap gap-2">
                {chips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setPrompt(chip)}
                    className="rounded-full bg-zinc-700 px-4 py-2 text-sm text-zinc-100 transition hover:bg-zinc-600"
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
                  {(["Safe", "Balanced", "Adventurous"] as DiscoveryLevel[]).map(
                    (item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setLevel(item)}
                        className={`rounded-full px-2 py-3 text-sm font-bold transition ${
                          level === item
                            ? "bg-green-500 text-black"
                            : "bg-zinc-700 text-white hover:bg-zinc-600"
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}
                </div>

                <div className="mt-4 rounded-2xl bg-[#181818] p-4">
                  <p className="text-sm font-semibold text-white">
                    {level === "Safe" && "Mostly close to your current taste"}
                    {level === "Balanced" &&
                      "A mix of familiar anchors and new artists"}
                    {level === "Adventurous" &&
                      "More unexpected artists and genre-adjacent picks"}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-zinc-400">
                    {level === "Safe" &&
                      "The queue will stay near artists, moods and genres you already know."}
                    {level === "Balanced" &&
                      "The queue will target roughly 25% familiar tracks and 75% discoveries."}
                    {level === "Adventurous" &&
                      "The queue will prioritise unfamiliar tracks and wider musical distance."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={buildDiscoveryQueue}
                disabled={!prompt.trim()}
                className="mt-7 w-full rounded-full bg-green-500 py-4 font-bold text-black transition hover:bg-green-400 disabled:cursor-not-allowed disabled:bg-zinc-600 disabled:text-zinc-400"
              >
                Build discovery queue
              </button>

              <button
                type="button"
                onClick={() => setIsDiscoverySheetOpen(false)}
                className="mt-3 w-full py-3 text-sm font-semibold text-zinc-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}