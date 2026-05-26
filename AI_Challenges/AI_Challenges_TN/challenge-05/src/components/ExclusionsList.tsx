import type { Policy } from '../types/policy';

interface Props { policy: Policy; }

export default function ExclusionsList({ policy }: Props) {
  if (!policy.exclusions?.length) return null;
  return (
    <section className="p-6 border-b border-gray-100">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Exclusions</h2>
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-3">
          ⚠ The following are not covered under this policy
        </p>
        <ul className="space-y-2">
          {policy.exclusions.map((ex) => (
            <li key={ex} className="flex gap-2 text-sm text-red-800">
              <span className="text-red-400 mt-0.5 shrink-0">✕</span>
              <span>{ex}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
