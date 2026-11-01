import { describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach } from "vitest";
import type { ProductionChainComparisonResult } from "../../../application/use-cases/CompareProductionChain";
import {
  syntheticVerifiedFixtureSource,
  unknownFixtureSource,
} from "../../../test/fixtures/economyCatalog";
import { ProductionChainComparison } from "./ProductionChainComparison";

afterEach(cleanup);

function completeResult(): ProductionChainComparisonResult {
  return {
    state: "available",
    unavailableActivities: [],
    comparison: {
      state: "complete",
      missingFacts: [],
      metrics: {
        inputOpportunityCost: 20,
        directCost: 3,
        totalCost: 23,
        directSaleGrossValue: 20,
        directSaleFeeAmount: 2,
        directSaleNet: 18,
        grossValue: 48,
        feeAmount: 4.8,
        transformedNet: 20.2,
        netDifference: 2.2,
        accumulatedTimeHours: 6,
        accumulatedEnergy: 5,
      },
      constraints: [
        {
          id: "animal-care",
          label: "Animal care window",
          source: syntheticVerifiedFixtureSource,
        },
      ],
      warnings: [
        {
          code: "feed-cadence",
          message: "Feed grain every 8 hours.",
          feedItem: "grain",
          quantityPerMeal: 5,
          cadenceHours: 8,
        },
        {
          code: "starvation-risk",
          message: "Animals may starve when meals are missed.",
          feedItem: "grain",
          quantityPerMeal: 5,
          cadenceHours: 8,
        },
      ],
      provenance: [syntheticVerifiedFixtureSource],
      freshness: ["2026-01-01"],
      confidence: ["verified"],
    },
  };
}

describe("ProductionChainComparison", () => {
  it("renders direct-sale and production-chain results with operational warnings", () => {
    render(<ProductionChainComparison result={completeResult()} />);

    expect(screen.getByText("18.00 tokens")).toBeInTheDocument();
    expect(screen.getByText("20.20 tokens")).toBeInTheDocument();
    expect(screen.getByText("2.20 tokens")).toBeInTheDocument();
    expect(screen.getByText("Feed cadence")).toBeInTheDocument();
    expect(screen.getByText("Starvation risk")).toBeInTheDocument();
    expect(screen.getByText(/feed grain every 8 hours/i)).toBeInTheDocument();
    expect(screen.getByText(/animals may starve/i)).toBeInTheDocument();
    expect(
      screen.getByText("test://economy-catalog/synthetic-verified-fact"),
    ).toBeInTheDocument();
    expect(screen.getByText(/freshness: 2026-01-01/i)).toBeInTheDocument();
    expect(screen.getByText(/confidence: verified/i)).toBeInTheDocument();
  });

  it("renders named source-aware gaps rather than estimating an incomplete comparison", () => {
    const result: ProductionChainComparisonResult = {
      state: "available",
      unavailableActivities: [],
      comparison: {
        state: "incomplete",
        missingFacts: [
          {
            factId: "feed.sell-value",
            factLabel: "Feed sell value",
            source: unknownFixtureSource,
          },
        ],
      },
    };
    render(<ProductionChainComparison result={result} />);

    expect(
      screen.getByText(
        /comparison unavailable until every required source fact/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Feed sell value")).toBeInTheDocument();
    expect(screen.getByText("feed.sell-value")).toBeInTheDocument();
    expect(screen.getByText(/confidence: unknown/i)).toBeInTheDocument();
  });

  it("truthfully discloses when no source-backed chain was supplied", () => {
    render(<ProductionChainComparison />);

    expect(
      screen.getByText(
        /no source-backed production-chain comparison is available yet/i,
      ),
    ).toBeInTheDocument();
  });
});
