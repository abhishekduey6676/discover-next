type DiscoveryLevel = "Safe" | "Balanced" | "Adventurous";

type DiscoveryTag = "Familiar anchor" | "New to you" | "Stretch pick";

type PromptIntent = "party" | "general";

type CatalogueTrack = {
  title: string;
  artist: string;
  art: string;
  genres: string[];
  moods: string[];
  energy: "low" | "medium" | "high";
  distance: 1 | 2 | 3 | 4;
  intentTags?: string[];
};

type NowPlayingContext = {
  title: string;
  artist: string;
};

type DiscoverRequestBody = {
  prompt?: unknown;
  level?: unknown;
  excludedTracks?: unknown;
  nowPlaying?: unknown;
};

type GroqTrackSelection = {
  trackKey: string;
  reason: string;
};

type GroqDiscoveryResponse = {
  tracks: GroqTrackSelection[];
  summary: string;
};

type GroqChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

const CATALOGUE: CatalogueTrack[] = [
  {
    title: "Sparks",
    artist: "Coldplay",
    art: "✨",
    genres: ["alternative rock", "soft rock"],
    moods: ["intimate", "melancholic", "warm"],
    energy: "low",
    distance: 1,
  },
  {
    title: "Chasing Cars",
    artist: "Snow Patrol",
    art: "🌨️",
    genres: ["alternative rock", "soft rock"],
    moods: ["emotional", "nostalgic", "slow build"],
    energy: "medium",
    distance: 1,
  },
  {
    title: "Somewhere Only We Know",
    artist: "Keane",
    art: "🌿",
    genres: ["piano rock", "alternative rock"],
    moods: ["nostalgic", "uplifting", "melodic"],
    energy: "medium",
    distance: 1,
  },
  {
    title: "Sing",
    artist: "Travis",
    art: "☁️",
    genres: ["britpop", "alternative rock"],
    moods: ["gentle", "melodic", "hopeful"],
    energy: "medium",
    distance: 1,
  },
  {
    title: "How to Save a Life",
    artist: "The Fray",
    art: "🕯️",
    genres: ["piano rock", "pop rock"],
    moods: ["emotional", "dramatic", "reflective"],
    energy: "medium",
    distance: 1,
  },
  {
    title: "Stop and Stare",
    artist: "OneRepublic",
    art: "🛣️",
    genres: ["pop rock", "alternative rock"],
    moods: ["anthemic", "reflective", "melodic"],
    energy: "medium",
    distance: 1,
  },
  {
    title: "Read My Mind",
    artist: "The Killers",
    art: "🌃",
    genres: ["indie rock", "alternative rock"],
    moods: ["nostalgic", "anthemic", "romantic"],
    energy: "high",
    distance: 1,
  },
  {
    title: "Drive",
    artist: "Incubus",
    art: "🚘",
    genres: ["alternative rock", "post-grunge"],
    moods: ["reflective", "calm", "hopeful"],
    energy: "medium",
    distance: 1,
  },
  {
    title: "Like a Stone",
    artist: "Audioslave",
    art: "🪨",
    genres: ["alternative rock", "hard rock"],
    moods: ["brooding", "powerful", "melancholic"],
    energy: "high",
    distance: 1,
  },
  {
    title: "Stop Crying Your Heart Out",
    artist: "Oasis",
    art: "🌧️",
    genres: ["britpop", "rock"],
    moods: ["emotional", "anthemic", "comforting"],
    energy: "medium",
    distance: 1,
  },
  {
    title: "High and Dry",
    artist: "Radiohead",
    art: "🏜️",
    genres: ["alternative rock", "britpop"],
    moods: ["melancholic", "wistful", "guitar-led"],
    energy: "medium",
    distance: 2,
  },
  {
    title: "Madness",
    artist: "Muse",
    art: "🔮",
    genres: ["alternative rock", "electronic rock"],
    moods: ["dramatic", "romantic", "slow build"],
    energy: "medium",
    distance: 2,
  },
  {
    title: "Evil",
    artist: "Interpol",
    art: "🟥",
    genres: ["post-punk revival", "indie rock"],
    moods: ["dark", "driving", "cool"],
    energy: "high",
    distance: 2,
  },
  {
    title: "I Need My Girl",
    artist: "The National",
    art: "🌙",
    genres: ["indie rock", "alternative rock"],
    moods: ["intimate", "melancholic", "romantic"],
    energy: "low",
    distance: 2,
  },
  {
    title: "Munich",
    artist: "Editors",
    art: "🏙️",
    genres: ["post-punk revival", "indie rock"],
    moods: ["urgent", "dark", "driving"],
    energy: "high",
    distance: 2,
  },
  {
    title: "Youth",
    artist: "Daughter",
    art: "🌫️",
    genres: ["indie folk", "dream pop"],
    moods: ["fragile", "melancholic", "atmospheric"],
    energy: "low",
    distance: 2,
  },
  {
    title: "Spanish Sahara",
    artist: "Foals",
    art: "🏝️",
    genres: ["indie rock", "art rock"],
    moods: ["slow build", "atmospheric", "cathartic"],
    energy: "medium",
    distance: 2,
  },
  {
    title: "Sorry",
    artist: "Nothing But Thieves",
    art: "⚡",
    genres: ["alternative rock", "indie rock"],
    moods: ["dramatic", "emotional", "powerful"],
    energy: "high",
    distance: 2,
  },
  {
    title: "Cornerstone",
    artist: "Arctic Monkeys",
    art: "🧱",
    genres: ["indie rock", "alternative rock"],
    moods: ["witty", "romantic", "nostalgic"],
    energy: "medium",
    distance: 2,
  },
  {
    title: "Eventually",
    artist: "Tame Impala",
    art: "🌀",
    genres: ["psychedelic pop", "indie"],
    moods: ["dreamy", "bittersweet", "expansive"],
    energy: "medium",
    distance: 2,
  },
  {
    title: "Cigarette Daydreams",
    artist: "Cage The Elephant",
    art: "🚬",
    genres: ["indie rock", "alternative rock"],
    moods: ["nostalgic", "gentle", "bittersweet"],
    energy: "medium",
    distance: 2,
  },
  {
    title: "1901",
    artist: "Phoenix",
    art: "🔥",
    genres: ["indie pop", "indie rock"],
    moods: ["bright", "energetic", "stylish"],
    energy: "high",
    distance: 2,
  },
  {
    title: "Red Eyes",
    artist: "The War on Drugs",
    art: "🔴",
    genres: ["indie rock", "heartland rock"],
    moods: ["driving", "expansive", "hopeful"],
    energy: "high",
    distance: 2,
  },
  {
    title: "Someday",
    artist: "The Strokes",
    art: "📼",
    genres: ["indie rock", "garage rock"],
    moods: ["nostalgic", "casual", "upbeat"],
    energy: "high",
    distance: 2,
  },
  {
    title: "Sonnet",
    artist: "The Verve",
    art: "📜",
    genres: ["britpop", "alternative rock"],
    moods: ["romantic", "wistful", "melodic"],
    energy: "medium",
    distance: 2,
  },
  {
    title: "Black",
    artist: "Pearl Jam",
    art: "⚫",
    genres: ["grunge", "alternative rock"],
    moods: ["heartbroken", "powerful", "slow build"],
    energy: "high",
    distance: 2,
  },
  {
    title: "Nightswimming",
    artist: "R.E.M.",
    art: "🌌",
    genres: ["alternative rock", "soft rock"],
    moods: ["nostalgic", "quiet", "reflective"],
    energy: "low",
    distance: 2,
  },
  {
    title: "Holocene",
    artist: "Bon Iver",
    art: "🏔️",
    genres: ["indie folk", "alternative"],
    moods: ["reflective", "expansive", "gentle"],
    energy: "low",
    distance: 3,
  },
  {
    title: "Anchor",
    artist: "Novo Amor",
    art: "⚓",
    genres: ["indie folk", "ambient"],
    moods: ["fragile", "calm", "melancholic"],
    energy: "low",
    distance: 3,
  },
  {
    title: "Oats in the Water",
    artist: "Ben Howard",
    art: "🌊",
    genres: ["indie folk", "alternative"],
    moods: ["dark", "brooding", "slow build"],
    energy: "medium",
    distance: 3,
  },
  {
    title: "Berlin",
    artist: "RY X",
    art: "🕊️",
    genres: ["ambient pop", "indie"],
    moods: ["intimate", "minimal", "haunting"],
    energy: "low",
    distance: 3,
  },
  {
    title: "Strong",
    artist: "London Grammar",
    art: "💠",
    genres: ["dream pop", "indie pop"],
    moods: ["dramatic", "atmospheric", "emotional"],
    energy: "medium",
    distance: 3,
  },
  {
    title: "Space Song",
    artist: "Beach House",
    art: "🪐",
    genres: ["dream pop", "indie"],
    moods: ["dreamy", "nostalgic", "floating"],
    energy: "low",
    distance: 3,
  },
  {
    title: "Apocalypse",
    artist: "Cigarettes After Sex",
    art: "🌑",
    genres: ["dream pop", "ambient pop"],
    moods: ["intimate", "romantic", "moody"],
    energy: "low",
    distance: 3,
  },
  {
    title: "Bloom",
    artist: "The Paper Kites",
    art: "🌸",
    genres: ["indie folk", "acoustic"],
    moods: ["warm", "romantic", "gentle"],
    energy: "low",
    distance: 3,
  },
  {
    title: "Angels",
    artist: "The xx",
    art: "❎",
    genres: ["indie pop", "minimal"],
    moods: ["intimate", "quiet", "romantic"],
    energy: "low",
    distance: 3,
  },
  {
    title: "Wait",
    artist: "M83",
    art: "🌠",
    genres: ["dream pop", "electronic"],
    moods: ["cinematic", "expansive", "slow build"],
    energy: "medium",
    distance: 3,
  },
  {
    title: "Cosmic Love",
    artist: "Florence + The Machine",
    art: "🌟",
    genres: ["indie rock", "baroque pop"],
    moods: ["dramatic", "romantic", "soaring"],
    energy: "high",
    distance: 3,
  },
  {
    title: "Don't Delete the Kisses",
    artist: "Wolf Alice",
    art: "💋",
    genres: ["indie rock", "dream pop"],
    moods: ["romantic", "dreamy", "building"],
    energy: "medium",
    distance: 3,
  },
  {
    title: "Dizzy on the Comedown",
    artist: "Turnover",
    art: "🫧",
    genres: ["dream pop", "emo"],
    moods: ["hazy", "melancholic", "gentle"],
    energy: "medium",
    distance: 3,
  },
  {
    title: "The Love You Want",
    artist: "Sleep Token",
    art: "🖤",
    genres: ["alternative metal", "progressive rock"],
    moods: ["dramatic", "dark", "cathartic"],
    energy: "high",
    distance: 4,
  },
  {
    title: "Unknown / Nth",
    artist: "Hozier",
    art: "🕯️",
    genres: ["indie soul", "alternative"],
    moods: ["lyrical", "heartbroken", "intense"],
    energy: "medium",
    distance: 3,
  },
  {
    title: "Lover, You Should've Come Over",
    artist: "Jeff Buckley",
    art: "🌹",
    genres: ["alternative rock", "singer-songwriter"],
    moods: ["heartbroken", "dramatic", "soulful"],
    energy: "medium",
    distance: 3,
  },
  {
    title: "Habibi",
    artist: "Tamino",
    art: "🪬",
    genres: ["art pop", "alternative"],
    moods: ["haunting", "dramatic", "mysterious"],
    energy: "medium",
    distance: 4,
  },
  {
    title: "Dreams Tonite",
    artist: "Alvvays",
    art: "💭",
    genres: ["indie pop", "dream pop"],
    moods: ["nostalgic", "bright", "bittersweet"],
    energy: "medium",
    distance: 3,
  },
  {
    title: "Aaoge Tum Kabhi",
    artist: "The Local Train",
    art: "🚆",
    genres: ["indian indie", "alternative rock"],
    moods: ["emotional", "yearning", "slow build"],
    energy: "medium",
    distance: 3,
  },
  {
    title: "Khoj",
    artist: "When Chai Met Toast",
    art: "☕",
    genres: ["indian indie", "folk pop"],
    moods: ["hopeful", "warm", "uplifting"],
    energy: "medium",
    distance: 3,
  },
  {
    title: "cold/mess",
    artist: "Prateek Kuhad",
    art: "❄️",
    genres: ["indian indie", "singer-songwriter"],
    moods: ["intimate", "romantic", "melancholic"],
    energy: "low",
    distance: 3,
  },
  {
    title: "Alag Aasmaan",
    artist: "Anuv Jain",
    art: "☁️",
    genres: ["indian indie", "acoustic"],
    moods: ["gentle", "romantic", "wistful"],
    energy: "low",
    distance: 3,
  },
  {
    title: "I Love You Baby, I Love You Doll",
    artist: "Parekh & Singh",
    art: "🎠",
    genres: ["indian indie", "dream pop"],
    moods: ["playful", "dreamy", "romantic"],
    energy: "medium",
    distance: 4,
  },
  {
    title: "Jaago",
    artist: "Lifafa",
    art: "🪩",
    genres: ["indian electronic", "indie"],
    moods: ["hypnotic", "groovy", "unexpected"],
    energy: "high",
    distance: 4,
  },
  {
    title: "Sextape",
    artist: "Deftones",
    art: "🌊",
    genres: ["alternative metal", "dream metal"],
    moods: ["atmospheric", "romantic", "heavy"],
    energy: "high",
    distance: 4,
  },
  {
    title: "Song to Say Goodbye",
    artist: "Placebo",
    art: "🩶",
    genres: ["alternative rock", "post-punk"],
    moods: ["dark", "emotional", "driving"],
    energy: "high",
    distance: 3,
  },
  {
    title: "Levitating",
    artist: "Dua Lipa",
    art: "🪩",
    genres: ["dance pop", "disco pop"],
    moods: ["party", "upbeat", "confident"],
    energy: "high",
    distance: 3,
    intentTags: ["party", "dance", "celebration"],
  },
  {
    title: "Don't Start Now",
    artist: "Dua Lipa",
    art: "💃",
    genres: ["dance pop", "nu-disco"],
    moods: ["party", "groovy", "confident"],
    energy: "high",
    distance: 3,
    intentTags: ["party", "dance", "club"],
  },
  {
    title: "Blinding Lights",
    artist: "The Weeknd",
    art: "🌆",
    genres: ["synth-pop", "dance pop"],
    moods: ["energetic", "driving", "night-out"],
    energy: "high",
    distance: 2,
    intentTags: ["party", "dance", "night"],
  },
  {
    title: "One More Time",
    artist: "Daft Punk",
    art: "🤖",
    genres: ["house", "electronic", "dance"],
    moods: ["celebratory", "party", "euphoric"],
    energy: "high",
    distance: 4,
    intentTags: ["party", "dance", "club"],
  },
  {
    title: "Wake Me Up",
    artist: "Avicii",
    art: "🌅",
    genres: ["edm", "dance pop"],
    moods: ["uplifting", "festival", "energetic"],
    energy: "high",
    distance: 3,
    intentTags: ["party", "dance", "festival"],
  },
  {
    title: "Rather Be",
    artist: "Clean Bandit",
    art: "🎻",
    genres: ["dance pop", "electronic"],
    moods: ["bright", "upbeat", "feel-good"],
    energy: "high",
    distance: 3,
    intentTags: ["party", "dance", "celebration"],
  },
  {
    title: "This Girl",
    artist: "Kungs",
    art: "🎺",
    genres: ["house", "dance"],
    moods: ["groovy", "sunny", "party"],
    energy: "high",
    distance: 4,
    intentTags: ["party", "dance", "club"],
  },
  {
    title: "Midnight City",
    artist: "M83",
    art: "🌃",
    genres: ["synth-pop", "electronic"],
    moods: ["night-out", "euphoric", "driving"],
    energy: "high",
    distance: 3,
    intentTags: ["party", "dance", "night"],
  },
  {
    title: "Walking on a Dream",
    artist: "Empire of the Sun",
    art: "🌈",
    genres: ["electropop", "synth-pop"],
    moods: ["bright", "dreamy", "upbeat"],
    energy: "high",
    distance: 3,
    intentTags: ["party", "dance", "feel-good"],
  },
  {
    title: "Shut Up and Dance",
    artist: "WALK THE MOON",
    art: "🎉",
    genres: ["dance rock", "pop rock"],
    moods: ["party", "playful", "energetic"],
    energy: "high",
    distance: 2,
    intentTags: ["party", "dance", "celebration"],
  },
  {
    title: "Udd Gaye",
    artist: "Ritviz",
    art: "🚀",
    genres: ["indian electronic", "dance"],
    moods: ["party", "playful", "euphoric"],
    energy: "high",
    distance: 4,
    intentTags: ["party", "dance", "indian"],
  },
  {
    title: "Liggi",
    artist: "Ritviz",
    art: "🌻",
    genres: ["indian electronic", "dance pop"],
    moods: ["groovy", "playful", "feel-good"],
    energy: "high",
    distance: 4,
    intentTags: ["party", "dance", "indian"],
  },
  {
    title: "D.A.N.C.E.",
    artist: "Justice",
    art: "✝️",
    genres: ["electro house", "dance"],
    moods: ["playful", "club", "energetic"],
    energy: "high",
    distance: 4,
    intentTags: ["party", "dance", "club"],
  },
  {
    title: "Dance Yrself Clean",
    artist: "LCD Soundsystem",
    art: "🔊",
    genres: ["dance-punk", "electronic"],
    moods: ["slow build", "club", "cathartic"],
    energy: "high",
    distance: 4,
    intentTags: ["party", "dance", "club"],
  },
  {
    title: "Heads Will Roll - A-Trak Remix",
    artist: "Yeah Yeah Yeahs",
    art: "👑",
    genres: ["electro house", "dance rock"],
    moods: ["club", "dramatic", "high-energy"],
    energy: "high",
    distance: 4,
    intentTags: ["party", "dance", "club"],
  },
  {
    title: "Electric Feel",
    artist: "MGMT",
    art: "⚡",
    genres: ["indie electronic", "psychedelic pop"],
    moods: ["groovy", "playful", "danceable"],
    energy: "high",
    distance: 3,
    intentTags: ["party", "dance", "groove"],
  },
  {
    title: "Lisztomania",
    artist: "Phoenix",
    art: "🎹",
    genres: ["indie pop", "dance rock"],
    moods: ["bright", "stylish", "upbeat"],
    energy: "high",
    distance: 3,
    intentTags: ["party", "dance", "feel-good"],
  },
  {
    title: "The Less I Know the Better",
    artist: "Tame Impala",
    art: "🌀",
    genres: ["psychedelic pop", "indie dance"],
    moods: ["groovy", "danceable", "stylish"],
    energy: "high",
    distance: 3,
    intentTags: ["party", "dance", "groove"],
  },
];

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "but",
  "for",
  "from",
  "help",
  "i",
  "in",
  "is",
  "it",
  "keep",
  "me",
  "more",
  "my",
  "of",
  "on",
  "or",
  "same",
  "something",
  "that",
  "the",
  "this",
  "to",
  "want",
  "with",
]);

