import Link from "next/link"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  actionHref?: string
  className?: string
}) {
  return (
    <Empty className={className ? `border ${className}` : "border"}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {actionLabel && (
        <EmptyContent>
          {actionHref ? (
            <Link href={actionHref} className={cn(buttonVariants(), "min-h-11 w-full")}>
              {actionLabel}
            </Link>
          ) : (
            <Button className="min-h-11 w-full" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </EmptyContent>
      )}
    </Empty>
  )
}
