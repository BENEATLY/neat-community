//  Author:     Thomas D'haenens
//  License:    GPL-3.0
//  Link:       https://github.com/BENEATLY/neat-community/
//  Contact:    https://neatly.be/


// Remove Special Characters
export function removeSpecialChars(input) {
  return input.replace(/[^a-zA-Z0-9]/g, '');
}

// Split By Comma
export function splitByComma(str) { return str.split(','); }

// Convert String To JSON
export function convertStringToJSON(val) { return JSON.parse(val); }

// Convert JSON To String
export function convertJSONToString(val) { return JSON.stringify(val); }

// Convert to Title Case
export function toTitleCase(str) {
  return str.replace(/\w\S*/g, function(txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); } );
}
