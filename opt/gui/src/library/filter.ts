//  Author:     Thomas D'haenens
//  License:    GPL-3.0
//  Link:       https://github.com/BENEATLY/neat-start-orig/
//  Contact:    https://neatly.be/


// Imports: Libraries
import * as valLib from '@library/validate';
import * as timeLib from '@library/time';
import * as definitionsLib from '@library/definitions';


// Declarations: JQuery
declare var $: any;


// Select Filter
export function selectFilter(filterLine, config, i) {
  if (filterLine.property[i] != "null") {
    let properties = config['definitions']['Object'][filterLine.object[i]]['properties']['all'];
    let newProperty = properties.filter(obj => (obj.property == filterLine.property[i]))[0];
    filterLine.lastProperty = newProperty;
    filterLine.property = filterLine.property.splice(0, i+1);
    filterLine.object = filterLine.object.splice(0, i+1);
    filterLine.comparator = null;
    filterLine.ref = null;
    if (valLib.hasReference(newProperty)) {
      filterLine.property.push(null);
      filterLine.object.push(valLib.hasReference(newProperty));
    }
  }
  else {
    filterLine.property = filterLine.property.splice(0, i);
    filterLine.property.push(null);
    filterLine.object = filterLine.object.splice(0, i+1);
    filterLine.comparator = null;
    filterLine.ref = null;
    if (filterLine.property.length > 1) {
      let properties = config['definitions']['Object'][filterLine.object[i-1]]['properties']['all'];
      filterLine.lastProperty = properties.filter(obj => (obj.property == filterLine.property[i-1]))[0];
    }
    else { filterLine.lastProperty = null; }
  }
}

// Filterable Properties
export function filterableProperties(properties) {
  return properties.filter(prop => ((!valLib.isCensored(prop)) && valLib.isFilterable(prop) && valLib.isVisible(prop)));
}

// Determine Comparators
export function determineComparators(filterLine) {
  let comparators = [];
  if (valLib.isNullable(filterLine.lastProperty)) {
    comparators.push({'comparator': '=null', 'valRequired': false});
    comparators.push({'comparator': '!=null', 'valRequired': false});
  }
  if (valLib.isDefinedString(filterLine.lastProperty)) {
    comparators.push({'comparator': '=', 'valRequired': true});
    comparators.push({'comparator': '!=', 'valRequired': true});
    comparators.push({'comparator': '~=', 'valRequired': true});
    comparators.push({'comparator': '!~=', 'valRequired': true});
  }
  else if (valLib.isDefinedNumber(filterLine.lastProperty)) {
    comparators.push({'comparator': '=', 'valRequired': true});
    comparators.push({'comparator': '!=', 'valRequired': true});
    comparators.push({'comparator': '>', 'valRequired': true});
    comparators.push({'comparator': '>=', 'valRequired': true});
    comparators.push({'comparator': '<', 'valRequired': true});
    comparators.push({'comparator': '<=', 'valRequired': true});
  }
  else if (valLib.isDefinedBoolean(filterLine.lastProperty)) {
    comparators.push({'comparator': '=true', 'valRequired': false});
    comparators.push({'comparator': '=false', 'valRequired': false});
  }
  else if (valLib.isDefinedTime(filterLine.lastProperty)) {
    comparators.push({'comparator': '=', 'valRequired': true});
    comparators.push({'comparator': '!=', 'valRequired': true});
    comparators.push({'comparator': '>', 'valRequired': true});
    comparators.push({'comparator': '<', 'valRequired': true});
  }
  else if (valLib.isDefinedDate(filterLine.lastProperty)) {
    comparators.push({'comparator': '=', 'valRequired': true});
    comparators.push({'comparator': '!=', 'valRequired': true});
    comparators.push({'comparator': '>', 'valRequired': true});
    comparators.push({'comparator': '<', 'valRequired': true});
  }
  else if (valLib.isDefinedDateTime(filterLine.lastProperty)) {
    comparators.push({'comparator': '=', 'valRequired': true});
    comparators.push({'comparator': '!=', 'valRequired': true});
    comparators.push({'comparator': '>', 'valRequired': true});
    comparators.push({'comparator': '<', 'valRequired': true});
  }
  return comparators;
}

