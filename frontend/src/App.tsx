import { useState } from "react";
import {
  Moon,
  Sprout,
  Sun,
  TreeDeciduous,
} from "lucide-react";

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

import "./styles/canopy.css";

export default function App() {
  const [mode, setMode] =
    useState<"dark" | "light">("dark");

  const theme =
    mode === "dark"
      ? darkTheme
      : lightTheme;

  const [text, setText] = useState("");

  const [mindmap, setMindmap] =
    useState<Mindmap | null>(null);

  const [selectedNode, setSelectedNode] =
    useState<MindmapNode | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState("");

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
      console.log("Generating mindmap...");

      const result = await generateMindmap(text);

      console.log("Mindmap received:", result);

      setMindmap(result);

      const root = result.nodes.find(
        (node) => node.id === result.rootId
      );

      setSelectedNode(root ?? null);
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
      style={{
        background: theme.bg,
        minHeight: "100vh",
        color: theme.ink,
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "56px 24px 72px",
        }}
      >
        {/* Header */}

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: theme.muted,
              }}
            >
              <TreeDeciduous size={14} />
              text → tree
            </div>

            <h1
              style={{
                fontWeight: 800,
                fontSize: 46,
                margin: "10px 0 8px",
                letterSpacing: "-0.02em",
              }}
            >
              Canopy
            </h1>

            <p
              style={{
                color: theme.muted,
                fontSize: 16,
                maxWidth: 520,
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Paste in a paragraph. It grows
              roots, branches, and leaves you
              can click through.
            </p>
          </div>

          {/* Theme toggle */}

          <button
            onClick={() =>
              setMode((m) =>
                m === "dark"
                  ? "light"
                  : "dark"
              )
            }
            aria-label="Toggle light and dark mode"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              borderRadius: 999,
              background: theme.panelBg,
              color: theme.panelText,
              border: `1px solid ${theme.panelBorder}`,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            {mode === "dark" ? (
              <Sun size={17} />
            ) : (
              <Moon size={17} />
            )}
          </button>
        </div>

        {/* Input */}

        <section
          style={{
            marginTop: 32,
            background: theme.panelBg,
            color: theme.panelText,
            borderRadius: 20,
            border: `1px solid ${theme.panelBorder}`,
            padding: 22,
          }}
        >
          <textarea
            value={text}
            onChange={(e) =>
              setText(e.target.value)
            }
            placeholder="Paste your text here…"
            rows={6}
            style={{
              width: "100%",
              resize: "none",
              border: "none",
              outline: "none",
              background: "transparent",
              color: "inherit",
              fontSize: 15,
              lineHeight: 1.6,
              fontFamily: "inherit",
            }}
          />

          <div
            style={{
              marginTop: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <span
              style={{
                fontSize: 12.5,
                opacity: 0.55,
              }}
            >
              {text.length} characters ·
              AI-generated mindmap
            </span>

            <button
              className="grow-btn"
              onClick={handleGenerate}
              disabled={loading}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: theme.panelText,
                color: theme.panelBg,
                border: "none",
                borderRadius: 999,
                padding: "10px 20px",
                fontSize: 14,
                fontWeight: 600,
                cursor: loading
                  ? "not-allowed"
                  : "pointer",
                opacity: loading ? 0.6 : 1,
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
              style={{
                marginTop: 10,
                fontSize: 13,
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
          <section
            style={{
              marginTop: 36,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 14,
                flexWrap: "wrap",
                marginBottom: 16,
              }}
            >
              <h2
                style={{
                  fontWeight: 700,
                  fontSize: 22,
                  margin: 0,
                }}
              >
                {mindmap.title}
              </h2>

              <span
                style={{
                  fontSize: 12,
                  color: theme.muted,
                }}
              >
                {countTreeNodes(tree)} ideas ·{" "}
                {maxTreeDepth(tree)} branches
                deep
              </span>
            </div>

            <MindmapCanvas
              mindmap={mindmap}
              theme={theme}
              selectedNode={selectedNode}
              onNodeSelect={setSelectedNode}
            />
          </section>
        )}
      </div>
    </div>
  );
}