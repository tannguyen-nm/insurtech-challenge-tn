import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { glossary, CATEGORIES } from "./data/glossary";
import type { Term } from "./data/glossary";
import { filterTerms } from "./utils/search";
import SearchBar from "./components/SearchBar";
import CategorySection from "./components/CategorySection";
import TermModal from "./components/TermModal";
import AlphabetSidebar from "./components/AlphabetSidebar";
import TermCard from "./components/TermCard";
import "./index.css";

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function App() {
  const [rawQuery, setRawQuery] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    return p.get("search") ?? "";
  });
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
  const query = useDebounce(rawQuery, 100);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (query) url.searchParams.set("search", query);
    else url.searchParams.delete("search");
    window.history.replaceState(null, "", url.toString());
  }, [query]);

  const results = useMemo(() => filterTerms(query, glossary), [query]);

  const termsByCategory = useMemo(() => {
    const map = new Map<string, Term[]>();
    for (const cat of CATEGORIES) map.set(cat, []);
    for (const { term } of results) map.get(term.category)?.push(term);
    return map;
  }, [results]);

  const activeLetters = useMemo(() => {
    const set = new Set<string>();
    for (const { term } of results) set.add(term.name[0].toUpperCase());
    return set;
  }, [results]);

  const termsByLetter = useMemo(() => {
    const map = new Map<string, Term[]>();
    for (const { term } of results) {
      const l = term.name[0].toUpperCase();
      if (!map.has(l)) map.set(l, []);
      map.get(l)!.push(term);
    }
    return map;
  }, [results]);

  const letterRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const handleJump = useCallback((letter: string) => {
    letterRefs.current.get(letter)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleNavigate = useCallback((id: string) => {
    const term = glossary.find((t) => t.id === id);
    if (term) setSelectedTerm(term);
  }, []);

  const isSearching = query.length > 0;
  const totalVisible = results.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 text-center mb-1">Insurance Glossary</h1>
          <p className="text-gray-500 text-center text-sm mb-6">
            {glossary.length} terms across {CATEGORIES.length} categories
          </p>
          <SearchBar value={rawQuery} onChange={setRawQuery} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {!isSearching && (
          <div className="md:hidden mb-4">
            <AlphabetSidebar activeLetters={activeLetters} onJump={handleJump} />
          </div>
        )}

        <div className="flex gap-6">
          {!isSearching && (
            <AlphabetSidebar activeLetters={activeLetters} onJump={handleJump} />
          )}

          <div className="flex-1 min-w-0">
            {totalVisible === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">🔍</p>
                <p className="text-gray-500 text-sm">
                  No terms found for <strong>"{query}"</strong>
                </p>
                <button
                  onClick={() => setRawQuery("")}
                  className="mt-3 text-blue-600 text-sm hover:underline"
                >
                  Clear search
                </button>
              </div>
            ) : isSearching ? (
              <div>
                <p className="text-sm text-gray-500 mb-4">
                  {totalVisible} result{totalVisible !== 1 ? "s" : ""} for <strong>"{query}"</strong>
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {results.map(({ term }) => (
                    <TermCard key={term.id} term={term} query={query} onClick={() => setSelectedTerm(term)} />
                  ))}
                </div>
              </div>
            ) : (
              <>
                {Array.from(termsByLetter.keys())
                  .sort()
                  .map((letter) => (
                    <div
                      key={letter}
                      ref={(el) => {
                        if (el) letterRefs.current.set(letter, el);
                        else letterRefs.current.delete(letter);
                      }}
                      id={`letter-${letter}`}
                    />
                  ))}
                {CATEGORIES.map((cat) => {
                  const terms = termsByCategory.get(cat) ?? [];
                  if (terms.length === 0) return null;
                  return (
                    <CategorySection
                      key={cat}
                      category={cat}
                      terms={terms}
                      query={query}
                      onSelect={setSelectedTerm}
                    />
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>

      {selectedTerm && (
        <TermModal
          term={selectedTerm}
          query={query}
          allTerms={glossary}
          onClose={() => setSelectedTerm(null)}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
}
