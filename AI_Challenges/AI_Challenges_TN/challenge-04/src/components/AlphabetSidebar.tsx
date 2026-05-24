interface Props {
  activeLetters: Set<string>;
  onJump: (letter: string) => void;
}

export default function AlphabetSidebar({ activeLetters, onJump }: Props) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  return (
    <>
      {/* Desktop: vertical sidebar */}
      <aside className="hidden md:flex flex-col gap-0.5 sticky top-6 self-start">
        {letters.map((l) => {
          const active = activeLetters.has(l);
          return (
            <button
              key={l}
              disabled={!active}
              onClick={() => active && onJump(l)}
              className={`w-7 h-7 rounded text-xs font-semibold transition-colors ${
                active
                  ? "text-blue-700 hover:bg-blue-100 cursor-pointer"
                  : "text-gray-300 cursor-default"
              }`}
            >
              {l}
            </button>
          );
        })}
      </aside>

      {/* Mobile: horizontal scroll */}
      <div className="md:hidden flex gap-1 overflow-x-auto pb-2 px-1">
        {letters
          .filter((l) => activeLetters.has(l))
          .map((l) => (
            <button
              key={l}
              onClick={() => onJump(l)}
              className="shrink-0 w-8 h-8 rounded bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors"
            >
              {l}
            </button>
          ))}
      </div>
    </>
  );
}
