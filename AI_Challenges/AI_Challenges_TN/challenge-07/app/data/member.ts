import type { MemberInfo } from '../types/wizard'

export const MOCK_MEMBER: MemberInfo = {
  name: 'Michael Johnson',
  policyNumber: 'INS-2024-001234',
  memberId: 'MBR-789456',
  dob: '1982-03-15',
  dependents: [
    {
      id: 'dep-001',
      name: 'Sarah Johnson',
      relationship: 'Spouse',
      memberId: 'MBR-789457',
      dob: '1984-07-22',
    },
    {
      id: 'dep-002',
      name: 'Emma Johnson',
      relationship: 'Child',
      memberId: 'MBR-789458',
      dob: '2010-11-05',
    },
    {
      id: 'dep-003',
      name: 'Lucas Johnson',
      relationship: 'Child',
      memberId: 'MBR-789459',
      dob: '2013-04-18',
    },
  ],
}
