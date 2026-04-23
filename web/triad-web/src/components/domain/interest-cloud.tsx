import { cn } from "@/lib/utils";
import { interestTone } from "@/lib/theme";

export function InterestCloud({
  interests,
  flaggedSet,
}: {
  interests: string[];
  flaggedSet?: Set<string>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {interests.map((interest) => {
        const isFlagged = flaggedSet?.has(interest.toLowerCase());

        return (
          <span
            key={interest}
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
              isFlagged ? "bg-rose-500/12 text-rose-700" : interestTone(interest),
            )}
          >
            {interest}
          </span>
        );
      })}
    </div>
  );
}
