import type { DemoTrack } from "@/lib/demoTracks";

type DemoTrackCoverProps = {
  track: Pick<DemoTrack, "title" | "artist" | "art" | "coverFrom" | "coverTo">;
  className?: string;
  compact?: boolean;
};

export default function DemoTrackCover({
  track,
  className = "",
  compact = false,
}: DemoTrackCoverProps) {
  return (
    <div
      aria-label={`${track.title} artwork`}
      className={`relative overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(145deg, ${track.coverFrom}, ${track.coverTo})`,
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_42%)]" />

      <div className="relative flex h-full flex-col justify-between p-3">
        <span
          className={`font-black tracking-tight text-white ${
            compact ? "text-xs" : "text-2xl"
          }`}
        >
          {track.art}
        </span>

        {!compact && (
          <div>
            <p className="truncate text-xs font-bold text-white">
              {track.title}
            </p>
            <p className="mt-0.5 truncate text-[10px] text-white/70">
              {track.artist}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
