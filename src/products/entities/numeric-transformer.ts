import { ValueTransformer } from 'typeorm';

/** Maps DB decimal strings to numbers for API responses. */
export const decimalNumberTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) =>
    value == null || value === '' ? null : Number(value),
};
