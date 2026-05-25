import type { DiffEntry, TenantConfig } from './types'

function deepDiff(a: unknown, b: unknown, path: string): DiffEntry[] {
  const equal = JSON.stringify(a) === JSON.stringify(b)

  if (
    typeof a !== 'object' ||
    typeof b !== 'object' ||
    a === null ||
    b === null ||
    Array.isArray(a) ||
    Array.isArray(b)
  ) {
    return [{ path, valueA: a, valueB: b, equal }]
  }

  const objA = a as Record<string, unknown>
  const objB = b as Record<string, unknown>
  const allKeys = new Set([...Object.keys(objA), ...Object.keys(objB)])
  const entries: DiffEntry[] = []

  for (const key of allKeys) {
    const childPath = path ? `${path}.${key}` : key
    const childA = objA[key]
    const childB = objB[key]

    if (
      typeof childA === 'object' &&
      typeof childB === 'object' &&
      childA !== null &&
      childB !== null &&
      !Array.isArray(childA) &&
      !Array.isArray(childB)
    ) {
      entries.push(...deepDiff(childA, childB, childPath))
    } else {
      const childEqual = JSON.stringify(childA) === JSON.stringify(childB)
      entries.push({ path: childPath, valueA: childA, valueB: childB, equal: childEqual })
    }
  }

  return entries
}

export function diffConfigs(configA: TenantConfig, configB: TenantConfig): DiffEntry[] {
  // Exclude tenantId and name from diff (they identify the tenants)
  const { tenantId: _idA, name: _nameA, ...restA } = configA
  const { tenantId: _idB, name: _nameB, ...restB } = configB
  return deepDiff(restA, restB, '')
}
