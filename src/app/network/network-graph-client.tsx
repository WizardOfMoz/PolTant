"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { NodeObject } from "react-force-graph-2d";

import type { AmplificationEvent } from "@/data/mock/amplification";
import type { GraphEdge, GraphNode, GraphNodeType } from "@/data/mock/graph";
import type { Platform } from "@/lib/types";
import type { SwingTier } from "@/lib/election/tiering";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  EDGE_TYPE_COLORS,
  EDGE_TYPE_DASH,
  EDGE_TYPE_LABELS,
  EDGE_TYPE_WIDTH,
  NODE_TYPE_COLORS,
  NODE_TYPE_LABELS,
  NODE_TYPE_ORDER,
} from "./network-colors";

// react-force-graph-2d touches window/canvas at module scope, so it can never
// run during SSR — dynamically imported client-only per the project's
// lazy-loading guide (node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md).
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

/** Trimmed, serializable account fields this panel needs — built server-side in page.tsx. */
export interface NetworkAccountSummary {
  displayName: string;
  handle: string;
  platform: Platform;
  category: "established-influencer" | "rising-new-media";
  languageRegion: string;
  bio: string;
  baseFollowerCount: number;
  primaryConstituencyId?: string;
}

/** Trimmed, serializable constituency fields this panel needs. */
export interface NetworkConstituencySummary {
  name: string;
  state: string;
  tier: SwingTier;
}

export interface NetworkGraphClientProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  amplificationEvents: AmplificationEvent[];
  accountsById: Record<string, NetworkAccountSummary>;
  constituenciesById: Record<string, NetworkConstituencySummary>;
}

const GRAPH_HEIGHT = 560;
const MIN_NODE_SIZE = 3;
const MAX_NODE_SIZE = 15;
const NEIGHBORHOOD_DEPTH = 2;
const MAX_LIST_ITEMS = 10;

const PLATFORM_LABEL: Record<Platform, string> = {
  youtube: "YouTube",
  x: "X",
  instagram: "Instagram",
  facebook: "Facebook",
};

const followerFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Per-type min-max normalization so a 8.4M-follower account, a 27-mention
 *  issue, and a 0-100 digital-engagement-index constituency all end up in a
 *  comparable, legible node-size range instead of one type dwarfing the rest. */
function computeNodeSizes(nodes: GraphNode[]): Map<string, number> {
  const byType = new Map<GraphNodeType, GraphNode[]>();
  for (const node of nodes) {
    const group = byType.get(node.type);
    if (group) group.push(node);
    else byType.set(node.type, [node]);
  }

  const sizes = new Map<string, number>();
  for (const group of byType.values()) {
    const weights = group.map((n) => n.weight ?? 0);
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    for (const node of group) {
      if (node.weight === undefined || max === min) {
        sizes.set(node.id, (MIN_NODE_SIZE + MAX_NODE_SIZE) / 2);
        continue;
      }
      const t = (node.weight - min) / (max - min);
      sizes.set(node.id, MIN_NODE_SIZE + t * (MAX_NODE_SIZE - MIN_NODE_SIZE));
    }
  }
  return sizes;
}

function buildAdjacency(edges: GraphEdge[]): Map<string, Set<string>> {
  const adjacency = new Map<string, Set<string>>();
  const link = (a: string, b: string) => {
    const existing = adjacency.get(a);
    if (existing) existing.add(b);
    else adjacency.set(a, new Set([b]));
  };
  for (const edge of edges) {
    link(edge.source, edge.target);
    link(edge.target, edge.source);
  }
  return adjacency;
}

function neighborhood(
  startId: string,
  adjacency: Map<string, Set<string>>,
  depth: number
): Set<string> {
  const visited = new Set([startId]);
  let frontier = new Set([startId]);
  for (let i = 0; i < depth; i++) {
    const next = new Set<string>();
    for (const id of frontier) {
      for (const neighbor of adjacency.get(id) ?? []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          next.add(neighbor);
        }
      }
    }
    frontier = next;
  }
  return visited;
}

