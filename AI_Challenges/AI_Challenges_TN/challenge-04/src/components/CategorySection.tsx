import { useState } from "react";
import type { Term } from "../data/glossary";
import TermCard from "./TermCard";

interface Props {
  category: string;
  terms: Term[];
  query: string;
  onSelect: (term: Term) => void;
}

export default function CategorySection({ category, terms, query, onSelect }: Props) {
  const [open, setOpen] = useState(true);

  return (
    <section className="mb-6">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 w-full text-left mb-3 group"
      >
        <span className="text-base font-bold text-gray-800 group-hover:text-blue-700 transition-colors">
          {category}
        </span>
        <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 font-medium">
          {terms.length}
        </span>
        <span className="ml-auto text-gray-400 text-sm">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="grid gap-3 sm:grid-cols-2">
          {terms.map((term) => (
            <TermCard key={term.id} term={term} query={query} onClick={() => onSelect(term)} />
          ))}
        </div>
      )}
    </section>
  );
}
