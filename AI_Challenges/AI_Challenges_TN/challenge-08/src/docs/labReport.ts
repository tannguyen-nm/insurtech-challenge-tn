export interface LabTest {
  test_name: string;
  result: string | number;
  unit: string;
  reference_range: string;
  flag: 'normal' | 'high' | 'low';
}

export interface LabData {
  id: number;
  lab_name: string;
  lab_address: string;
  patient_name: string;
  patient_id: string;
  dob: string;
  gender: string;
  date: string;
  ordered_by: string;
  tests: LabTest[];
}

export const LABS: LabData[] = [
  {
    id: 1,
    lab_name: 'Bangkok Lab & Pathology Center',
    lab_address: '35/4 Silom Rd, Bangrak, Bangkok 10500',
    patient_name: 'Thida Pornprasert',
    patient_id: 'LAB-2024-09981',
    dob: '1983-09-12',
    gender: 'Female',
    date: '2024-05-10',
    ordered_by: 'Dr. Araya Boonsri',
    tests: [
      { test_name: 'Hemoglobin (Hgb)', result: 9.8, unit: 'g/dL', reference_range: '12.0 – 16.0', flag: 'low' },
      { test_name: 'Hematocrit (Hct)', result: 31.2, unit: '%', reference_range: '36.0 – 48.0', flag: 'low' },
      { test_name: 'White Blood Cell Count', result: 11.4, unit: '×10³/μL', reference_range: '4.5 – 10.0', flag: 'high' },
      { test_name: 'Platelet Count', result: 245, unit: '×10³/μL', reference_range: '150 – 400', flag: 'normal' },
      { test_name: 'Mean Corpuscular Volume (MCV)', result: 72, unit: 'fL', reference_range: '80 – 100', flag: 'low' },
      { test_name: 'Serum Ferritin', result: 6.2, unit: 'ng/mL', reference_range: '10.0 – 291.0', flag: 'low' },
      { test_name: 'Total Iron Binding Capacity (TIBC)', result: 490, unit: 'μg/dL', reference_range: '250 – 370', flag: 'high' },
    ],
  },
  {
    id: 2,
    lab_name: 'MedLab Diagnostics Co., Ltd.',
    lab_address: '128/9 Sukhumvit 21, Asoke, Bangkok 10110',
    patient_name: 'Phong Nguyen',
    patient_id: 'ML-2024-03317',
    dob: '1970-03-25',
    gender: 'Male',
    date: '2024-09-03',
    ordered_by: 'Dr. Pravit Chaisamut',
    tests: [
      { test_name: 'Fasting Blood Glucose', result: 186, unit: 'mg/dL', reference_range: '70 – 99', flag: 'high' },
      { test_name: 'HbA1c', result: 8.9, unit: '%', reference_range: '<5.7', flag: 'high' },
      { test_name: 'Total Cholesterol', result: 228, unit: 'mg/dL', reference_range: '<200', flag: 'high' },
      { test_name: 'LDL Cholesterol', result: 152, unit: 'mg/dL', reference_range: '<130', flag: 'high' },
      { test_name: 'HDL Cholesterol', result: 42, unit: 'mg/dL', reference_range: '>40', flag: 'normal' },
      { test_name: 'Triglycerides', result: 195, unit: 'mg/dL', reference_range: '<150', flag: 'high' },
      { test_name: 'Creatinine', result: 1.1, unit: 'mg/dL', reference_range: '0.7 – 1.2', flag: 'normal' },
      { test_name: 'eGFR', result: 68, unit: 'mL/min/1.73m²', reference_range: '>60', flag: 'normal' },
      { test_name: 'Alanine Aminotransferase (ALT)', result: 38, unit: 'U/L', reference_range: '7 – 40', flag: 'normal' },
    ],
  },
];

const FLAG_COLORS: Record<string, string> = { high: '#e74c3c', low: '#3498db', normal: '#27ae60' };

export function renderLabReport(data: LabData): string {
  const rows = data.tests.map(t => `
    <tr>
      <td>${t.test_name}</td>
      <td class="center" style="font-weight:bold;color:${FLAG_COLORS[t.flag]}">${t.result}</td>
      <td class="center">${t.unit}</td>
      <td class="center">${t.reference_range}</td>
      <td class="center"><span style="background:${FLAG_COLORS[t.flag]};color:white;padding:2px 8px;border-radius:3px;font-size:11px;font-weight:bold">${t.flag.toUpperCase()}</span></td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a1a; margin: 0; padding: 32px; max-width: 760px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #16a085; padding-bottom: 14px; margin-bottom: 18px; }
  .lab-name { font-size: 20px; font-weight: bold; color: #16a085; }
  .lab-addr { font-size: 11px; color: #666; margin-top: 3px; }
  .doc-title h1 { font-size: 20px; font-weight: bold; color: #16a085; margin: 0; text-align: right; }
  .patient-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; background: #f0fbf8; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px; border: 1px solid #a8e6da; }
  .info-row { display: flex; gap: 6px; font-size: 12px; }
  .info-label { font-weight: bold; color: #16a085; min-width: 110px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #16a085; color: white; padding: 8px 10px; font-size: 12px; text-align: left; }
  th.center { text-align: center; }
  td { padding: 7px 10px; border-bottom: 1px solid #e0e0e0; font-size: 12px; }
  td.center { text-align: center; }
  tr:nth-child(even) td { background: #f9fffe; }
  .legend { display: flex; gap: 20px; margin-top: 16px; font-size: 11px; }
  .leg-item { display: flex; align-items: center; gap: 5px; }
  .leg-dot { width: 10px; height: 10px; border-radius: 50%; }
  .footer { margin-top: 20px; font-size: 10px; color: #aaa; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="lab-name">${data.lab_name}</div>
      <div class="lab-addr">${data.lab_address}</div>
    </div>
    <div class="doc-title"><h1>LABORATORY REPORT</h1></div>
  </div>
  <div class="patient-grid">
    <div class="info-row"><span class="info-label">Patient Name:</span><span>${data.patient_name}</span></div>
    <div class="info-row"><span class="info-label">Lab No:</span><span>${data.patient_id}</span></div>
    <div class="info-row"><span class="info-label">Date of Birth:</span><span>${data.dob}</span></div>
    <div class="info-row"><span class="info-label">Gender:</span><span>${data.gender}</span></div>
    <div class="info-row"><span class="info-label">Report Date:</span><span>${data.date}</span></div>
    <div class="info-row"><span class="info-label">Ordered By:</span><span>${data.ordered_by}</span></div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Test Name</th>
        <th class="center">Result</th>
        <th class="center">Unit</th>
        <th class="center">Reference Range</th>
        <th class="center">Flag</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="legend">
    <div class="leg-item"><div class="leg-dot" style="background:#27ae60"></div> Normal</div>
    <div class="leg-item"><div class="leg-dot" style="background:#e74c3c"></div> High</div>
    <div class="leg-item"><div class="leg-dot" style="background:#3498db"></div> Low</div>
  </div>
  <div class="footer">Results are for physician interpretation only. Verified by licensed medical laboratory technologist.</div>
</body>
</html>`;
}
