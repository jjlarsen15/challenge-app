import { cn } from "@/lib/utils";

export function OwnerOSLogo({
  className,
  wordmark = true,
}: {
  className?: string;
  wordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 3.2 4.8 7.1v9.8L12 20.8l7.2-3.9V7.1L12 3.2Zm0 2.3 5 2.7v2.2l-5 2.7-5-2.7V8.2l5-2.7Zm-5 7.2 4.2 2.3v3.3L7 17.2v-4.5Zm10 0v4.5l-4.2 2.3v-3.3l4.2-2.3Z"
          />
        </svg>
      </span>
      {wordmark ? (
        <span className="text-[15px] font-semibold tracking-tight text-foreground">
          OwnerOS
        </span>
      ) : null}
    </span>
  );
}
