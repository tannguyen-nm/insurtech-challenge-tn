import type { DocType, ExtractionOutput } from './types.js';

function isValidDate(val: unknown): boolean {
  if (typeof val !== 'string' || !val) return false;
  const d = new Date(val);
  return !isNaN(d.getTime());
}

function isPositiveNumber(val: unknown): boolean {
  return typeof val === 'number' && isFinite(val) && val > 0;
}

function getFieldValue(fields: Record<string, unknown>, key: string): unknown {
  const entry = fields[key] as { value: unknown } | undefined;
  return entry?.value ?? null;
}

export function validate(output: ExtractionOutput): ExtractionOutput {
  const errors: string[] = [];
  const { document_type: type, fields } = output;

  // Date field validation
  const dateFields: Partial<Record<DocType, string[]>> = {
    receipt: ['date'],
    discharge_summary: ['admission_date', 'discharge_date'],
    lab_report: ['date'],
    prescription: ['date'],
  };
  for (const field of dateFields[type] ?? []) {
    const val = getFieldValue(fields, field);
    if (val !== null && !isValidDate(val)) {
      errors.push(`Invalid date in field '${field}': ${String(val)}`);
    }
  }

  // Discharge: discharge after admission
  if (type === 'discharge_summary') {
    const adm = getFieldValue(fields, 'admission_date');
    const dis = getFieldValue(fields, 'discharge_date');
    if (isValidDate(adm) && isValidDate(dis)) {
      if (new Date(dis as string) < new Date(adm as string)) {
        errors.push(`discharge_date (${dis}) is before admission_date (${adm})`);
      }
    }
  }

  // Receipt: amounts positive + line item sum check
  if (type === 'receipt') {
    const grandTotal = getFieldValue(fields, 'grand_total');
    if (grandTotal !== null && !isPositiveNumber(grandTotal)) {
      errors.push(`grand_total must be a positive number, got: ${grandTotal}`);
    }
    const itemsField = fields['items'] as { value: Array<{ total: unknown }> | null } | undefined;
    const items = itemsField?.value;
    if (items && typeof grandTotal === 'number' && grandTotal > 0) {
      const sum = items.reduce((acc, it) => acc + (typeof it.total === 'number' ? it.total : 0), 0);
      const diff = Math.abs(sum - grandTotal);
      if (diff > grandTotal * 0.05) {
        errors.push(`Line item sum (${sum}) differs from grand_total (${grandTotal}) by ${(diff / grandTotal * 100).toFixed(1)}% (>5%)`);
      }
    }
  }

  return { ...output, validation_errors: errors };
}
