import { useState } from "react";
import { Moon, Sprout, Sun } from "lucide-react";

import MindmapCanvas from "./components/MindmapCanvas";
import { generateMindmap } from "./api";

import {
  mindmapToTree,
  countTreeNodes,
  maxTreeDepth,
} from "./lib/mindmapToTree";

import { darkTheme, lightTheme } from "./constants/theme";

import type {
  Mindmap,
  MindmapNode,
} from "./types/mindmap";


export default function App() {
  const [mode, setMode] =
    useState<"dark" | "light">("light");

  const theme =
    mode === "dark"
      ? darkTheme
      : lightTheme;

  const [text, setText] =
    useState("");

  const [mindmap, setMindmap] =
    useState<Mindmap | null>(null);

  const [selectedNode, setSelectedNode] =
    useState<MindmapNode | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

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

    try {
      console.log(
        "Generating mindmap..."
      );

      const result =
        await generateMindmap(text);

      console.log(
        "Mindmap received:",
        result
      );

      setMindmap(result);

      const root =
        result.nodes.find(
          (node) =>
            node.id ===
            result.rootId
        );

      setSelectedNode(
        root ?? null
      );
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
    } finally {
      setLoading(false);
    }
  }

  const tree = mindmap
    ? mindmapToTree(mindmap)
    : null;

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
              Paste in a paragraph. It
              grows roots, branches,
              and leaves you can click
              through.
            </p>
          </div>

          {/* Theme toggle */}

          <button
            type="button"
            onClick={() =>
              setMode((m) =>
                m === "dark"
                  ? "light"
                  : "dark"
              )
            }
            aria-label="Toggle light and dark mode"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor:
                theme.panelBg,
              color:
                theme.panelText,
              borderColor:
                theme.panelBorder,
            }}
          >
            {mode === "dark" ? (
              <Sun size={17} />
            ) : (
              <Moon size={17} />
            )}
          </button>
        </header>

        {/* Input */}

        <section
          className="mt-8 rounded-[20px] border p-[22px]"
          style={{
            backgroundColor:
              theme.panelBg,
            color:
              theme.panelText,
            borderColor:
              theme.panelBorder,
          }}
        >
          <textarea
            value={text}
            onChange={(e) =>
              setText(
                e.target.value
              )
            }
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

            <button
              type="button"
              className="grow-btn inline-flex items-center gap-2 rounded-full border-none px-5 py-2.5 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              onClick={
                handleGenerate
              }
              disabled={loading}
              style={{
                backgroundColor:
                  theme.panelText,
                color:
                  theme.panelBg,
              }}
            >
              <Sprout size={16} />

              {loading
                ? "Growing..."
                : "Grow mindmap"}
            </button>
          </div>

          {error && (
            <p
              className="mt-2.5 text-[13px]"
              style={{
                color:
                  mode === "dark"
                    ? "#ff8a8a"
                    : "#c22b2b",
              }}
            >
              {error}
            </p>
          )}
        </section>

        {/* Mindmap */}

        {mindmap && tree && (
          <section className="mt-9">
            <div className="mb-4 flex flex-wrap items-baseline gap-3.5">
              <h2 className="m-0 text-[22px] font-bold">
                {mindmap.title}
              </h2>

              <span
                className="text-xs"
                style={{
                  color:
                    theme.muted,
                }}
              >
                {countTreeNodes(
                  tree
                )}{" "}
                ideas
                {" · "}
                {maxTreeDepth(
                  tree
                )}{" "}
                branches deep
              </span>
            </div>

            <MindmapCanvas
              mindmap={mindmap}
              theme={theme}
              selectedNode={
                selectedNode
              }
              onNodeSelect={
                setSelectedNode
              }
            />
          </section>
        )}
      </main>
    </div>
  );
}