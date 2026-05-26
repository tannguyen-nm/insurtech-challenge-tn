import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { glossary } from "./data/glossary";
import type { Term } from "./data/glossary";
import { filterTerms } from "./utils/search";
import SearchBar from "./components/SearchBar";
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
    return new Map([...map.entries()].sort());
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
            {glossary.length} terms across {new Set(glossary.map(t => t.category)).size} categories
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
                {Array.from(termsByLetter.entries()).map(([letter, terms]) => (
                  <div
                    key={letter}
                    ref={(el) => {
                      if (el) letterRefs.current.set(letter, el);
                      else letterRefs.current.delete(letter);
                    }}
                    id={`letter-${letter}`}
                    className="mb-6"
                  >
                    <h2 className="text-lg font-bold text-blue-700 border-b border-blue-100 pb-1 mb-3">
                      {letter}
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {terms.map((term) => (
                        <TermCard key={term.id} term={term} query={query} onClick={() => setSelectedTerm(term)} />
                      ))}
                    </div>
                  </div>
                ))}
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