function normalise(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function trackKey(track: Pick<CatalogueTrack, "title" | "artist">) {
  return `${track.title} - ${track.artist}`;
}

function isDiscoveryLevel(value: unknown): value is DiscoveryLevel {
  return value === "Safe" || value === "Balanced" || value === "Adventurous";
}

function parseNowPlaying(value: unknown): NowPlayingContext | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as {
    title?: unknown;
    artist?: unknown;
  };

  if (
    typeof candidate.title !== "string" ||
    typeof candidate.artist !== "string"
  ) {
    return null;
  }

  const title = candidate.title.trim().slice(0, 180);
  const artist = candidate.artist.trim().slice(0, 180);

  if (!title || !artist) {
    return null;
  }

  return {
    title,
    artist,
  };
}

function getPromptTerms(prompt: string) {
  return normalise(prompt)
    .replace(/[^a-z0-9/\s-]/g, " ")
    .split(/\s+/)
    .filter((term) => term.length > 2 && !STOP_WORDS.has(term));
}

function getTargetDistance(level: DiscoveryLevel) {
  if (level === "Safe") {
    return 1.5;
  }

  if (level === "Adventurous") {
    return 3.7;
  }

  return 2.6;
}

function detectPromptIntent(prompt: string): PromptIntent {
  const promptText = normalise(prompt);

  const partyKeywords = [
    "party",
    "party tracks",
    "dance",
    "dancing",
    "club",
    "club-ready",
    "celebration",
    "celebratory",
    "pregame",
    "night out",
    "house party",
    "edm",
    "festival",
    "groovy",
    "feel good",
    "feel-good",
  ];

  return partyKeywords.some((keyword) => promptText.includes(keyword))
    ? "party"
    : "general";
}

