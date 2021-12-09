//  Author:     Thomas D'haenens
//  License:    GPL-3.0
//  Link:       https://github.com/BENEATLY/neat-community/
//  Contact:    https://neatly.be/


// Imports: Tools
import * as math from 'mathjs';


// Look for Key
export function lookUpKey(dict, ref) {
  if (ref in dict) { return true; }
  else { return false; }
}

// Get Keys of Object
export function getKeys(obj) { return Object.keys(obj); }

// Check if Object
export function isObject(obj) { return (obj === Object(obj)); }

// Check if Array
export function isArray(obj) { return (Array.isArray(obj)); }

// Check if Empty Object
export function isEmptyObject(obj) {
  if (isObject(obj)) {
    if (getKeys(obj).length === 0) { return true; }
    else { return false; }
  }
  else { return false; }
}

// Get Sub Property
export function getSubProperty(obj, parameter) {
  let subProperties = parameter.split('.');
  let val = obj;
  for (let subProperty of subProperties) { val = val?.[subProperty]; }
  if (val == undefined) { return null; }
  return val;
}

// Evaluate Statement
export function evaluateStatement(statement, properties, acceptedList) {

  // Number
  if (typeof statement == 'number') { return statement; }

  // Statement with Brackets Found
  if (statement.includes('${')) {

    // Determine # Statements
    let nrOfParameters = statement.split('${').length - 1;

    // Iterate over Statements
    for (var i=0; i<nrOfParameters; i++) {

      // Content of Statement
      let parameter = statement.split('${')[1].split('}')[0];

      // Sub Attribute
      if (!parameter.includes('.')) { statement = statement.replace('${' + parameter + '}', properties.filter(x => x.property == parameter)[0].value); }

      // Direct Attribute
      else { statement = statement.replace('${' + parameter + '}', getSubProperty(acceptedList[parameter.split('.')[0]].filter(x => x.id == properties.filter(x => x.property == parameter.split('.')[0])[0].value)[0], parameter.split(parameter.split('.')[0] + '.')[1])); }

    }
  }

  // Return Result (Math Required)
  if (statement.includes('math(')) { return math.evaluate(statement.split('math(')[1].split(')')[0]); }

  // Return Result
  else { return statement; }

}

// Create Item By Properties
export function createItemByProperties(properties) {
  let item = {};
  for (let property of properties) { item[property.property] = property.value; }
  return item;
}

// Update Existing Dict
export function updateExistingDict(origDict, newDict) {
  for (let key of getKeys(newDict)) { origDict[key] = newDict[key]; }
  return origDict;
}

// Convert for Comparison
export function convertForComparison(value) {
  if (isArray(value)) { return value.map(val => (isObject(val)?val.id:val.toString())); }
  else if (isObject(value)) { return value.id; }
  else { return value.toString(); }
}
