import { describe, expect, it } from "vitest";
import {
    render,
    screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import App from "./src/App";

describe("Canopy App", () => {
    it("shows the empty state before a mindmap is generated", () => {
        render(<App />);

        expect(
            screen.getByText(
                "Your mindmap will grow here"
            )
        ).toBeTruthy();
    });

    it("shows the backend error when the input is too short", async () => {
        const user = userEvent.setup();

        render(<App />);

        const textarea =
            screen.getByPlaceholderText(
                "Paste your text here…"
            );

        await user.type(
            textarea,
            "This is test content."
        );

        await user.click(
            screen.getByRole("button", {
                name: /grow mindmap/i,
            })
        );

        expect(
            await screen.findByText(
                /The text is too short to create a meaningful mindmap/
            )
        ).toBeTruthy();
    });
});