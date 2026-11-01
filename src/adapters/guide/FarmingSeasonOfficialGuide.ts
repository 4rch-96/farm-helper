import {
  createGuideFact,
  type BuildingGuide,
  type CropGuide,
  type FarmingSeasonGuide,
  type GuideTownHallLevel,
  type OrchardPlantGuide,
  type TownHallGuide,
} from '../../domain/guide/FarmingSeasonGuide';
import type { FactSource } from '../../domain/economy/EconomyCatalog';

export const FARMING_SEASON_GUIDE_URL = 'https://farmingseason.io/docs';
export const FARMING_SEASON_GUIDE_REVIEWED_AT = '2026-11-01';

function officialSource(section: string): FactSource {
  return Object.freeze({
    kind: 'official-guide',
    reference: `${FARMING_SEASON_GUIDE_URL} — ${section}`,
    observedAt: FARMING_SEASON_GUIDE_REVIEWED_AT,
    dateKind: 'observed',
    confidence: 'verified',
  });
}

function fact<T>(value: T, section: string) {
  return createGuideFact(value, officialSource(section));
}

const TOWN_HALLS: ReadonlyArray<TownHallGuide> = Object.freeze([
  Object.freeze({
    level: 1,
    upgradeHours: fact(0, 'Town Hall levels'),
    maxFields: fact(6, 'Town Hall levels'),
    produceValueMultiplier: fact(1, 'Town Hall levels'),
    animalCapacityMultiplier: fact(1, 'Town Hall levels'),
    dailyEarningLimitMultiplier: fact(1, 'Daily limits'),
    dailyEarningLimitUsd: fact(1.5, 'Daily limits'),
    unlocks: fact(['Fields', 'Coop', 'Sheep pen', 'Farm Bank', 'Silo', 'Battle arena', 'Join clans'], 'Town Hall levels'),
  }),
  Object.freeze({
    level: 2,
    upgradeHours: fact(8, 'Town Hall levels'),
    maxFields: fact(12, 'Town Hall levels'),
    produceValueMultiplier: fact(1.6, 'Town Hall levels'),
    animalCapacityMultiplier: fact(1.25, 'Town Hall levels'),
    dailyEarningLimitMultiplier: fact(2.3, 'Daily limits'),
    unlocks: fact(['Withdrawals', 'Barn', 'Pig pen', 'Orchard', 'Mine', 'Player market', 'Farm Bank lock', 'Found a clan'], 'Town Hall levels'),
  }),
  Object.freeze({
    level: 3,
    upgradeHours: fact(12, 'Town Hall levels'),
    maxFields: fact(18, 'Town Hall levels'),
    produceValueMultiplier: fact(1.75, 'Town Hall levels'),
    animalCapacityMultiplier: fact(1.5, 'Town Hall levels'),
    dailyEarningLimitMultiplier: fact(5.3, 'Daily limits'),
    unlocks: fact(['Oil Well', 'Second coop', 'Second barn', 'Second orchard'], 'Town Hall levels'),
  }),
  Object.freeze({
    level: 4,
    upgradeHours: fact(16, 'Town Hall levels'),
    maxFields: fact(24, 'Town Hall levels'),
    produceValueMultiplier: fact(2.1, 'Town Hall levels'),
    animalCapacityMultiplier: fact(1.75, 'Town Hall levels'),
    dailyEarningLimitMultiplier: fact(12, 'Daily limits'),
    unlocks: fact(['Additional coops', 'Barns', 'Orchards', 'Sheep pens'], 'Town Hall levels'),
  }),
  Object.freeze({
    level: 5,
    upgradeHours: fact(24, 'Town Hall levels'),
    maxFields: fact(30, 'Town Hall levels'),
    produceValueMultiplier: fact(2.4, 'Town Hall levels'),
    animalCapacityMultiplier: fact(2, 'Town Hall levels'),
    dailyEarningLimitMultiplier: fact(26.7, 'Daily limits'),
    unlocks: fact(['Second pig pen', 'Four sheep pens', 'Maximum documented capacity'], 'Town Hall levels'),
  }),
]);

const CROPS: ReadonlyArray<CropGuide> = Object.freeze([
  ['radish', 'Radish', 0.5], ['turnip', 'Turnip', 0.5], ['carrot', 'Carrot', 0.5],
  ['onion', 'Onion', 1], ['red-onion', 'Red onion', 1], ['garlic', 'Garlic', 1],
  ['wheat', 'Wheat', 2, 'silo'], ['corn', 'Corn', 2, 'silo'], ['potato', 'Potato', 2], ['cucumber', 'Cucumber', 2],
  ['tomato', 'Tomato', 4], ['red-pepper', 'Red pepper', 4], ['yellow-pepper', 'Yellow pepper', 4], ['green-pepper', 'Green pepper', 4],
  ['cabbage', 'Cabbage', 8], ['cauliflower', 'Cauliflower', 8], ['chili', 'Chili', 8],
  ['eggplant', 'Eggplant', 12], ['strawberry', 'Strawberry', 12], ['pumpkin', 'Pumpkin', 24],
].map(([id, label, growthHours, settlement = 'direct-payout']) => Object.freeze({
  id: id as string,
  label: label as string,
  growthHours: fact(growthHours as number, 'Fields and crops'),
  settlement: settlement as CropGuide['settlement'],
  source: officialSource('Fields and crops'),
})));

