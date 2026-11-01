import type { EconomyCatalog } from '../../domain/economy/EconomyCatalog';

/** A replaceable, local catalog source. It does not require player data or network access. */
export interface EconomyCatalogProvider {
  getCatalog(): EconomyCatalog;
}
