import type {
  ActivityConstraint,
  CatalogFact,
  CatalogFactUnit,
  EconomyActivity,
  EconomyActivityCategory,
  EconomyCatalog,
  FactSource,
} from '../../domain/economy/EconomyCatalog';

export const CATALOG_REVIEWED_AT = '2026-10-31';

const UNKNOWN_ECONOMIC_SOURCE: FactSource = Object.freeze({
  kind: 'unknown',
  reference: 'Catalog review: no admissible Farming Season source is recorded for this fact.',
  observedAt: CATALOG_REVIEWED_AT,
  dateKind: 'catalog-review',
  confidence: 'unknown',
});

type PendingActivityDefinition = Readonly<{
  id: string;
  category: EconomyActivityCategory;
  label: string;
  inputLabel: string;
  outputLabel: string;
  additionalFactLabel: string;
}>;

function unknownFact(id: string, label: string, unit: CatalogFactUnit): CatalogFact {
  return Object.freeze({ id, label, value: 'unknown', unit, source: UNKNOWN_ECONOMIC_SOURCE });
}

function unknownConstraint(id: string, label: string): ActivityConstraint {
  return Object.freeze({ id, label, source: UNKNOWN_ECONOMIC_SOURCE });
}

function pendingActivity(definition: PendingActivityDefinition): EconomyActivity {
  const { id } = definition;

  return Object.freeze({
    id,
    category: definition.category,
    label: definition.label,
    unlockLevel: unknownFact(`${id}.unlock-level`, 'Town Hall unlock level', 'Town Hall level'),
    inputs: Object.freeze([
      Object.freeze({
        item: definition.inputLabel,
        quantity: unknownFact(`${id}.input.quantity`, `${definition.inputLabel} quantity`, 'items'),
        unitCost: unknownFact(`${id}.input.unit-cost`, `${definition.inputLabel} unit cost`, 'tokens'),
      }),
    ]),
    outputs: Object.freeze([
      Object.freeze({
        item: definition.outputLabel,
        quantity: unknownFact(`${id}.output.quantity`, `${definition.outputLabel} quantity`, 'items'),
        sellValue: unknownFact(`${id}.output.sell-value`, `${definition.outputLabel} sell value`, 'tokens'),
      }),
    ]),
    durationHours: unknownFact(`${id}.duration-hours`, 'Activity duration', 'hours'),
    energyActions: Object.freeze([unknownFact(`${id}.energy-actions`, 'Energy actions', 'energy')]),
    limits: Object.freeze([unknownFact(`${id}.applicable-limits`, 'Applicable limits', 'items')]),
    additionalEconomicFacts: Object.freeze([unknownFact(`${id}.additional-cost`, definition.additionalFactLabel, 'tokens')]),
    constraints: Object.freeze([unknownConstraint(`${id}.constraints`, 'Operational constraints')]),
  });
}

const ACTIVITIES: ReadonlyArray<EconomyActivity> = Object.freeze([
  pendingActivity({
    id: 'crop-evidence-pending',
    category: 'crop',
    label: 'Crop activity (evidence pending)',
    inputLabel: 'Seed',
    outputLabel: 'Harvest',
    additionalFactLabel: 'Field capacity or building cost',
  }),
  pendingActivity({
    id: 'animal-evidence-pending',
    category: 'animal',
    label: 'Animal husbandry activity (evidence pending)',
    inputLabel: 'Feed',
    outputLabel: 'Animal product',
    additionalFactLabel: 'Animal or building cost',
  }),
  pendingActivity({
    id: 'feed-evidence-pending',
    category: 'feed',
    label: 'Feed recipe activity (evidence pending)',
    inputLabel: 'Recipe ingredient',
    outputLabel: 'Feed',
    additionalFactLabel: 'Recipe quantity or workshop cost',
  }),
  pendingActivity({
    id: 'processing-evidence-pending',
    category: 'processing',
    label: 'Processing recipe activity (evidence pending)',
    inputLabel: 'Recipe ingredient',
    outputLabel: 'Processed output',
    additionalFactLabel: 'Workshop or recipe cost',
  }),
  pendingActivity({
    id: 'mine-evidence-pending',
    category: 'mine',
    label: 'Mine activity (evidence pending)',
    inputLabel: 'Mining requirement',
    outputLabel: 'Mined output',
    additionalFactLabel: 'Tool or entry cost',
  }),
  pendingActivity({
    id: 'oil-evidence-pending',
    category: 'oil',
    label: 'Oil activity (evidence pending)',
    inputLabel: 'Oil well requirement',
    outputLabel: 'Oil output',
    additionalFactLabel: 'Oil well or building cost',
  }),
  pendingActivity({
    id: 'fishing-evidence-pending',
    category: 'fishing',
    label: 'Fishing activity (evidence pending)',
    inputLabel: 'Bait',
    outputLabel: 'Catch',
    additionalFactLabel: 'Bait or fishing requirement cost',
  }),
]);

export class FarmingSeasonDocumentationCatalog {
  private readonly catalog: EconomyCatalog = Object.freeze({
    version: 'farming-season-documentation-catalog-2026-10-31',
    reviewedAt: CATALOG_REVIEWED_AT,
    activities: ACTIVITIES,
  });

  public getCatalog(): EconomyCatalog {
    return this.catalog;
  }
}