function matchesPromptIntent(
  track: CatalogueTrack,
  intent: PromptIntent
) {
  if (intent === "general") {
    return true;
  }

  const searchable = normalise(
    [
      ...track.genres,
      ...track.moods,
      ...(track.intentTags ?? []),
    ].join(" ")
  );

  const partySignals = [
    "party",
    "dance",
    "club",
    "house",
    "edm",
    "festival",
    "disco",
    "groovy",
    "danceable",
    "celebratory",
    "night-out",
    "feel-good",
    "upbeat",
  ];

  return (
    track.energy === "high" &&
    partySignals.some((signal) => searchable.includes(signal))
  );
}

function getIntentInstruction(intent: PromptIntent) {
  if (intent === "party") {
    return "The listener explicitly requested party music. Every selected track must be danceable, upbeat, celebratory, club-ready or festival-ready. This requirement is more important than matching the currently playing song. Do not select heavy, brooding, slow, intimate or melancholy tracks merely because they are high-energy.";
  }

  return "Follow the listener's explicit prompt first, then use the currently playing song as supporting context.";
}

function createCandidatePool(
  prompt: string,
  level: DiscoveryLevel,
  excludedTracks: string[],
  nowPlaying: NowPlayingContext | null
) {
  const excluded = new Set(excludedTracks.map(normalise));

  if (nowPlaying) {
    excluded.add(
      normalise(`${nowPlaying.title} - ${nowPlaying.artist}`)
    );
  }
  const nonExcluded = CATALOGUE.filter(
    (track) => !excluded.has(normalise(trackKey(track)))
  );

  const baseSource = nonExcluded.length >= 10 ? nonExcluded : CATALOGUE;
  const promptIntent = detectPromptIntent(prompt);
  const intentFilteredSource = baseSource.filter((track) =>
    matchesPromptIntent(track, promptIntent)
  );
  const source =
    promptIntent !== "general" && intentFilteredSource.length >= 8
      ? intentFilteredSource
      : baseSource;
  const promptTerms = getPromptTerms(prompt);
  const promptText = normalise(prompt);
  const targetDistance = getTargetDistance(level);

  const noveltyRequested = [
    "new",
    "never heard",
    "unfamiliar",
    "surprise",
    "different",
    "branch out",
    "new artists",
  ].some((phrase) => promptText.includes(phrase));

  const lowerEnergyRequested = [
    "calm",
    "soft",
    "slow",
    "gentle",
    "quiet",
    "low energy",
  ].some((phrase) => promptText.includes(phrase));

  const higherEnergyRequested =
    promptIntent === "party" ||
    [
      "energy",
      "energetic",
      "upbeat",
      "loud",
      "powerful",
      "high energy",
    ].some((phrase) => promptText.includes(phrase));

  return source
    .map((track) => {
      const searchable = normalise(
        [
          track.title,
          track.artist,
          ...track.genres,
          ...track.moods,
          track.energy,
        ].join(" ")
      );

      const termScore = promptTerms.reduce(
        (score, term) => score + (searchable.includes(term) ? 3 : 0),
        0
      );

      const distanceScore =
        5 - Math.min(5, Math.abs(track.distance - targetDistance) * 1.6);

      const noveltyScore = noveltyRequested ? track.distance * 0.8 : 0;

      const energyScore =
        (lowerEnergyRequested && track.energy === "low") ||
        (higherEnergyRequested && track.energy === "high")
          ? 3
          : 0;

      const intentScore = matchesPromptIntent(track, promptIntent) ? 12 : 0;
      const randomVariety = Math.random() * 2;

      return {
        track,
        score:
          termScore +
          distanceScore +
          noveltyScore +
          energyScore +
          intentScore +
          randomVariety,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 24)
    .map(({ track }) => track);
}

function getTagPattern(level: DiscoveryLevel): DiscoveryTag[] {
  if (level === "Safe") {
    return [
      "Familiar anchor",
      "Familiar anchor",
      "New to you",
      "New to you",
      "New to you",
    ];
  }

  if (level === "Adventurous") {
    return [
      "New to you",
      "New to you",
      "New to you",
      "Stretch pick",
      "Stretch pick",
    ];
  }

  return [
    "Familiar anchor",
    "New to you",
    "New to you",
    "New to you",
    "Stretch pick",
  ];
}

function createFallbackReason(
  track: CatalogueTrack,
  prompt: string,
  tag: DiscoveryTag
) {
  const mood = track.moods.slice(0, 2).join(" and ");
  const genre = track.genres[0];

  if (tag === "Familiar anchor") {
    return `A recognisable ${genre} anchor with ${mood} qualities that keeps the queue connected to your request.`;
  }

  if (tag === "Stretch pick") {
    return `A wider step into ${genre}, chosen to add a more unexpected ${mood} edge without breaking the flow.`;
  }

  return `A discovery-led ${genre} pick with ${mood} qualities that responds to “${prompt.slice(
    0,
    70
  )}”.`;
}

function createFallbackResponse(
  candidates: CatalogueTrack[],
  prompt: string,
  level: DiscoveryLevel,
  nowPlaying: NowPlayingContext | null
) {
  const selected = candidates.slice(0, 5);
  const tags = getTagPattern(level);
  const promptIntent = detectPromptIntent(prompt);

  return {
    tracks: selected.map((track, index) => ({
      title: track.title,
      artist: track.artist,
      art: track.art,
      tag: tags[index],
      reason: createFallbackReason(track, prompt, tags[index]),
    })),
    summary:
      promptIntent === "party"
        ? `A danceable ${level.toLowerCase()} party queue built around unfamiliar artists, upbeat momentum and a coherent energy rise.`
        : nowPlaying
        ? `Starting from “${nowPlaying.title}” by ${nowPlaying.artist}, this ${level.toLowerCase()} queue keeps the musical thread while introducing unfamiliar artists and controlled musical distance.`
        : `Built around your request with a ${level.toLowerCase()} mix of emotional continuity, unfamiliar artists and controlled musical distance.`,
    usedFallback: true,
    provider: "Curated fallback",
  };
}

export async function POST(request: Request) {
  let body: DiscoverRequestBody;

  try {
    body = (await request.json()) as DiscoverRequestBody;
  } catch {
    return Response.json(
      {
        error: "The request body must be valid JSON.",
      },
      {
        status: 400,
      }
    );
  }

  const prompt =
    typeof body.prompt === "string" ? body.prompt.trim().slice(0, 600) : "";

  const level: DiscoveryLevel = isDiscoveryLevel(body.level)
    ? body.level
    : "Balanced";

  const excludedTracks = Array.isArray(body.excludedTracks)
    ? body.excludedTracks
        .filter((item): item is string => typeof item === "string")
        .slice(-30)
    : [];

  const nowPlaying = parseNowPlaying(body.nowPlaying);
  const promptIntent = detectPromptIntent(prompt);

  if (!prompt) {
    return Response.json(
      {
        error: "Please enter a discovery prompt.",
      },
      {
        status: 400,
      }
    );
  }

  const candidates = createCandidatePool(
    prompt,
    level,
    excludedTracks,
    nowPlaying
  );

  const fallbackResponse = createFallbackResponse(
    candidates,
    prompt,
    level,
    nowPlaying
  );
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return Response.json(fallbackResponse, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

  const candidateKeys = candidates.map(trackKey);
  const candidateByKey = new Map(
    candidates.map((track) => [normalise(trackKey(track)), track])
  );

  const intentInstruction = getIntentInstruction(promptIntent);

  const levelInstruction =
    level === "Safe"
      ? "Stay close to the musical character of the current song. Use two accessible anchors and three gentle discoveries."
      : level === "Adventurous"
      ? "Use the current song only as a starting point, then prioritise unfamiliar artists, wider genre movement and two genuine stretch picks."
      : "Use the current song as a musical anchor, then choose one familiar-feeling track, three new-to-you discoveries and one stretch pick.";

  try {
    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: [
            {
              role: "system",
              content:
                "You are the recommendation intelligence inside Spotify's Discover Next feature. The listener's explicit natural-language request is the strongest instruction. Use the real currently playing song only as supporting musical context when it does not conflict with the request. Select exactly five unique songs only from the supplied candidate list. Preserve a coherent queue flow, avoid generic repetition, and never invent a song or artist. Return concise reasons that explain why each track satisfies the listener's request.",
            },
            {
              role: "user",
              content: JSON.stringify({
                nowPlaying,
                listenerPrompt: prompt,
                detectedIntent: promptIntent,
                intentInstruction,
                discoveryLevel: level,
                levelInstruction,
                outputInstruction:
                  "Return exactly five unique trackKey values from candidates. Obey the detected intent as a hard constraint. Order the tracks as a playable queue with a coherent emotional or energy progression.",
                candidates: candidates.map((track) => ({
                  trackKey: trackKey(track),
                  genres: track.genres,
                  moods: track.moods,
                  energy: track.energy,
                  musicalDistance: track.distance,
                })),
              }),
            },
          ],
          temperature: 0.9,
          reasoning_effort: "low",
          max_completion_tokens: 1000,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "spotify_discovery_queue",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  tracks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        trackKey: {
                          type: "string",
                          enum: candidateKeys,
                        },
                        reason: {
                          type: "string",
                        },
                      },
                      required: ["trackKey", "reason"],
                      additionalProperties: false,
                    },
                  },
                  summary: {
                    type: "string",
                  },
                },
                required: ["tracks", "summary"],
                additionalProperties: false,
              },
            },
          },
        }),
        cache: "no-store",
      }
    );

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      throw new Error(
        `Groq request failed with ${groqResponse.status}: ${errorText}`
      );
    }

    const groqData =
      (await groqResponse.json()) as GroqChatCompletionResponse;

    const content = groqData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Groq returned an empty response.");
    }

    const parsed = JSON.parse(content) as GroqDiscoveryResponse;
    const seen = new Set<string>();

    const selected = Array.isArray(parsed.tracks)
      ? parsed.tracks
          .filter((item) => {
            if (
              !item ||
              typeof item.trackKey !== "string" ||
              typeof item.reason !== "string"
            ) {
              return false;
            }

            const key = normalise(item.trackKey);

            if (seen.has(key) || !candidateByKey.has(key)) {
              return false;
            }

            seen.add(key);
            return true;
          })
          .slice(0, 5)
      : [];

    if (selected.length !== 5) {
      throw new Error("Groq did not return five valid unique tracks.");
    }

    const tags = getTagPattern(level);

    const tracks = selected.map((selection, index) => {
      const track = candidateByKey.get(normalise(selection.trackKey));

      if (!track) {
        throw new Error("A selected track was not found in the catalogue.");
      }

      return {
        title: track.title,
        artist: track.artist,
        art: track.art,
        tag: tags[index],
        reason: selection.reason.trim().slice(0, 260),
      };
    });

    return Response.json(
      {
        tracks,
        summary:
          typeof parsed.summary === "string" && parsed.summary.trim()
            ? parsed.summary.trim().slice(0, 320)
            : `A ${level.toLowerCase()} discovery queue shaped around your prompt.`,
        usedFallback: false,
        provider: "Groq · GPT-OSS 20B",
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Discover Next Groq error:", error);

    return Response.json(fallbackResponse, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }
}
