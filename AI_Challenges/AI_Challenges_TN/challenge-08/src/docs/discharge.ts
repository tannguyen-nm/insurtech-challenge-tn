export interface DischargeData {
  id: number;
  hospital_name: string;
  hospital_address: string;
  patient_name: string;
  patient_id: string;
  dob: string;
  admission_date: string;
  discharge_date: string;
  diagnosis_primary: string;
  diagnosis_secondary: string[];
  procedures_performed: string[];
  attending_physician: string;
  department: string;
  discharge_instructions: string;
}

export const DISCHARGES: DischargeData[] = [
  {
    id: 1,
    hospital_name: 'Chulalongkorn Hospital',
    hospital_address: '1873 Rama IV Rd, Pathum Wan, Bangkok 10330',
    patient_name: 'Pranee Suksomboon',
    patient_id: 'CU-2024-04412',
    dob: '1978-06-14',
    admission_date: '2024-04-10',
    discharge_date: '2024-04-13',
    diagnosis_primary: 'Acute Appendicitis (K35.8)',
    diagnosis_secondary: ['Mild Dehydration (E86.0)'],
    procedures_performed: ['Laparoscopic Appendectomy', 'IV Fluid Resuscitation', 'Post-operative wound care'],
    attending_physician: 'Dr. Chaiwat Phromthai, MD — General Surgery',
    department: 'General Surgery',
    discharge_instructions: 'Rest for 2 weeks. Avoid heavy lifting. Follow up in outpatient clinic in 7 days. Take prescribed antibiotics (Amoxicillin 500mg) for 5 days. Return to ER if fever >38.5°C or wound discharge noted.',
  },
  {
    id: 2,
    hospital_name: 'Ramathibodi Hospital',
    hospital_address: '270 Rama VI Rd, Ratchathewi, Bangkok 10400',
    patient_name: 'Le Van Minh',
    patient_id: 'RT-2024-07889',
    dob: '1965-11-30',
    admission_date: '2024-06-01',
    discharge_date: '2024-06-05',
    diagnosis_primary: 'Acute Myocardial Infarction — NSTEMI (I21.4)',
    diagnosis_secondary: ['Type 2 Diabetes Mellitus (E11.9)', 'Hypertension (I10)', 'Hyperlipidemia (E78.5)'],
    procedures_performed: ['Coronary Angiography', 'Percutaneous Coronary Intervention (PCI) — LAD stenting', 'Echocardiography', 'Continuous cardiac monitoring'],
    attending_physician: 'Dr. Supawit Tangsrirat, MD — Interventional Cardiology',
    department: 'Cardiology / CCU',
    discharge_instructions: 'Strict low-sodium, low-fat diet. Take all cardiac medications as prescribed (Aspirin, Clopidogrel, Atorvastatin, Metoprolol). Cardiac rehabilitation program enrollment. Follow-up with cardiologist in 2 weeks. Avoid strenuous activity for 4 weeks.',
  },
  {
    id: 3,
    hospital_name: 'Siriraj Hospital',
    hospital_address: '2 Wanglang Rd, Bangkok Noi, Bangkok 10700',
    patient_name: 'Malee Kongkiat',
    patient_id: 'SR-2024-02244',
    dob: '1990-02-08',
    admission_date: '2024-08-20',
    discharge_date: '2024-08-22',
    diagnosis_primary: 'Pneumonia — Community Acquired (J18.9)',
    diagnosis_secondary: ['Mild Hypoxemia (J96.01)'],
    procedures_performed: ['Chest X-Ray (AP & Lateral)', 'Sputum Culture & Sensitivity', 'IV Antibiotics — Ceftriaxone 2g OD', 'Supplemental oxygen therapy'],
    attending_physician: 'Dr. Nattaporn Wisuttipat, MD — Pulmonology',
    department: 'Internal Medicine / Pulmonology',
    discharge_instructions: 'Complete oral antibiotic course (Amoxicillin-Clavulanate 875/125mg BD × 7 days). Adequate rest and hydration. Avoid smoking. Return if dyspnea worsens or oxygen saturation <95%. Follow up chest X-ray in 6 weeks.',
  },
];

