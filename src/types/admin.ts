export interface ValidationMetric {
  label: string;
  value: number;
  kind?: "number" | "percentage" | "currency";
  helperText?: string;
}
