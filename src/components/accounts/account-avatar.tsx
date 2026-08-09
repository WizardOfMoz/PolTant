import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/**
 * Deterministic, locally-generated avatar for a fictional account — no
 * external avatar/image service, no network calls. A simple string hash
 * over `seed` (normally `Account.avatarSeed`) picks a hue; the same seed
 * always produces the same color and initials, matching the determinism
 * contract the rest of the mock-data layer follows (see
 * src/data/mock/growth-history.ts's file header for the same rule applied
 * to numeric data).
 */

/** Small deterministic 32-bit string hash — mirrors the one used throughout
 *  src/data/mock/*, kept local here rather than imported so this component
 *  has no dependency on the mock-data layer. */
function hashStringToSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (Math.imul(31, hash) + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Up to two initials from a display name, e.g. "Bharat Bytes" -> "BB",
 *  "Loksabha Live" -> "LL", "X" -> "X". */
function initialsFor(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

export interface AccountAvatarProps {
  /** Deterministic seed, normally `Account.avatarSeed`. */
  seed: string;
  /** Display name used to derive initials. */
  name: string;
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function AccountAvatar({ seed, name, size = "default", className }: AccountAvatarProps) {
  const hue = hashStringToSeed(seed) % 360;
  const background = `hsl(${hue} 60% 90%)`;
  const foreground = `hsl(${hue} 45% 32%)`;

  return (
    <Avatar size={size} className={cn(className)}>
      <AvatarFallback
        style={{ backgroundColor: background, color: foreground }}
        className="font-medium"
      >
        {initialsFor(name)}
      </AvatarFallback>
    </Avatar>
  );
}
