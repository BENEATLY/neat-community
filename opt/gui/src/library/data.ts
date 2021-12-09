//  Author:     Thomas D'haenens
//  License:    GPL-3.0
//  Link:       https://github.com/BENEATLY/neat-start-orig/
//  Contact:    https://neatly.be/


// Imports: Default
import { HttpHeaders } from '@angular/common/http';

// Imports: Libraries
import * as valLib from '@library/validate';
import * as objLib from '@library/object';
import * as filterLib from '@library/filter';
import * as sortLib from '@library/sort';
import * as definitionsLib from '@library/definitions';

// Imports: Tools
import * as cloneDeep from 'lodash/cloneDeep';


// Get Page Info
export function getPageInfo(config, userData, name, apiObject, columns, pageInfo, resultInfo, accessLevel, sortingArray, filterArray, filterState, displayOptions, modFunc, translate, timezone, snackBarService, cookieService, httpModule) {

  // Define API Authentication
  let token = cookieService.get('token');
  let headers: HttpHeaders = new HttpHeaders({"Authorization": "Token " + token});

  // Definitions Level
  let definitionsLevel = 'own';
  if (objLib.lookUpKey(displayOptions, name) && objLib.lookUpKey(displayOptions[name], 'level')) { definitionsLevel = displayOptions[name]['level']; }
  else { definitionsLevel = definitionsLib.lookUpDefinitions(config, userData.right, 'Get', apiObject); }

  // Select Sorting Attribute
  if ((config['definitions']['Object'][apiObject]['properties'][definitionsLevel]) && (config['definitions']['Object'][apiObject]['properties'][definitionsLevel].length) && (objLib.lookUpKey(sortingArray, name)) && (sortingArray[name].attr == null)) {
    sortingArray[name] = sortLib.determinePreferredSortProperty(config['definitions']['Object'][apiObject]['properties'][definitionsLevel]);
  }

  // Perform Get List API Call
  httpModule.get(`${config['apiRootUrl']}` + apiObject.toLowerCase() + `/list&page=${pageInfo[name].page}&perPage=${pageInfo[name].perPage}` + ((objLib.lookUpKey(displayOptions, name) && objLib.lookUpKey(displayOptions[name], 'level'))?('&level=' + displayOptions[name]['level']):(((accessLevel != null) && (objLib.lookUpKey(accessLevel, 'selected')) && accessLevel['selected'])?('&level=' + accessLevel['selected']):'')) + sortLib.generateAPISortParams(config, name, apiObject, definitionsLevel, sortingArray) + ((filterLib.filterAllowed(filterArray[name]) && (filterLib.constructAPIFilter(filterArray[name], timezone).length > 0))?'&filter=' + filterLib.constructAPIFilter(filterArray[name], timezone):'') + ((objLib.lookUpKey(displayOptions, name) && objLib.lookUpKey(displayOptions[name], 'extendQuery'))?('&' + displayOptions[name]['extendQuery']):''), { headers }).subscribe(

    // Success
    (res: any[]) => {

      // Store Columns
      let origColumns = cloneDeep(columns[name]);

      // Reset Columns
      columns[name] = {};

      // Update Columns
      for (let property of config['definitions']['Object'][apiObject]['properties'][definitionsLevel]) {
        if (objLib.lookUpKey(displayOptions, name) && objLib.lookUpKey(displayOptions[name], 'hiddenColumns')) {
          if (!displayOptions[name]['hiddenColumns'].includes(property.property)) {
            if (valLib.isVisible(property)) {
              if ((objLib.getKeys(origColumns).length > 0) && objLib.lookUpKey(origColumns, property.property)) { columns[name][property.property] = origColumns[property.property]; }
              else { columns[name][property.property] = valLib.isDisplayColumn(property); }
            }
          }
        }
        else {
          if (valLib.isVisible(property)) {
            if ((objLib.getKeys(origColumns).length > 0) && objLib.lookUpKey(origColumns, property.property)) { columns[name][property.property] = origColumns[property.property]; }
            else { columns[name][property.property] = valLib.isDisplayColumn(property); }
          }
        }
      }

      // Modifying Function (Per Element)
      let modRes = res['content'];

      if (modFunc && (modFunc.length > 0)) {
        for (let item of modRes) { modFunc[0](translate, item); }
      }

      // Store Info
      resultInfo[name] = modRes;
      pageInfo[name].maxPage = res['maxPage'];
      pageInfo[name].total = res['total'];
      pageInfo[name].exist = res['exist'];

      // Set Filter State
      if (filterState) {
        filterState['applied'] = true;
        filterState['lastFilter'] = cloneDeep(filterArray);
      }

      // Modifying Function (Total)
      if (modFunc && (modFunc.length > 1)) { modFunc[1](columns, modRes); }

    },

    // Fail
    err => {

      // Error Occurred
      snackBarService.httpErrorOccurred(err);

    }

  );

}

