import { type ReactElement } from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "../wagmi";

/// Render a component inside the app's providers at a given route (for tests).
export function renderWithProviders(ui: ReactElement, route = "/") {
  return render(
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </QueryClientProvider>
    </WagmiProvider>,
  );
}
