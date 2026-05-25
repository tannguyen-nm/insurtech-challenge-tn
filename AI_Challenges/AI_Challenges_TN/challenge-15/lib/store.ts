import type { TenantVersion } from './types'
import { seedStore } from './seed'

declare global {
  // eslint-disable-next-line no-var
  var __tenantStore: Map<string, TenantVersion[]> | undefined
}

function getStore(): Map<string, TenantVersion[]> {
  if (!globalThis.__tenantStore) {
    globalThis.__tenantStore = new Map()
    seedStore(globalThis.__tenantStore)
  }
  return globalThis.__tenantStore
}

export const store = {
  listTenants(): TenantVersion[][] {
    return Array.from(getStore().values())
  },

  getHistory(tenantId: string): TenantVersion[] | undefined {
    return getStore().get(tenantId)
  },

  getLatest(tenantId: string): TenantVersion | undefined {
    const history = getStore().get(tenantId)
    return history ? history[history.length - 1] : undefined
  },

  create(version: TenantVersion): void {
    getStore().set(version.config.tenantId, [version])
  },

  appendVersion(tenantId: string, version: TenantVersion): boolean {
    const history = getStore().get(tenantId)
    if (!history) return false
    history.push(version)
    return true
  },

  delete(tenantId: string): boolean {
    return getStore().delete(tenantId)
  },

  has(tenantId: string): boolean {
    return getStore().has(tenantId)
  },
}
