/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-start-orig/
    Contact:    https://neatly.be/
*/


// Imports: Required
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

// Imports: Default
import { LocalStorageService } from 'ngx-webstorage';

// Imports: Libraries
import * as objLib from '@library/object';

// Imports: Tools
import * as cloneDeep from 'lodash/cloneDeep';


// Class Export Definition
@Injectable()
export class PluginConfig {

  // Define Properties
  public plugin = {};


  // Constructor
  constructor(private http: HttpClient, private localStorage: LocalStorageService) { }


  // Get Active Plugins
  getPluginConfig() { return this.plugin; }

  // Fetch Active Plugins
  fetchActivePlugins(appConfig, resolve, reject) {

    // Refuse Caching
    let headers: HttpHeaders = new HttpHeaders({'Cache-Control': 'no-cache, no-store, must-revalidate, post-check=0, pre-check=0', 'Pragma': 'no-cache', 'Expires': '0'});

    // Get Config
    this.http.get(`${appConfig.config['apiRootUrl']}` + 'plugin/list/active', { headers }).subscribe(
      (res: any) => {

        // Get Stored Plugins
        let plugin = this.localStorage.retrieve('plugin');
        if (!plugin) { plugin = {}; }

        // Assign Active Plugin
        this.plugin['active'] = res;

        // Store Config
        plugin['active'] = res;
        this.localStorage.store('plugin', plugin);

        // Resolve
        resolve(true);

      }
    );
  }

  // Load Plugin Config
  load(hashConfig, appConfig) {
    return new Promise(
      (resolve, reject) => {

        // Get Hashes
        let configHashes = this.localStorage.retrieve('configHashes');

        // Hashes Stored
        if (configHashes && objLib.lookUpKey(configHashes, 'plugin') && (configHashes.plugin)) {

          // Get Stored Plugin Config
          let plugin = this.localStorage.retrieve('plugin');

          // Plugin Config Present & Up To Date
          if (plugin && objLib.lookUpKey(plugin, 'active') && (plugin.active) && (configHashes.plugin == hashConfig.config.plugin)) {
            console.log('Application plugin config up-to-date');
            this.plugin = cloneDeep(plugin);
            resolve(true);
          }

          // Plugin Config Not Present or Not Up To Date
          else {
            configHashes['plugin'] = cloneDeep(hashConfig.config.plugin);
            this.localStorage.store('configHashes', configHashes);
            this.fetchActivePlugins(appConfig, resolve, reject);
          }

        }

        // No Hashes Stored
        else {
          if (!configHashes) { configHashes = {}; }
          configHashes['plugin'] = cloneDeep(hashConfig.config.plugin);
          this.localStorage.store('configHashes', configHashes);
          this.fetchActivePlugins(appConfig, resolve, reject);
        }

      }
    );
  }

}
