import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

type DiscoveryLevel = "Safe" | "Balanced" | "Adventurous";

type CatalogueTrack = {
  title: string;
  artist: string;
  genres: string[];
  moods: string[];
  energy: "low" | "medium" | "high";
  familiarity: "known" | "new" | "stretch";
};

const catalogue: CatalogueTrack[] = [
  {
    title: "The Silence",
    artist: "Manchester Orchestra",
    genres: ["alternative rock", "indie rock"],
    moods: ["emotional", "intense", "reflective"],
    energy: "medium",
    familiarity: "new",
  },
  {
    title: "Sweet Disposition",
    artist: "The Temper Trap",
    genres: ["alternative rock", "indie rock"],
    moods: ["nostalgic", "uplifting", "emotional"],
    energy: "medium",
    familiarity: "new",
  },
  {
    title: "Fix You",
    artist: "Coldplay",
    genres: ["alternative rock", "pop rock"],
    moods: ["emotional", "hopeful", "reflective"],
    energy: "medium",
    familiarity: "known",
  },
  {
    title: "First Day of My Life",
    artist: "Bright Eyes",
    genres: ["indie folk", "indie rock"],
    moods: ["intimate", "warm", "reflective"],
    energy: "low",
    familiarity: "stretch",
  },
  {
    title: "Open Your Eyes",
    artist: "Snow Patrol",
    genres: ["alternative rock", "pop rock"],
    moods: ["emotional", "dramatic", "nostalgic"],
    energy: "medium",
    familiarity: "new",
  },
  {
    title: "Run",
    artist: "Snow Patrol",
    genres: ["alternative rock"],
    moods: ["emotional", "melancholic", "dramatic"],
    energy: "medium",
    familiarity: "new",
  },
  {
    title: "Work Song",
    artist: "Hozier",
    genres: ["alternative", "indie soul"],
    moods: ["dark", "romantic", "emotional"],
    energy: "low",
    familiarity: "stretch",
  },
  {
    title: "Somewhere Only We Know",
    artist: "Keane",
    genres: ["alternative rock", "piano rock"],
    moods: ["nostalgic", "emotional", "hopeful"],
    energy: "medium",
    familiarity: "new",
  },
  {
    title: "Chasing Cars",
    artist: "Snow Patrol",
    genres: ["alternative rock"],
    moods: ["romantic", "emotional", "calm"],
    energy: "low",
    familiarity: "new",
  },
  {
    title: "How to Save a Life",
    artist: "The Fray",
    genres: ["alternative rock", "piano rock"],
    moods: ["emotional", "reflective", "melancholic"],
    energy: "medium",
    familiarity: "new",
  },
  {
    title: "Yellow",
    artist: "Coldplay",
    genres: ["alternative rock", "pop rock"],
    moods: ["warm", "romantic", "nostalgic"],
    energy: "medium",
    familiarity: "known",
  },
  {
    title: "Read My Mind",
    artist: "The Killers",
    genres: ["alternative rock", "indie rock"],
    moods: ["nostalgic", "uplifting", "reflective"],
    energy: "medium",
    familiarity: "known",
  },
];

const fallbackTracks = [
  {
    title: "The Silence",
    artist: "Manchester Orchestra",
    tag: "New to you",
    reason:
      "Matches the emotional build of your current playlist while introducing a less familiar artist.",
    art: "🌌",
  },
  {
    title: "Sweet Disposition",
    artist: "The Temper Trap",
    tag: "New to you",
    reason:
      "Keeps the nostalgic alternative-rock feeling without repeating your usual artists.",
    art: "🌅",
  },
  {
    title: "Fix You",
    artist: "Coldplay",
    tag: "Familiar anchor",
    reason:
      "Provides one familiar track so the discovery queue still feels connected to your taste.",
    art: "🟦",
  },
  {
    title: "First Day of My Life",
    artist: "Bright Eyes",
    tag: "Stretch pick",
    reason:
      "Introduces a softer indie direction while preserving the reflective mood.",
    art: "🌙",
  },
  {
    title: "Open Your Eyes",
    artist: "Snow Patrol",
    tag: "New to you",
    reason:
      "Fits the melodic emotional-rock direction and broadens the artist mix.",
    art: "❄️",
  },
];

