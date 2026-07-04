"use client";

import { useEffect, useRef, useState } from "react";

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

type SpotifyPlayerProps = {
  onOpenDiscovery: () => void;
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
}: SpotifyPlayerProps) {
  const playerRef = useRef<SpotifyPlayerInstance | null>(null);

  const [status, setStatus] = useState(
    "Loading Spotify player..."
  );

  const [deviceId, setDeviceId] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isStartingTrack, setIsStartingTrack] = useState(false);

  const [currentTrack, setCurrentTrack] =
    useState<SpotifyTrack | null>(null);

  const [nextTracks, setNextTracks] = useState<SpotifyTrack[]>(
    []
  );

  const [isPaused, setIsPaused] = useState(true);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queueOpen, setQueueOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("spotify_access_token");

    if (!token) {
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
        name: "Discover Next Player",

        getOAuthToken: (callback) => {
          const currentToken = localStorage.getItem(
            "spotify_access_token"
          );

          if (currentToken) {
            callback(currentToken);
          }
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
        setStatus("Spotify player connected");
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

        setIsActive(true);
        setCurrentTrack(state.track_window.current_track);
        setNextTracks(state.track_window.next_tracks ?? []);
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

  async function activateBrowserPlayer() {
    const token = localStorage.getItem(
      "spotify_access_token"
    );

    if (!token) {
      setStatus("Spotify access token is missing.");
      return false;
    }

    if (!deviceId) {
      setStatus("Spotify browser device is not ready.");
      return false;
    }

    setIsActivating(true);

    try {
      await playerRef.current?.activateElement();

      const response = await fetch(
        "https://api.spotify.com/v1/me/player",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            device_ids: [deviceId],
            play: false,
          }),
        }
      );

      if (!response.ok && response.status !== 204) {
        const errorText = await response.text();

        throw new Error(
          errorText ||
            `Spotify returned status ${response.status}`
        );
      }

      setIsActive(true);
      setStatus("Browser player is active");

      return true;
    } catch (error) {
      console.error(error);

      setStatus(
        error instanceof Error
          ? `Could not activate player: ${error.message}`
          : "Could not activate Spotify playback."
      );

      return false;
    } finally {
      setIsActivating(false);
    }
  }

  async function startInitialTrack() {
    const token = localStorage.getItem(
      "spotify_access_token"
    );

    if (!token) {
      setStatus("Spotify access token is missing.");
      return;
    }

    if (!deviceId) {
      setStatus("Spotify browser device is not ready.");
      return;
    }

    setIsStartingTrack(true);

    try {
      await playerRef.current?.activateElement();

      setStatus("Activating browser player...");

      const transferResponse = await fetch(
        "https://api.spotify.com/v1/me/player",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            device_ids: [deviceId],
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

      const searchResponse = await fetch(
        `https://api.spotify.com/v1/search?${searchParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
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
        error instanceof Error
          ? `Could not start playback: ${error.message}`
          : "Could not start Spotify playback."
      );
    } finally {
      setIsStartingTrack(false);
    }
  }

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

  if (!currentTrack) {
    return (
      <section className="mb-6 rounded-3xl border border-zinc-700 bg-[#181818] p-5">
        <p className="font-semibold">{status}</p>

        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Activate the browser player, then start a real
          Spotify track.
        </p>

        {deviceId && (
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={activateBrowserPlayer}
              disabled={isActivating}
              className="rounded-full bg-zinc-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {isActivating
                ? "Activating..."
                : isActive
                ? "Browser active"
                : "Activate browser"}
            </button>

            <button
              type="button"
              onClick={startInitialTrack}
              disabled={isStartingTrack}
              className="rounded-full bg-green-500 px-5 py-3 text-sm font-bold text-black disabled:bg-zinc-600 disabled:text-zinc-400"
            >
              {isStartingTrack
                ? "Starting song..."
                : "▶ Play A Message"}
            </button>
          </div>
        )}
      </section>
    );
  }

  return (
    <>
      <section className="mb-6 overflow-hidden rounded-[32px] bg-gradient-to-b from-zinc-800 to-[#121212] p-6">
        <p className="text-center text-sm font-semibold text-zinc-300">
          Now playing
        </p>

        <div className="mt-6 aspect-square overflow-hidden rounded-2xl bg-zinc-800 shadow-2xl">
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

        <div className="mt-7 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold">
              {currentTrack.name}
            </h1>

            <p className="mt-1 truncate text-zinc-400">
              {artists}
            </p>
          </div>

          <button
            type="button"
            aria-label="Open queue"
            onClick={() => setQueueOpen(true)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xl"
          >
            ☰
          </button>
        </div>

        <div className="mt-6">
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
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-9">
          <button
            type="button"
            onClick={() =>
              void playerRef.current?.previousTrack()
            }
            className="text-3xl"
            aria-label="Previous track"
          >
            ⏮
          </button>

          <button
            type="button"
            onClick={() =>
              void playerRef.current?.togglePlay()
            }
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-2xl text-black"
            aria-label={isPaused ? "Play" : "Pause"}
          >
            {isPaused ? "▶" : "Ⅱ"}
          </button>

          <button
            type="button"
            onClick={() =>
              void playerRef.current?.nextTrack()
            }
            className="text-3xl"
            aria-label="Next track"
          >
            ⏭
          </button>
        </div>
      </section>

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
                  Playing on Discover Next Player
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
              <p className="text-sm font-semibold text-zinc-400">
                Next in queue
              </p>

              <div className="mt-3 space-y-2">
                {nextTracks.length > 0 ? (
                  nextTracks.map((track) => {
                    const nextArtwork =
                      track.album?.images?.[0]?.url ?? "";

                    const nextArtists =
                      track.artists
                        ?.map((artist) => artist.name)
                        .join(", ") ?? "";

                    return (
                      <div
                        key={`${track.id}-${track.uri}`}
                        className="flex items-center gap-4 rounded-2xl p-2"
                      >
                        {nextArtwork ? (
                          <img
                            src={nextArtwork}
                            alt=""
                            className="h-14 w-14 rounded-lg bg-zinc-800 object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-zinc-800">
                            🎵
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">
                            {track.name}
                          </p>

                          <p className="truncate text-sm text-zinc-400">
                            {nextArtists}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="rounded-2xl bg-zinc-800 p-4 text-sm text-zinc-400">
                    No upcoming Spotify tracks yet.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-7 rounded-3xl border border-green-500/30 bg-green-500/10 p-5">
              <h3 className="text-lg font-bold">
                Discover what comes next
              </h3>

              <p className="mt-2 text-sm leading-6 text-zinc-300">
                Keep the current vibe while introducing
                artists you have not heard.
              </p>

              <button
                type="button"
                onClick={() => {
                  setQueueOpen(false);
                  onOpenDiscovery();
                }}
                className="mt-5 w-full rounded-full bg-green-500 py-4 font-bold text-black"
              >
                Discover with AI
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}