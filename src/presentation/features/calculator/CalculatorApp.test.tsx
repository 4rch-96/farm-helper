import { describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach } from "vitest";
import { CalculatorApp } from "./CalculatorApp";

afterEach(cleanup);

describe("CalculatorApp", () => {
  it("renders the global planner without a mandatory JSON import", () => {
    render(<CalculatorApp />);

    expect(
      screen.getByRole("heading", {
        name: /compare what the catalog can support/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/town hall level/i)).toHaveValue("1");
    expect(
      screen.getByText(/optional local snapshot overlay/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/paste snapshot json/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /analyze snapshot/i }),
    ).not.toBeInTheDocument();
  });

  it("wires the global selectors while retaining named incomplete evidence", () => {
    render(<CalculatorApp />);

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

  it("requires no credential, wallet, session, game action, or live-market data", () => {
    render(<CalculatorApp />);

    expect(
      screen.getByText(
        /does not use credentials, wallets, sessions, game actions, authenticated polling, or live-market data/i,
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
