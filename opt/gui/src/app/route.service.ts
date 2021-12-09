/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-start-orig/
    Contact:    https://neatly.be/
*/


// Imports: Required
import { Injectable } from '@angular/core';

// Imports: Default
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LocalStorageService } from 'ngx-webstorage';

// Imports: Libraries
import * as objLib from '@library/object';

// Imports: Tools
import * as cloneDeep from 'lodash/cloneDeep';


// Class Export Definition
@Injectable()
export class RouteService {

  // Define Properties
  public moduleRoutes = [];
  public routes = {'routes': [], 'linked': {}, 'options': {}};


  // Constructor
  constructor(private http: HttpClient, private localStorage: LocalStorageService) { }


  // Get Public Routes
  getPublicRoutes() { return this.routes['routes'].filter(route => (objLib.lookUpKey(route, 'public') && route['public'])).map(route => route['path']); }

  // Get No Navigation Routes
  getNoNavRoutes() { return this.routes['routes'].filter(route => (objLib.lookUpKey(route, 'noNav') && route['noNav'])).map(route => route['path']); }

  // Create Item Parameter Nav Path
  createItemParameterNavPath(path, nrs, id, prev = null, fixedRef = null) {
    let newPath = path;
    for (let nr of [...Array(nrs).keys()]) {
      newPath = ':item' + (nr+1).toString() + '/:id' + (nr+1).toString() + '/' + newPath;
    }
    if (id) { newPath = newPath + '/:id0'; }
    return (prev?(prev + '/:id999999/'): '') + newPath;
    if (prev) { return (prev + '/:id999999/' + newPath); }
    else if (fixedRef) { return (fixedRef + '/' + newPath); }
    else { return newPath; }
  }

  // Map Module Routes
  mapModuleRoutes(config, componentImportsDict) {

    // Empty Routes
    let routes = [];

    // Iterate over Routes
    for (let route of config.routes.sort(function(a, b) { return (b.path.split('/').length - 1) - (a.path.split('/').length - 1); })) {

      // Fixed Type
      if (route.type == 'fixed') {

        routes.push({ path: route.path, component: componentImportsDict[route.component] });
        routes.push({ path: route.path + '/:id0', redirectTo: route.path, pathMatch: 'full' });

      }

      // Fixed Reference Type
      else if (route.type == 'fixed-ref') {

        routes.push({ path: route.path, component: componentImportsDict[route.component] });

      }

      // Item Type
      else if (route.type == 'item') {

        routes.push({ path: route.path, component: componentImportsDict[route.component] });
        routes.push({ path: route.path + '/:id0', component: componentImportsDict[route.component] });

        // Exotic Path
        let specialRoutes = config.routes.filter(rout => ((rout.type == 'item') && (rout.path != route.path) && (rout.path.includes('/')) && (!route.path.includes('/')))).map(rout => rout.path);
        for (var i=0; i<=config.options.maxSubNav; i++) {
          for (let specialRoute of specialRoutes) {
            routes.push({ path: this.createItemParameterNavPath(route.path, i, false, specialRoute, null), component: componentImportsDict[route.component] });
            routes.push({ path: this.createItemParameterNavPath(route.path, i, true, specialRoute, null), component: componentImportsDict[route.component] });
          }
        }

        // Fixed Reference Routes
        let fixedRefRoutes = config.routes.filter(rout => (rout.type == 'fixed-ref') && (!route.path.includes('/'))).map(rout => rout.path);
        for (var i=0; i<=config.options.maxSubNav; i++) {
          for (let fixedRefRoute of fixedRefRoutes) {
            routes.push({ path: this.createItemParameterNavPath(route.path, i, false, null, fixedRefRoute), component: componentImportsDict[route.component] });
            routes.push({ path: this.createItemParameterNavPath(route.path, i, true, null, fixedRefRoute), component: componentImportsDict[route.component] });
          }
        }

        // Simple Path
        if (!route.path.includes('/')) {
          for (var i=1; i<=config.options.maxSubNav; i++) {
            routes.push({ path: this.createItemParameterNavPath(route.path, i, false, null, null), component: componentImportsDict[route.component] });
            routes.push({ path: this.createItemParameterNavPath(route.path, i, true, null, null), component: componentImportsDict[route.component] });
          }
        }

      }

      // Item List Type
      else if (route.type == 'item-list') {

        routes.push({ path: route.path, component: componentImportsDict[route.component] });

        // Exotic Path
        let specialRoutes = config.routes.filter(rout => ((rout.type == 'item-list') && (rout.path != route.path) && (rout.path.includes('/')) && (!route.path.includes('/')))).map(rout => rout.path);
        for (var i=0; i<=config.options.maxSubNav; i++) {
          for (let specialRoute of specialRoutes) {
            routes.push({ path: this.createItemParameterNavPath(route.path, i, false, specialRoute, null), component: componentImportsDict[route.component] });
          }
        }

        // Simple Path
        if (!route.path.includes('/')) {
          for (var i=1; i<=config.options.maxSubNav; i++) { routes.push({ path: this.createItemParameterNavPath(route.path, i, false, null, null), component: componentImportsDict[route.component] }); }
        }

      }

      // Item Id Type
      else if (route.type == 'item-id') {

        routes.push({ path: route.path + '/:id0', component: componentImportsDict[route.component] });

        // Exotic Path
        let specialRoutes = config.routes.filter(rout => ((rout.type == 'item-id') && (rout.path != route.path) && (rout.path.includes('/')) && (!route.path.includes('/')))).map(rout => rout.path);
        for (var i=0; i<=config.options.maxSubNav; i++) {
          for (let specialRoute of specialRoutes) {
            routes.push({ path: this.createItemParameterNavPath(route.path, i, true, specialRoute, null), component: componentImportsDict[route.component] });
          }
        }

        // Simple Path
        if (!route.path.includes('/')) {
          for (var i=1; i<=config.options.maxSubNav; i++) { routes.push({ path: this.createItemParameterNavPath(route.path, i, true, null, null), component: componentImportsDict[route.component] }); }
        }

      }

      // Custom Type
      if (route.type == 'custom') { routes.push({ path: route.path, component: componentImportsDict[route.component] }); }

    }

    // Iterate over Redirects
    for (let key in config.options.redirects) {

      // Empty Path
      if (key == 'empty') { routes.push({ path: '', redirectTo: config.options.redirects[key], pathMatch: 'full' }); }

      // Unknown Path
      else if (key == 'unknown') { routes.push({ path: '**', redirectTo: config.options.redirects[key] }); }

    }

    // Return Routes
    return routes;

  }

