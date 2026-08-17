import type {
  Mindmap,
  MindmapSummary,
} from "./types/mindmap";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";

export async function generateMindmap(
  text: string
): Promise<Mindmap> {
  const response = await fetch(
    `${API_URL}/api/mindmaps`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    }
  );

  if (!response.ok) {
    let message =
      "Failed to generate mindmap";

    try {
      const error =
        await response.json();

      if (typeof error.detail === "string") {
        message = error.detail;
      }
    } catch {
      // Keep default message.
    }

    throw new Error(message);
  }

  return response.json();
}


export async function getMindmaps(): Promise<
  MindmapSummary[]
> {
  const response = await fetch(
    `${API_URL}/api/mindmaps`
  );

  if (!response.ok) {
    let message =
      "Failed to load saved mindmaps";

    try {
      const error =
        await response.json();

      if (typeof error.detail === "string") {
        message = error.detail;
      }
    } catch {
      // Keep default message.
    }

    throw new Error(message);
  }

  return response.json();
}


export async function getMindmap(
  id: string
): Promise<Mindmap> {
  const response = await fetch(
    `${API_URL}/api/mindmaps/${id}`
  );

  if (!response.ok) {
    let message =
      "Failed to load mindmap";

    try {
      const error =
        await response.json();

      if (typeof error.detail === "string") {
        message = error.detail;
      }
    } catch {
      // Keep default message.
    }

    throw new Error(message);
  }

  return response.json();
}