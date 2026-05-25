import type { Policy } from '../types/policy';
import { formatDate } from '../utils/format';

interface Props { policy: Policy; }

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-gray-100">
      <td className="py-2.5 pr-4 text-sm font-medium text-gray-500 w-44">{label}</td>
      <td className="py-2.5 text-sm text-gray-900 font-medium">{value}</td>
    </tr>
  );
}

export default function PolicyOverview({ policy }: Props) {
  const { policyholder: ph, plan } = policy;
  return (
    <section className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Policy Overview</h2>
      <table className="w-full">
        <tbody>
          <Row label="Policy Number" value={policy.policy_number} />
          <Row label="Policyholder" value={ph.name} />
          <Row label="Type" value={ph.type === 'CORPORATE' ? `Corporate${ph.industry ? ` · ${ph.industry}` : ''}` : 'Individual'} />
          {ph.employee_count && <Row label="Employees" value={ph.employee_count.toLocaleString()} />}
          <Row label="Plan Name" value={`${plan.name} (${plan.tier})`} />
          <Row label="Currency" value={plan.currency} />
          <Row label="Effective Date" value={formatDate(plan.effective_date)} />
          <Row label="Expiry Date" value={formatDate(plan.expiry_date)} />
        </tbody>
      </table>
    </section>
  );
}
