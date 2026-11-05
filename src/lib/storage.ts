export interface SiteConfig {
  enabled?: boolean;
  maxWidth?: number;
  selector?: string | null;
}

export interface ResolvedSite {
  enabled: boolean;
  maxWidth: number;
  selector: string | null;
  hasOverride: boolean;
  defaultMaxWidth: number;
}

export const CZ_DEFAULTS = {
  globalEnabled: false,
  defaultMaxWidth: 1200,
};

export const CZ_SITE_PREFIX = "site:";

// Each site lives in its own sync key. The old layout kept every site in one
// `sites` object, which hits the 8 KB per-item quota after about 100 sites.
// That object is still read as a fallback and shrinks as sites get rewritten.
const czSiteKey = (host: string) => CZ_SITE_PREFIX + host;

interface StoredState {
  globalEnabled: boolean;
  defaultMaxWidth: number;
  site: SiteConfig | undefined;
  legacySites: Record<string, SiteConfig>;
}

async function czGetAll(host: string): Promise<StoredState> {
  const key = czSiteKey(host);
  const data = await chrome.storage.sync.get(["globalEnabled", "defaultMaxWidth", "sites", key]);
  const legacySites: Record<string, SiteConfig> = data.sites ?? {};
  return {
    globalEnabled: data.globalEnabled ?? CZ_DEFAULTS.globalEnabled,
    defaultMaxWidth: data.defaultMaxWidth ?? CZ_DEFAULTS.defaultMaxWidth,
    site: data[key] ?? legacySites[host],
    legacySites,
  };
}

async function czDropLegacy(host: string, legacySites: Record<string, SiteConfig>): Promise<void> {
  if (!(host in legacySites)) return;
  delete legacySites[host];
  await chrome.storage.sync.set({ sites: legacySites });
}

export async function czGetSite(host: string): Promise<ResolvedSite> {
  const all = await czGetAll(host);
  const site = all.site ?? {};
  return {
    enabled: site.enabled ?? all.globalEnabled,
    maxWidth: site.maxWidth ?? all.defaultMaxWidth,
    selector: site.selector ?? null,
    hasOverride: all.site !== undefined,
    defaultMaxWidth: all.defaultMaxWidth,
  };
}

export async function czSetSite(host: string, patch: SiteConfig): Promise<void> {
  const all = await czGetAll(host);
  await chrome.storage.sync.set({ [czSiteKey(host)]: { ...(all.site ?? {}), ...patch } });
  await czDropLegacy(host, all.legacySites);
}

export async function czResetSite(host: string): Promise<void> {
  const all = await czGetAll(host);
  await chrome.storage.sync.remove(czSiteKey(host));
  await czDropLegacy(host, all.legacySites);
}
