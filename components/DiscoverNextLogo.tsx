"use client";

type DiscoverNextLogoProps = {
  size?: "tiny" | "small" | "medium" | "large";
  className?: string;
};

export default function DiscoverNextLogo({
  size = "medium",
  className = "",
}: DiscoverNextLogoProps) {
  const sizeClasses = {
    tiny: "h-8 w-8 rounded-xl p-1.5",
    small: "h-10 w-10 rounded-xl p-2",
    medium: "h-12 w-12 rounded-2xl p-2",
    large: "h-14 w-14 rounded-2xl p-2.5",
  };

  return (
    <div
      aria-label="Discover Next logo"
      role="img"
      className={`shrink-0 bg-green-500 text-black shadow-[0_0_30px_rgba(34,197,94,0.22)] ${sizeClasses[size]} ${className}`}
    >
      <svg
        viewBox="0 0 64 64"
        className="h-full w-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="9" cy="20" r="3.5" fill="currentColor" />
        <circle cx="9" cy="32" r="3.5" fill="currentColor" />
        <circle cx="9" cy="44" r="3.5" fill="currentColor" />

        <path
          d="M17 20h17M17 32h13M17 44h9"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />

        <path
          d="M26 44c11 0 10-12 17-12 7 0 6-12 13-12"
          stroke="currentColor"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="m50 14 7 6-7 6"
          stroke="currentColor"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="m41 7 1.8 3.7L46.5 12l-3.7 1.8L41 17.5l-1.8-3.7L35.5 12l3.7-1.3L41 7Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}
