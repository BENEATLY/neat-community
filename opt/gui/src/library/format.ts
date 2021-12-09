//  Author:     Thomas D'haenens
//  License:    GPL-3.0
//  Link:       https://github.com/BENEATLY/neat-community/
//  Contact:    https://neatly.be/


// Imports: Libraries
import * as valLib from '@library/validate';
import * as objLib from '@library/object';
import * as pluginLib from '@library/plugin';

// Imports: Tools
import * as cloneDeep from 'lodash/cloneDeep';


// Format Unique By
export function formatUniqueBy(obj, params) {
  let rights = [];
  if (obj == null) { return []; }
  for (let subObj of obj) {
    if (!rights.find(x => valLib.isEqualWithParams(x, subObj, params))) { rights.push(subObj); }
  }
  return rights;
}

// Format Filter By
export function formatFilterBy(obj, ref, params) {
  return obj.filter(x => valLib.isEqualWithParams(x, ref, params));
}

// Push Object in Format
export function enterObject(format, obj) {
  let filledFormat = cloneDeep(format);
  let keys = objLib.getKeys(obj);
  for(var elem in filledFormat) {
    if (keys.includes(filledFormat[elem]['property'])) { filledFormat[elem]['value'] = cloneDeep(obj[filledFormat[elem]['property']]); }
    else if (filledFormat[elem]['property'].includes('.')) { filledFormat[elem]['value'] = cloneDeep(objLib.getSubProperty(obj, filledFormat[elem]['property'])); }
  }
  return filledFormat;
}

// Push Variables in Format
export function enterVariables(config, defs) {
  let val = cloneDeep(defs);
  for(var key in val) {
    if (val[key] === Object(val[key])) { val[key] = enterVariables(config, val[key]); }
    else {
      if ((val[key] != null) && val[key].toString().includes('{{') && val[key].toString().includes('}}')) {
        let valToReplace = (' ' + val[key]).slice(1);
        let matches = valToReplace.match(/{\{.+?}\}/g);
        for(var occ in matches) {
          let newVal = matches[occ].replace('{{', '').replace('}}', '')
          val[key] = val[key].replace(matches[occ], config[newVal])
        }
      }
    }
  }
  return val;
}

// Format Info
export function formatInfo(config, type, obj, level: string = 'all') {
  let format = enterVariables(config, config['definitions']['Object'][type]['properties'][level]);
  if (obj == null) { return cloneDeep(format); }
  else { return enterObject(format, obj); }
}

// Format Plugin Option Info
export function formatPluginOptionInfo(config, plugin, options, group) {
  let definitions = enterVariables(config, config['definitions']['Plugin'][plugin['id'].toString()][group]);
  definitions = definitions.filter(definition => (objLib.lookUpKey(options, group) && objLib.lookUpKey(options[group], (valLib.isObject(definition)?definition['property']:definition))));
  definitions.forEach(definition => definition['value'] = options[group][(valLib.isObject(definition)?definition['property']:definition)]);
  return definitions;
}

// Format Multiple Info
export function formatMultipleInfo(config, type, objlist, level: string = 'all') {
  return objlist.map(obj => formatInfo(config, type, obj, level));
}
