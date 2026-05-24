import { useEffect } from "react";
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
  allTerms: Term[];
  onClose: () => void;
  onNavigate: (id: string) => void;
}

export default function TermModal({ term, query, allTerms, onClose, onNavigate }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const relatedTermObjects = term.relatedTerms
    .map((id) => allTerms.find((t) => t.id === id))
    .filter(Boolean) as Term[];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2
                className="text-xl font-bold text-gray-900"
                dangerouslySetInnerHTML={{ __html: highlight(term.name, query) }}
              />
              <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[term.category]}`}>
                {term.category}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold shrink-0"
            >
              ✕
            </button>
          </div>
          <p
            className="text-gray-700 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: highlight(term.definition, query) }}
          />
          {relatedTermObjects.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Related Terms</p>
              <div className="flex flex-wrap gap-2">
                {relatedTermObjects.map((rt) => (
                  <button
                    key={rt.id}
                    onClick={() => onNavigate(rt.id)}
                    className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1 hover:bg-blue-100 transition-colors"
                  >
                    {rt.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
