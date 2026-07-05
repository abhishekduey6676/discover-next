"use client";

import { useEffect, useMemo, useState } from "react";
import DiscoverQueueLogo from "@/components/DiscoverQueueLogo";
import DemoTrackCover from "@/components/DemoTrackCover";
import {
  DEFAULT_DEMO_TRACK,
  getDemoQueue,
  type DemoTrack,
} from "@/lib/demoTracks";

type QueueDisplayTrack = {
  title: string;
  artist: string;
  art: string;
  artwork?: string;
  uri: string;
};

type NowPlayingContext = {
  title: string;
  artist: string;
};

type DemoSpotifyPlayerProps = {
  onOpenDiscovery: () => void;
  onTrackChange: (track: NowPlayingContext | null) => void;
  queuedTracks: QueueDisplayTrack[];
  initialTrack?: DemoTrack;
};

const GENERATED_COVERS = [
  ["#134e4a", "#22c55e"],
  ["#312e81", "#8b5cf6"],
  ["#7c2d12", "#f97316"],
  ["#164e63", "#06b6d4"],
  ["#581c87", "#d946ef"],
] as const;

function formatTime(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function toGeneratedDemoTrack(
  track: QueueDisplayTrack,
  index: number,
): DemoTrack {
  const colors = GENERATED_COVERS[index % GENERATED_COVERS.length];

  return {
    title: track.title,
    artist: track.artist,
    art: track.art,
    uri: track.uri,
    duration: 240_000,
    collection: "Added by Discover Queue",
    coverFrom: colors[0],
    coverTo: colors[1],
  };
}

export default function DemoSpotifyPlayer({
  onOpenDiscovery,
  onTrackChange,
  queuedTracks,
  initialTrack = DEFAULT_DEMO_TRACK,
}: DemoSpotifyPlayerProps) {
  const [currentTrack, setCurrentTrack] = useState<DemoTrack>(initialTrack);
  const [queue, setQueue] = useState<DemoTrack[]>(
    getDemoQueue(initialTrack.uri),
  );
  const [isPaused, setIsPaused] = useState(false);
  const [position, setPosition] = useState(42_000);
  const [queueOpen, setQueueOpen] = useState(false);
  const [demoNotice, setDemoNotice] = useState("");

  const isDiscoverNextQueue = queuedTracks.length > 0;

  useEffect(() => {
    setCurrentTrack(initialTrack);
    setQueue(getDemoQueue(initialTrack.uri));
    setPosition(42_000);
    setIsPaused(false);
  }, [initialTrack]);

  useEffect(() => {
    onTrackChange({
      title: currentTrack.title,
      artist: currentTrack.artist,
    });
  }, [currentTrack, onTrackChange]);

  useEffect(() => {
    if (queuedTracks.length === 0) {
      return;
    }

    setQueue(queuedTracks.map(toGeneratedDemoTrack));
  }, [queuedTracks]);

  useEffect(() => {
    if (isPaused) {
      return;
    }

    const interval = window.setInterval(() => {
      setPosition((previous) => {
        const next = previous + 1_000;

        return next >= currentTrack.duration
          ? currentTrack.duration
          : next;
      });
    }, 1_000);

    return () => window.clearInterval(interval);
  }, [currentTrack.duration, isPaused]);

  const progress = Math.min(
    (position / currentTrack.duration) * 100,
    100,
  );

  const visibleQueue = useMemo(
    () => queue.slice(0, isDiscoverNextQueue ? 5 : 8),
    [isDiscoverNextQueue, queue],
  );

  function showDemoNotice(message: string) {
    setDemoNotice(message);

    window.setTimeout(() => {
      setDemoNotice("");
    }, 2200);
  }

  function playTrackFromQueue(track: DemoTrack) {
    setCurrentTrack(track);
    setQueue((previous) =>
      previous.filter((item) => item.uri !== track.uri),
    );
    setPosition(0);
    setIsPaused(false);
    setQueueOpen(false);
  }

  function playNextTrack() {
    const nextTrack = queue[0];

    if (!nextTrack) {
      showDemoNotice("There are no more tracks in the demo queue.");
      return;
    }

    playTrackFromQueue(nextTrack);
  }

  return (
    <>
      <section className="relative mb-6 overflow-hidden bg-gradient-to-b from-[#0d2530] via-[#111820] to-[#121212] px-6 pb-8 pt-5">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() =>
              showDemoNotice(
                "Back navigation is not available in the interactive demo.",
              )
            }
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-2xl"
            aria-label="Back"
          >
            ⌄
          </button>

          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-300">
              Playing from Discover Queue
            </p>
            <p className="mt-1 text-[10px] text-green-400">
              Interactive demo
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              showDemoNotice(
                "More options are not available in the interactive demo.",
              )
            }
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-xl"
            aria-label="More options"
          >
            •••
          </button>
        </div>

        <DemoTrackCover
          track={currentTrack}
          className="mx-auto mt-7 aspect-square max-w-[340px] rounded-xl shadow-2xl"
        />

        <div className="mt-10 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-3xl font-bold">
              {currentTrack.title}
            </h1>

            <p className="mt-1 truncate text-lg text-zinc-400">
              {currentTrack.artist}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              showDemoNotice(
                "Saving songs is not available in the interactive demo.",
              )
            }
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-white text-3xl"
            aria-label="Save track"
          >
            +
          </button>
        </div>

        <div className="mt-7">
          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-700">
            <div
              className="h-full rounded-full bg-white transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-2 flex justify-between text-xs text-zinc-400">
            <span>{formatTime(position)}</span>
            <span>
              -{formatTime(Math.max(currentTrack.duration - position, 0))}
            </span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() =>
              showDemoNotice(
                "Shuffle is not available in the interactive demo.",
              )
            }
            className="text-2xl text-zinc-300"
            aria-label="Shuffle"
          >
            ⤨
          </button>

          <button
            type="button"
            onClick={() =>
              showDemoNotice(
                "Previous track is not available in the interactive demo.",
              )
            }
            className="text-4xl"
            aria-label="Previous track"
          >
            ⏮
          </button>

          <button
            type="button"
            onClick={() => setIsPaused((previous) => !previous)}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-3xl text-black"
            aria-label={isPaused ? "Play" : "Pause"}
          >
            {isPaused ? "▶" : "Ⅱ"}
          </button>

          <button
            type="button"
            onClick={playNextTrack}
            className="text-4xl"
            aria-label="Next track"
          >
            ⏭
          </button>

          <button
            type="button"
            onClick={() =>
              showDemoNotice(
                "Repeat is not available in the interactive demo.",
              )
            }
            className="text-2xl text-zinc-300"
            aria-label="Repeat"
          >
            ↻
          </button>
        </div>

        <div className="mt-7 flex items-center justify-between">
          <button
            type="button"
            onClick={() =>
              showDemoNotice(
                "Device switching is available only in live Spotify mode.",
              )
            }
            className="flex items-center gap-2 text-sm font-semibold text-green-400"
          >
            <span className="text-xl">▱</span>
            Discover Queue
          </button>

          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() =>
                showDemoNotice(
                  "Sharing is not available in the interactive demo.",
                )
              }
              className="text-2xl"
              aria-label="Share"
            >
              ⇧
            </button>

            <button
              type="button"
              aria-label="Open Discover Queue"
              onClick={() => setQueueOpen(true)}
              className="rounded-xl transition active:scale-95"
            >
              <DiscoverQueueLogo size="small" />
            </button>
          </div>
        </div>

        <section className="mt-8 rounded-3xl bg-[#2f8bb4] p-5 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Lyrics</h2>
            <span className="rounded-full bg-black/20 px-3 py-1 text-xs">
              Demo
            </span>
          </div>

          <div className="mt-8 space-y-4">
            <div className="h-4 w-3/4 rounded-full bg-white/75" />
            <div className="h-4 w-11/12 rounded-full bg-white/45" />
            <div className="h-4 w-2/3 rounded-full bg-white/30" />
          </div>

          <p className="mt-8 text-sm font-semibold text-white/80">
            Lyrics are simulated in interactive demo mode.
          </p>
        </section>

        <section className="mt-6 rounded-3xl bg-[#242424] p-5">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">About the song</h2>
            <span className="rounded-md bg-green-500 px-2 py-1 text-xs font-bold text-black">
              Anchor
            </span>
          </div>

          <p className="mt-4 text-sm leading-6 text-zinc-300">
            {currentTrack.title} by {currentTrack.artist} is the musical anchor.
            Discover Queue combines this context with your prompt to build what
            plays next.
          </p>
        </section>
      </section>

      {queueOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75"
          role="dialog"
          aria-modal="true"
          aria-label="Discover Queue"
        >
          <button
            type="button"
            aria-label="Close queue"
            onClick={() => setQueueOpen(false)}
            className="absolute inset-0"
          />

          <section className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-[32px] bg-[#242424] px-5 pb-8 pt-3">
            <div className="mx-auto h-1.5 w-12 rounded-full bg-zinc-500" />

            <div className="mt-5 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <DiscoverQueueLogo size="small" />

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-400">
                    Discover Queue
                  </p>
                  <h2 className="mt-1 text-2xl font-black">Queue</h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setQueueOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-700 text-xl"
                aria-label="Close queue"
              >
                ×
              </button>
            </div>

            <div className="mt-6 rounded-2xl bg-black/25 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Now playing
              </p>

              <div className="mt-3 flex items-center gap-3">
                <DemoTrackCover
                  track={currentTrack}
                  compact
                  className="h-12 w-12 shrink-0 rounded-lg"
                />

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-green-400">
                    {currentTrack.title}
                  </p>
                  <p className="mt-1 truncate text-xs text-zinc-400">
                    {currentTrack.artist}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-7 flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  {isDiscoverNextQueue
                    ? "Added by Discover Queue"
                    : "Next in queue"}
                </p>
                <h3 className="mt-1 text-lg font-bold">
                  {visibleQueue.length} tracks waiting
                </h3>
              </div>

              <span className="rounded-full bg-zinc-700 px-3 py-1 text-xs text-zinc-300">
                Interactive demo
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {visibleQueue.map((track) => (
                <button
                  key={track.uri}
                  type="button"
                  onClick={() => playTrackFromQueue(track)}
                  className="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-white/5"
                >
                  <DemoTrackCover
                    track={track}
                    compact
                    className="h-12 w-12 shrink-0 rounded-lg"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {track.title}
                    </p>
                    <p className="mt-1 truncate text-xs text-zinc-400">
                      {track.artist}
                    </p>

                    {isDiscoverNextQueue && (
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-green-400">
                        Added by Discover Queue
                      </p>
                    )}
                  </div>

                  <span className="text-zinc-500">›</span>
                </button>
              ))}
            </div>

            <div className="mt-7 rounded-3xl border border-green-500/30 bg-green-500/10 p-5">
              <div className="flex items-start gap-3">
                <DiscoverQueueLogo size="small" />
                <div>
                  <p className="font-bold">Shape what plays next</p>
                  <p className="mt-1 text-sm leading-6 text-zinc-400">
                    Use a prompt—or let the current song decide.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setQueueOpen(false);
                  onOpenDiscovery();
                }}
                className="mt-5 w-full rounded-full bg-green-500 py-4 font-bold text-black"
              >
                Build with Discover Queue
              </button>
            </div>
          </section>
        </div>
      )}

      {demoNotice && (
        <div className="fixed inset-x-0 bottom-8 z-[70] mx-auto w-full max-w-md px-5">
          <div className="rounded-full bg-white px-5 py-3 text-center text-sm font-semibold text-black shadow-2xl">
            {demoNotice}
          </div>
        </div>
      )}
    </>
  );
}
