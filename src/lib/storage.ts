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

interface StoredState {
  globalEnabled: boolean;
  defaultMaxWidth: number;
  sites: Record<string, SiteConfig>;
}

async function czGetAll(): Promise<StoredState> {
  const data = await chrome.storage.sync.get(["globalEnabled", "defaultMaxWidth", "sites"]);
  return {
    globalEnabled: data.globalEnabled ?? CZ_DEFAULTS.globalEnabled,
    defaultMaxWidth: data.defaultMaxWidth ?? CZ_DEFAULTS.defaultMaxWidth,
    sites: data.sites ?? {},
  };
}

export async function czGetSite(host: string): Promise<ResolvedSite> {
  const all = await czGetAll();
  const site = all.sites[host] ?? {};
  return {
    enabled: site.enabled ?? all.globalEnabled,
    maxWidth: site.maxWidth ?? all.defaultMaxWidth,
    selector: site.selector ?? null,
    hasOverride: host in all.sites,
    defaultMaxWidth: all.defaultMaxWidth,
  };
}

export async function czSetSite(host: string, patch: SiteConfig): Promise<void> {
  const all = await czGetAll();
  all.sites[host] = { ...(all.sites[host] ?? {}), ...patch };
  await chrome.storage.sync.set({ sites: all.sites });
}

export async function czResetSite(host: string): Promise<void> {
  const all = await czGetAll();
  delete all.sites[host];
  await chrome.storage.sync.set({ sites: all.sites });
}
