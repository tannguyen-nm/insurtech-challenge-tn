import type { Term } from "../data/glossary";

export interface SearchResult {
  term: Term;
  nameMatch: boolean;
}

export function filterTerms(query: string, terms: Term[]): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return terms.map((term) => ({ term, nameMatch: false }));

  const results: SearchResult[] = [];
  const nameMatches: SearchResult[] = [];
  const defMatches: SearchResult[] = [];

  for (const term of terms) {
    const inName = term.name.toLowerCase().includes(q);
    const inDef = term.definition.toLowerCase().includes(q);
    if (inName) nameMatches.push({ term, nameMatch: true });
    else if (inDef) defMatches.push({ term, nameMatch: false });
  }

  results.push(...nameMatches, ...defMatches);
  return results;
}

export function highlight(text: string, query: string): string {
  if (!query.trim()) return text;
  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(`(${escaped})`, "gi"), "<mark>$1</mark>");
}