export function renderDischarge(data: DischargeData): string {
  const secondaryDx = data.diagnosis_secondary.map(d => `<li>${d}</li>`).join('');
  const procedures = data.procedures_performed.map(p => `<li>${p}</li>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: 'Times New Roman', serif; font-size: 13px; color: #1a1a1a; margin: 0; padding: 32px; max-width: 720px; margin: 0 auto; }
  .header { text-align: center; border-bottom: 3px double #2c3e50; padding-bottom: 16px; margin-bottom: 20px; }
  .hospital-name { font-size: 22px; font-weight: bold; color: #2c3e50; }
  .hospital-addr { font-size: 11px; color: #666; margin-top: 4px; }
  .doc-title { font-size: 18px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin-top: 12px; color: #2c3e50; }
  .patient-box { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; padding: 12px 16px; margin-bottom: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .info-row { display: flex; gap: 8px; font-size: 12px; }
  .info-label { font-weight: bold; color: #495057; min-width: 130px; }
  .section { margin-bottom: 18px; }
  .section-title { font-size: 14px; font-weight: bold; color: #2c3e50; border-bottom: 1px solid #adb5bd; padding-bottom: 4px; margin-bottom: 8px; }
  .diagnosis-primary { font-weight: bold; color: #c0392b; font-size: 13px; }
  ul { margin: 4px 0; padding-left: 20px; }
  li { margin-bottom: 3px; font-size: 12px; }
  .instructions { background: #fff8e1; border-left: 4px solid #f39c12; padding: 10px 14px; font-size: 12px; line-height: 1.6; }
  .signature-block { display: flex; justify-content: space-between; margin-top: 30px; }
  .sig-line { text-align: center; min-width: 200px; }
  .sig-line .line { border-top: 1px solid #333; margin-top: 40px; padding-top: 4px; font-size: 11px; }
  .footer { margin-top: 24px; font-size: 10px; color: #aaa; text-align: center; border-top: 1px solid #eee; padding-top: 12px; }
</style>
</head>
<body>
  <div class="header">
    <div class="hospital-name">${data.hospital_name}</div>
    <div class="hospital-addr">${data.hospital_address}</div>
    <div class="doc-title">Discharge Summary</div>
  </div>
  <div class="patient-box">
    <div class="info-row"><span class="info-label">Patient Name:</span><span>${data.patient_name}</span></div>
    <div class="info-row"><span class="info-label">Patient ID:</span><span>${data.patient_id}</span></div>
    <div class="info-row"><span class="info-label">Date of Birth:</span><span>${data.dob}</span></div>
    <div class="info-row"><span class="info-label">Department:</span><span>${data.department}</span></div>
    <div class="info-row"><span class="info-label">Admission Date:</span><span>${data.admission_date}</span></div>
    <div class="info-row"><span class="info-label">Discharge Date:</span><span>${data.discharge_date}</span></div>
  </div>
  <div class="section">
    <div class="section-title">Diagnosis</div>
    <div style="margin-bottom:6px"><strong>Primary:</strong> <span class="diagnosis-primary">${data.diagnosis_primary}</span></div>
    ${data.diagnosis_secondary.length ? `<div><strong>Secondary:</strong><ul>${secondaryDx}</ul></div>` : ''}
  </div>
  <div class="section">
    <div class="section-title">Procedures Performed</div>
    <ul>${procedures}</ul>
  </div>
  <div class="section">
    <div class="section-title">Attending Physician</div>
    <p style="margin:0;font-size:12px">${data.attending_physician}</p>
  </div>
  <div class="section">
    <div class="section-title">Discharge Instructions</div>
    <div class="instructions">${data.discharge_instructions}</div>
  </div>
  <div class="signature-block">
    <div class="sig-line"><div class="line">${data.attending_physician.split('—')[0].trim()}</div></div>
    <div class="sig-line"><div class="line">Date: ${data.discharge_date}</div></div>
  </div>
  <div class="footer">This document is confidential. For authorized medical personnel use only.</div>
</body>
</html>`;
}
