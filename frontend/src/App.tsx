import { useState } from "react";
import { Moon, Sprout, Sun, TreeDeciduous } from "lucide-react";
import MindmapCanvas from "./components/MindmapCanvas";
import { buildTree, SAMPLE_TEXT } from "./lib/textToTree";
import { countNodes, maxDepth } from "./lib/treeUtils";
import { darkTheme, lightTheme } from "./constants/theme";
import "./styles/canopy.css";

export default function App() {
  const [mode, setMode] = useState<"dark" | "light">("dark");
  const theme = mode === "dark" ? darkTheme : lightTheme;

  const [text, setText] = useState(SAMPLE_TEXT);
  const [tree, setTree] = useState(() => buildTree(SAMPLE_TEXT));
  const [error, setError] = useState("");

  function handleGenerate() {
    if (!text.trim()) {
      setError("Give it a sentence or two to grow a tree from.");
      return;
    }
    const next = buildTree(text);
    if (!next) {
      setError("Couldn't find enough there — try a fuller sentence.");
      return;
    }
    setError("");
    setTree(next);
  }

  return (
    <div style={{ background: theme.bg, minHeight: "100vh", color: theme.ink }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "56px 24px 72px" }}>
        {/* header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
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
            <h1 style={{ fontWeight: 800, fontSize: 46, margin: "10px 0 8px", letterSpacing: "-0.02em" }}>
              Canopy
            </h1>
            <p style={{ color: theme.muted, fontSize: 16, maxWidth: 520, lineHeight: 1.6, margin: 0 }}>
              Paste in a paragraph. It grows roots, branches, and leaves you can click through.
            </p>
          </div>

          <button
            onClick={() => setMode((m) => (m === "dark" ? "light" : "dark"))}
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
            {mode === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>

        {/* input card */}
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
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your text here…"
            rows={6}
            style={{
              width: "100%",
              resize: "none",
              border: "none",
              background: "transparent",
              color: "inherit",
              fontSize: 15,
              lineHeight: 1.6,
              fontFamily: "inherit",
            }}
          />

          <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <span style={{ fontSize: 12.5, opacity: 0.55 }}>
              {text.length} characters · parsed on-device for this preview
            </span>

            <button
              className="grow-btn"
              onClick={handleGenerate}
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
                cursor: "pointer",
              }}
            >
              <Sprout size={16} />
              Grow mindmap
            </button>
          </div>

          {error && <p style={{ marginTop: 10, fontSize: 13, color: mode === "dark" ? "#ff8a8a" : "#c22b2b" }}>{error}</p>}
        </section>

        {/* tree */}
        {tree && (
          <section style={{ marginTop: 36 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
              <h2 style={{ fontWeight: 700, fontSize: 22, margin: 0 }}>{tree.label}</h2>
              <span style={{ fontSize: 12, color: theme.muted }}>
                {countNodes(tree)} ideas · {maxDepth(tree)} branches deep
              </span>
            </div>

            <MindmapCanvas mindmap={tree} theme={theme} />
          </section>
        )}
      </div>
    </div>
  );
}