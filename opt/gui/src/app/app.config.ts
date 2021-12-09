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
export class AppConfig {

  // Define Properties
  public config: Object = null;


  // Constructor
  constructor(private http: HttpClient, private localStorage: LocalStorageService) { }


  // Get Config by Key
  getConfig(key: any) { return this.config[key]; }

  // Get All Config
  getAllConfig() { return this.config; }

  // Fetch Config
  fetchConfig(resolve, reject) {

    // Refuse Caching
    let headers: HttpHeaders = new HttpHeaders({'Cache-Control': 'no-cache, no-store, must-revalidate, post-check=0, pre-check=0', 'Pragma': 'no-cache', 'Expires': '0'});

    // Get Config
    this.http.get('./assets/config.json', { headers }).subscribe(
      (res: any) => {

        // Get Stored App Init
        let appInit = this.localStorage.retrieve('appInit');
        if (!appInit) { appInit = {}; }

        // Assign Config
        this.config = res;

        // Store Config
        appInit['config'] = res;
        this.localStorage.store('appInit', appInit);

        // Resolve
        resolve(true);

      }
    );
  }

  // Load Config
  load(hashConfig) {
    return new Promise(
      (resolve, reject) => {

        // Get Hashes
        let configHashes = this.localStorage.retrieve('configHashes');

        // Hashes Stored
        if (configHashes && objLib.lookUpKey(configHashes, 'config') && (configHashes.config)) {

          // Get Stored App Init
          let appInit = this.localStorage.retrieve('appInit');

          // Config Present & Up To Date
          if (appInit && objLib.lookUpKey(appInit, 'config') && (appInit.config) && (configHashes.config == hashConfig.config.config)) {
            console.log('Application config up-to-date');
            this.config = cloneDeep(appInit.config);
            resolve(true);
          }

          // Config Not Present or Not Up To Date
          else {
            configHashes['config'] = cloneDeep(hashConfig.config.config);
            this.localStorage.store('configHashes', configHashes);
            this.fetchConfig(resolve, reject);
          }

        }

        // No Hashes Stored
        else {
          if (!configHashes) { configHashes = {}; }
          configHashes['config'] = cloneDeep(hashConfig.config.config);
          this.localStorage.store('configHashes', configHashes);
          this.fetchConfig(resolve, reject);
        }

      }
    );
  }

}
