const scopes = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-read-playback-state",
  "user-modify-playback-state",
];

const ACCESS_TOKEN_KEY = "spotify_access_token";
const REFRESH_TOKEN_KEY = "spotify_refresh_token";
const EXPIRES_AT_KEY = "spotify_token_expires_at";
const TOKEN_REFRESH_BUFFER_MS = 60_000;

type SpotifyTokenResponse = {
  access_token: string;
  token_type?: string;
  scope?: string;
  expires_in: number;
  refresh_token?: string;
};

let refreshPromise: Promise<string | null> | null = null;

function generateRandomString(length: number) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  const values = crypto.getRandomValues(new Uint8Array(length));

  return Array.from(values)
    .map((value) => characters[value % characters.length])
    .join("");
}

async function createCodeChallenge(codeVerifier: string) {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await crypto.subtle.digest("SHA-256", data);

  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function isBrowser() {
  return typeof window !== "undefined";
}

function getSpotifyClientId() {
  return process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ?? "";
}

export function getSpotifyRedirectUri() {
  if (!isBrowser()) {
    return "";
  }

  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    return "http://127.0.0.1:3000/callback";
  }

  return `${window.location.origin}/callback`;
}

export function saveSpotifyTokens(data: SpotifyTokenResponse) {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
  localStorage.setItem(
    EXPIRES_AT_KEY,
    String(Date.now() + data.expires_in * 1000)
  );

  if (data.refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
  }
}

export function clearSpotifySession() {
  if (!isBrowser()) {
    return;
  }

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(EXPIRES_AT_KEY);
  localStorage.removeItem("spotify_device_id");
}

function getStoredAccessToken() {
  if (!isBrowser()) {
    return null;
  }

  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getStoredRefreshToken() {
  if (!isBrowser()) {
    return null;
  }

  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function getStoredExpiryTime() {
  if (!isBrowser()) {
    return 0;
  }

  const value = localStorage.getItem(EXPIRES_AT_KEY);
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

async function requestFreshSpotifyAccessToken() {
  const clientId = getSpotifyClientId();
  const refreshToken = getStoredRefreshToken();

  if (!clientId || !refreshToken) {
    return null;
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    let errorMessage = `Spotify token refresh failed: ${response.status}`;

    try {
      const errorBody = (await response.json()) as {
        error?: string;
        error_description?: string;
      };

      errorMessage =
        errorBody.error_description ||
        errorBody.error ||
        errorMessage;
    } catch {
      const errorText = await response.text();

      if (errorText) {
        errorMessage = errorText;
      }
    }

    if (response.status === 400 || response.status === 401) {
      clearSpotifySession();
    }

    throw new Error(errorMessage);
  }

  const data = (await response.json()) as SpotifyTokenResponse;

  if (!data.access_token || !data.expires_in) {
    throw new Error("Spotify returned an incomplete refresh response.");
  }

  saveSpotifyTokens(data);

  return data.access_token;
}

export async function refreshSpotifyAccessToken() {
  if (!refreshPromise) {
    refreshPromise = requestFreshSpotifyAccessToken().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function getValidSpotifyAccessToken(
  forceRefresh = false
): Promise<string | null> {
  if (!isBrowser()) {
    return null;
  }

  const accessToken = getStoredAccessToken();
  const expiresAt = getStoredExpiryTime();
  const tokenIsStillValid =
    accessToken &&
    expiresAt > Date.now() + TOKEN_REFRESH_BUFFER_MS;

  if (!forceRefresh && tokenIsStillValid) {
    return accessToken;
  }

  const refreshToken = getStoredRefreshToken();

  if (refreshToken) {
    return refreshSpotifyAccessToken();
  }

  if (!forceRefresh && accessToken && expiresAt === 0) {
    return accessToken;
  }

  return null;
}

export async function spotifyFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
) {
  const accessToken = await getValidSpotifyAccessToken();

  if (!accessToken) {
    throw new Error("Spotify session expired. Connect Spotify again.");
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);

  let response = await fetch(input, {
    ...init,
    headers,
  });

  if (response.status !== 401) {
    return response;
  }

  const refreshedToken = await getValidSpotifyAccessToken(true);

  if (!refreshedToken) {
    clearSpotifySession();
    throw new Error("Spotify session expired. Connect Spotify again.");
  }

  const retryHeaders = new Headers(init.headers);
  retryHeaders.set("Authorization", `Bearer ${refreshedToken}`);

  response = await fetch(input, {
    ...init,
    headers: retryHeaders,
  });

  return response;
}

export async function loginWithSpotify() {
  const clientId = getSpotifyClientId();

  if (!clientId) {
    throw new Error("Spotify Client ID is missing.");
  }

  clearSpotifySession();

  const codeVerifier = generateRandomString(64);
  const codeChallenge = await createCodeChallenge(codeVerifier);
  const state = generateRandomString(16);

  localStorage.setItem("spotify_code_verifier", codeVerifier);
  localStorage.setItem("spotify_auth_state", state);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: getSpotifyRedirectUri(),
    scope: scopes.join(" "),
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
    state,
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}
