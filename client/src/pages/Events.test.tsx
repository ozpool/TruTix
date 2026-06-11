import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../test/helpers";
import { Events } from "./Events";
import * as api from "../lib/api";

vi.mock("../lib/api");

describe("Events page", () => {
  it("lists events returned by the API", async () => {
    vi.mocked(api.apiGet).mockResolvedValue({
      events: [
        {
          eventId: 1,
          name: "Demo Night",
          description: "an evening",
          heroImage: "",
          capacity: 100,
          maxResalePct: 20,
          royaltyBps: 500,
          startsAt: "",
          tierPrices: ["100000000000000000"],
        },
      ],
    });

    renderWithProviders(<Events />);
    await waitFor(() => expect(screen.getByText("Demo Night")).toBeInTheDocument());
  });
});
