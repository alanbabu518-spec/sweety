import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReadingForm from "./ReadingForm";
import api from "../api";

vi.mock("../api", () => ({
  default: { post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  errorMessage: (error) =>
    error?.response?.data?.error || "Something went wrong.",
}));

const defaultProps = {
  date: "2026-11-14",
  slot: "morning",
  onSlot: vi.fn(),
  readings: [],
  sheetOpen: false,
  onClose: vi.fn(),
  onDone: vi.fn(),
};

describe("ReadingForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.post.mockResolvedValue({ data: { reading: {} } });
    api.put.mockResolvedValue({ data: { reading: {} } });
    api.delete.mockResolvedValue({ data: {} });
  });

  it("submits a new reading with the selected date, slot and value", async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    render(<ReadingForm {...defaultProps} onDone={onDone} />);

    await user.type(screen.getByLabelText("Glucose"), "115");
    await user.click(screen.getByRole("button", { name: "Save reading" }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/readings", {
        date: "2026-11-14",
        slot: "morning",
        value: "115",
      });
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("shows a readable validation error returned by the API", async () => {
    const user = userEvent.setup();
    api.post.mockRejectedValue({
      response: { data: { error: "Value must be between 40 and 600 mg/dl." } },
    });
    render(<ReadingForm {...defaultProps} />);

    await user.type(screen.getByLabelText("Glucose"), "700");
    await user.click(screen.getByRole("button", { name: "Save reading" }));

    expect(
      await screen.findByText("Value must be between 40 and 600 mg/dl."),
    ).toBeInTheDocument();
  });

  it("prefills and updates an existing reading", async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    const readings = [
      {
        id: 42,
        date: "2026-11-14",
        slot: "after_lunch",
        slotLabel: "After lunch",
        value: 130,
      },
    ];

    render(
      <ReadingForm
        {...defaultProps}
        slot="after_lunch"
        readings={readings}
        onDone={onDone}
      />,
    );

    const input = screen.getByLabelText("Glucose");
    expect(input).toHaveValue("130");
    await user.clear(input);
    await user.type(input, "145");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith("/readings/42", {
        date: "2026-11-14",
        slot: "after_lunch",
        value: "145",
      });
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("lets the user change the selected slot", async () => {
    const user = userEvent.setup();
    const onSlot = vi.fn();
    render(<ReadingForm {...defaultProps} onSlot={onSlot} />);

    await user.click(screen.getByRole("button", { name: "After breakfast" }));
    expect(onSlot).toHaveBeenCalledWith("after_breakfast");
  });
});
