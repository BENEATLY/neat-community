//  Author:     Thomas D'haenens
//  License:    GPL-3.0
//  Link:       https://github.com/BENEATLY/neat-community/
//  Contact:    https://neatly.be/


// Imports: Libraries
import * as objLib from '@library/object';
import * as valLib from '@library/validate';
import * as rightLib from '@library/right';
import * as definitionsLib from '@library/definitions';
import * as genLib from '@library/generator';
import * as routeLib from '@library/route';


// Check Path
export function checkPath(pathName, path) { return (pathName == path); }

// Check Path (for SubItem)
export function checkSubItemPath(item, path) {
  return item.subItems.some(
    function(subItem) {
      if (objLib.lookUpKey(subItem, 'subItems')) { return checkSubItemPath(subItem, path); }
      else { return checkPath(subItem.routerLink, path); }
    }
  );
}

// Make Navigation Array
export function makeNavigationArray(navigation, collapse) {
  let navigationArray = objLib.getKeys(navigation).map( function(key) { return navigation[key]; } );
  for (let nav of navigationArray) {
    if (objLib.lookUpKey(nav, 'subItems')) {
      nav['subItems'] = makeNavigationArray(nav['subItems'], collapse);
      nav['collapse'] = true;
    }
  }
  return navigationArray;
}

// Convert Navigation Config
export function convertNavigationConfig(navigation, collapse=false) {
  let navigationConfig = {};
  for (const [key, value] of Object.entries(navigation)) { navigationConfig[key] = makeNavigationArray(value, collapse); }
  return navigationConfig;
}

// Get Navigation
export function getNavigation(config, userData, type, subPath) {
  if (type == 'leftbar') {
    let simpleNavigationConfig = convertNavigationConfig(config['navigation']['leftbar'], true);
    if (objLib.getKeys(simpleNavigationConfig).includes(subPath)) {
      return filterNavBarByRights(config, userData, simpleNavigationConfig[subPath]);
    }
    else { return null; }
  }
  else if (type == 'navbar') {
    let simpleNavigationConfig = convertNavigationConfig(config['navigation']['navbar']);
    return filterNavBarByRights(config, userData, simpleNavigationConfig[subPath]);
  }
  else { return null; }
}

// Filter Nav Bar Navigation By Rights
export function filterNavBarByRights(config, userData, navigations) {
  navigations = navigations.filter(navigation => ((!objLib.lookUpKey(navigation, 'rights')) || navigation.rights.some(right => (((objLib.lookUpKey(right, 'specific') && (right.specific))?(definitionsLib.lookUpDefinitions(config, userData.right, right.action, right.object) == right.level):rightLib.sufficientRights(userData.right, right.object, right.action, right.level))))));
  navigations = navigations.filter(navigation => ((!objLib.lookUpKey(navigation, 'pluginActionRights')) || navigation.pluginActionRights.some(right => (rightLib.sufficientPluginActionRights(userData.pluginActionRight, right.plugin, right.action, (objLib.lookUpKey(right, 'level')?right.level:'all'))))));
  for (let navigation of navigations) {
    if (objLib.lookUpKey(navigation, 'subItems')) {
      navigation.subItems = navigation.subItems.filter(nav => ((!objLib.lookUpKey(nav, 'rights')) || nav.rights.some(right => (((objLib.lookUpKey(right, 'specific') && (right.specific))?(definitionsLib.lookUpDefinitions(config, userData.right, right.action, right.object) == right.level):rightLib.sufficientRights(userData.right, right.object, right.action, right.level))))));
      navigation.subItems = navigation.subItems.filter(nav => ((!objLib.lookUpKey(nav, 'pluginActionRights')) || nav.pluginActionRights.some(right => (rightLib.sufficientPluginActionRights(userData.pluginActionRight, right.plugin, right.action, (objLib.lookUpKey(right, 'level')?right.level:'all'))))));
      navigation.subItems.sort(function(a, b) { if (!objLib.lookUpKey(a, 'order')) { return 1; } if (!objLib.lookUpKey(b, 'order')) { return -1; } return (a['order'] - b['order']); })
    }
  }
  navigations = navigations.filter(navigation => ((!objLib.lookUpKey(navigation, 'subItems')) || navigation.subItems.length));
  navigations.sort(function(a, b) { if (!objLib.lookUpKey(a, 'order')) { return 1; } if (!objLib.lookUpKey(b, 'order')) { return -1; } return (a['order'] - b['order']); })
  return navigations;
}

