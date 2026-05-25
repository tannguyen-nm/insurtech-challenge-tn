import type { CountryConfig } from '../types';

// Vite glob import — adding a new country JSON = zero code changes needed
const configModules = import.meta.glob('../configs/*.json', { eager: true });

const configs: Record<string, CountryConfig> = {};

for (const path in configModules) {
  const mod = configModules[path] as { default: CountryConfig };
  const cfg = mod.default ?? (mod as unknown as CountryConfig);
  if (cfg.country) {
    configs[cfg.country] = cfg;
  }
}

export function getConfig(countryCode: string): CountryConfig | null {
  return configs[countryCode] ?? null;
}

export function getAllConfigs(): CountryConfig[] {
  return Object.values(configs);
}

export function getCountryCodes(): string[] {
  return Object.keys(configs).sort();
}
