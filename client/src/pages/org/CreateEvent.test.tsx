import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../test/helpers";
import { OrgContext } from "../../org/context";
import { CreateEvent } from "./CreateEvent";
import { useCreateEvent } from "../../hooks/useCreateEvent";

vi.mock("../../hooks/useCreateEvent", () => ({ useCreateEvent: vi.fn() }));

const submit = vi.fn();
const base = { error: null, txError: null, warning: null, eventId: null, submit };

function render() {
  renderWithProviders(
    <OrgContext.Provider value={{ token: "jwt", logout: vi.fn() }}>
      <CreateEvent />
    </OrgContext.Provider>,
  );
}

describe("CreateEvent wizard", () => {
  beforeEach(() => submit.mockReset());

  it("submits the typed draft to the create hook", () => {
    vi.mocked(useCreateEvent).mockReturnValue({ ...base, phase: "form" });
    render();
    fireEvent.change(screen.getByText("Name").parentElement!.querySelector("input")!, {
      target: { value: "Jazz Night" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create event" }));
    expect(submit).toHaveBeenCalledOnce();
    expect(submit.mock.calls[0]![0].name).toBe("Jazz Night");
  });

  it("shows the success screen when the hook reports done", () => {
    vi.mocked(useCreateEvent).mockReturnValue({ ...base, phase: "done", eventId: 42n });
    render();
    expect(screen.getByText("Event created")).toBeInTheDocument();
    expect(screen.getByText(/#42 is live/)).toBeInTheDocument();
  });
});
