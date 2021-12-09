//  Author:     Thomas D'haenens
//  License:    GPL-3.0
//  Link:       https://github.com/BENEATLY/neat-start-orig/
//  Contact:    https://neatly.be/


// Imports: Libraries
import * as valLib from '@library/validate';


// Get Seperator Information for Locale
export function getSeparator(locale, separatorType) {
  const numberWithGroupAndDecimalSeparator = 1000.1;
  return Intl.NumberFormat(locale)['formatToParts'](numberWithGroupAndDecimalSeparator).find(part => part.type === separatorType).value;
}

// Format Number for Locale
export function formatNumber(val, locale, options={}) { return val.toLocaleString(locale, options); }

// Count Decimals
export function countDecimals(value) {
  if (Math.floor(value) === value) return 0;
  return value.toString().split(".")[1].length || 0;
}

// Number Locale Formatting Options
export function numberLocaleFormattingOptions(property, value=null) {
  if (valLib.hasAccuracy(property)) { return {'minimumFractionDigits': property.accepted.accuracy}; }
  else if (valLib.isNumber(value)) { return {'minimumFractionDigits': countDecimals(value)}; }
  else { return {}; }
}
