//  Author:     Thomas D'haenens
//  License:    GPL-3.0
//  Link:       https://github.com/BENEATLY/neat-community/
//  Contact:    https://neatly.be/


// Imports: Default
import { HttpHeaders } from '@angular/common/http';

// Imports: Libraries
import * as objLib from '@library/object';
import * as valLib from '@library/validate';
import * as strLib from '@library/string';


// Plugin Active?
export function isActivePlugin(config, pluginId) { return config.active.some(plugin => plugin.id === pluginId); }

// All Services Running?
export function allServicesRunning(services) {

  // Variable for Service Status
  let running = []

  // Iterate over Services
  for (let service of services) {

    // Service Running
    if (service.status) { running.push(true); }

    // Service Failed
    else { running.push(false); }

  }

  // Return Result
  if (running.every(x => x == true)) { return true; }
  else { return false; }

}

// Plugin Action Possible
export function pluginActionPossible(results) { return (!results.filter(x => (x['transition'] != null)).length); }

// Plugin Transition Permitted
export function pluginTransitionPermitted(results, plugin, transitionDirection) {

  // Install
  if (!plugin.installed && transitionDirection) {
    let dependentPlugins = plugin.required.filter(x => (!x.installed));
    return (!dependentPlugins.length);
  }

  // Uninstall
  if (plugin.installed && (!plugin.activated) && (!transitionDirection)) {
    let dependentPlugins = results.filter(x => (x.required.map(y => y.id).includes(plugin.id) && x.installed));
    return (!dependentPlugins.length);
  }

  // Activate
  if (plugin.installed && (!plugin.activated) && transitionDirection) {
    let dependentPlugins = plugin.required.filter(x => (!x.activated));
    return (!dependentPlugins.length);
  }

  // Deactivate
  if (plugin.installed && plugin.activated && (!transitionDirection)) {
    let dependentPlugins = results.filter(x => (x.required.map(y => y.id).includes(plugin.id) && x.activated));
    return (!dependentPlugins.length);
  }

  // Unexpected Action
  return false;

}

// Plugin Installation
export async function asyncPluginInstall(config, plugin, translate, cookieService, httpModule, position): Promise<void> {

  // Set Transition
  plugin.transition = true;

  // Define API Authentication
  let token = cookieService.get('token');
  let headers: HttpHeaders = new HttpHeaders({"Authorization": "Token " + token});

  // Perform Plugin Install API Call
  httpModule.post(`${config['apiRootUrl']}plugin/edit/` + plugin.id.toString(), {'installed': true}, { headers }).subscribe();

}

// Plugin Uninstallation
export async function asyncPluginUninstall(config, plugin, translate, cookieService, httpModule, position): Promise<void> {

  // Set Transition
  plugin.transition = false;

  // Define API Authentication
  let token = cookieService.get('token');
  let headers: HttpHeaders = new HttpHeaders({"Authorization": "Token " + token});

  // Perform Plugin Uninstall API Call
  httpModule.post(`${config['apiRootUrl']}plugin/edit/` + plugin.id.toString(), {'installed': false}, { headers }).subscribe();

}

// Plugin Activation
export async function asyncPluginActivate(config, plugin, translate, cookieService, httpModule, position): Promise<void> {

  // Set Transition
  plugin.transition = true;

  // Define API Authentication
  let token = cookieService.get('token');
  let headers: HttpHeaders = new HttpHeaders({"Authorization": "Token " + token});

  // Perform Plugin Activation API Call
  httpModule.post(`${config['apiRootUrl']}plugin/edit/` + plugin.id.toString(), {'activated': true}, { headers }).subscribe();

}

// Plugin Deactivation
export async function asyncPluginDeactivate(config, plugin, translate, cookieService, httpModule, position): Promise<void> {

  // Set Transition
  plugin.transition = false;

  // Define API Authentication
  let token = cookieService.get('token');
  let headers: HttpHeaders = new HttpHeaders({"Authorization": "Token " + token});

  // Perform Plugin Deactivation API Call
  httpModule.post(`${config['apiRootUrl']}plugin/edit/` + plugin.id.toString(), {'activated': false}, { headers }).subscribe();

}

// Get Definitions
export function getDefinitions(config, pluginName) { return (config.plugins as any)[pluginName].config.definitions; }

// Get Definition
export function getDefinition(config, pluginName, definition) { return (config.plugins as any)[pluginName].config.definitions[definition]; }

// Get Plugin Groups
export function getPluginGroups(config, plugin) { return objLib.getKeys(config['plugins'][plugin['id'].toString()]); }

// Get Plugin Values
export function getPublicPluginValues(config, plugin, group) { return config['plugins'][plugin['id'].toString()][group]; }

// Get Plugin Value
export function getPublicPluginValue(config, plugin, group, definition) {
  if (valLib.isObject(definition)) { return config['plugins'][plugin['id'].toString()][group][definition['property']]; }
  else { return config['plugins'][plugin['id'].toString()][group][definition]; }
}

// Convert Config Dict To JSON
export function convertConfigDictToJSON(configDict) {
  for (let config of objLib.getKeys(configDict)) { configDict[config] = JSON.parse(configDict[config]); }
  return configDict;
}

// Replace Config File Options
export function replaceConfigOptions(config, properties) {
  for (let property of properties) {
    if (objLib.getKeys(config).includes(property.config.file)) {
      let itemToEdit = config[property.config.file];
      for (let subItem of property.config.location.split('.')) { itemToEdit = itemToEdit[subItem]; }
      if (objLib.lookUpKey(property, 'config') && objLib.lookUpKey(property.config, 'options') && property.config.options) { itemToEdit.filter(option => (option.property == property.property))[0].value = property.value; }
      else {
        if (objLib.lookUpKey(property, 'config') && objLib.lookUpKey(property.config, 'value') && property.config.value) { itemToEdit.value = property.value; }
        else { itemToEdit = property.value; }
      }
    }
    else { console.error('Didn\'t find config file ' + property.config.file); }
  }
  return config;
}

// Stringify Config Options
export function stringifyConfigOptions(config) {
  let newConfig = {};
  for (let configFile of objLib.getKeys(config)) { newConfig[configFile] = strLib.convertJSONToString(config[configFile]); }
  return newConfig;
}

// Construct Plugin Action Path
export function constructPluginActionPath(config, plugin, action) { return (config['apiRootUrl'] + 'plugin/' + plugin['id'] + '/action/' + action); }
