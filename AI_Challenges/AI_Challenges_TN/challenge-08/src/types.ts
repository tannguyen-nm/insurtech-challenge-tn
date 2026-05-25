import { z } from 'zod';

export type DocType = 'receipt' | 'discharge_summary' | 'lab_report' | 'prescription';

export const FieldValueSchema = z.object({
  value: z.union([z.string(), z.number(), z.null()]),
  confidence: z.number().min(0).max(1),
});

export type FieldValue = z.infer<typeof FieldValueSchema>;

// Receipt
export const ReceiptItemSchema = z.object({
  description: z.string(),
  quantity: z.number().nullable(),
  unit_price: z.number().nullable(),
  total: z.number().nullable(),
});

export const ReceiptFieldsSchema = z.object({
  hospital_name: FieldValueSchema,
  patient_name: FieldValueSchema,
  date: FieldValueSchema,
  items: z.object({ value: z.array(ReceiptItemSchema).nullable(), confidence: z.number() }),
  grand_total: FieldValueSchema,
  payment_method: FieldValueSchema,
});

// Discharge Summary
export const DischargeSummaryFieldsSchema = z.object({
  hospital_name: FieldValueSchema,
  patient_name: FieldValueSchema,
  admission_date: FieldValueSchema,
  discharge_date: FieldValueSchema,
  diagnosis_primary: FieldValueSchema,
  diagnosis_secondary: z.object({ value: z.array(z.string()).nullable(), confidence: z.number() }),
  procedures_performed: z.object({ value: z.array(z.string()).nullable(), confidence: z.number() }),
  attending_physician: FieldValueSchema,
  discharge_instructions: FieldValueSchema,
});

// Lab Report
export const LabTestSchema = z.object({
  test_name: z.string(),
  result: z.union([z.string(), z.number()]).nullable(),
  unit: z.string().nullable(),
  reference_range: z.string().nullable(),
  flag: z.enum(['normal', 'high', 'low']).nullable(),
});

export const LabReportFieldsSchema = z.object({
  lab_name: FieldValueSchema,
  patient_name: FieldValueSchema,
  date: FieldValueSchema,
  tests: z.object({ value: z.array(LabTestSchema).nullable(), confidence: z.number() }),
});

// Prescription
export const MedicationSchema = z.object({
  name: z.string(),
  dosage: z.string().nullable(),
  frequency: z.string().nullable(),
  duration: z.string().nullable(),
  quantity: z.union([z.string(), z.number()]).nullable(),
});

export const PrescriptionFieldsSchema = z.object({
  doctor_name: FieldValueSchema,
  patient_name: FieldValueSchema,
  date: FieldValueSchema,
  medications: z.object({ value: z.array(MedicationSchema).nullable(), confidence: z.number() }),
});

export const ClassificationResultSchema = z.object({
  document_type: z.enum(['receipt', 'discharge_summary', 'lab_report', 'prescription']),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});

export type ClassificationResult = z.infer<typeof ClassificationResultSchema>;

export interface ExtractionOutput {
  document_type: DocType;
  confidence: number;
  fields: Record<string, unknown>;
  validation_errors: string[];
}