  // Fetch Routes
  fetchRoutes(componentImportsDict, resolve, reject) {

    // Refuse Caching
    let headers: HttpHeaders = new HttpHeaders({'Cache-Control': 'no-cache, no-store, must-revalidate, post-check=0, pre-check=0', 'Pragma': 'no-cache', 'Expires': '0'});

    // Get Route Config
    this.http.get('./assets/routes/routes.json', { headers }).subscribe(
      (config: any) => {

        // Get Stored App Init
        let appInit = this.localStorage.retrieve('appInit');
        if (!appInit) { appInit = {}; }

        // Assign Module Routes
        this.moduleRoutes = this.mapModuleRoutes(config, componentImportsDict);

        // Assign Routes
        this.routes = config;

        // Store Routes
        appInit['routes'] = config;
        this.localStorage.store('appInit', appInit);

        // Resolve
        resolve(true);

      },
      err => {

        // Get Stored App Init
        let appInit = this.localStorage.retrieve('appInit');
        if (!appInit) { appInit = {}; }

        // No Module Routes
        this.moduleRoutes = [];

        // No Route Info
        this.routes = {'routes': [], 'linked': {}, 'options': {}};

        // Store Routes
        appInit['routes'] = {'routes': [], 'linked': {}, 'options': {}};
        this.localStorage.store('appInit', appInit);

        // Reject
        reject('Unable to get application routes');

      }
    );

  }

  // Load Routes
  loadRoutes(hashConfig, componentImportsDict) {
    return new Promise(
      (resolve, reject) => {

        // Get Stored Hashes
        let configHashes = this.localStorage.retrieve('configHashes');

        // Hashes Present?
        if (configHashes && objLib.lookUpKey(configHashes, 'routes') && (configHashes.routes)) {

          // Get Stored App Init
          let appInit = this.localStorage.retrieve('appInit');

          // Config Present & Up To Date
          if (appInit && objLib.lookUpKey(appInit, 'routes') && (appInit.routes) && (configHashes.routes == hashConfig.config.routes)) {
            console.log('Application routes up-to-date');
            let config = cloneDeep(appInit.routes);
            this.moduleRoutes = this.mapModuleRoutes(config, componentImportsDict);
            this.routes = config;
            resolve(true);
          }

          // Config Not Present or Not Up To Date
          else {
            configHashes['routes'] = cloneDeep(hashConfig.config.routes);
            this.localStorage.store('configHashes', configHashes);
            this.fetchRoutes(componentImportsDict, resolve, reject);
          }

        }

        // No Hashes Stored
        else {
          if (!configHashes) { configHashes = {}; }
          configHashes['routes'] = cloneDeep(hashConfig.config.routes);
          this.localStorage.store('configHashes', configHashes);
          this.fetchRoutes(componentImportsDict, resolve, reject);
        }

      }
    );
  }

  // Init Router Module
  initRouterModule(router) {
    return new Promise(
      (resolve, reject) => {

        // Reset Router Config
        router.resetConfig(this.moduleRoutes);

        // Resolve
        resolve(true);

      }
    );
  }

}
