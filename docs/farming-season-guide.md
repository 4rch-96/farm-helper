# Farming Season official-guide data map

This file records the static mechanics Field Ledger can use directly from the
[Farming Season player guide](https://farmingseason.io/docs). It is a planning
reference, not a price feed or a promise of earnings.

## Quick path

1. Choose a Town Hall level from 1 through 5.
2. Use the documented cycle, energy, capacity, and unlock data to plan work.
3. Add current values from the game before using a monetary profit ranking.

## What is source-backed now

| Area | Directly documented facts used by the guide adapter |
| --- | --- |
| Town Hall | Levels 1–5; field limits; produce and animal-capacity multipliers; upgrade times; daily earning-cap multipliers; unlocks. |
| Energy | 100 free energy daily; energy cost of farming, fruit, mine/oil, feeding, collecting products, and arena lives. |
| Crops | Twenty named crops, their 30-minute to 24-hour growth cycles, and wheat/corn silo handling. |
| Animals and feed | Unlock levels, product cadence, feed bags per meal, building limits, building time, and the `1 wheat + 1 corn → 10 feed` recipe. |
| Orchard | Unlock level, three slots per orchard, six plants, and 12/24-hour fruit cycles. |
| Mine, Oil Well, fishing | Unlocks, build and collection cadence, Mine storage, fishing caps, fish probability, and weight ranges. |
| Selling | 5% player-market seller fee, 2% Farm Bank fee, market listing limits, and the documented price range. |

Every field in `FarmingSeasonOfficialGuide` carries an official-guide source
record with the URL, named guide section, observation date, and verified
confidence.

## Intentionally not inferred

The guide does not publish the current seed, crop, animal, building, rod,
bait, or energy-pack prices; harvest and product payouts; resource quantities;
current reward share; or current market listings. It also states that Season 1
numbers can change and that the game displays current values.

Field Ledger must therefore not call a crop, animal, feed recipe, fishing
catch, or resource activity “most profitable” until the player has supplied a
timestamped current-value snapshot. Until then, the product may rank or group
only documented operational characteristics such as cycle time, energy demand,
unlock level, capacity, and feed pressure.

## Official mechanics summary

### Town Hall

| Level | Fields | Produce value | Animal capacity | Upgrade | Daily cap multiplier |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 | 6 | ×1 | ×1 | Start | ×1 (up to $1.50/day) |
| 2 | 12 | ×1.6 | ×1.25 | 8 h | ×2.3 |
| 3 | 18 | ×1.75 | ×1.5 | 12 h | ×5.3 |
| 4 | 24 | ×2.1 | ×1.75 | 16 h | ×12 |
| 5 | 30 | ×2.4 | ×2 | 24 h | ×26.7 |

The official guide currently documents only Town Hall levels 1–5. A planner
must not offer undocumented levels 6 or 7.

### Daily operations

- Planting or harvesting a field, planting or picking fruit, collecting a Mine
  cart or running the Oil Well, feeding a building, and collecting a day of
  animal products cost 2 energy each.
- An arena life costs 5 energy.
- Animals eat every 12 hours and die after 24 hours without food.
- Wheat and corn enter the silo; one unit of each makes 10 feed bags.
- The player market opens at Town Hall 2, has a 5% seller fee, supports at
  most 10 active listings, and returns an unsold listing after 7 days.

## Review checklist

- [ ] A supported fact points to the official player-guide URL and named section.
- [ ] A fact absent from the guide remains absent from monetary calculation input.
- [ ] A change to the public guide is reviewed before the local static facts are changed.
- [ ] Current value inputs retain their own timestamp and source rather than being treated as guide constants.

## Source

- [Farming Season player guide](https://farmingseason.io/docs), reviewed 2026-11-01. The guide states that Season 1 values can change; validate current values in-game before acting.