interface NodeConnections {
  discussedInIssues: GraphNode[];
  discussedByAccounts: GraphNode[];
  drivenByAccounts: GraphNode[];
  drivenIssues: GraphNode[];
  addressesIssues: GraphNode[];
  addressedByPolicies: GraphNode[];
  linkedAccounts: GraphNode[];
}

function computeConnections(
  nodeId: string,
  edges: GraphEdge[],
  nodesById: Map<string, GraphNode>
): NodeConnections {
  const byId = (id: string) => nodesById.get(id);
  const result: NodeConnections = {
    discussedInIssues: [],
    discussedByAccounts: [],
    drivenByAccounts: [],
    drivenIssues: [],
    addressesIssues: [],
    addressedByPolicies: [],
    linkedAccounts: [],
  };

  for (const edge of edges) {
    if (edge.type === "DISCUSSED_IN") {
      if (edge.source === nodeId) {
        const target = byId(edge.target);
        if (target) result.discussedInIssues.push(target);
      }
      if (edge.target === nodeId) {
        const source = byId(edge.source);
        if (source) result.discussedByAccounts.push(source);
      }
    }
    if (edge.type === "DRIVEN_BY") {
      if (edge.source === nodeId) {
        const target = byId(edge.target);
        if (target) result.drivenByAccounts.push(target);
      }
      if (edge.target === nodeId) {
        const source = byId(edge.source);
        if (source) result.drivenIssues.push(source);
      }
    }
    if (edge.type === "ADDRESSES") {
      if (edge.source === nodeId) {
        const target = byId(edge.target);
        if (target) result.addressesIssues.push(target);
      }
      if (edge.target === nodeId) {
        const source = byId(edge.source);
        if (source) result.addressedByPolicies.push(source);
      }
    }
    if (edge.type === "LINKED_ACCOUNT") {
      if (edge.source === nodeId || edge.target === nodeId) {
        const otherId = edge.source === nodeId ? edge.target : edge.source;
        const other = byId(otherId);
        if (other) result.linkedAccounts.push(other);
      }
    }
  }
  return result;
}

function NodeChipList({ nodes }: { nodes: GraphNode[] }) {
  if (nodes.length === 0) {
    return <p className="text-sm text-muted-foreground">None in this synthetic dataset.</p>;
  }
  const shown = nodes.slice(0, MAX_LIST_ITEMS);
  const remaining = nodes.length - shown.length;
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((node) => (
        <Badge key={node.id} variant="outline" style={{ borderColor: NODE_TYPE_COLORS[node.type] }}>
          {node.label}
        </Badge>
      ))}
      {remaining > 0 && <Badge variant="secondary">+{remaining} more</Badge>}
    </div>
  );
}