function getArtwork(tag: string) {
  if (tag === "Familiar anchor") return "🟦";
  if (tag === "Stretch pick") return "🌙";
  return "✨";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const prompt =
      typeof body.prompt === "string" ? body.prompt.trim() : "";

    const level = body.level as DiscoveryLevel;

    if (!prompt) {
      return NextResponse.json(
        { error: "A discovery prompt is required." },
        { status: 400 }
      );
    }

    if (!["Safe", "Balanced", "Adventurous"].includes(level)) {
      return NextResponse.json(
        { error: "Invalid discovery level." },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        tracks: fallbackTracks,
        summary:
          "Fallback recommendations were used because the AI key is not configured.",
        usedFallback: true,
      });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const modelPrompt = `
You are an AI music discovery engine.

Your job is not merely to recommend relevant songs. Your primary goal is to help a listener discover unfamiliar music while keeping the queue coherent.

USER REQUEST:
${prompt}

DISCOVERY LEVEL:
${level}

CURRENT LISTENING CONTEXT:
- Coldplay
- Linkin Park
- Red Hot Chili Peppers
- The Beatles
- The Killers
- Emotional rock
- Nostalgic melodies
- Medium energy

AVAILABLE CATALOGUE:
${JSON.stringify(catalogue, null, 2)}

DISCOVERY RULES:

Safe:
- 2 familiar anchors
- 3 adjacent discoveries
- No major genre jump

Balanced:
- 1 familiar anchor
- 3 adjacent discoveries
- 1 stretch discovery

Adventurous:
- 0 or 1 familiar anchor
- At least 2 stretch discoveries
- Wider musical distance is allowed

Additional rules:
- Return exactly 5 tracks.
- Only choose tracks from the supplied catalogue.
- Do not invent songs or artists.
- Do not repeat a song.
- Make the recommendations clearly support discovery.
- Reasons must be concise and personalised.
- Tag each track as exactly one of:
  "Familiar anchor"
  "New to you"
  "Stretch pick"

Return JSON only in this format:

{
  "summary": "One sentence describing what the AI understood.",
  "tracks": [
    {
      "title": "Song title",
      "artist": "Artist",
      "tag": "New to you",
      "reason": "Short personalised reason"
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: modelPrompt,
      config: {
  responseMimeType: "application/json",
  responseJsonSchema: {
    type: "object",
    properties: {
      summary: {
        type: "string",
      },
      tracks: {
        type: "array",
        minItems: 5,
        maxItems: 5,
        items: {
          type: "object",
          properties: {
            title: {
              type: "string",
            },
            artist: {
              type: "string",
            },
            tag: {
              type: "string",
              enum: [
                "Familiar anchor",
                "New to you",
                "Stretch pick",
              ],
            },
            reason: {
              type: "string",
            },
          },
          required: ["title", "artist", "tag", "reason"],
        },
      },
    },
    required: ["summary", "tracks"],
  },
},
    });

    const responseText = response.text;

    if (!responseText) {
      throw new Error("Gemini returned an empty response.");
    }

    const parsed = JSON.parse(responseText);

    if (!Array.isArray(parsed.tracks) || parsed.tracks.length === 0) {
      throw new Error("Gemini returned an invalid track list.");
    }

    const tracks = parsed.tracks.slice(0, 5).map(
      (track: {
        title?: string;
        artist?: string;
        tag?: string;
        reason?: string;
      }) => ({
        title: track.title ?? "Unknown track",
        artist: track.artist ?? "Unknown artist",
        tag: track.tag ?? "New to you",
        reason:
          track.reason ??
          "Selected because it matches the direction of your request.",
        art: getArtwork(track.tag ?? "New to you"),
      })
    );

    return NextResponse.json({
      tracks,
      summary:
        parsed.summary ??
        "A discovery queue based on your current playlist and prompt.",
      usedFallback: false,
    });
  } catch (error) {
    console.error("Discovery API error:", error);

    return NextResponse.json({
      tracks: fallbackTracks,
      summary:
        "A reliable fallback queue was generated because the AI request could not be completed.",
      usedFallback: true,
    });
  }
}