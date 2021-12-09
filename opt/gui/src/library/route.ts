//  Author:     Thomas D'haenens
//  License:    GPL-3.0
//  Link:       https://github.com/BENEATLY/neat-start-orig/
//  Contact:    https://neatly.be/


// Imports: Routes
import config from "@assets/routes/routes.json";

// Imports: Libraries
import * as objLib from '@library/object';
import * as valLib from '@library/validate';
import * as definitionsLib from '@library/definitions';
import * as presentLib from '@library/presentation';


// Get Route Parameters
export function getRouteParameters(params) {
  let parsedParams = [];
  for (var i=config.options.maxSubNav; i>0; i--) {
    if (objLib.lookUpKey(params, 'item' + i.toString())) {
      let paramToAdd = {};
      if (objLib.lookUpKey(config.linked, params['item' + i.toString()])) { paramToAdd[config.linked[params['item' + i.toString()]]] = params['id' + i.toString()]; }
      else { paramToAdd[params['item' + i.toString()]] = params['id' + i.toString()]; }
      parsedParams.push(paramToAdd);
    }
  }
  if (objLib.lookUpKey(params, 'id0')) { parsedParams.push({'id': params['id0']}); }
  return parsedParams;
}

// Shift Parameters
export function shiftParameters(params, item) {
  let shiftedParams = [];
  for (let param of params) {
    if (objLib.getKeys(param)[0] == 'id') {
      let tempDict = {};
      tempDict[item] = param['id'];
      shiftedParams.push(tempDict);
    }
    else {
      let tempDict = {};
      tempDict[objLib.getKeys(param)[0]] = param[objLib.getKeys(param)[0]];
      shiftedParams.push(tempDict);
    }
  }
  return shiftedParams;
}

// Has Parent
export function hasParent(config, right, action, objectDefinition, params) { return (((params.length != 0) && ((params.length > 1) || (!params.some(x => objLib.lookUpKey(x, 'id'))))) && parentValidityCheck(config, right, action, objectDefinition, params)); }

// Get Parent Object Name
export function getParentObjectName(params) {
  let filteredParams = params.filter(x => (!objLib.lookUpKey(x, 'id')));
  if (filteredParams.length > 0) { return objLib.getKeys(filteredParams[filteredParams.length-1])[0]; }
  else { return null; }
}

// Get Parent Id
export function getParentId(params) {
  let filteredParams = params.filter(x => (!objLib.lookUpKey(x, 'id')));
  if (filteredParams.length > 0) { return filteredParams[filteredParams.length-1][objLib.getKeys(filteredParams[filteredParams.length-1])[0]]; }
  else { return null; }
}

// Add Passed Parameters Filtering
export function addPassedParameterFiltering(config, right, action, objectDefinition, params, filterArray, name) {

  // Has Id
  if (params.some(x => objLib.lookUpKey(x, 'id'))) {
    filterArray[name] = [].concat([
      {
        'property': ['id'],
        'comparator': '=',
        'ref': parseInt(params.filter(x => (objLib.lookUpKey(x, 'id')))[0]['id']),
        'object': [objectDefinition],
        'lastProperty': {
          'accepted': {
            'min': 0,
            'nullable': false,
            'step': 1,
            'type': 'Number'
          },
          'property': 'id',
          'value': 0
        },
        'fixed': true
      }
    ],
    filterArray[name]);
  }

  // Has Parent
  if (hasParent(config, right, action, objectDefinition, params)) {
    filterArray[name] = [].concat([
      {
        'property': [getParentObjectName(params), 'id'],
        'comparator': '=',
        'ref': parseInt(getParentId(params)),
        'object': [objectDefinition, definitionsLib.getObjectName(config, getParentObjectName(params))],
        'lastProperty': {
          'accepted': {
            'min': 0,
            'nullable': false,
            'step': 1,
            'type': 'Number'
          },
          'property': 'id',
          'value': 0
        },
        'fixed': true
      }
    ],
    filterArray[name]);
  }

}

// Parent Validity Check
export function parentValidityCheck(config, right, action, objectDefinition, params) {
  let usedParams = params;
  let defs = definitionsLib.getDefinitionsForPage(config, right, null, objectDefinition, action, null, null);
  for (var i=(params.length-1); i>=0; i--) {
    if (objLib.getKeys(params[i])[0] != 'id') {
      let filterDefs = defs.filter(x => (x.property == objLib.getKeys(params[i])[0]));
      if (filterDefs.length == 1) {
        let ref = valLib.hasReference(filterDefs[0]);
        if (ref) { defs = definitionsLib.getDefinitionsForPage(config, right, null, ref, action, null, null); }
        else { return false; }
      }
      else { return false; }
    }
  }
  return true;
}

// Navigate to Route Without parent
export function navNoParent(router, route, params) {

  // Has ID
  if (params.some(x => objLib.lookUpKey(x, 'id'))) { router.navigate([route.snapshot.url[route.snapshot.url.length-2].path, route.snapshot.url[route.snapshot.url.length-1].path]); }

  // Has No Id
  else { router.navigate([route.snapshot.url[route.snapshot.url.length-1].path]); }

}

// Navigate
export function navigate(router, path) { router.navigate(path.split('/')); }

// Navigate Collapse
export function navigateCollapse(router, path, width) {

  // Check if Navbar Collapsed
  if (width < 992) { presentLib.toggleNavBarCollapse(); }

  // Navigate
  navigate(router, path);

}
