import { useState, useEffect } from "react";
import { Moon, Sprout, Sun } from "lucide-react";
import SpecularButton from "./components/SpecularButton";

import MindmapCanvas from "./components/MindmapCanvas";
import {
  generateMindmapStream,
  getMindmap,
  getMindmaps,
} from "./api";

import { darkTheme, lightTheme } from "./constants/theme";

import type { Mindmap, MindmapNode, MindmapSummary } from "./types/mindmap";

export default function App() {
  const [mode, setMode] = useState<"dark" | "light">("light");
  const theme = mode === "dark" ? darkTheme : lightTheme;
  const [text, setText] = useState("");
  const [mindmap, setMindmap] = useState<Mindmap | null>(null);
  const [savedMindmaps, setSavedMindmaps] = useState<MindmapSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [selectedNode, setSelectedNode] = useState<MindmapNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generationPhase, setGenerationPhase] =
    useState("");

  useEffect(() => {
    async function loadHistory() {
      try {
        setHistoryLoading(true);
        setHistoryError("");

        const maps =
          await getMindmaps();

        setSavedMindmaps(maps);
      } catch (err) {
        setHistoryError(
          err instanceof Error
            ? err.message
            : "Failed to load saved mindmaps."
        );
      } finally {
        setHistoryLoading(false);
      }
    }

    loadHistory();
  }, []);

  async function handleGenerate() {
    if (!text.trim()) {
      setError(
        "Give it a sentence or two to grow a tree from."
      );
      return;
    }

    setLoading(true);
    setError("");
    setMindmap(null);
    setSelectedNode(null);
    setGenerationPhase("Starting...");

    try {
      console.log("Generating mindmap...");

      const result =
        await generateMindmapStream(
          text,
          {
            onPhase: (phase, data) => {
              switch (phase) {
                case "outline_started":
                  setGenerationPhase(
                    "Building the mindmap structure..."
                  );
                  break;

                case "outline_completed":
                  setGenerationPhase(
                    `Structure created — ${data.nodeCount ?? ""
                    } ideas found.`
                  );
                  break;

                case "enrichment_started":
                  setGenerationPhase(
                    "Writing node summaries..."
                  );
                  break;

                case "enrichment_completed":
                  setGenerationPhase(
                    "Finishing your mindmap..."
                  );
                  break;
              }
            },
          }
        );

      setMindmap(result);

      const root =
        result.nodes.find(
          (node) =>
            node.id === result.rootId
        );

      setSelectedNode(root ?? null);

      setGenerationPhase("");

      // Refresh saved history
      try {
        const maps =
          await getMindmaps();

        setSavedMindmaps(maps);
      } catch {
        // Mindmap itself was generated successfully.
      }
    } catch (err) {
      console.error(
        "Mindmap generation failed:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while generating the mindmap."
      );

      setGenerationPhase("");
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadMindmap(
    id: string
  ) {
    try {
      setError("");

      const result =
        await getMindmap(id);

      setMindmap(result);

      const root =
        result.nodes.find(
          (node) =>
            node.id === result.rootId
        );

      setSelectedNode(
        root ?? null
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load mindmap."
      );
    }
  }

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: theme.bg,
        color: theme.ink,
      }}
    >
      <main className="mx-auto w-full max-w-[1180px] px-6 py-14 md:py-[56px] lg:py-[72px]">
        {/* Header */}

        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="m-0 text-[46px] font-extrabold leading-tight tracking-[-0.02em]">
              Visualli AI
            </h1>

            <p
              className="mt-2 max-w-[920px] text-base leading-[1.6]"
              style={{
                color: theme.muted,
              }}
            >
              Paste in a paragraph. It grows roots, branches, and leaves you can
              click through.
            </p>
          </div>

          {/* Theme toggle */}
          <button
            type="button"
            onClick={() => setMode((m) => (m === "dark" ? "light" : "dark"))}
            aria-label="Toggle light and dark mode"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: theme.panelBg,
              color: theme.panelText,
              borderColor: theme.panelBorder,
            }}
          >
            {mode === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </header>

        {/* Input */}
        <section
          className="mt-8 rounded-[20px] border p-[22px]"
          style={{
            backgroundColor: theme.panelBg,
            color: theme.panelText,
            borderColor: theme.panelBorder,
          }}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your text here…"
            rows={6}
            className="w-full resize-none border-none bg-transparent text-[15px] leading-[1.6] outline-none placeholder:opacity-40"
          />

          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[12.5px] opacity-55">
              {text.length} characters
              {" · "}
              AI-generated mindmap
            </span>

            <SpecularButton
              size="sm"
              radius={999}
              tint={theme.panelText}
              tintOpacity={0}
              blur={0}
              textColor={theme.panelText}
              lineColor={theme.panelBorder}
              baseColor={theme.panelText}
              intensity={1.5}
              shineSize={10}
              shineFade={40}
              thickness={1.2}
              speed={0.35}
              followMouse
              proximity={250}
              autoAnimate={true}
              onClick={handleGenerate}
              disabled={loading}
              aria-label="Grow mindmap"
            >
              <div className="flex items-center gap-2">
                <Sprout size={16} />
                <span>{loading ? "Growing..." : "Grow mindmap"}</span>
              </div>
            </SpecularButton>
          </div>

          {error && (
            <p
              className="mt-2.5 text-[13px]"
              style={{
                color: mode === "dark" ? "#ff8a8a" : "#c22b2b",
              }}
            >
              {error}
            </p>
          )}
        </section>

        {loading && (
          <section
            className="mt-8 rounded-2xl border px-5 py-4"
            style={{
              backgroundColor: theme.panelBg,
              color: theme.panelText,
              borderColor: theme.panelBorder,
            }}
            aria-live="polite"
          >
            <div className="flex items-center gap-3">
              <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-current" />

              <p className="text-sm font-medium">
                {generationPhase}
              </p>
            </div>
          </section>
        )}

        {/* Mindmap */}
        {!mindmap && !loading && (
          <section className="mt-12 flex flex-col items-center justify-center px-6 py-16 text-center">
            <Sprout size={32} className="mb-4 opacity-40" />

            <h2 className="text-lg font-semibold">
              Your mindmap will grow here
            </h2>

            <p className="mt-2 max-w-md text-sm opacity-60">
              Paste some text above and click "Grow mindmap" to turn it into an
              interactive diagram.
            </p>
          </section>
        )}

        {mindmap && (
          <section className="mt-9">
            <div className="mb-4 flex flex-wrap items-baseline gap-3">
              <h2 className="text-[22px] font-bold">{mindmap.title}</h2>

              <span className="text-xs" style={{ color: theme.muted }}>
                {mindmap.nodes.length} ideas
                deep
              </span>
            </div>

            <div className="flex min-h-[620px] gap-4">
              {/* Diagram */}
              <div
                className={`min-w-0 flex-1 transition-all duration-300 ${selectedNode ? "lg:w-[calc(100%-340px)]" : "w-full"
                  }`}
              >
                <MindmapCanvas
                  mindmap={mindmap}
                  theme={theme}
                  selectedNode={selectedNode}
                  onNodeSelect={setSelectedNode}
                />
              </div>

              {/* Details panel */}
              {selectedNode && (
                <aside
                  className="w-[320px] shrink-0 overflow-hidden rounded-2xl border p-5"
                  style={{
                    backgroundColor: theme.panelBg,
                    color: theme.panelText,
                    borderColor: theme.panelBorder,
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p
                        className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                        style={{ color: theme.muted }}
                      >
                        Node details
                      </p>

                      <h3 className="mt-2 text-xl font-bold">
                        {selectedNode.label}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedNode(null)}
                      aria-label="Close node details"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-70"
                      style={{
                        backgroundColor: theme.chipBg,
                        color: theme.panelText,
                      }}
                    >
                      ×
                    </button>
                  </div>

                  <div
                    className="my-5 h-px"
                    style={{
                      backgroundColor: theme.panelBorder,
                    }}
                  />

                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                    style={{ color: theme.muted }}
                  >
                    Summary
                  </p>

                  <p className="mt-2 text-sm leading-6 opacity-80">
                    {selectedNode.summary}
                  </p>

                  {(() => {
                    const childIds = mindmap.connections
                      .filter(
                        (connection) => connection.from === selectedNode.id,
                      )
                      .map((connection) => connection.to);

                    const children = mindmap.nodes.filter((node) =>
                      childIds.includes(node.id),
                    );

                    if (children.length === 0) {
                      return null;
                    }

                    return (
                      <div className="mt-6">
                        <p
                          className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                          style={{
                            color: theme.muted,
                          }}
                        >
                          Grows into
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {children.map((child) => (
                            <button
                              key={child.id}
                              type="button"
                              onClick={() => setSelectedNode(child)}
                              className="rounded-full border px-3 py-1.5 text-xs transition-opacity hover:opacity-70"
                              style={{
                                backgroundColor: theme.chipBg,
                                color: theme.panelText,
                                borderColor: theme.panelBorder,
                              }}
                            >
                              {child.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  <div
                    className="mt-6 border-t pt-4 text-[11px] opacity-40"
                    style={{
                      borderColor: theme.panelBorder,
                    }}
                  >
                    ID: {selectedNode.id}
                  </div>
                </aside>
              )}
            </div>
          </section>

        )}
        {/* Saved mindmaps */}

        <section
          className="mt-14 border-t pt-8"
          style={{
            borderColor: theme.panelBorder,
          }}
        >
          <div className="mb-5">
            <h2 className="text-xl font-bold">
              Saved mindmaps
            </h2>

            <p
              className="mt-1 text-sm"
              style={{
                color: theme.muted,
              }}
            >
              Your previously generated mindmaps
            </p>
          </div>

          {historyLoading ? (
            <p
              className="text-sm"
              style={{
                color: theme.muted,
              }}
            >
              Loading saved mindmaps...
            </p>
          ) : historyError ? (
            <p
              className="text-sm"
              style={{
                color:
                  mode === "dark"
                    ? "#ff8a8a"
                    : "#c22b2b",
              }}
            >
              {historyError}
            </p>
          ) : savedMindmaps.length === 0 ? (
            <div
              className="rounded-2xl border px-5 py-8 text-center"
              style={{
                borderColor:
                  theme.panelBorder,
                backgroundColor:
                  theme.panelBg,
                color: theme.muted,
              }}
            >
              <p className="text-sm">
                No saved mindmaps yet.
              </p>

              <p className="mt-1 text-xs">
                Generate your first mindmap
                and it will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {savedMindmaps.map((saved) => (
                <button
                  key={saved.id}
                  type="button"
                  onClick={() =>
                    handleLoadMindmap(saved.id)
                  }
                  className="
            group
            rounded-2xl
            border
            p-4
            text-left
            transition-all
            duration-200
            hover:-translate-y-0.5
          "
                  style={{
                    backgroundColor:
                      theme.panelBg,
                    color: theme.panelText,
                    borderColor:
                      theme.panelBorder,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold">
                      {saved.title}
                    </h3>

                    <span
                      className="
                shrink-0
                text-xs
                opacity-50
                transition-opacity
                group-hover:opacity-100
              "
                    >
                      Open
                    </span>
                  </div>

                  <p
                    className="mt-2 text-xs"
                    style={{
                      color: theme.muted,
                    }}
                  >
                    {new Date(
                      saved.createdAt
                    ).toLocaleString()}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
