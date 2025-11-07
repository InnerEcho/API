import { formatToKstIsoString } from '@/utils/date.js';

const snakeToCamel = (value: string): string =>
  value.replace(/([-_][a-z0-9])/gi, group =>
    group.toUpperCase().replace('-', '').replace('_', ''),
  );

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Object.prototype.toString.call(value) === '[object Object]';

const convertValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(item => convertValue(item));
  }

  if (value instanceof Date) {
    return formatToKstIsoString(value);
  }

  if (isPlainObject(value)) {
    return Object.entries(value).reduce<Record<string, unknown>>(
      (acc, [key, nestedValue]) => {
        const convertedKey = snakeToCamel(key);
        acc[convertedKey] = convertValue(nestedValue);
        return acc;
      },
      {},
    );
  }

  return value;
};

export const toCamelCase = <T>(input: T): T => convertValue(input) as T;
