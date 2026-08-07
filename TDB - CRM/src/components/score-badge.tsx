import { Badge } from "@/components/ui";
import { scoreTone } from "@/lib/scoring";

export function ScoreBadge({ score }: { score: number }) {
  return <Badge tone={scoreTone(score)}>{score}</Badge>;
}
