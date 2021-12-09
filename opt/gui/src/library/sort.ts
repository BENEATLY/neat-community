//  Author:     Thomas D'haenens
//  License:    GPL-3.0
//  Link:       https://github.com/BENEATLY/neat-community/
//  Contact:    https://neatly.be/


// Imports: Libraries
import * as valLib from '@library/validate';
import * as objLib from '@library/object';


// Sort by Attribute
export function sortByAttribute(val, ref) {

  // Is Array?
  if (!Array.isArray(val)) { return null; }

  // Sort
  return val.sort(function(a,b) {
    if (a[ref] === Object(a[ref])) {
      if(a[ref]['name'] < b[ref]['name']) { return -1; }
      if(a[ref]['name'] > b[ref]['name']) { return 1; }
      return 0;
    }
    else {
      if(a[ref] < b[ref]) { return -1; }
      if(a[ref] > b[ref]) { return 1; }
      return 0;
    }
  });

}

// Sort By
export function sortBy(val, ref, order) {

  // No or Empty Value
  if (val == null) { return []; }
  if (val.length == 0) { return []; }

  // No Reference
  if (ref == null) { return val; }

  // Sort By Attribute Order
  if (order) { return sortByAttribute(val, ref); }
  else { return sortByAttribute(val, ref).reverse(); }

}

// Sorting Job
export function sortJob(sortingArray, val, ref) {

  // Change Attribute to Sort on
  if (sortingArray[val].attr != ref) {
    sortingArray[val].attr = ref;
    sortingArray[val].order = true;
  }

  // Switch Order to Sort on
  else { sortingArray[val].order = !sortingArray[val].order; }

}

// Visually Order Properties
export function visuallyOrderProperties(properties) {

  // Variables
  let orderedProperties = [];
  let observed = {'input': 0, 'list': 0, 'textArea': 0, 'checkBox': 0, 'optional': 0};
  let order = [];
  let used = [];

  // Determine Types
  for (let property of properties) {
    if (!valLib.isOptional(property)) {
      if ((valLib.isDefinedString(property) && valLib.hasMaxConstraint(property) && (property.accepted.max <= 99)) || valLib.isDefinedNumber(property) || valLib.isDefinedId(property) || valLib.isDefinedFile(property) || valLib.isTimeDependent(property)) { observed['input'] += 1; }
      else if (valLib.isDefinedList(property)) { observed['list'] += 1; }
      else if (valLib.isDefinedString(property) && ((!valLib.hasMaxConstraint(property)) || (property.accepted.max > 99))) { observed['textArea'] += 1; }
      else if (valLib.isDefinedBoolean(property)) { observed['checkBox'] += 1; }
    }
    else { observed['optional'] += 1; }
  }

  // Sort Types in Order
  if (observed['input'] % 2 == 0) {
    if (observed['textArea'] % 2 == 0) {
      order.push(...Array.from({length: observed['input']}, (v, k) => 'input'));
      order.push(...Array.from({length: observed['textArea']}, (v, k) => 'textArea'));
    }
    else if (observed['input'] > 0) {
      order.push(...Array.from({length: observed['input']-2}, (v, k) => 'input'));
      order.push(...Array.from({length: observed['textArea']}, (v, k) => 'textArea'));
      order.push(...Array.from({length: 2}, (v, k) => 'input'));
    }
    else { order.push(...Array.from({length: observed['textArea']}, (v, k) => 'textArea')); }
  }
  else if (observed['textArea'] % 2 == 0) {
    order.push(...Array.from({length: observed['input']-1}, (v, k) => 'input'));
    order.push(...Array.from({length: observed['textArea']}, (v, k) => 'textArea'));
    order.push('input');
  }
  else {
    order.push(...Array.from({length: observed['input']-1}, (v, k) => 'input'));
    order.push(...Array.from({length: observed['textArea']-1}, (v, k) => 'textArea'));
    order.push('textArea');
    order.push('input');
  }
  order.push(...Array.from({length: observed['list']}, (v, k) => 'list'));
  order.push(...Array.from({length: observed['checkBox']}, (v, k) => 'checkBox'));
  order.push(...Array.from({length: observed['optional']}, (v, k) => 'optional'));

  // Assign Property to Type
  for (let pos of order) {

    // Stop Looking when Found
    let found = false;

    // Iterate over Property and find Matching Type
    for (let property of properties) {

      // New Property
      if ((!used.includes(property.property)) && (!found)) {

        // Not Optional
        if (!valLib.isOptional(property)) {

          // Regular Input
          if (((valLib.isDefinedString(property) && valLib.hasMaxConstraint(property) && (property.accepted.max <= 99)) || valLib.isDefinedNumber(property) || valLib.isDefinedId(property)  || valLib.isDefinedFile(property) || valLib.isTimeDependent(property)) && (pos == 'input')) {
            orderedProperties.push(property);
            used.push(property.property);
            found = true;
          }

          // List
          else if (valLib.isDefinedList(property) && (pos == 'list')) {
            orderedProperties.push(property);
            used.push(property.property);
            found = true;
          }

          // Text Area
          else if ((valLib.isDefinedString(property) && ((!valLib.hasMaxConstraint(property)) || (property.accepted.max > 99))) && (pos == 'textArea')) {
            orderedProperties.push(property);
            used.push(property.property);
            found = true;
          }

          // Boolean
          else if (valLib.isDefinedBoolean(property) && (pos == 'checkBox') && (properties.filter(prop => prop.accepted.type == 'Boolean').filter(prop => !used.includes(prop.property)).sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0))[0].property == property.property)) {
            orderedProperties.push(property);
            used.push(property.property);
            found = true;
          }

        }

        // Is Optional
        else if (pos == 'optional') {

          orderedProperties.push(property);
          used.push(property.property);
          found = true;

        }

      }

    }

  }

  // Return Visually Ordered Properties
  return orderedProperties;

}

// Determine Preferred Sort Property
export function determinePreferredSortProperty(properties) {

  // Define Variables
  let preferredSort = {'priority': null, 'sortingArray': null};

  // Determine Preferred Property
  for (let property of properties) {

    // Priority Defined
    if (objLib.lookUpKey(property, 'sort')) {

      // Priority Higher
      if ((!preferredSort['priority']) || (objLib.lookUpKey(property.sort, 'priority') && (property.sort.priority > preferredSort['priority']))) {

        // Set Preferred Sort Option
        preferredSort['priority'] = property.sort.priority;
        preferredSort['sortingArray'] = {'attr': property.property, 'order': (objLib.lookUpKey(property.sort, 'order')?property.sort.order:true)};

      }

    }

  }

  // No Preferred One
  if (!preferredSort['priority']) { preferredSort['sortingArray'] = {'attr': properties[0].property, 'order': true}; }

  // Return Result
  return preferredSort['sortingArray'];

}

// Generate API Sort Parameters
export function generateAPISortParams(config, name, apiObject, definitionsLevel, sortingArray) {

  // Need to Sort
  if (sortingArray[name].attr) {

    // Find Sorting Property
    let property = config['definitions']['Object'][apiObject]['properties'][definitionsLevel].filter(x => (x.property == sortingArray[name].attr));

    // Check for Sorting
    if (property && valLib.hasSorting(property[0])) {

      let sorting = valLib.hasSorting(property[0]);
      return `&sort=${sorting.attr}&order=${((sortingArray[name].order?sorting.order:(!sorting.order))?'asc':'desc')}`;

    }
    else { return `&sort=${sortingArray[name].attr}&order=${(sortingArray[name].order?'asc':'desc')}`; }

  }

  // No Need to Sort
  else { return ''; }

}
