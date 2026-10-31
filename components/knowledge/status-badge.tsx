import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, type KnowledgeStatus } from "@/lib/types/domain";
import { cn } from "@/lib/utils";

const STYLES: Record<KnowledgeStatus, string> = {
  draft: "border-transparent bg-secondary text-secondary-foreground",
  pending_review: "border-transparent bg-amber-100 text-amber-900",
  approved: "border-transparent bg-primary/12 text-primary",
  archived: "border-border bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: KnowledgeStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", STYLES[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