// Retrieve Object Id (By Filter)
export async function retrieveObjectIdByFilter(config, apiObject, filterArray, timezone, snackBarService, cookieService, httpModule) {

  // Define API Authentication
  let token = cookieService.get('token');
  let headers: HttpHeaders = new HttpHeaders({"Authorization": "Token " + token});

  // Perform Get List API Call
  return await httpModule.get(`${config['apiRootUrl']}` + apiObject.toLowerCase() + `/list` + ((filterLib.filterAllowed(filterArray) && (filterLib.constructAPIFilter(filterArray, timezone).length > 0))?'&filter=' + filterLib.constructAPIFilter(filterArray, timezone):''), { headers }).toPromise().then(

    // Success
    res => {

      // Single Result
      if (res.length == 1) { return res[0]['id']; }

      // Not a Single Result
      else {
        console.warn('Unable to retrieve object id (by filter)');
        return null;
      }

    },

    // Fail
    err => {

      // Error Occurred
      snackBarService.httpErrorOccurred(err);
      return null;

    }

  );

}

// Retrieve Object (By Id)
export async function retrieveObjectById(config, apiObject, id, snackBarService, cookieService, httpModule) {

  // Define API Authentication
  let token = cookieService.get('token');
  let headers: HttpHeaders = new HttpHeaders({"Authorization": "Token " + token});

  // Perform Get List API Call
  return await httpModule.get(`${config['apiRootUrl']}` + apiObject.toLowerCase() + `/id/` + id.toString(), { headers }).toPromise().then(

    // Success
    res => { return res; },

    // Fail
    err => {

      // Error Occurred
      snackBarService.httpErrorOccurred(err);
      return null;

    }

  );

}

// Retrieve Object (By Attribute)
export async function retrieveObjectByAttr(config, apiObject, attr, val, snackBarService, cookieService, httpModule) {

  // Define API Authentication
  let token = cookieService.get('token');
  let headers: HttpHeaders = new HttpHeaders({"Authorization": "Token " + token});

  // Perform Get List API Call
  return await httpModule.get(`${config['apiRootUrl']}` + apiObject.toLowerCase() + `/list` + '&filter=(' + attr + '=' + (valLib.isString(val)?('"' + val + '"'):val.toString()) + ')', { headers }).toPromise().then(

    // Success
    res => {

      // Single Result
      if (res.length == 1) { return res[0]; }

      // Not a Single Result
      else {
        console.warn('Unable to retrieve object (by attribute)');
        return null;
      }

    },

    // Fail
    err => {

      // Error Occurred
      snackBarService.httpErrorOccurred(err);
      return null;

    }

  );

}

// Generate Default Sorting Array
export function defaultSortingArray(name='model') {
  let returnDict = {};
  returnDict[name] = {'attr': null, 'order': true};
  return returnDict;
}

// Generate Default Filter Array
export function defaultFilterState() { return {'applied': true, 'lastFilter': null}; }

// Generate Default Page Info
export function defaultPageInfo(name, pageNr) {
  let returnDict = {};
  returnDict[name] = {'page': 1, 'perPage': pageNr, 'maxPage': 1, 'total': null, 'exist': null};
  return returnDict;
}

// Generate Default Columns
export function defaultColumns(name) {
  let returnDict = {};
  returnDict[name] = {};
  return returnDict;
}

// Generate Default Filter Array
export function defaultFilterArray(name, objectDefinition) {
  let returnDict = {};
  returnDict[name] = [{'property': [null], 'comparator': null, 'ref': null, 'object': [objectDefinition], 'lastProperty': null}];
  return returnDict;
}

// Get Private Plugin Values
export async function getPrivatePluginValues(config, plugin, snackBarService, cookieService, httpModule) {

  // Define API Authentication
  let token = cookieService.get('token');
  let headers: HttpHeaders = new HttpHeaders({"Authorization": "Token " + token});

  // Perform Get List API Call
  return await httpModule.get(`${config['apiRootUrl']}` + `plugin/` + plugin['id'].toString() + `/options`, { headers }).toPromise().then(

    // Success
    res => { return res; },

    // Fail
    err => {

      // Error Occurred
      snackBarService.httpErrorOccurred(err);
      return null;

    }

  );

}

// Set Private Plugin
export async function setPrivatePluginValues(config, plugin, optionsData, snackBarModule, cookieService, httpModule) {

  // Define API Authentication
  let token = cookieService.get('token');
  let headers: HttpHeaders = new HttpHeaders({"Authorization": "Token " + token});

  // Perform Post API Call
  await httpModule.post(`${config['apiRootUrl']}` + `plugin/` + plugin['id'].toString() + `/options`, optionsData, { headers }).toPromise().then(
    res => {},
    err => { snackBarModule.httpErrorOccurred(err); }
  );

}
