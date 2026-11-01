import type { FactSource } from '../economy/EconomyCatalog';

/** A documented game mechanic paired with the source that supports it. */
export type GuideFact<T> = Readonly<{
  value: T;
  source: FactSource;
}>;

export type GuideTownHallLevel = 1 | 2 | 3 | 4 | 5;

export type TownHallGuide = Readonly<{
  level: GuideTownHallLevel;
  upgradeHours: GuideFact<number>;
  maxFields: GuideFact<number>;
  produceValueMultiplier: GuideFact<number>;
  animalCapacityMultiplier: GuideFact<number>;
  dailyEarningLimitMultiplier: GuideFact<number>;
  dailyEarningLimitUsd?: GuideFact<number>;
  unlocks: GuideFact<ReadonlyArray<string>>;
}>;

export type EnergyActionGuide = Readonly<{
  id: string;
  label: string;
  energy: GuideFact<number>;
}>;

export type CropGuide = Readonly<{
  id: string;
  label: string;
  growthHours: GuideFact<number>;
  settlement: 'direct-payout' | 'silo';
  source: FactSource;
}>;

export type AnimalGuide = Readonly<{
  id: string;
  label: string;
  building: string;
  product: string;
  unlockLevel: GuideFact<GuideTownHallLevel>;
  productCadenceHours: GuideFact<number>;
  feedBagsPerMeal: GuideFact<number>;
  source: FactSource;
}>;

export type BuildingGuide = Readonly<{
  id: string;
  label: string;
  maxBuildingsByLevel: ReadonlyArray<GuideFact<number>>;
  buildHours: GuideFact<number>;
  capacityAtLevelOne?: GuideFact<number>;
  capacityAtLevelFive?: GuideFact<number>;
  slotsPerBuilding?: GuideFact<number>;
  source: FactSource;
}>;

export type OrchardPlantGuide = Readonly<{
  id: string;
  label: string;
  kind: 'tree' | 'bush';
  fruitCadenceHours: GuideFact<number>;
  source: FactSource;
}>;

export type ResourceActivityGuide = Readonly<{
  id: 'mine' | 'oil-well';
  label: string;
  unlockLevel: GuideFact<GuideTownHallLevel>;
  buildHours: GuideFact<number>;
  collectionCadenceHours: GuideFact<number>;
  maximumWaitingCollections?: GuideFact<number>;
  source: FactSource;
}>;

export type FishingCatchGuide = Readonly<{
  id: string;
  label: string;
  size: 'small' | 'medium' | 'big' | 'huge';
  probability: GuideFact<number>;
  minimumWeightKg: GuideFact<number>;
  maximumWeightKg: GuideFact<number>;
  source: FactSource;
}>;

export type FishingGuide = Readonly<{
  unlockLevel: GuideFact<GuideTownHallLevel>;
  buildHours: GuideFact<number>;
  dailyBaitLimit: GuideFact<number>;
  dailyCastLimit: GuideFact<number>;
  catches: ReadonlyArray<FishingCatchGuide>;
  source: FactSource;
}>;

export type FeedRecipeGuide = Readonly<{
  wheatUnits: GuideFact<number>;
  cornUnits: GuideFact<number>;
  feedBagsProduced: GuideFact<number>;
  source: FactSource;
}>;

export type MarketGuide = Readonly<{
  unlockLevel: GuideFact<GuideTownHallLevel>;
  sellerFeeRate: GuideFact<number>;
  priceFloorMultiplier: GuideFact<number>;
  priceCeilingMultiplier: GuideFact<number>;
  maximumListings: GuideFact<number>;
  listingExpiryDays: GuideFact<number>;
  source: FactSource;
}>;

export type FarmBankGuide = Readonly<{
  sellerFeeRate: GuideFact<number>;
  source: FactSource;
}>;

export type FarmingSeasonGuide = Readonly<{
  version: string;
  reviewedAt: string;
  sourceUrl: string;
  townHalls: ReadonlyArray<TownHallGuide>;
  freeDailyEnergy: GuideFact<number>;
  energyActions: ReadonlyArray<EnergyActionGuide>;
  crops: ReadonlyArray<CropGuide>;
  animals: ReadonlyArray<AnimalGuide>;
  buildings: ReadonlyArray<BuildingGuide>;
  feedRecipe: FeedRecipeGuide;
  orchardPlants: ReadonlyArray<OrchardPlantGuide>;
  resourceActivities: ReadonlyArray<ResourceActivityGuide>;
  fishing: FishingGuide;
  playerMarket: MarketGuide;
  farmBank: FarmBankGuide;
}>;

export function createGuideFact<T>(value: T, source: FactSource): GuideFact<T> {
  return Object.freeze({ value, source });
}

export function isGuideTownHallLevel(level: number): level is GuideTownHallLevel {
  return Number.isInteger(level) && level >= 1 && level <= 5;
}
