import type { FarmSnapshot } from '../../domain/farm/FarmSnapshot';

export type FarmSnapshotImportResult =
  | Readonly<{ ok: true; snapshot: FarmSnapshot; warnings: ReadonlyArray<string> }>
  | Readonly<{ ok: false; message: string; warnings: ReadonlyArray<string> }>;

export interface FarmSnapshotProvider {
  import(raw: string): FarmSnapshotImportResult;
}
