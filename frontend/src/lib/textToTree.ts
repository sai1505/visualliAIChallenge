import type { Mindmap } from "../types/mindmap";

/**
 * Stand-in for a real LLM call. Splits text into sentences (branches)
 * and clauses (twigs/leaves). Swap this out for your actual API
 * response — it already returns the `Mindmap` shape the rest of the
 * app expects, so nothing else needs to change.
 */
export function buildTree(rawText: string): Mindmap | null {
    const text = rawText.replace(/\s+/g, " ").trim();
    if (!text) return null;

    const sentences = text
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);

    if (sentences.length === 0) return null;

    const rootLabel = truncateWords(sentences[0], 6);
    const branchSource = sentences.length > 1 ? sentences.slice(1) : sentences;
    const branchSentences = branchSource.slice(0, 6);

    const children = branchSentences.map((sentence, i) => {
        const label = truncateWords(sentence, 5);
        const clauses = sentence
            .split(/,| and | but | which | that | because | while | so /i)
            .map((c) => c.trim())
            .filter((c) => c.split(/\s+/).length >= 3)
            .slice(0, 3);

        const grandchildren = clauses.slice(1).map((clause, j) => ({
            id: `b${i}-l${j}`,
            label: truncateWords(clause, 5),
            summary: clause.charAt(0).toUpperCase() + clause.slice(1) + ".",
            children: [],
        }));

        return {
            id: `b${i}`,
            label,
            summary: sentence,
            children: grandchildren,
        };
    });

    return {
        id: "root",
        label: rootLabel,
        summary: text.length > 260 ? text.slice(0, 260).trim() + "…" : text,
        children,
    };
}

export function truncateWords(str: string, n: number): string {
    const clean = str.replace(/^[\s,;:–-]+/, "").trim();
    const words = clean.split(/\s+/);
    const cut = words.slice(0, n).join(" ");
    const capped = cut.charAt(0).toUpperCase() + cut.slice(1);
    return words.length > n ? capped.replace(/[.,;:]$/, "") + "…" : capped;
}

export const SAMPLE_TEXT =
    "A mindmap turns scattered notes into a single living structure, the way a seed grows into a tree with one trunk and many branches. Start with your core idea at the root, then let related thoughts branch outward as you write, and watch smaller details unfurl as leaves along each branch. Group related points together, because clusters reveal patterns that a flat list hides, and label the connections between branches so the relationships stay clear. Keep each branch short and specific, and trim anything that does not serve the main idea. Revisit the map after a day, prune what no longer fits, and graft in new branches as your thinking grows.";