export function NetworkGraphClient({
  nodes,
  edges,
  amplificationEvents,
  accountsById,
  constituenciesById,
}: NetworkGraphClientProps) {
  const [activeTypes, setActiveTypes] = useState<Set<GraphNodeType>>(
    () => new Set(NODE_TYPE_ORDER)
  );
  const [focusConstituencyId, setFocusConstituencyId] = useState<string>("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth || 800);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const nodesById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const nodeSizes = useMemo(() => computeNodeSizes(nodes), [nodes]);
  const adjacency = useMemo(() => buildAdjacency(edges), [edges]);

  const constituencyOptions = useMemo(
    () =>
      nodes
        .filter((n) => n.type === "constituency")
        .slice()
        .sort((a, b) => a.label.localeCompare(b.label)),
    [nodes]
  );

  function toggleType(type: GraphNodeType) {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  const graphData = useMemo(() => {
    const allowedIds = focusConstituencyId
      ? neighborhood(focusConstituencyId, adjacency, NEIGHBORHOOD_DEPTH)
      : null;

    const filteredNodes = nodes.filter((node) => {
      if (allowedIds && !allowedIds.has(node.id)) return false;
      if (node.id === focusConstituencyId) return true;
      return activeTypes.has(node.type);
    });
    const idSet = new Set(filteredNodes.map((n) => n.id));
    const filteredEdges = edges.filter((edge) => idSet.has(edge.source) && idSet.has(edge.target));

    // Fresh object copies every time — react-force-graph mutates x/y/vx/vy onto
    // nodes and resolves link source/target into object refs in place, so
    // reusing the same objects across a filter change would carry over stale
    // physics state from a differently-shaped graph.
    return {
      nodes: filteredNodes.map((n) => ({ ...n })),
      links: filteredEdges.map((e) => ({ ...e })),
    };
  }, [nodes, edges, activeTypes, focusConstituencyId, adjacency]);

  const selectedNode = selectedNodeId ? nodesById.get(selectedNodeId) ?? null : null;
  const connections = useMemo(
    () => (selectedNodeId ? computeConnections(selectedNodeId, edges, nodesById) : null),
    [selectedNodeId, edges, nodesById]
  );
  const selectedAccount = selectedNode?.type === "account" ? accountsById[selectedNode.id] : undefined;
  const selectedConstituency =
    selectedNode?.type === "constituency" ? constituenciesById[selectedNode.id] : undefined;
  const selectedAmplification = useMemo(
    () =>
      selectedNode?.type === "constituency"
        ? amplificationEvents.filter((e) => e.constituencyId === selectedNode.id)
        : [],
    [selectedNode, amplificationEvents]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {NODE_TYPE_ORDER.map((type) => {
            const active = activeTypes.has(type);
            return (
              <Badge
                key={type}
                variant={active ? "default" : "outline"}
                className={cn("cursor-pointer select-none", !active && "text-muted-foreground")}
                style={active ? { backgroundColor: NODE_TYPE_COLORS[type], borderColor: NODE_TYPE_COLORS[type] } : undefined}
                onClick={() => toggleType(type)}
              >
                <span
                  className="mr-1 inline-block size-2 rounded-full"
                  style={{ backgroundColor: active ? "currentColor" : NODE_TYPE_COLORS[type] }}
                />
                {NODE_TYPE_LABELS[type]}
              </Badge>
            );
          })}
        </div>

        <Separator orientation="vertical" className="h-6" />

        <Select
          value={focusConstituencyId || "__all__"}
          onValueChange={(value) => setFocusConstituencyId(value === "__all__" ? "" : String(value))}
        >
          <SelectTrigger size="sm" className="w-56">
            <SelectValue placeholder="Focus a constituency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All constituencies</SelectItem>
            {constituencyOptions.map((node) => (
              <SelectItem key={node.id} value={node.id}>
                {node.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-lg border border-border bg-background"
        style={{ height: GRAPH_HEIGHT }}
      >
        <ForceGraph2D
          width={width}
          height={GRAPH_HEIGHT}
          graphData={graphData}
          nodeId="id"
          nodeLabel={(node: NodeObject) => String((node as unknown as GraphNode).label ?? node.id)}
          nodeColor={(node: NodeObject) =>
            NODE_TYPE_COLORS[(node as unknown as GraphNode).type] ?? "#8a8f98"
          }
          nodeVal={(node: NodeObject) => nodeSizes.get(String(node.id)) ?? MIN_NODE_SIZE}
          linkColor={(link) => EDGE_TYPE_COLORS[(link as unknown as GraphEdge).type] ?? "rgba(0,0,0,0.2)"}
          linkWidth={(link) => EDGE_TYPE_WIDTH[(link as unknown as GraphEdge).type] ?? 1}
          linkLineDash={(link) => EDGE_TYPE_DASH[(link as unknown as GraphEdge).type] ?? null}
          linkLabel={(link) => EDGE_TYPE_LABELS[(link as unknown as GraphEdge).type] ?? ""}
          onNodeClick={(node: NodeObject) => setSelectedNodeId(String(node.id))}
          backgroundColor="#ffffff"
          nodeRelSize={3.5}
          cooldownTime={4000}
        />
      </div>

      <Sheet open={selectedNode !== null} onOpenChange={(open) => !open && setSelectedNodeId(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          {selectedNode && connections && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <span
                    className="inline-block size-2.5 rounded-full"
                    style={{ backgroundColor: NODE_TYPE_COLORS[selectedNode.type] }}
                  />
                  {selectedNode.label}
                </SheetTitle>
                <SheetDescription>{NODE_TYPE_LABELS[selectedNode.type]}</SheetDescription>
              </SheetHeader>

              <div className="space-y-5 px-4 pb-4 text-sm">
                {selectedAccount && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="secondary">{PLATFORM_LABEL[selectedAccount.platform]}</Badge>
                      <Badge variant="outline">
                        {selectedAccount.category === "established-influencer"
                          ? "Established influencer"
                          : "Rising new media"}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">{selectedAccount.bio}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedAccount.handle} · {followerFormatter.format(selectedAccount.baseFollowerCount)}{" "}
                      followers · {selectedAccount.languageRegion}
                    </p>
                    {selectedAccount.primaryConstituencyId &&
                      constituenciesById[selectedAccount.primaryConstituencyId] && (
                        <p className="text-xs text-muted-foreground">
                          Primary constituency:{" "}
                          {constituenciesById[selectedAccount.primaryConstituencyId].name} (
                          {constituenciesById[selectedAccount.primaryConstituencyId].state})
                        </p>
                      )}
                  </div>
                )}

                {selectedConstituency && (
                  <div className="space-y-1">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="secondary">{selectedConstituency.state}</Badge>
                      <Badge variant="outline">{selectedConstituency.tier}</Badge>
                    </div>
                  </div>
                )}

                {selectedNode.type === "account" && (
                  <>
                    <Section title="Discussed issues">
                      <NodeChipList nodes={connections.discussedInIssues} />
                    </Section>
                    <Section title="Top driver for">
                      <NodeChipList nodes={connections.drivenIssues} />
                    </Section>
                    <Section title="Linked accounts (other platforms)">
                      <NodeChipList nodes={connections.linkedAccounts} />
                    </Section>
                  </>
                )}

                {selectedNode.type === "constituency" && (
                  <>
                    <Section title="Issues discussed in this constituency">
                      <NodeChipList nodes={connections.discussedInIssues} />
                    </Section>
                    <Section title="Cross-platform amplification events">
                      {selectedAmplification.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No amplification events tied to this constituency in this synthetic dataset.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {selectedAmplification.map((event) => (
                            <li key={event.id} className="rounded-md border border-border p-2 text-xs">
                              <p className="text-foreground">{event.headline}</p>
                              <p className="mt-1 text-muted-foreground">
                                {PLATFORM_LABEL[event.originPlatform]} → {PLATFORM_LABEL[event.targetPlatform]}
                                {" · "}
                                {event.hoursDelay}h delay · {event.spreadMultiplier}x spread
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </Section>
                  </>
                )}

                {selectedNode.type === "issue" && (
                  <>
                    <Section title="Top accounts driving this issue">
                      <NodeChipList nodes={connections.drivenByAccounts} />
                    </Section>
                    <Section title="Also discussed by">
                      <NodeChipList nodes={connections.discussedByAccounts} />
                    </Section>
                    <Section title="Addressed by policies">
                      <NodeChipList nodes={connections.addressedByPolicies} />
                    </Section>
                  </>
                )}

                {selectedNode.type === "policy" && (
                  <Section title="Addresses issues">
                    <NodeChipList nodes={connections.addressesIssues} />
                  </Section>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h4 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h4>
      {children}
    </div>
  );
}
