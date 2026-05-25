import { useState } from 'react';
import { diffCountryRules } from '../lib/engine';
import { getConfig, getCountryCodes } from '../lib/loader';

const STATUS_STYLE = {
  differs: 'border-yellow-200 bg-yellow-50',
  only_in_a: 'border-blue-200 bg-blue-50',
  only_in_b: 'border-purple-200 bg-purple-50',
  same: 'border-green-200 bg-green-50',
};

const STATUS_LABEL = {
  differs: 'Different',
  only_in_a: 'Only in A',
  only_in_b: 'Only in B',
  same: 'Same',
};

const STATUS_BADGE = {
  differs: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  only_in_a: 'bg-blue-100 text-blue-800 border-blue-200',
  only_in_b: 'bg-purple-100 text-purple-800 border-purple-200',
  same: 'bg-green-100 text-green-800 border-green-200',
};

export default function DiffTab() {
  const codes = getCountryCodes();
  const [countryA, setCountryA] = useState(codes[0] ?? 'TH');
  const [countryB, setCountryB] = useState(codes[1] ?? 'VN');

  const configA = getConfig(countryA);
  const configB = getConfig(countryB);
  const diffs = configA && configB ? diffCountryRules(configA, configB) : [];

  const counts = {
    differs: diffs.filter((d) => d.status === 'differs').length,
    only_in_a: diffs.filter((d) => d.status === 'only_in_a').length,
    only_in_b: diffs.filter((d) => d.status === 'only_in_b').length,
    same: diffs.filter((d) => d.status === 'same').length,
  };

  return (
    <div className="space-y-4">
      {/* Country selectors */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 mb-4">Compare Country Rules</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Country A</p>
            <div className="flex flex-wrap gap-2">
              {codes.map((c) => (
                <button
                  key={c}
                  disabled={c === countryB}
                  onClick={() => setCountryA(c)}
                  className={`text-sm font-semibold px-4 py-2 rounded-xl border transition-colors disabled:opacity-30 ${
                    countryA === c
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Country B</p>
            <div className="flex flex-wrap gap-2">
              {codes.map((c) => (
                <button
                  key={c}
                  disabled={c === countryA}
                  onClick={() => setCountryB(c)}
                  className={`text-sm font-semibold px-4 py-2 rounded-xl border transition-colors disabled:opacity-30 ${
                    countryB === c
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary counts */}
        <div className="flex gap-3 mt-4">
          {(Object.keys(STATUS_LABEL) as Array<keyof typeof STATUS_LABEL>).map((k) => (
            <div key={k} className={`text-xs px-3 py-1 rounded-full border font-semibold ${STATUS_BADGE[k]}`}>
              {STATUS_LABEL[k]}: {counts[k]}
            </div>
          ))}
        </div>
      </div>

      {/* Diff list */}
      <div className="space-y-3">
        {diffs.map((d, i) => (
          <div key={i} className={`rounded-2xl border p-5 ${STATUS_STYLE[d.status]}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{d.rule_type.replace(/_/g, ' ')}</span>
                {d.rule_id_a && <span className="font-mono text-xs text-blue-700">{d.rule_id_a}</span>}
                {d.rule_id_a && d.rule_id_b && <span className="text-xs text-gray-400">vs</span>}
                {d.rule_id_b && <span className="font-mono text-xs text-purple-700">{d.rule_id_b}</span>}
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${STATUS_BADGE[d.status]}`}>
                {STATUS_LABEL[d.status]}
              </span>
            </div>
            <p className="text-sm text-gray-800 mb-2">{d.description}</p>
            {d.diff && Object.keys(d.diff).length > 0 && (
              <div className="space-y-2">
                {Object.entries(d.diff).map(([key, val]) => (
                  <div key={key} className="grid grid-cols-3 gap-2 text-xs">
                    <div className="font-semibold text-gray-600">{key}</div>
                    <div className="bg-blue-100 rounded px-2 py-1 font-mono text-blue-800">
                      {countryA}: {JSON.stringify(val.a)}
                    </div>
                    <div className="bg-purple-100 rounded px-2 py-1 font-mono text-purple-800">
                      {countryB}: {JSON.stringify(val.b)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
