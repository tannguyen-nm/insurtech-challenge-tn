import type { Policy } from '../types/policy';
import { formatNetworkType } from '../utils/format';

interface Props { policy: Policy; }

export default function NetworkInfo({ policy }: Props) {
  if (!policy.network) return null;
  const { network } = policy;
  return (
    <section className="p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Network Information</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">Network Type</p>
          <p className="font-semibold text-green-800 text-sm">{formatNetworkType(network.type)}</p>
        </div>
        {network.hospital_count !== undefined && (
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Partner Hospitals</p>
            <p className="font-semibold text-green-800 text-sm">{network.hospital_count.toLocaleString()} hospitals</p>
          </div>
        )}
        {network.countries?.length && (
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Coverage Countries</p>
            <p className="font-semibold text-green-800 text-sm">{network.countries.join(', ')}</p>
          </div>
        )}
      </div>
    </section>
  );
}
