import type {
  Mindmap,
  MindmapSummary,
} from "./types/mindmap";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";

type StreamPhase =
  | "outline_started"
  | "outline_completed"
  | "enrichment_started"
  | "enrichment_completed";

type StreamEvent = {
  phase: StreamPhase;
  data: Record<string, unknown>;
};

type StreamCallbacks = {
  onPhase?: (
    phase: StreamPhase,
    data: Record<string, unknown>
  ) => void;
};

export async function generateMindmapStream(
  text: string,
  callbacks: StreamCallbacks = {}
): Promise<Mindmap> {
  const response = await fetch(
    `${API_URL}/api/mindmaps/stream`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({ text }),
    }
  );

  if (!response.ok) {
    let message =
      "Failed to generate mindmap";

    try {
      const error = await response.json();

      if (typeof error.detail === "string") {
        message = error.detail;
      } else if (Array.isArray(error.detail)) {
        message = error.detail
          .map((item: { msg?: string }) => item.msg)
          .filter(Boolean)
          .join(", ");
      }
    } catch {
      // Keep default message.
    }

    throw new Error(message);
  }

  if (!response.body) {
    throw new Error(
      "Streaming is not supported by this browser."
    );
  }

  const reader =
    response.body.getReader();

  const decoder =
    new TextDecoder();

  let buffer = "";

  try {
    while (true) {
      const { value, done } =
        await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(
        value,
        { stream: true }
      );

      const events =
        buffer.split("\n\n");

      buffer =
        events.pop() ?? "";

      for (const event of events) {
        const parsed =
          parseSSEEvent(event);

        if (!parsed) {
          continue;
        }

        if (parsed.event === "phase") {
          const phaseData =
            parsed.data as StreamEvent;

          callbacks.onPhase?.(
            phaseData.phase,
            phaseData.data
          );
        }

        if (parsed.event === "complete") {
          return parsed.data as Mindmap;
        }

        if (parsed.event === "error") {
          const errorData =
            parsed.data as {
              message?: string;
            };

          throw new Error(
            errorData.message ||
            "Something went wrong while generating the mindmap."
          );
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  throw new Error(
    "Mindmap generation ended before completion."
  );
}

function parseSSEEvent(
  rawEvent: string
): {
  event: string;
  data: unknown;
} | null {
  const lines =
    rawEvent.split("\n");

  let event = "message";
  let data = "";

  for (const line of lines) {
    if (line.startsWith("event:")) {
      event =
        line.slice(6).trim();
    }

    if (line.startsWith("data:")) {
      data +=
        line.slice(5).trim();
    }
  }

  if (!data) {
    return null;
  }

  try {
    return {
      event,
      data: JSON.parse(data),
    };
  } catch {
    return null;
  }
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