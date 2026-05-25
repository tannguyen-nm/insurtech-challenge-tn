export interface ReceiptData {
  id: number;
  hospital_name: string;
  hospital_address: string;
  patient_name: string;
  patient_id: string;
  date: string;
  items: { description: string; quantity: number; unit_price: number; total: number }[];
  grand_total: number;
  payment_method: string;
}

export const RECEIPTS: ReceiptData[] = [
  {
    id: 1,
    hospital_name: 'Bangkok Hospital Medical Center',
    hospital_address: '2 Soi Soonvijai 7, New Petchburi Rd, Bangkok 10310',
    patient_name: 'Somchai Jaidee',
    patient_id: 'BH-2024-00341',
    date: '2024-03-15',
    items: [
      { description: 'Consultation Fee (Internal Medicine)', quantity: 1, unit_price: 1200, total: 1200 },
      { description: 'Blood Chemistry Panel', quantity: 1, unit_price: 2800, total: 2800 },
      { description: 'Chest X-Ray (PA)', quantity: 1, unit_price: 1500, total: 1500 },
      { description: 'Omeprazole 20mg (30 caps)', quantity: 2, unit_price: 350, total: 700 },
      { description: 'Nursing Service', quantity: 1, unit_price: 500, total: 500 },
    ],
    grand_total: 6700,
    payment_method: 'Credit Card (Visa)',
  },
  {
    id: 2,
    hospital_name: 'Bumrungrad International Hospital',
    hospital_address: '33 Sukhumvit 3 (Soi Nana Nua), Wattana, Bangkok 10110',
    patient_name: 'Nguyen Thi Lan',
    patient_id: 'BH-2024-00892',
    date: '2024-05-22',
    items: [
      { description: 'Emergency Room Fee', quantity: 1, unit_price: 2500, total: 2500 },
      { description: 'IV Fluid Administration', quantity: 2, unit_price: 400, total: 800 },
      { description: 'Complete Blood Count (CBC)', quantity: 1, unit_price: 950, total: 950 },
      { description: 'Urinalysis', quantity: 1, unit_price: 450, total: 450 },
      { description: 'Ceftriaxone 1g Injection', quantity: 3, unit_price: 280, total: 840 },
      { description: 'Room & Board (1 night)', quantity: 1, unit_price: 4500, total: 4500 },
    ],
    grand_total: 10040,
    payment_method: 'Insurance Direct Billing',
  },
  {
    id: 3,
    hospital_name: 'Samitivej Sukhumvit Hospital',
    hospital_address: '133 Sukhumvit 49, Klongton Nua, Wattana, Bangkok 10110',
    patient_name: 'Wanchai Boonmee',
    patient_id: 'SV-2024-01155',
    date: '2024-07-08',
    items: [
      { description: 'Outpatient Consultation (Orthopedics)', quantity: 1, unit_price: 1800, total: 1800 },
      { description: 'MRI Knee Joint (without contrast)', quantity: 1, unit_price: 12000, total: 12000 },
      { description: 'Physical Therapy Session', quantity: 3, unit_price: 800, total: 2400 },
      { description: 'Diclofenac 50mg (20 tabs)', quantity: 1, unit_price: 180, total: 180 },
      { description: 'Knee Brace (Medium)', quantity: 1, unit_price: 1200, total: 1200 },
    ],
    grand_total: 17580,
    payment_method: 'Cash',
  },
];

export function renderReceipt(data: ReceiptData): string {
  const rows = data.items.map(item => `
    <tr>
      <td>${item.description}</td>
      <td class="center">${item.quantity}</td>
      <td class="right">฿ ${item.unit_price.toLocaleString()}</td>
      <td class="right">฿ ${item.total.toLocaleString()}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a1a; margin: 0; padding: 32px; max-width: 720px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1a5276; padding-bottom: 16px; margin-bottom: 20px; }
  .hospital-name { font-size: 20px; font-weight: bold; color: #1a5276; }
  .hospital-addr { font-size: 11px; color: #555; margin-top: 4px; }
  .doc-title { text-align: right; }
  .doc-title h1 { font-size: 22px; font-weight: bold; color: #1a5276; margin: 0; }
  .doc-title .receipt-no { font-size: 12px; color: #888; margin-top: 4px; }
  .patient-info { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: #f4f6f8; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px; }
  .info-row { display: flex; gap: 8px; }
  .info-label { font-weight: bold; color: #555; min-width: 100px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { background: #1a5276; color: white; padding: 8px 10px; text-align: left; font-size: 12px; }
  th.center { text-align: center; }
  th.right { text-align: right; }
  td { padding: 7px 10px; border-bottom: 1px solid #e8e8e8; font-size: 12px; }
  td.center { text-align: center; }
  td.right { text-align: right; }
  tr:nth-child(even) td { background: #fafbfc; }
  .totals { display: flex; justify-content: flex-end; margin-bottom: 20px; }
  .totals-box { min-width: 260px; }
  .total-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee; font-size: 12px; }
  .grand-total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 15px; font-weight: bold; color: #1a5276; border-top: 2px solid #1a5276; margin-top: 4px; }
  .payment-section { background: #eaf4fb; border-left: 4px solid #1a5276; padding: 10px 14px; font-size: 12px; }
  .footer { margin-top: 24px; font-size: 10px; color: #aaa; text-align: center; border-top: 1px solid #eee; padding-top: 12px; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="hospital-name">${data.hospital_name}</div>
      <div class="hospital-addr">${data.hospital_address}</div>
    </div>
    <div class="doc-title">
      <h1>RECEIPT</h1>
      <div class="receipt-no">Receipt No: ${data.patient_id}-R</div>
    </div>
  </div>
  <div class="patient-info">
    <div class="info-row"><span class="info-label">Patient Name:</span> <span>${data.patient_name}</span></div>
    <div class="info-row"><span class="info-label">Patient ID:</span> <span>${data.patient_id}</span></div>
    <div class="info-row"><span class="info-label">Date:</span> <span>${data.date}</span></div>
    <div class="info-row"><span class="info-label">Visit Type:</span> <span>Outpatient</span></div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="center">Qty</th>
        <th class="right">Unit Price</th>
        <th class="right">Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="totals">
    <div class="totals-box">
      <div class="total-row"><span>Subtotal</span><span>฿ ${data.grand_total.toLocaleString()}</span></div>
      <div class="total-row"><span>VAT (0%)</span><span>฿ 0</span></div>
      <div class="grand-total-row"><span>GRAND TOTAL</span><span>฿ ${data.grand_total.toLocaleString()}</span></div>
    </div>
  </div>
  <div class="payment-section">
    <strong>Payment Method:</strong> ${data.payment_method}
  </div>
  <div class="footer">This receipt is computer-generated. For inquiries contact billing@${data.hospital_name.toLowerCase().replace(/\s+/g, '')}.co.th</div>
</body>
</html>`;
}
