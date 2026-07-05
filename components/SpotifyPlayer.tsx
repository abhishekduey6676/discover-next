"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DiscoverNextLogo from "@/components/DiscoverNextLogo";
import {
  getValidSpotifyAccessToken,
  spotifyFetch,
} from "@/lib/spotifyAuth";

type SpotifyArtist = {
  name: string;
};

type SpotifyImage = {
  url: string;
};

type SpotifyTrack = {
  id: string;
  name: string;
  uri: string;
  artists: SpotifyArtist[];
  album: {
    images: SpotifyImage[];
  };
};

type SpotifySearchResponse = {
  tracks?: {
    items?: SpotifyTrack[];
  };
};

type QueueDisplayTrack = {
  title: string;
  artist: string;
  art: string;
  artwork?: string;
  uri: string;
};

type SpotifyQueueResponse = {
  queue?: SpotifyTrack[];
};

type WebPlaybackState = {
  paused: boolean;
  position: number;
  duration: number;
  track_window: {
    current_track: SpotifyTrack;
    next_tracks: SpotifyTrack[];
    previous_tracks: SpotifyTrack[];
  };
};

type DevicePayload = {
  device_id: string;
};

type ErrorPayload = {
  message: string;
};

interface SpotifyPlayerInstance {
  addListener(
    event: "ready" | "not_ready",
    callback: (data: DevicePayload) => void
  ): boolean;

  addListener(
    event: "player_state_changed",
    callback: (state: WebPlaybackState | null) => void
  ): boolean;

  addListener(
    event:
      | "initialization_error"
      | "authentication_error"
      | "account_error"
      | "playback_error",
    callback: (data: ErrorPayload) => void
  ): boolean;

  connect(): Promise<boolean>;
  disconnect(): void;
  activateElement(): Promise<void>;
  togglePlay(): Promise<void>;
  nextTrack(): Promise<void>;
  previousTrack(): Promise<void>;
}

declare global {
  interface Window {
    Spotify?: {
      Player: new (options: {
        name: string;
        getOAuthToken: (callback: (token: string) => void) => void;
        volume: number;
      }) => SpotifyPlayerInstance;
    };

    onSpotifyWebPlaybackSDKReady?: () => void;
  }
}

type NowPlayingContext = {
  title: string;
  artist: string;
};

type SpotifyPlayerProps = {
  onOpenDiscovery: () => void;
  onTrackChange: (track: NowPlayingContext | null) => void;
  queuedTracks: QueueDisplayTrack[];
};

