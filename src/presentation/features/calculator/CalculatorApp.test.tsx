import { describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach } from "vitest";
import { CalculatorApp } from "./CalculatorApp";

const unavailableQuoteProvider = {
  getQuote: async () => ({ ok: false as const, message: "Quote unavailable in this test." }),
};

const CAPTURE_TIME = 1_793_491_200_000;

function safeCapture(): string {
  return JSON.stringify({
    now: CAPTURE_TIME,
    farm: {
      version: 2,
      level: 4,
      today: { energy: 100 },
      animals: [
        ...Array.from({ length: 6 }, () => ({ kind: "chicken" })),
        ...Array.from({ length: 3 }, () => ({ kind: "cow" })),
      ],
      structures: [{ kind: "coop" }, { kind: "barn" }],
      log: [
        { text: "Collected egg (+27 SEASON)" },
        { text: "Collected milk (+109 SEASON)" },
        { text: "Field 2: harvested radish (+10 SEASON)" },
        { text: "Market: bought 20 feed bags from Any Player (−40 SEASON)" },
      ],
    },
  });
}

afterEach(cleanup);

describe("CalculatorApp", () => {
  it("renders the global planner without requiring a local capture", () => {
    render(<CalculatorApp seasonQuoteProvider={unavailableQuoteProvider} />);

    expect(
      screen.getByRole("heading", {
        name: /compare what the catalog can support/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/town hall level/i)).toHaveValue("1");
    expect(screen.getByLabelText(/local capture json/i)).toHaveValue("");
    expect(screen.getByRole("button", { name: /analyze local capture/i })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /observed crop seed cost/i })).toBeDisabled();
  });

  it("loads only a safe projection, clears the source text, and records dated crop-cost evidence", () => {
    render(<CalculatorApp seasonQuoteProvider={unavailableQuoteProvider} />);

    const captureInput = screen.getByLabelText(/local capture json/i);
    fireEvent.change(captureInput, { target: { value: safeCapture() } });
    fireEvent.click(screen.getByRole("button", { name: /analyze local capture/i }));

    expect(captureInput).toHaveValue("");
    expect(screen.getByText(/observed data loaded from 2026-11-01/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/observed local planning context/i)).toHaveTextContent(/2 complete alternatives/i);
    expect(screen.getByRole("group", { name: /observed crop seed cost/i })).not.toBeDisabled();

    fireEvent.change(screen.getByLabelText(/^crop$/i), { target: { value: "radish" } });
    fireEvent.change(screen.getByLabelText(/seed cost \(observed game-token unit\)/i), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText(/observation date/i), { target: { value: "2026-11-01" } });
    fireEvent.click(screen.getByRole("button", { name: /record observed seed cost/i }));

    expect(screen.getByText(/observed seed cost saved for radish/i)).toBeInTheDocument();
    expect(screen.getByTestId("observed-plan-summary")).toHaveTextContent(/3 complete alternatives/i);
    expect(screen.getByText(/never predicts an in-game reward/i)).toBeInTheDocument();
  });

  it("clears an unrecorded seed-cost draft before replacing a local capture", () => {
    render(<CalculatorApp seasonQuoteProvider={unavailableQuoteProvider} />);

    const captureInput = screen.getByLabelText(/local capture json/i);
    fireEvent.change(captureInput, { target: { value: safeCapture() } });
    fireEvent.click(screen.getByRole("button", { name: /analyze local capture/i }));

    fireEvent.change(screen.getByLabelText(/^crop$/i), { target: { value: "pumpkin" } });
    fireEvent.change(screen.getByLabelText(/seed cost \(observed game-token unit\)/i), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText(/observation date/i), { target: { value: "2026-11-01" } });

    fireEvent.change(captureInput, { target: { value: safeCapture() } });
    fireEvent.click(screen.getByRole("button", { name: /analyze local capture/i }));

    expect(screen.getByLabelText(/^crop$/i)).toHaveValue("radish");
    expect(screen.getByLabelText(/seed cost \(observed game-token unit\)/i)).toHaveValue(null);
    expect(screen.getByLabelText(/observation date/i)).toHaveValue("");
    fireEvent.click(screen.getByRole("button", { name: /record observed seed cost/i }));
    expect(screen.getByText(/observed seed cost must be a non-negative number/i)).toBeInTheDocument();
    expect(screen.getByTestId("observed-plan-summary")).toHaveTextContent(/2 complete alternatives/i);
  });

  it("clears and rejects credential-shaped input without exposing it", () => {
    render(<CalculatorApp seasonQuoteProvider={unavailableQuoteProvider} />);

    const raw = JSON.stringify({
      ...JSON.parse(safeCapture()),
      cookies: "private-cookie",
    });
    const captureInput = screen.getByLabelText(/local capture json/i);
    fireEvent.change(captureInput, { target: { value: raw } });
    fireEvent.click(screen.getByRole("button", { name: /analyze local capture/i }));

    expect(captureInput).toHaveValue("");
    expect(screen.getByText(/credential-shaped input is not accepted/i)).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("private-cookie");
    expect(screen.queryByLabelText(/observed local planning context/i)).not.toBeInTheDocument();
  });

  it("wires the global selectors while retaining named incomplete evidence", () => {
    render(<CalculatorApp seasonQuoteProvider={unavailableQuoteProvider} />);

    fireEvent.change(screen.getByLabelText(/town hall level/i), {
      target: { value: "3" },
    });
    fireEvent.change(screen.getByLabelText(/sort metric/i), {
      target: { value: "net-per-energy" },
    });

    expect(
      screen.getByRole("table", { name: /global activities at town hall 3/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Net per energy").length).toBeGreaterThan(0);
    expect(
      screen.getByText(/formula unavailable until every required fact/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /ranking unavailable: fewer than two complete eligible activities/i,
      ),
    ).toBeInTheDocument();
    expect(
      document.querySelector('[data-responsive-summary="true"]'),
    ).not.toBeNull();
  });

  it("requires no credential, wallet, session, game action, or authenticated game polling", () => {
    render(<CalculatorApp seasonQuoteProvider={unavailableQuoteProvider} />);

    expect(
      screen.getByText(
        /does not use credentials, wallets, sessions, game actions, or authenticated game polling/i,
      ),
    ).toBeInTheDocument();
    const buttonNames = screen
      .getAllByRole("button")
      .map((button) => button.textContent?.trim());
    expect(buttonNames).not.toContain("SELL");
    expect(buttonNames).not.toContain("BUY");
    expect(buttonNames).not.toContain("PLANT");
    expect(buttonNames).not.toContain("HARVEST");
  });
});
