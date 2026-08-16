import type { Mindmap } from "./types/mindmap";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:8000";

export async function generateMindmap(
    text: string
): Promise<Mindmap> {
    console.log(
        "POST:",
        `${API_URL}/api/mindmaps`
    );

    const response = await fetch(
        `${API_URL}/api/mindmaps`,
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json",
            },

            body: JSON.stringify({
                text,
            }),
        }
    );

    if (!response.ok) {
        let message =
            "Failed to generate mindmap";

        try {
            const error =
                await response.json();

            if (
                typeof error.detail ===
                "string"
            ) {
                message =
                    error.detail;
            }
        } catch {
            // Keep default message.
        }

        throw new Error(message);
    }

    const data =
        await response.json();

    console.log(
        "Mindmap API response:",
        data
    );

    return data;
}