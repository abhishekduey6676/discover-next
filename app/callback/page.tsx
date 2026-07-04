"use client";

import { useEffect, useState } from "react";
import { getSpotifyRedirectUri } from "@/lib/spotifyAuth";

export default function SpotifyCallbackPage() {
  const [message, setMessage] = useState("Connecting to Spotify...");

  useEffect(() => {
    async function exchangeCode() {
      try {
        const params = new URLSearchParams(window.location.search);

        const code = params.get("code");
        const returnedState = params.get("state");
        const error = params.get("error");

        const savedState = localStorage.getItem("spotify_auth_state");
        const codeVerifier = localStorage.getItem("spotify_code_verifier");
        const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;

        if (error) {
          throw new Error(`Spotify login failed: ${error}`);
        }

        if (!code || !codeVerifier || !clientId) {
          throw new Error("Missing Spotify authentication information.");
        }

        if (!returnedState || returnedState !== savedState) {
          throw new Error("Spotify authentication state did not match.");
        }

        const response = await fetch(
          "https://accounts.spotify.com/api/token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              client_id: clientId,
              grant_type: "authorization_code",
              code,
              redirect_uri: getSpotifyRedirectUri(),
              code_verifier: codeVerifier,
            }),
          }
        );

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`Token request failed: ${errorBody}`);
        }

        const data = await response.json();

        localStorage.setItem("spotify_access_token", data.access_token);
        localStorage.setItem(
          "spotify_token_expires_at",
          String(Date.now() + data.expires_in * 1000)
        );

        if (data.refresh_token) {
          localStorage.setItem(
            "spotify_refresh_token",
            data.refresh_token
          );
        }

        localStorage.removeItem("spotify_code_verifier");
        localStorage.removeItem("spotify_auth_state");

        window.location.href = "/";
      } catch (error) {
        console.error(error);

        setMessage(
          error instanceof Error
            ? error.message
            : "Spotify connection failed."
        );
      }
    }

    exchangeCode();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-zinc-700 border-t-green-500" />

        <p className="mt-5 text-sm text-zinc-300">{message}</p>
      </div>
    </main>
  );
}