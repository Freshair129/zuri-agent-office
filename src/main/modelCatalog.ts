import type { ModelCatalog } from '../shared/modelCatalogPayload';

export interface RemoteCatalogResult {
  catalog: ModelCatalog | null;
  fetchedAt: number;
  stale: boolean;
}

/** No upstream refresh or imported cache: null keeps the bundled model catalog. */
export async function loadModelCatalog(
  _cachePath: string,
  _opts: { force?: boolean } = {}
): Promise<RemoteCatalogResult> {
  return { catalog: null, fetchedAt: 0, stale: true };
}
