/**
 * Custom type guard that checks whether a value is not empty (null/undefined).
 * This can be used with an array filter to turn an array with nullable elements into
 * non-nullable ones.
 *
 * @param value The value to validate.
 */
export const notEmpty = <T>(value: T | undefined): value is T => {
  return value !== null && value !== undefined;
};

/** Type guard checking whether a value is defined and of type string. */
export function isString(v: unknown): v is string {
  return v !== undefined && typeof v === 'string';
}

/** Type guard checking whether a value is EITHER undefined or of type string. */
export function isOptString(v: unknown): v is string | undefined {
  return v === undefined || typeof v === 'string';
}

/** Type guard checking whether a value is defined and of type number. */
export function isNumber(v: unknown): v is number {
  return v !== undefined && typeof v === 'number';
}

/** Type guard checking whether a value is EITHER undefined or of type number. */
export function isOptNumber(v: unknown): v is number | undefined {
  return v === undefined || typeof v === 'number';
}

/** Type guard checking whether a value is defined, an array and all values are of type T. */
export function isArray<T>(
  v: unknown,
  valueGuard: (av: unknown) => av is T
): v is T[] {
  return v !== undefined && v instanceof Array && v.every(valueGuard);
}

/**
 * Type guard checking whether a value is EITHER defined or an array and all values are of type T.
 */
export function isOptArray<T>(
  v: unknown,
  valueGuard: (vg: unknown) => vg is T
): v is T[] | undefined {
  return v === undefined || (v instanceof Array && v.every(valueGuard));
}

/** Type guard checking whether a value is defined and an object/Record. */
export function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== undefined && typeof v === 'object';
}

/** Type guard checking whether a value is EITHER undefined or an object/Record. */
export function isOptRecord(v: unknown): v is Record<string, unknown> {
  return v === undefined || typeof v === 'object';
}
