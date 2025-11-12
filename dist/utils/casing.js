import { formatToKstIsoString } from "./date.js";
const snakeToCamel = value => value.replace(/([-_][a-z0-9])/gi, group => group.toUpperCase().replace('-', '').replace('_', ''));
const isPlainObject = value => Object.prototype.toString.call(value) === '[object Object]';
const convertValue = value => {
  if (Array.isArray(value)) {
    return value.map(item => convertValue(item));
  }
  if (value instanceof Date) {
    return formatToKstIsoString(value);
  }
  if (isPlainObject(value)) {
    return Object.entries(value).reduce((acc, [key, nestedValue]) => {
      const convertedKey = snakeToCamel(key);
      acc[convertedKey] = convertValue(nestedValue);
      return acc;
    }, {});
  }
  return value;
};
export const toCamelCase = input => convertValue(input);