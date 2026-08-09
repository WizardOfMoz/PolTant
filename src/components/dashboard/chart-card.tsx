import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface ChartCardProps {
  title: string;
  description?: string;
  /** Rendered top-right of the header, e.g. a period-select dropdown. */
  action?: ReactNode;
  /** Rendered in a bordered footer strip below the chart, e.g. a legend or source note. */
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * Thin `Card` wrapper for dropping a chart (or any data-viz block) into a
 * consistent title/description/action header — composes the existing
 * `src/components/ui/card.tsx` primitives rather than reinventing them, so
 * it inherits the same spacing/radius/ring tokens as every other card in
 * the app. Not a 21st.dev pull: no public, unauthenticated registry
 * component fit this narrow "chart wrapper" need cleanly, so this is
 * original code built on the existing Card conventions.
 */
export function ChartCard({ title, description, action, footer, className, children }: ChartCardProps) {
  return (
    <Card className={cn("gap-4", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer && <CardFooter className="text-xs text-muted-foreground">{footer}</CardFooter>}
    </Card>
  );
}
