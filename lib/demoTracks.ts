export type DemoTrack = {
  title: string;
  artist: string;
  art: string;
  uri: string;
  duration: number;
  collection: string;
  coverFrom: string;
  coverTo: string;
};

export const DEMO_TRACKS: DemoTrack[] = [
  {
    title: "A Message",
    artist: "Coldplay",
    art: "X&Y",
    uri: "demo:a-message",
    duration: 285_000,
    collection: "Emotional rock",
    coverFrom: "#0f2740",
    coverTo: "#0a5b78",
  },
  {
    title: "The Zephyr Song",
    artist: "Red Hot Chili Peppers",
    art: "ZEP",
    uri: "demo:zephyr-song",
    duration: 232_000,
    collection: "Alternative essentials",
    coverFrom: "#8f2d2d",
    coverTo: "#f29b38",
  },
  {
    title: "Across The Universe",
    artist: "The Beatles",
    art: "ATU",
    uri: "demo:across-the-universe",
    duration: 228_000,
    collection: "Classic calm",
    coverFrom: "#3d315b",
    coverTo: "#8d6bb8",
  },
  {
    title: "Iridescent",
    artist: "Linkin Park",
    art: "IRI",
    uri: "demo:iridescent",
    duration: 297_000,
    collection: "Slow-build rock",
    coverFrom: "#232323",
    coverTo: "#646464",
  },
  {
    title: "Human",
    artist: "The Killers",
    art: "HUM",
    uri: "demo:human",
    duration: 245_000,
    collection: "Indie anthems",
    coverFrom: "#9b3156",
    coverTo: "#f1aa53",
  },
  {
    title: "Chasing Cars",
    artist: "Snow Patrol",
    art: "CC",
    uri: "demo:chasing-cars",
    duration: 267_000,
    collection: "Emotional favourites",
    coverFrom: "#334a5e",
    coverTo: "#8ea6b5",
  },
  {
    title: "Drive",
    artist: "Incubus",
    art: "DRV",
    uri: "demo:drive",
    duration: 232_000,
    collection: "Reflective rock",
    coverFrom: "#28465f",
    coverTo: "#5f9f8c",
  },
  {
    title: "Nightswimming",
    artist: "R.E.M.",
    art: "NTS",
    uri: "demo:nightswimming",
    duration: 258_000,
    collection: "Late-night listening",
    coverFrom: "#19283d",
    coverTo: "#575f8f",
  },
  {
    title: "Space Song",
    artist: "Beach House",
    art: "SPC",
    uri: "demo:space-song",
    duration: 320_000,
    collection: "Dreamy discoveries",
    coverFrom: "#37204c",
    coverTo: "#9866a8",
  },
  {
    title: "Levitating",
    artist: "Dua Lipa",
    art: "LEV",
    uri: "demo:levitating",
    duration: 203_000,
    collection: "Upbeat pop",
    coverFrom: "#5f2477",
    coverTo: "#ee5d9f",
  },
  {
    title: "Shut Up and Dance",
    artist: "WALK THE MOON",
    art: "DNC",
    uri: "demo:shut-up-and-dance",
    duration: 199_000,
    collection: "Party starters",
    coverFrom: "#ef325c",
    coverTo: "#f5a623",
  },
  {
    title: "Aaoge Tum Kabhi",
    artist: "The Local Train",
    art: "ATK",
    uri: "demo:aaoge-tum-kabhi",
    duration: 313_000,
    collection: "Indie India",
    coverFrom: "#343434",
    coverTo: "#8d5b3d",
  },
  {
    title: "cold/mess",
    artist: "Prateek Kuhad",
    art: "C/M",
    uri: "demo:cold-mess",
    duration: 281_000,
    collection: "Acoustic calm",
    coverFrom: "#586c7a",
    coverTo: "#a7b5bd",
  },
  {
    title: "1901",
    artist: "Phoenix",
    art: "1901",
    uri: "demo:1901",
    duration: 193_000,
    collection: "Indie energy",
    coverFrom: "#bc3c25",
    coverTo: "#efb641",
  },
  {
    title: "Red Eyes",
    artist: "The War on Drugs",
    art: "RED",
    uri: "demo:red-eyes",
    duration: 299_000,
    collection: "Road-trip rock",
    coverFrom: "#6d1824",
    coverTo: "#c55a46",
  },
  {
    title: "Somewhere Only We Know",
    artist: "Keane",
    art: "SOWK",
    uri: "demo:somewhere-only-we-know",
    duration: 237_000,
    collection: "Piano-led favourites",
    coverFrom: "#55604e",
    coverTo: "#a7aa7b",
  },
  {
    title: "Madness",
    artist: "Muse",
    art: "MAD",
    uri: "demo:madness",
    duration: 281_000,
    collection: "Alternative pulse",
    coverFrom: "#3a263f",
    coverTo: "#9f486d",
  },
  {
    title: "The Less I Know the Better",
    artist: "Tame Impala",
    art: "TLIK",
    uri: "demo:less-i-know",
    duration: 216_000,
    collection: "Groovy indie",
    coverFrom: "#7d274c",
    coverTo: "#e89a58",
  },
  {
    title: "Midnight City",
    artist: "M83",
    art: "MID",
    uri: "demo:midnight-city",
    duration: 244_000,
    collection: "Night drive",
    coverFrom: "#17324d",
    coverTo: "#a75183",
  },
  {
    title: "Read My Mind",
    artist: "The Killers",
    art: "RMM",
    uri: "demo:read-my-mind",
    duration: 246_000,
    collection: "Indie classics",
    coverFrom: "#294664",
    coverTo: "#dd7d5e",
  },
];

export const DEFAULT_DEMO_TRACK = DEMO_TRACKS[0];

export function getDemoQueue(seedUri: string, count = 8) {
  const seedIndex = DEMO_TRACKS.findIndex((track) => track.uri === seedUri);
  const startIndex = seedIndex >= 0 ? seedIndex : 0;
  const queue: DemoTrack[] = [];

  for (let offset = 1; queue.length < Math.min(count, DEMO_TRACKS.length - 1); offset += 1) {
    const candidate = DEMO_TRACKS[(startIndex + offset) % DEMO_TRACKS.length];

    if (candidate.uri !== seedUri) {
      queue.push(candidate);
    }
  }

  return queue;
}