// Get Navigation Items
export function getNavItems(config, routes, url) {
  let items = [];
  let fullPath = url.map(url => url.path);
  for (let nr of genLib.increasingArray(fullPath.length)) {
    if (routes.filter(route => (route.type == 'fixed')).map(route => route.path).includes(fullPath.slice(0, nr+1).join('/'))) { items.push({'name': fullPath.slice(0, nr+1).join('.') + '.pagetitle', 'ref': fullPath.slice(0, nr+1).join('/')}); }
    else if (routes.filter(route => (route.type == 'fixed-ref')).map(route => route.path).includes(fullPath.slice(0, nr+1).join('/'))) { items.push({'name': fullPath.slice(0, nr+1).join('.') + '.pagetitle', 'ref': fullPath.slice(0, nr+1).join('/')}); }
    else if (!valLib.isStringInt(fullPath.slice(nr, nr+1)[0]) && (routes.filter(route => (route.type == 'item')).map(route => route.path).includes(fullPath.slice(nr, nr+1)[0]))) { items.push({'name': 'object.' + definitionsLib.getObjectName(config, fullPath.slice(nr, nr+1)[0]) + '.naming.singular', 'ref': fullPath.slice(0, nr+1).join('/')}); }
    else if ((routes.filter(route => (route.type == 'item-list')).map(route => route.path).includes(fullPath.slice(nr, nr+1)[0])) || (routes.filter(route => (route.type == 'item-list')).map(route => route.path).includes(fullPath.slice(0, nr+1).join('/')))) { items.push({'name': 'object.' + definitionsLib.getObjectName(config, fullPath.slice(nr, nr+1)[0]) + '.naming.singular', 'ref': fullPath.slice(0, nr+1).join('/')}); }
    else if (routes.filter(route => (route.type == 'custom')).map(route => route.path).includes(fullPath.slice(0, nr+1).join('/'))) { items.push({'name': fullPath.slice(0, nr+1).join('.') + '.pagetitle', 'ref': fullPath.slice(0, nr+1).join('/')}); }
    else if (valLib.isStringInt(fullPath.slice(nr, nr+1)[0]) && ((routes.filter(route => (route.type == 'item')).map(route => route.path).includes(fullPath.slice(nr-1, nr)[0])) || (routes.filter(route => (route.type == 'item')).map(route => route.path).includes(fullPath.slice(0, nr).join('/'))))) { items.push({'value': fullPath.slice(nr, nr+1)[0], 'ref': fullPath.slice(0, nr+1).join('/')}); }
    else if (valLib.isStringInt(fullPath.slice(nr, nr+1)[0]) && ((routes.filter(route => (route.type == 'item-id')).map(route => route.path).includes(fullPath.slice(nr-1, nr)[0])) || (routes.filter(route => (route.type == 'item-id')).map(route => route.path).includes(fullPath.slice(0, nr).join('/'))))) { items.push({'value': fullPath.slice(nr, nr+1)[0], 'ref': fullPath.slice(0, nr+1).join('/')}); }
    else { items.push({'name': fullPath.slice(0, nr+1).join('.') + '.pagetitle', 'ref': null}); }
  }
  return items;
}

// Generate Sub Navigate Path
export function genSubNavPath(url, objectDef, item, property, val) {
  let fullPath = url.map(url => url.path);
  if (valLib.isStringInt(fullPath.slice(-1)[0])) {
    if (val) { return ('/' + fullPath.join('/') + '/' + property.property.toLowerCase() + '/' + val.id.toString()); }
    else { return ('/' + fullPath.join('/') + '/' + property.property.toLowerCase()); }
  }
  else {
    if (property) {
      if (objectDef.toLowerCase() != fullPath.slice(-1)[0].toLowerCase()) {
        if (val) { return ('/' + fullPath.join('/') + '/' + objectDef.toLowerCase() + '/' + item.id.toString() + '/' + property.property.toLowerCase() + '/' + val.id.toString()); }
        else { return ('/' + fullPath.join('/') + '/' + objectDef.toLowerCase() + '/' + item.id.toString() + '/' + property.property.toLowerCase()); }
      }
      else {
        if (val) { return ('/' + fullPath.join('/') + '/' + item.id.toString() + '/' + property.property.toLowerCase() + '/' + val.id.toString()); }
        else { return ('/' + fullPath.join('/') + '/' + item.id.toString() + '/' + property.property.toLowerCase()); }
      }
    }
    else {
      if (objectDef.toLowerCase() != fullPath.slice(-1)[0].toLowerCase()) { return ('/' + fullPath.join('/') + '/' + objectDef.toLowerCase() + '/' + item.id.toString()); }
      else { return ('/' + fullPath.join('/') + '/' + item.id.toString()); }
    }
  }
}

// Sub Navigate
export function subNav(router, url, objectName, item, property, val) { routeLib.navigate(router, genSubNavPath(url, objectName, item, property, val)); }