function formatTime(milliseconds: number) {
  const totalSeconds = Math.max(
    0,
    Math.floor(milliseconds / 1000)
  );

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function SpotifyPlayer({
  onOpenDiscovery,
  onTrackChange,
  queuedTracks,
}: SpotifyPlayerProps) {
  const playerRef = useRef<SpotifyPlayerInstance | null>(null);
  const onTrackChangeRef = useRef(onTrackChange);
  const autoStartAttemptedRef = useRef(false);

  const [status, setStatus] = useState(
    "Loading Spotify player..."
  );

  const [deviceId, setDeviceId] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [isStartingTrack, setIsStartingTrack] = useState(false);

  const [currentTrack, setCurrentTrack] =
    useState<SpotifyTrack | null>(null);

  const [nextTracks, setNextTracks] = useState<SpotifyTrack[]>([]);
  const [apiQueue, setApiQueue] = useState<SpotifyTrack[]>([]);
  const [isQueueLoading, setIsQueueLoading] = useState(false);
  const [queueError, setQueueError] = useState("");

  const [isPaused, setIsPaused] = useState(true);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queueOpen, setQueueOpen] = useState(false);
  const [demoNotice, setDemoNotice] = useState("");

  useEffect(() => {
    onTrackChangeRef.current = onTrackChange;
  }, [onTrackChange]);

  useEffect(() => {
    const hasSpotifySession =
      localStorage.getItem("spotify_access_token") ||
      localStorage.getItem("spotify_refresh_token");

    if (!hasSpotifySession) {
      setStatus("Connect Spotify first.");
      return;
    }

    let cancelled = false;

    function initialisePlayer() {
      if (
        !window.Spotify ||
        cancelled ||
        playerRef.current
      ) {
        return;
      }

      const player = new window.Spotify.Player({
        name: "Discover Next",

        getOAuthToken: (callback) => {
          void getValidSpotifyAccessToken()
            .then((token) => {
              if (token) {
                callback(token);
                return;
              }

              setStatus("Spotify session expired. Connect again.");
            })
            .catch((error) => {
              console.error(error);

              setStatus(
                error instanceof Error
                  ? error.message
                  : "Spotify authentication failed."
              );
            });
        },

        volume: 0.5,
      });

      playerRef.current = player;

      player.addListener("ready", ({ device_id }) => {
        if (cancelled) {
          return;
        }

        setDeviceId(device_id);
        localStorage.setItem("spotify_device_id", device_id);
        setStatus("Preparing your demo track...");

        if (!autoStartAttemptedRef.current) {
          autoStartAttemptedRef.current = true;

          window.setTimeout(() => {
            void startInitialTrack(device_id, true);
          }, 250);
        }
      });

      player.addListener("not_ready", () => {
        if (cancelled) {
          return;
        }

        setIsActive(false);
        setStatus("Spotify browser player is unavailable.");
      });

      player.addListener("player_state_changed", (state) => {
        if (!state) {
          return;
        }

        const playingTrack = state.track_window.current_track;
        const playingArtist =
          playingTrack.artists
            ?.map((artist) => artist.name)
            .join(", ") ?? "";

        setIsActive(true);
        setCurrentTrack(playingTrack);
        setNextTracks(state.track_window.next_tracks ?? []);
        onTrackChangeRef.current({
          title: playingTrack.name,
          artist: playingArtist,
        });
        setIsPaused(state.paused);
        setPosition(state.position);
        setDuration(state.duration);
        setStatus("Browser player is active");
      });

      player.addListener(
        "initialization_error",
        ({ message }) => {
          setStatus(`Initialization error: ${message}`);
        }
      );

      player.addListener(
        "authentication_error",
        ({ message }) => {
          setStatus(`Authentication error: ${message}`);
        }
      );

      player.addListener("account_error", ({ message }) => {
        setStatus(`Spotify account error: ${message}`);
      });

      player.addListener("playback_error", ({ message }) => {
        setStatus(`Playback error: ${message}`);
      });

      void player.connect().then((connected) => {
        if (!connected && !cancelled) {
          setStatus("Spotify player could not connect.");
        }
      });
    }

    window.onSpotifyWebPlaybackSDKReady = initialisePlayer;

    if (window.Spotify) {
      initialisePlayer();
    } else {
      const existingScript = document.querySelector(
        'script[src="https://sdk.scdn.co/spotify-player.js"]'
      );

      if (!existingScript) {
        const script = document.createElement("script");

        script.src =
          "https://sdk.scdn.co/spotify-player.js";

        script.async = true;
        document.body.appendChild(script);
      }
    }

    return () => {
      cancelled = true;

      playerRef.current?.disconnect();
      playerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (isPaused || !isActive || duration <= 0) {
      return;
    }

    const interval = window.setInterval(() => {
      setPosition((currentPosition) =>
        Math.min(currentPosition + 1000, duration)
      );
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [isPaused, isActive, duration]);

  async function startInitialTrack(
    targetDeviceId = deviceId,
    automatic = false,
  ) {
    if (!targetDeviceId) {
      setStatus("Spotify browser device is not ready.");
      return;
    }

    setIsStartingTrack(true);

    try {
      await playerRef.current?.activateElement();

      setStatus("Activating browser player...");

      const transferResponse = await spotifyFetch(
        "https://api.spotify.com/v1/me/player",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            device_ids: [targetDeviceId],
            play: false,
          }),
        }
      );

      if (
        !transferResponse.ok &&
        transferResponse.status !== 204
      ) {
        const errorText = await transferResponse.text();

        throw new Error(
          errorText ||
            `Could not activate device: ${transferResponse.status}`
        );
      }

      setIsActive(true);
      setStatus("Finding A Message by Coldplay...");

      const searchParams = new URLSearchParams({
        q: 'track:"A Message" artist:"Coldplay"',
        type: "track",
        limit: "1",
        market: "from_token",
      });

      const searchResponse = await spotifyFetch(
        `https://api.spotify.com/v1/search?${searchParams.toString()}`
      );

      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();

        throw new Error(
          errorText ||
            `Spotify search failed: ${searchResponse.status}`
        );
      }

      const searchData =
        (await searchResponse.json()) as SpotifySearchResponse;

      const track = searchData.tracks?.items?.[0];

      if (!track?.uri) {
        throw new Error(
          "A Message by Coldplay was not found."
        );
      }

      setStatus(`Starting ${track.name}...`);

      const playResponse = await spotifyFetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(
          targetDeviceId
        )}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uris: [track.uri],
          }),
        }
      );

      if (
        !playResponse.ok &&
        playResponse.status !== 204
      ) {
        const errorText = await playResponse.text();

        throw new Error(
          errorText ||
            `Spotify playback failed: ${playResponse.status}`
        );
      }

      setStatus(`Playing ${track.name} — Coldplay`);
    } catch (error) {
      console.error(error);

      setStatus(
        automatic
          ? "Tap the player once to start the demo track."
          : error instanceof Error
            ? `Could not start playback: ${error.message}`
            : "Could not start Spotify playback."
      );
    } finally {
      setIsStartingTrack(false);
    }
  }

  async function refreshSpotifyQueue() {
    setIsQueueLoading(true);
    setQueueError("");

    try {
      const response = await spotifyFetch(
        "https://api.spotify.com/v1/me/player/queue",
      );

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          errorText || `Could not load the Spotify queue: ${response.status}`,
        );
      }

      const data = (await response.json()) as SpotifyQueueResponse;
      setApiQueue(Array.isArray(data.queue) ? data.queue : []);
    } catch (error) {
      console.error(error);

      setQueueError(
        error instanceof Error
          ? error.message
          : "Could not load the Spotify queue.",
      );
    } finally {
      setIsQueueLoading(false);
    }
  }

  function openQueue() {
    setQueueOpen(true);
    void refreshSpotifyQueue();
  }

  const defaultQueueRows = [
    {
      key: "default-chasing-cars",
      title: "Chasing Cars",
      artist: "Snow Patrol",
      artwork: "",
      art: "🌨️",
    },
    {
      key: "default-somewhere-only-we-know",
      title: "Somewhere Only We Know",
      artist: "Keane",
      artwork: "",
      art: "🌿",
    },
    {
      key: "default-read-my-mind",
      title: "Read My Mind",
      artist: "The Killers",
      artwork: "",
      art: "🌃",
    },
  ];

  const queueDisplay = useMemo(() => {
    if (queuedTracks.length > 0) {
      const seen = new Set<string>();

      const rows = queuedTracks
        .filter((track) => {
          const key =
            track.uri ||
            `${track.title.toLowerCase()}-${track.artist.toLowerCase()}`;

          if (seen.has(key)) {
            return false;
          }

          seen.add(key);
          return true;
        })
        .slice(0, 5)
        .map((track) => ({
          key: track.uri,
          title: track.title,
          artist: track.artist,
          artwork: track.artwork || "",
          art: track.art,
        }));

      return {
        rows,
        isDemo: false,
      };
    }

    const combinedSpotifyTracks = [...apiQueue, ...nextTracks];
    const seen = new Set<string>();

    const realRows = combinedSpotifyTracks
      .filter((track) => {
        const artist =
          track.artists?.map((item) => item.name).join(", ") || "";

        const key =
          track.uri ||
          track.id ||
          `${track.name.toLowerCase()}-${artist.toLowerCase()}`;

        const isCurrentTrack =
          Boolean(currentTrack?.uri) && track.uri === currentTrack?.uri;

        if (!key || isCurrentTrack || seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      })
      .slice(0, 5)
      .map((track) => ({
        key: track.uri || track.id,
        title: track.name,
        artist:
          track.artists?.map((artist) => artist.name).join(", ") || "",
        artwork: track.album?.images?.[0]?.url || "",
        art: "🎵",
      }));

    const rows = [...realRows];
    const rowKeys = new Set(
      rows.map(
        (track) =>
          `${track.title.toLowerCase()}-${track.artist.toLowerCase()}`,
      ),
    );

    for (const fallbackTrack of defaultQueueRows) {
      if (rows.length >= 5) {
        break;
      }

      const key =
        `${fallbackTrack.title.toLowerCase()}-${fallbackTrack.artist.toLowerCase()}`;

      if (rowKeys.has(key)) {
        continue;
      }

      rowKeys.add(key);
      rows.push(fallbackTrack);
    }

    return {
      rows: rows.slice(0, 5),
      isDemo: realRows.length < 2,
    };
  }, [apiQueue, currentTrack?.uri, nextTracks, queuedTracks]);

  const queueRows = queueDisplay.rows;

  const artwork =
    currentTrack?.album?.images?.[0]?.url ?? "";

  const artists =
    currentTrack?.artists
      ?.map((artist) => artist.name)
      .join(", ") ?? "";

  const progress =
    duration > 0
      ? Math.min((position / duration) * 100, 100)
      : 0;

  function showDemoNotice(message: string) {
    setDemoNotice(message);

    window.setTimeout(() => {
      setDemoNotice("");
    }, 2200);
  }

  if (!currentTrack) {
    const needsTap =
      /tap the player|error|failed|expired|unavailable|could not/i.test(
        status,
      );

    return (
      <section className="relative mb-6 overflow-hidden bg-gradient-to-b from-[#0d2530] via-[#111820] to-[#121212] px-6 pb-8 pt-5">
        <div className="flex items-center justify-between">
          <span className="h-10 w-10" />

          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-300">
            Playing from Discover Next
          </p>

          <span className="h-10 w-10" />
        </div>

        <div className="mx-auto mt-7 flex aspect-square max-w-[340px] items-center justify-center rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-950 shadow-2xl">
          <DiscoverNextLogo size="large" />
        </div>

        <div className="mt-9">
          <h1 className="text-2xl font-bold">
            {needsTap ? "Your demo track is ready" : "Preparing your demo track"}
          </h1>

          <p className="mt-2 text-sm leading-6 text-zinc-400">
            {needsTap
              ? "Tap once to start playback and use the song as your musical anchor."
              : "Discover Next is connecting the browser player and loading A Message by Coldplay."}
          </p>
        </div>

        <div className="mt-7 h-1.5 overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full w-2/5 animate-pulse rounded-full bg-green-500" />
        </div>

        {needsTap && (
          <button
            type="button"
            onClick={() => void startInitialTrack()}
            disabled={!deviceId || isStartingTrack}
            className="mt-7 w-full rounded-full bg-green-500 px-6 py-4 font-bold text-black disabled:bg-zinc-700 disabled:text-zinc-400"
          >
            {isStartingTrack ? "Starting playback..." : "▶ Play demo track"}
          </button>
        )}
      </section>
    );
  }

  return (
    <>
      <section className="relative mb-6 overflow-hidden bg-gradient-to-b from-[#0d2530] via-[#111820] to-[#121212] px-6 pb-8 pt-5">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => showDemoNotice("Back navigation is not available in this demo.")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-2xl"
            aria-label="Back"
          >
           ⌄
          </button>

          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-300">
            Playing from Discover Next
          </p>

          <button
            type="button"
            onClick={() => showDemoNotice("More options are not available in this demo.")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-xl"
            aria-label="More options"
          >
            •••
          </button>
        </div>

        <div className="mx-auto mt-7 aspect-square max-w-[340px] overflow-hidden rounded-xl bg-zinc-800 shadow-2xl">
          {artwork ? (
            <img
              src={artwork}
              alt={`${currentTrack.name} album artwork`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-7xl">
              🎵
            </div>
          )}
        </div>

        <div className="mt-10 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-3xl font-bold">
              {currentTrack.name}
            </h1>

            <p className="mt-1 truncate text-lg text-zinc-400">
              {artists}
            </p>
          </div>

          <button
            type="button"
            onClick={() => showDemoNotice("Saving songs is not available in this demo.")}
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
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <div className="mt-2 flex justify-between text-xs text-zinc-400">
            <span>{formatTime(position)}</span>
            <span>-{formatTime(Math.max(duration - position, 0))}</span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => showDemoNotice("Shuffle is not available in this demo.")}
            className="text-2xl text-zinc-300"
            aria-label="Shuffle"
          >
            ⤨
          </button>

          <button
            type="button"
            onClick={() => void playerRef.current?.previousTrack()}
            className="text-4xl"
            aria-label="Previous track"
          >
            ⏮
          </button>

          <button
            type="button"
            onClick={() => void playerRef.current?.togglePlay()}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-3xl text-black"
            aria-label={isPaused ? "Play" : "Pause"}
          >
            {isPaused ? "▶" : "Ⅱ"}
          </button>

          <button
            type="button"
            onClick={() => void playerRef.current?.nextTrack()}
            className="text-4xl"
            aria-label="Next track"
          >
            ⏭
          </button>

          <button
            type="button"
            onClick={() => showDemoNotice("Repeat is not available in this demo.")}
            className="text-2xl text-zinc-300"
            aria-label="Repeat"
          >
            ↻
          </button>
        </div>

        <div className="mt-7 flex items-center justify-between">
          <button
            type="button"
            onClick={() => showDemoNotice("Device switching is not available in this demo.")}
            className="flex items-center gap-2 text-sm font-semibold text-green-400"
          >
            <span className="text-xl">▱</span>
            Discover Next
          </button>

          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => showDemoNotice("Sharing is not available in this demo.")}
              className="text-2xl"
              aria-label="Share"
            >
              ⇧
            </button>

            <button
              type="button"
              aria-label="Open queue and Discover Next"
              onClick={openQueue}
              className="rounded-xl transition active:scale-95"
            >
              <DiscoverNextLogo size="small" />
            </button>
          </div>
        </div>

        <section className="mt-8 rounded-3xl bg-[#2f8bb4] p-5 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Lyrics</h2>

            <button
              type="button"
              onClick={() => showDemoNotice("Full lyrics are not available in this demo.")}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-xl"
              aria-label="Expand lyrics"
            >
              ↗
            </button>
          </div>

          <div className="mt-8 space-y-4">
            <div className="h-4 w-3/4 rounded-full bg-white/75" />
            <div className="h-4 w-11/12 rounded-full bg-white/45" />
            <div className="h-4 w-2/3 rounded-full bg-white/30" />
          </div>

          <p className="mt-8 text-sm font-semibold text-white/80">
            Lyrics preview included for realism
          </p>
        </section>

        <section className="mt-6 rounded-3xl bg-[#242424] p-5">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">About the song</h2>
            <span className="rounded-md bg-green-500 px-2 py-1 text-xs font-bold text-black">
              Demo
            </span>
          </div>

          <p className="mt-4 text-sm leading-6 text-zinc-300">
            {currentTrack.name} by {artists} is being used as the musical
            anchor for Discover Next. The prototype uses its mood and your
            prompt to shape what comes next.
          </p>

          <button
            type="button"
            onClick={() => showDemoNotice("Song details are not available in this demo.")}
            className="mt-4 text-sm font-semibold text-white"
          >
            See more
          </button>
        </section>

        <section className="mt-6 overflow-hidden rounded-3xl bg-[#242424]">
          <div className="relative h-52 bg-zinc-800">
            {artwork ? (
              <img
                src={artwork}
                alt=""
                className="h-full w-full object-cover opacity-75"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-6xl">
                🎤
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <p className="absolute left-5 top-5 text-xl font-bold">
              About the artist
            </p>
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-2xl font-bold">{artists}</p>
                <p className="mt-1 text-sm text-zinc-400">
                  Artist profile preview
                </p>
              </div>

              <button
                type="button"
                onClick={() => showDemoNotice("Following artists is not available in this demo.")}
                className="rounded-full border border-zinc-500 px-5 py-2 text-sm font-semibold"
              >
                Following
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-zinc-400">
              Discover more about the artist, collaborators and the story
              behind this track.
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-[#242424] p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Credits</h2>
            <button
              type="button"
              onClick={() => showDemoNotice("Full credits are not available in this demo.")}
              className="text-sm font-semibold text-green-400"
            >
              Show all
            </button>
          </div>

          <div className="mt-5 space-y-5">
            <div>
              <p className="font-semibold">{artists}</p>
              <p className="mt-1 text-sm text-zinc-400">Main artist</p>
            </div>

            <div>
              <p className="font-semibold">Song contributors</p>
              <p className="mt-1 text-sm text-zinc-400">
                Writers · Producers · Musicians
              </p>
            </div>
          </div>
        </section>
      </section>

      {demoNotice && (
        <div className="fixed inset-x-0 bottom-8 z-[70] mx-auto w-full max-w-md px-5">
          <div className="rounded-full bg-white px-5 py-3 text-center text-sm font-semibold text-black shadow-2xl">
            {demoNotice}
          </div>
        </div>
      )}

      {queueOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80">
          <button
            type="button"
            aria-label="Close queue"
            onClick={() => setQueueOpen(false)}
            className="absolute inset-0"
          />

          <section className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-[32px] bg-[#202020] px-5 pb-8 pt-3">
            <div className="mx-auto h-1.5 w-12 rounded-full bg-zinc-500" />

            <div className="mt-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  Queue
                </h2>

                <p className="mt-1 text-sm text-zinc-400">
                  Playing on Discover Next
                </p>
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

            <div className="mt-6">
              <p className="text-sm font-semibold text-zinc-400">
                Now playing
              </p>

              <div className="mt-3 flex items-center gap-4 rounded-2xl bg-green-500/10 p-3">
                {artwork ? (
                  <img
                    src={artwork}
                    alt=""
                    className="h-14 w-14 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-zinc-800">
                    🎵
                  </div>
                )}

                <div className="min-w-0">
                  <p className="truncate font-semibold text-green-400">
                    {currentTrack.name}
                  </p>

                  <p className="truncate text-sm text-zinc-400">
                    {artists}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-400">
                    {queuedTracks.length > 0
                      ? "Added by Discover Next"
                      : "Next in queue"}
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    {queuedTracks.length > 0
                      ? `${queuedTracks.length} tracks added to what’s next`
                      : queueDisplay.isDemo
                        ? "Demo queue before Discover Next"
                        : "Your current Spotify queue"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void refreshSpotifyQueue()}
                  disabled={isQueueLoading}
                  className="text-xs font-semibold text-green-400 disabled:text-zinc-600"
                >
                  {isQueueLoading ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {queueRows.map((track, index) => (
                  <div
                    key={`${track.key}-${index}`}
                    className="flex items-center gap-4 rounded-2xl p-2"
                  >
                    {track.artwork ? (
                      <img
                        src={track.artwork}
                        alt=""
                        className="h-14 w-14 rounded-lg bg-zinc-800 object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-zinc-800 text-2xl">
                        {track.art}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">
                        {track.title}
                      </p>

                      <p className="truncate text-sm text-zinc-400">
                        {track.artist}
                      </p>

                      {queuedTracks.length > 0 && (
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-green-400">
                          Added by Discover Next
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {queueError && (
                  <p className="rounded-2xl bg-red-500/10 p-4 text-sm text-red-300">
                    {queueError}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                ["Shuffle", "⤨"],
                ["Repeat", "↻"],
                ["Timer", "◴"],
              ].map(([label, icon]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() =>
                    showDemoNotice(`${label} is not available in this demo.`)
                  }
                  className="rounded-2xl bg-zinc-700 px-3 py-4 text-center"
                >
                  <span className="block text-2xl">{icon}</span>
                  <span className="mt-2 block text-sm font-semibold">
                    {label}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-7 rounded-3xl border border-green-500/30 bg-green-500/10 p-5">
              <div className="flex items-start gap-3">
                <DiscoverNextLogo size="medium" />

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-green-400">
                    Discover Next
                  </p>

                  <h3 className="mt-1 text-lg font-bold">
                    Build what should play next
                  </h3>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-zinc-300">
                Keep the current vibe while introducing artists you have not
                heard.
              </p>

              <button
                type="button"
                onClick={() => {
                  setQueueOpen(false);
                  onOpenDiscovery();
                }}
                className="mt-5 w-full rounded-full bg-green-500 py-4 font-bold text-black"
              >
                Build discovery queue
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}