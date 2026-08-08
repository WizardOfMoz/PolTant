import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface InactivePlatformCardProps {
  platform: string;
  requirement: string;
}

/**
 * Static "not yet live" adapter card for a platform whose official public-
 * content API this prototype doesn't have paid/approved access to (see
 * PROJECT_BRIEF.md). Deliberately inert — no fetching, no numbers, dashed
 * border + disabled control so it can't be mistaken for a live tile.
 */
export function InactivePlatformCard({ platform, requirement }: InactivePlatformCardProps) {
  return (
    <Card className="border-2 border-dashed border-border bg-muted/30 shadow-none ring-0">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm text-muted-foreground">{platform}</CardTitle>
          <Badge variant="outline" className="text-muted-foreground">
            Not connected
          </Badge>
        </div>
        <CardDescription>{requirement}</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          No live fetching is implemented for this platform in this build.
        </p>
        <Link
          href="/methodology"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "shrink-0")}
        >
          Connect →
        </Link>
      </CardContent>
    </Card>
  );
}