const BUILDINGS: ReadonlyArray<BuildingGuide> = Object.freeze([
  Object.freeze({
    id: 'coop', label: 'Coop',
    maxBuildingsByLevel: [1, 1, 2, 3, 4].map((value) => fact(value, 'Buildings and construction')),
    buildHours: fact(6, 'Buildings and construction'),
    capacityAtLevelOne: fact(6, 'Buildings and construction'),
    capacityAtLevelFive: fact(12, 'Buildings and construction'),
    source: officialSource('Buildings and construction'),
  }),
  Object.freeze({
    id: 'sheep-pen', label: 'Sheep pen',
    maxBuildingsByLevel: [1, 1, 1, 2, 4].map((value) => fact(value, 'Buildings and construction')),
    buildHours: fact(3, 'Buildings and construction'),
    capacityAtLevelOne: fact(4, 'Buildings and construction'),
    capacityAtLevelFive: fact(8, 'Buildings and construction'),
    source: officialSource('Buildings and construction'),
  }),
  Object.freeze({
    id: 'barn', label: 'Barn',
    maxBuildingsByLevel: [0, 1, 2, 3, 4].map((value) => fact(value, 'Buildings and construction')),
    buildHours: fact(12, 'Buildings and construction'),
    capacityAtLevelOne: fact(3, 'Buildings and construction'),
    capacityAtLevelFive: fact(6, 'Buildings and construction'),
    source: officialSource('Buildings and construction'),
  }),
  Object.freeze({
    id: 'pig-pen', label: 'Pig pen',
    maxBuildingsByLevel: [0, 1, 1, 1, 2].map((value) => fact(value, 'Buildings and construction')),
    buildHours: fact(3, 'Buildings and construction'),
    capacityAtLevelOne: fact(2, 'Buildings and construction'),
    capacityAtLevelFive: fact(4, 'Buildings and construction'),
    source: officialSource('Buildings and construction'),
  }),
  Object.freeze({
    id: 'orchard', label: 'Orchard',
    maxBuildingsByLevel: [0, 1, 2, 3, 4].map((value) => fact(value, 'Buildings and construction')),
    buildHours: fact(0.5, 'Orchard and trees'),
    slotsPerBuilding: fact(3, 'Orchard and trees'),
    source: officialSource('Buildings and construction'),
  }),
]);

const ORCHARD_PLANTS: ReadonlyArray<OrchardPlantGuide> = Object.freeze([
  ['apple-tree', 'Apple tree', 'tree', 24], ['lemon-tree', 'Lemon tree', 'tree', 24], ['orange-tree', 'Orange tree', 'tree', 24],
  ['blueberry', 'Blueberry', 'bush', 12], ['raspberry', 'Raspberry', 'bush', 12], ['blackberry', 'Blackberry', 'bush', 12],
].map(([id, label, kind, fruitCadenceHours]) => Object.freeze({
  id: id as string,
  label: label as string,
  kind: kind as OrchardPlantGuide['kind'],
  fruitCadenceHours: fact(fruitCadenceHours as number, 'Orchard and trees'),
  source: officialSource('Orchard and trees'),
})));

