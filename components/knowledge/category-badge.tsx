import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABELS, type KnowledgeCategory } from "@/lib/types/domain";

export function CategoryBadge({ category }: { category: KnowledgeCategory }) {
  return (
    <Badge variant="secondary" className="font-medium">
      {CATEGORY_LABELS[category]}
    </Badge>
  );
}