// Selected Comparator
export function onComparatorSelect(filterArray, filterLine, index, timezone, translation, filterName) {
  let comparator = determineComparators(filterLine).filter(comp => (comp.comparator == filterLine.comparator))[0];
  if (comparator && comparator.valRequired) {
    if (filterLine.ref == null) {
      if (valLib.isDefinedString(filterLine.lastProperty)) { filterLine.ref = ''; }
      else if (valLib.isDefinedNumber(filterLine.lastProperty)) { filterLine.ref = 0; }
      else if (valLib.isDefinedTime(filterLine.lastProperty)) { filterLine.ref = timeLib.convertTimeDependentToString(timeLib.getNow().toISOString().split('Z')[0].split('T')[1], filterLine.lastProperty, timezone); }
      else if (valLib.isDefinedDateTime(filterLine.lastProperty)) { filterLine.ref = timeLib.convertTimeDependentToString(timeLib.getNow().toISOString().split('Z')[0], filterLine.lastProperty, timezone); }
      else if (valLib.isDefinedDate(filterLine.lastProperty)) { filterLine.ref = timeLib.convertTimeDependentToString(timeLib.getNow().toISOString().split('Z')[0].split('T')[0], filterLine.lastProperty, timezone); }
    }
    if (valLib.isTimeDependent(filterLine.lastProperty)) {
      setTimeout(() => {
        $('#filter-' + (filterName?(filterName + '-'):'') + (index+1).toString() + '-datetimepicker').datetimepicker(timeLib.dateTimePickerSettings(null, timeLib.getNow(), filterLine.lastProperty, timezone, translation));
        $('#filter-' + (filterName?(filterName + '-'):'') + (index+1).toString() + '-datetimepicker').on('dp.change', function() { filterLine.ref = $('#filter-' + (filterName?(filterName + '-'):'') + (index+1).toString() + '-input').val(); });
      }, 500);
    }
  }
  else { filterLine.ref = null; }
  if (filterArray.length == (index+1)) {
    filterArray.push({'property': [null], 'comparator': null, 'ref': null, 'object': [filterArray[0]['object'][0]], 'lastProperty': null, 'fixed': false});
  }
}

// Delete Filter
export function deleteFilter(filterArray, line) {
  filterArray.splice(line, 1);
}

// Clear Filter
export function clearFilter(filterArray, line) {
  filterArray[line] = {'property': [null], 'comparator': null, 'ref': null, 'object': [filterArray[0]['object'][0]], 'lastProperty': null, 'fixed': false};
}

// Has Comparator
export function hasComparator(filterLine) {
  return (filterLine.comparator != null);
}

// Single Filter Allowed
export function singleFilterAllowed(filterLine, i, count) {
  if (filterLine.property[0] == null) { return ((i+1 == count)?true:false); }
  else { return hasComparator(filterLine); }
}

// Filter Allowed
export function filterAllowed(filterArray) {
  if (filterArray.length > 1) {
    let filtersToCheck = filterArray.slice(0, -1);
    return filtersToCheck.every(hasComparator);
  }
  else if (filterArray[0].property[0] == null) { return true; }
  else { return false; }
}

// Current Applied Filter Check
export function isCurrentAppliedFilter(filterState, filterArray) {
  if (filterState) { return (filterState['applied'] && valLib.isSameObject(filterState['lastFilter'], filterArray)); }
  else { return false; }
}

// Construct API Filter
export function constructAPIFilter(filterArray, timezone) {
  let filtersToCheck = filterArray.slice(0, -1);
  let filterString = '';
  for (let filterLine of filtersToCheck) {
    filterString = filterString  + ((filterString.length > 0)?'&':'') + '(' + filterLine.property.filter(val => (val != null)).join('.') + filterLine.comparator + ((filterLine.ref != null)?(valLib.isString(filterLine.ref)?(valLib.isTimeDependent(filterLine.lastProperty)?("'" + timeLib.convertToISOUTCFormat(filterLine.ref, filterLine.lastProperty, timezone) + "'"):("'" + filterLine.ref + "'")):filterLine.ref.toString()):'') + ')';
  }
  return filterString;
}

// Determine Last Property
export function determineLastProperty(config, userData, object, property) { return config['definitions']['Object'][object[object.length - 1]]['properties'][definitionsLib.lookUpDefinitions(config, userData.right, 'Get', object[object.length - 1])].filter(definition => (definition.property == property[property.length - 1]))[0]; }
