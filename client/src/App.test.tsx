import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "./test/helpers";
import { App } from "./App";

describe("App shell", () => {
  it("renders the landing page with a connect button", () => {
    renderWithProviders(<App />, "/");
    expect(screen.getByRole("link", { name: "TruTix" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /connect wallet/i })).toBeInTheDocument();
  });

  it("gates attendee routes behind a wallet connection", () => {
    renderWithProviders(<App />, "/me");
    expect(screen.getByText(/connect your wallet to continue/i)).toBeInTheDocument();
  });
});
