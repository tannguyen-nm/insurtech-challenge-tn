import type { Term, Category } from "../data/glossary";
import { highlight } from "../utils/search";

const categoryColors: Record<Category, string> = {
  "General Insurance": "bg-blue-100 text-blue-800",
  Claims: "bg-orange-100 text-orange-800",
  Coverage: "bg-green-100 text-green-800",
  "Life & Health": "bg-pink-100 text-pink-800",
  Reinsurance: "bg-purple-100 text-purple-800",
  Regulatory: "bg-gray-100 text-gray-700",
};

interface Props {
  term: Term;
  query: string;
  onClick: () => void;
}

export default function TermCard({ term, query, onClick }: Props) {
  const firstSentence = term.definition.split(".")[0] + ".";
  const highlightedName = highlight(term.name, query);
  const highlightedDef = highlight(firstSentence, query);

  return (
    <div
      tabIndex={0}
      role="button"
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3
          className="font-semibold text-gray-900 text-sm"
          dangerouslySetInnerHTML={{ __html: highlightedName }}
        />
        <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap font-medium ${categoryColors[term.category]}`}>
          {term.category}
        </span>
      </div>
      <p
        className="text-gray-600 text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: highlightedDef }}
      />
      <button className="mt-3 text-xs text-blue-600 hover:text-blue-800 font-medium">
        View full definition →
      </button>
    </div>
  );
}
