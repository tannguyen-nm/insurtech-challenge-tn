export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: string;
}

export interface PrescriptionData {
  id: number;
  doctor_name: string;
  doctor_title: string;
  clinic: string;
  clinic_address: string;
  license_no: string;
  patient_name: string;
  patient_id: string;
  dob: string;
  date: string;
  medications: Medication[];
  notes: string;
}

export const PRESCRIPTIONS: PrescriptionData[] = [
  {
    id: 1,
    doctor_name: 'Dr. Sirimas Wongsatit',
    doctor_title: 'MD, Internist',
    clinic: 'Bangkok Medical Clinic',
    clinic_address: '45/2 Phahonyothin Rd, Chatuchak, Bangkok 10900',
    license_no: 'ว.25634',
    patient_name: 'Ananya Charoenwong',
    patient_id: 'BMC-2024-00234',
    dob: '1992-07-19',
    date: '2024-04-20',
    medications: [
      { name: 'Metformin 500mg', dosage: '500mg', frequency: 'Twice daily with meals', duration: '30 days', quantity: '60 tablets' },
      { name: 'Lisinopril 10mg', dosage: '10mg', frequency: 'Once daily in the morning', duration: '30 days', quantity: '30 tablets' },
      { name: 'Atorvastatin 20mg', dosage: '20mg', frequency: 'Once daily at bedtime', duration: '30 days', quantity: '30 tablets' },
    ],
    notes: 'Monitor blood pressure weekly. Fasting blood glucose test in 3 months. Avoid grapefruit with Atorvastatin.',
  },
  {
    id: 2,
    doctor_name: 'Dr. Pattarapong Suksom',
    doctor_title: 'MD, Pediatrician',
    clinic: 'Happy Kids Clinic',
    clinic_address: '88 Ratchadaphisek Rd, Din Daeng, Bangkok 10400',
    license_no: 'ว.31102',
    patient_name: 'Nong Suksom',
    patient_id: 'HKC-2024-01076',
    dob: '2019-03-05',
    date: '2024-11-12',
    medications: [
      { name: 'Amoxicillin 250mg/5mL Syrup', dosage: '5mL (250mg)', frequency: 'Three times daily', duration: '7 days', quantity: '1 bottle (100mL)' },
      { name: 'Paracetamol 160mg/5mL Syrup', dosage: '5mL (160mg)', frequency: 'Every 6 hours as needed for fever', duration: '5 days', quantity: '1 bottle (60mL)' },
      { name: 'Cetirizine 5mg/5mL Syrup', dosage: '2.5mL', frequency: 'Once daily at bedtime', duration: '7 days', quantity: '1 bottle (30mL)' },
    ],
    notes: 'Ensure full antibiotic course completion. Return if fever persists beyond 3 days or worsens. Store all syrups in refrigerator.',
  },
];

export function renderPrescription(data: PrescriptionData): string {
  const meds = data.medications.map((m, i) => `
    <tr>
      <td class="center" style="font-weight:bold;color:#6c3483">${i + 1}</td>
      <td><strong>${m.name}</strong></td>
      <td>${m.dosage}</td>
      <td>${m.frequency}</td>
      <td>${m.duration}</td>
      <td>${m.quantity}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a1a; margin: 0; padding: 32px; max-width: 720px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #6c3483; padding-bottom: 14px; margin-bottom: 18px; }
  .clinic-name { font-size: 20px; font-weight: bold; color: #6c3483; }
  .clinic-addr { font-size: 11px; color: #666; margin-top: 3px; }
  .rx-symbol { font-size: 48px; font-weight: bold; color: #6c3483; opacity: 0.15; line-height: 1; }
  .doctor-block { background: #f5eef8; border-radius: 4px; padding: 10px 14px; margin-bottom: 16px; }
  .doctor-name { font-size: 15px; font-weight: bold; color: #6c3483; }
  .doctor-sub { font-size: 11px; color: #888; }
  .patient-box { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; background: #fdfefe; border: 1px solid #d2b4de; border-radius: 4px; padding: 10px 14px; margin-bottom: 18px; }
  .info-row { display: flex; gap: 6px; font-size: 12px; }
  .info-label { font-weight: bold; color: #6c3483; min-width: 110px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { background: #6c3483; color: white; padding: 8px 10px; font-size: 11px; text-align: left; }
  th.center { text-align: center; }
  td { padding: 7px 10px; border-bottom: 1px solid #e8daef; font-size: 12px; }
  td.center { text-align: center; }
  tr:nth-child(even) td { background: #fdf5ff; }
  .notes-box { background: #fef9e7; border-left: 4px solid #f0b429; padding: 10px 14px; font-size: 12px; margin-bottom: 20px; }
  .sig-block { display: flex; justify-content: flex-end; margin-top: 20px; }
  .sig-area { text-align: center; min-width: 220px; }
  .sig-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 4px; font-size: 11px; }
  .footer { margin-top: 16px; font-size: 10px; color: #aaa; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="clinic-name">${data.clinic}</div>
      <div class="clinic-addr">${data.clinic_address}</div>
    </div>
    <div class="rx-symbol">Rx</div>
  </div>
  <div class="doctor-block">
    <div class="doctor-name">${data.doctor_name}</div>
    <div class="doctor-sub">${data.doctor_title} · License No: ${data.license_no}</div>
  </div>
  <div class="patient-box">
    <div class="info-row"><span class="info-label">Patient Name:</span><span>${data.patient_name}</span></div>
    <div class="info-row"><span class="info-label">Patient ID:</span><span>${data.patient_id}</span></div>
    <div class="info-row"><span class="info-label">Date of Birth:</span><span>${data.dob}</span></div>
    <div class="info-row"><span class="info-label">Date:</span><span>${data.date}</span></div>
  </div>
  <table>
    <thead>
      <tr>
        <th class="center">#</th>
        <th>Medication</th>
        <th>Dosage</th>
        <th>Frequency</th>
        <th>Duration</th>
        <th>Quantity</th>
      </tr>
    </thead>
    <tbody>${meds}</tbody>
  </table>
  <div class="notes-box"><strong>Clinical Notes:</strong> ${data.notes}</div>
  <div class="sig-block">
    <div class="sig-area"><div class="sig-line">${data.doctor_name}<br>${data.doctor_title}</div></div>
  </div>
  <div class="footer">This prescription is valid for 30 days from date of issue. Not valid if altered.</div>
</body>
</html>`;
}