const GUIDE: FarmingSeasonGuide = Object.freeze({
  version: 'farming-season-official-guide-2026-11-01',
  reviewedAt: FARMING_SEASON_GUIDE_REVIEWED_AT,
  sourceUrl: FARMING_SEASON_GUIDE_URL,
  townHalls: TOWN_HALLS,
  freeDailyEnergy: fact(100, 'Energy'),
  energyActions: Object.freeze([
    Object.freeze({ id: 'plant-or-harvest-field', label: 'Plant or harvest a field', energy: fact(2, 'Energy') }),
    Object.freeze({ id: 'plant-or-pick-fruit', label: 'Plant a tree or pick fruit', energy: fact(2, 'Energy') }),
    Object.freeze({ id: 'collect-mine-or-run-oil', label: 'Collect a mine cart or run the Oil Well', energy: fact(2, 'Energy') }),
    Object.freeze({ id: 'feed-building', label: 'Feed a building for one meal', energy: fact(2, 'Energy') }),
    Object.freeze({ id: 'collect-animal-products', label: 'Collect animal products for one day', energy: fact(2, 'Energy') }),
    Object.freeze({ id: 'arena-life', label: 'One battle arena life', energy: fact(5, 'Energy') }),
  ]),
  crops: CROPS,
  animals: Object.freeze([
    Object.freeze({ id: 'chicken', label: 'Chicken', building: 'Coop', product: 'Egg', unlockLevel: fact(1 as GuideTownHallLevel, 'Animals'), productCadenceHours: fact(24, 'Animals'), feedBagsPerMeal: fact(2, 'Animals'), source: officialSource('Animals') }),
    Object.freeze({ id: 'sheep', label: 'Sheep', building: 'Sheep pen', product: 'Wool', unlockLevel: fact(1 as GuideTownHallLevel, 'Animals'), productCadenceHours: fact(72, 'Animals'), feedBagsPerMeal: fact(5, 'Animals'), source: officialSource('Animals') }),
    Object.freeze({ id: 'cow', label: 'Cow', building: 'Barn', product: 'Milk', unlockLevel: fact(2 as GuideTownHallLevel, 'Animals'), productCadenceHours: fact(24, 'Animals'), feedBagsPerMeal: fact(8, 'Animals'), source: officialSource('Animals') }),
    Object.freeze({ id: 'pig', label: 'Pig', building: 'Pig pen', product: 'Meat', unlockLevel: fact(2 as GuideTownHallLevel, 'Animals'), productCadenceHours: fact(168, 'Animals'), feedBagsPerMeal: fact(10, 'Animals'), source: officialSource('Animals') }),
  ]),
  buildings: BUILDINGS,
  feedRecipe: Object.freeze({ wheatUnits: fact(1, 'Silo and feed'), cornUnits: fact(1, 'Silo and feed'), feedBagsProduced: fact(10, 'Silo and feed'), source: officialSource('Silo and feed') }),
  orchardPlants: ORCHARD_PLANTS,
  resourceActivities: Object.freeze([
    Object.freeze({ id: 'mine', label: 'Mine', unlockLevel: fact(2 as GuideTownHallLevel, 'Mine and Oil Well'), buildHours: fact(4, 'Mine and Oil Well'), collectionCadenceHours: fact(6, 'Mine and Oil Well'), maximumWaitingCollections: fact(2, 'Mine and Oil Well'), source: officialSource('Mine and Oil Well') }),
    Object.freeze({ id: 'oil-well', label: 'Oil Well', unlockLevel: fact(3 as GuideTownHallLevel, 'Mine and Oil Well'), buildHours: fact(2, 'Mine and Oil Well'), collectionCadenceHours: fact(24, 'Mine and Oil Well'), source: officialSource('Mine and Oil Well') }),
  ]),
  fishing: Object.freeze({
    unlockLevel: fact(3 as GuideTownHallLevel, 'Fishing pond'),
    buildHours: fact(2, 'Fishing pond'),
    dailyBaitLimit: fact(20, 'Fishing pond'),
    dailyCastLimit: fact(20, 'Fishing pond'),
    catches: Object.freeze([
      Object.freeze({ id: 'perch', label: 'Perch', size: 'small', probability: fact(0.45, 'Fishing pond'), minimumWeightKg: fact(0.1, 'Fishing pond'), maximumWeightKg: fact(0.4, 'Fishing pond'), source: officialSource('Fishing pond') }),
      Object.freeze({ id: 'carp', label: 'Carp', size: 'medium', probability: fact(0.3, 'Fishing pond'), minimumWeightKg: fact(0.8, 'Fishing pond'), maximumWeightKg: fact(2.5, 'Fishing pond'), source: officialSource('Fishing pond') }),
      Object.freeze({ id: 'rainbow-trout', label: 'Rainbow trout', size: 'big', probability: fact(0.18, 'Fishing pond'), minimumWeightKg: fact(1.5, 'Fishing pond'), maximumWeightKg: fact(4, 'Fishing pond'), source: officialSource('Fishing pond') }),
      Object.freeze({ id: 'blue-pike', label: 'Blue pike', size: 'huge', probability: fact(0.07, 'Fishing pond'), minimumWeightKg: fact(4, 'Fishing pond'), maximumWeightKg: fact(9, 'Fishing pond'), source: officialSource('Fishing pond') }),
    ]),
    source: officialSource('Fishing pond'),
  }),
  playerMarket: Object.freeze({
    unlockLevel: fact(2 as GuideTownHallLevel, 'Player market'),
    sellerFeeRate: fact(0.05, 'Player market'),
    priceFloorMultiplier: fact(0.5, 'Player market'),
    priceCeilingMultiplier: fact(2, 'Player market'),
    maximumListings: fact(10, 'Player market'),
    listingExpiryDays: fact(7, 'Player market'),
    source: officialSource('Player market'),
  }),
  farmBank: Object.freeze({ sellerFeeRate: fact(0.02, 'Farm Bank'), source: officialSource('Farm Bank') }),
});

/** Immutable adapter over the public, Season 1 player-guide mechanics. */
export class FarmingSeasonOfficialGuide {
  public getGuide(): FarmingSeasonGuide {
    return GUIDE;
  }
}
