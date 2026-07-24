import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import GroupWorkspace from "./GroupWorkspace";
import client from "../api/client";

vi.mock("../api/client");

function renderWorkspace() {
  return render(
    <MemoryRouter initialEntries={["/groups/fake-id"]}>
      <GroupWorkspace />
    </MemoryRouter>
  );
}

describe("GroupWorkspace data fetching", () => {
  it("shows a loading state before data arrives", () => {
    client.get.mockReturnValueOnce(new Promise(() => {}));
    renderWorkspace();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("calls the workspace endpoint with the correct group id", async () => {
    client.get.mockResolvedValueOnce({
      data: { group: { name: "Trip to Banff" }, myRole: "organizer", summary: { memberCount: 1, upcomingEventCount: 0, expenseCount: 0 } },
    });
    renderWorkspace();
    await waitFor(() => {
      expect(client.get).toHaveBeenCalledWith("/groups/fake-id");
    });
  });

  it("shows an error message if the fetch fails", async () => {
    client.get.mockRejectedValueOnce({ response: { data: { error: "Could not load this group." } } });
    renderWorkspace();
    await waitFor(() => {
      expect(screen.getByText("Could not load this group.")).toBeInTheDocument();
    });
  });
});

describe("GroupWorkspace role-based rendering", () => {
  it("shows Invite Member and Manage Members buttons for an organizer", async () => {
    client.get.mockResolvedValueOnce({
      data: { group: { name: "Trip to Banff" }, myRole: "organizer", summary: { memberCount: 3, upcomingEventCount: 0, expenseCount: 0 } },
    });
    renderWorkspace();
    await waitFor(() => {
      expect(screen.getByText("Invite Member")).toBeInTheDocument();
      expect(screen.getByText("Manage Members")).toBeInTheDocument();
    });
  });

  it("hides Invite Member, Manage Members, and Recent Expenses for a member", async () => {
    client.get.mockResolvedValueOnce({
      data: { group: { name: "Trip to Banff" }, myRole: "member", summary: { memberCount: 3, upcomingEventCount: 0, expenseCount: 0 } },
    });
    renderWorkspace(); 
    await waitFor(() => {                  
      expect(screen.queryByText("Invite Member")).not.toBeInTheDocument();
      expect(screen.queryByText("Manage Members")).not.toBeInTheDocument();
      expect(screen.queryByText("Recent Expenses")).not.toBeInTheDocument();
    });
  });
});