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

function captureWithBreadListing(): string {
  const capture = JSON.parse(safeCapture()) as Record<string, unknown>;
  return JSON.stringify({
    ...capture,
    listings: [{ item: "bread", qty: 1, price: 6 }],
  });
}

afterEach(cleanup);

describe("CalculatorApp", () => {
  it("renders an accessible, table-free planner without requiring a local capture", () => {
    render(<CalculatorApp seasonQuoteProvider={unavailableQuoteProvider} />);

    expect(screen.getByRole("heading", { name: /make the next farm decision with proof/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /plan with the evidence you have/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/town hall level/i)).toHaveValue("1");
    expect(screen.getByRole("tablist", { name: /planner categories/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /crops/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText(/town hall 6 and 7 are not presented as available/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/local capture json/i)).toHaveValue("");
    expect(screen.getByRole("group", { name: /observed crop seed cost/i })).toBeDisabled();
  });

  it("shows recipe and order alternatives as evidence-pending instead of fabricated calculations", () => {
    render(<CalculatorApp seasonQuoteProvider={unavailableQuoteProvider} />);

    fireEvent.click(screen.getByRole("tab", { name: /processing/i }));
    expect(screen.getByRole("tabpanel", { name: /processing/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /bread/i })).toBeInTheDocument();
    expect(screen.getByText(/recipe inputs and quantities/i)).toBeInTheDocument();
    expect(screen.getByText(/unit-compatible output payout/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /orders/i }));
    expect(screen.getByRole("button", { name: /orders and requests/i })).toBeInTheDocument();
    expect(screen.getByText(/unit-compatible reward/i)).toBeInTheDocument();
    expect(screen.queryByText(/^net benefit$/i)).not.toBeInTheDocument();
  });

  it("retains every universal recipe evidence gap when a local listing names a recipe", () => {
    render(<CalculatorApp seasonQuoteProvider={unavailableQuoteProvider} />);

    fireEvent.change(screen.getByLabelText(/local capture json/i), { target: { value: captureWithBreadListing() } });
    fireEvent.click(screen.getByRole("button", { name: /analyze local capture/i }));
    fireEvent.click(screen.getByRole("tab", { name: /processing/i }));
    fireEvent.click(screen.getByRole("button", { name: /bread/i }));

    for (const gap of [
      "recipe inputs and quantities",
      "recipe duration",
      "recipe energy",
      "unit-compatible output payout",
    ]) {
      expect(screen.getAllByText(gap).length).toBeGreaterThan(0);
    }
  });

  it("loads only a safe projection and renders observed metrics with provenance", () => {
    render(<CalculatorApp seasonQuoteProvider={unavailableQuoteProvider} />);

    const captureInput = screen.getByLabelText(/local capture json/i);
    fireEvent.change(captureInput, { target: { value: safeCapture() } });
    fireEvent.click(screen.getByRole("button", { name: /analyze local capture/i }));

    expect(captureInput).toHaveValue("");
    expect(screen.getByText(/observed data loaded from 2026-11-01/i)).toBeInTheDocument();
    expect(screen.getByTestId("observed-plan-summary")).toHaveTextContent(/2 complete alternatives/i);
    expect(screen.getByRole("group", { name: /observed crop seed cost/i })).not.toBeDisabled();

    fireEvent.click(screen.getByRole("tab", { name: /animals/i }));
    fireEvent.click(screen.getByRole("button", { name: /chicken/i }));
    expect(screen.getByRole("complementary", { name: /chicken decision detail/i })).toBeInTheDocument();
    expect(screen.getByText(/^net benefit$/i)).toBeInTheDocument();
    expect(screen.getByText(/^roi$/i)).toBeInTheDocument();
    expect(screen.getByText(/derived from compatible official mechanics and observed game-token data/i)).toBeInTheDocument();
    expect(screen.getByText(/storage and processing stay evidence-pending/i)).toBeInTheDocument();
    expect(screen.getAllByText("Official").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Observed").length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText(/^crop$/i), { target: { value: "radish" } });
    fireEvent.change(screen.getByLabelText(/seed cost \(observed game-token unit\)/i), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText(/observation date/i), { target: { value: "2026-11-01" } });
    fireEvent.click(screen.getByRole("button", { name: /record observed seed cost/i }));
    fireEvent.click(screen.getByRole("tab", { name: /crops/i }));

    expect(screen.getByRole("button", { name: /radish.*complete/i })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: /radish decision detail/i })).toBeInTheDocument();
    expect(screen.getByText(/net benefit = observed gross value/i)).toBeInTheDocument();
    expect(screen.getByText(/public season\/usd panel is market context only/i)).toBeInTheDocument();
  });

  it("locks a documented animal at a lower selected Town Hall instead of recommending it", () => {
    render(<CalculatorApp seasonQuoteProvider={unavailableQuoteProvider} />);

    fireEvent.click(screen.getByRole("tab", { name: /animals/i }));
    fireEvent.click(screen.getByRole("button", { name: /cow/i }));

    expect(screen.getByRole("complementary", { name: /cow evidence detail/i })).toHaveTextContent(/not compared at the selected town hall/i);
    expect(screen.getByText(/town hall 2 is required by the official guide/i)).toBeInTheDocument();
    expect(screen.queryByText(/^net benefit$/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/town hall level/i), { target: { value: "3" } });
    expect(screen.getByLabelText(/town hall 3 official mechanics/i)).toBeInTheDocument();
  });

  it("reranks observed alternatives after Town Hall eligibility hides a higher-ranked animal", () => {
    render(<CalculatorApp seasonQuoteProvider={unavailableQuoteProvider} />);

    fireEvent.change(screen.getByLabelText(/local capture json/i), { target: { value: safeCapture() } });
    fireEvent.click(screen.getByRole("button", { name: /analyze local capture/i }));
    fireEvent.click(screen.getByRole("tab", { name: /animals/i }));

    expect(screen.getByRole("button", { name: /cow.*locked/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /chicken.*complete.*rank 1/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /chicken.*rank 2/i })).not.toBeInTheDocument();
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
