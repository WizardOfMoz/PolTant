"use client";

import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ExternalLink, TriangleAlert } from "lucide-react";

import type { ChannelDisplay } from "@/lib/pipeline/channels";
import type { Platform } from "@/data/dummy-channels";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { SENTIMENT_NEGATIVE, SENTIMENT_NEUTRAL, SENTIMENT_POSITIVE } from "@/lib/palette";

const CATEGORY_LABEL: Record<ChannelDisplay["category"], string> = {
  "established-influencer": "Established influencer",
  "rising-new-media": "Rising new media",
};

const PLATFORM_LABEL: Record<Platform, string> = {
  youtube: "YouTube",
  x: "X",
  instagram: "Instagram",
  facebook: "Facebook",
};

function sentimentColor(score: number): string {
  if (score > 0.15) return SENTIMENT_POSITIVE;
  if (score < -0.15) return SENTIMENT_NEGATIVE;
  return SENTIMENT_NEUTRAL;
}

const subscriberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const countFormatter = new Intl.NumberFormat("en-US", { notation: "compact" });

function formatCount(value: number | null): string {
  if (value === null) return "—";
  return countFormatter.format(value);
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

interface ChannelsExplorerProps {
  channels: ChannelDisplay[];
}

export function ChannelsExplorer({ channels }: ChannelsExplorerProps) {
  const [tab, setTab] = useState<"all" | Platform>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(
    () => (tab === "all" ? channels : channels.filter((c) => c.platform === tab)),
    [channels, tab]
  );

  const counts = useMemo(() => {
    const byPlatform: Record<Platform, number> = { youtube: 0, x: 0, instagram: 0, facebook: 0 };
    for (const c of channels) byPlatform[c.platform]++;
    return { all: channels.length, ...byPlatform };
  }, [channels]);

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="youtube">YouTube ({counts.youtube})</TabsTrigger>
          <TabsTrigger value="x">X ({counts.x})</TabsTrigger>
          <TabsTrigger value="instagram">Instagram ({counts.instagram})</TabsTrigger>
          <TabsTrigger value="facebook">Facebook ({counts.facebook})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Channel</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Language / region</TableHead>
              <TableHead className="text-right">Followers</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((channel) => {
              const isOpen = expanded === channel.handle;
              return (
                <Fragment key={channel.handle}>
                  <TableRow
                    aria-expanded={isOpen}
                    className="cursor-pointer"
                    onClick={() => setExpanded(isOpen ? null : channel.handle)}
                  >
                    <TableCell className="max-w-56 whitespace-normal">
                      <div className="font-medium text-foreground">{channel.displayName}</div>
                      <a
                        href={channel.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                      >
                        {channel.handle}
                        <ExternalLink className="size-3" />
                      </a>
                      {channel.error ? (
                        <div className="mt-1 flex items-center gap-1 text-xs text-destructive">
                          <TriangleAlert className="size-3" />
                          Data unavailable for this channel
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{PLATFORM_LABEL[channel.platform]}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{CATEGORY_LABEL[channel.category]}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-normal text-muted-foreground">
                      {channel.languageRegion}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {channel.subscriberCount !== null
                        ? subscriberFormatter.format(channel.subscriberCount)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <ChevronDown
                        className={cn(
                          "size-4 text-muted-foreground transition-transform",
                          isOpen && "rotate-180"
                        )}
                      />
                    </TableCell>
                  </TableRow>
                  {isOpen ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={6} className="whitespace-normal bg-muted/30 py-4">
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs font-medium text-foreground">
                              Why this channel is tracked
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {channel.justification}
                            </p>
                          </div>

                          {channel.error ? (
                            <p className="text-xs text-destructive">
                              Ingestion error: {channel.error}
                            </p>
                          ) : null}

                          <div>
                            <p className="text-xs font-medium text-foreground">
                              Recent posts &amp; analysis
                            </p>
                            {channel.recentVideos.length === 0 ? (
                              <p className="mt-1 text-sm text-muted-foreground">
                                No recent posts to show.
                              </p>
                            ) : (
                              <ul className="mt-2 space-y-2">
                                {channel.recentVideos.map((video) => (
                                  <li
                                    key={video.url + video.title}
                                    className="rounded-lg border border-border bg-card px-3 py-2.5"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <a
                                        href={video.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center gap-1 text-sm font-medium text-foreground underline underline-offset-2 hover:text-primary"
                                      >
                                        {video.title}
                                        <ExternalLink className="size-3 shrink-0" />
                                      </a>
                                      {!video.unavailable && (
                                        <span
                                          className="shrink-0 text-sm font-medium tabular-nums"
                                          style={{ color: sentimentColor(video.sentimentScore) }}
                                        >
                                          {video.sentimentScore.toFixed(2)}
                                        </span>
                                      )}
                                    </div>
                                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                                      <span>{formatDate(video.publishedAt)}</span>
                                      <span>{formatCount(video.viewCount)} views</span>
                                      <span>{formatCount(video.likeCount)} likes</span>
                                      <span>{formatCount(video.commentCount)} comments</span>
                                    </div>
                                    {video.unavailable ? (
                                      <p className="mt-1.5 text-xs italic text-muted-foreground">
                                        Analysis unavailable — ANTHROPIC_API_KEY not configured or a
                                        model error occurred.
                                      </p>
                                    ) : (
                                      <>
                                        <p className="mt-1.5 text-xs text-muted-foreground">
                                          {video.narrativeSummary}
                                        </p>
                                        {video.topics.length > 0 && (
                                          <div className="mt-1.5 flex flex-wrap gap-1">
                                            {video.topics.map((topic) => (
                                              <Badge
                                                key={topic}
                                                variant="outline"
                                                className="text-[10px]"
                                              >
                                                {topic}
                                              </Badge>
                                            ))}
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Click a row to see its curation rationale and recent posts, each with a real
        LLM-computed sentiment score, topics, and narrative summary (see /methodology). Handles
        link out to the illustrative profile URL for that platform.
      </p>
    </div>
  );
}
