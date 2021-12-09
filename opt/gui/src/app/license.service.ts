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
import { CookieService } from 'ngx-cookie-service';
import { LocalStorageService } from 'ngx-webstorage';

// Imports: Libraries
import * as objLib from '@library/object';
import * as rightLib from '@library/right';

// Imports: Tools
import * as cloneDeep from 'lodash/cloneDeep';


// Class Export Definition
@Injectable()
export class LicenseService {

  // Define Properties
  public license = {};
  public validLicense = null;


  // Constructor
  constructor(private http: HttpClient, private cookieService: CookieService, private localStorage: LocalStorageService) { }


  // Get Data
  getData(...args: any[]) {
    if (args.length == 0) { return null; }
    else {
      let val = this;
      for(var i in args) { val = val[args[i]]; }
      return val;
    }
  }

  // License Valid
  licenseValid(license) {

    // Existing License
    if (license) { return true; }

    // No License
    else { return false; }

  }

  // Generate Greeting
  generateGreeting() {

    // Valid License
    if (this.license) { return 'common.greetings.license.valid'; }

    // No License
    else { return 'common.greetings.license.none'; }

  }

  // Fetch License Info
  fetchLicenseInfo(appConfig, resolve, reject) {

    // Get Stored User Data
    let userData = this.localStorage.retrieve('userData');

    if ((!userData) || (!objLib.lookUpKey(userData, 'authToken'))) {

      // Get Stored App Init
      let appInit = this.localStorage.retrieve('appInit');
      if (!appInit) { appInit = {}; }

      // No License Info
      this.license = null;

      // Store License
      appInit['license'] = null;
      this.localStorage.store('appInit', appInit);

      // Reject
      resolve(true);

    }

    // Define API Authentication
    let headers: HttpHeaders = new HttpHeaders({"Authorization": "Token " + userData.authToken});

    // Get License
    this.http.get(`${appConfig.config['apiRootUrl']}license/info`, { headers }).subscribe(
      (res: any) => {

        // Get Stored App Init
        let appInit = this.localStorage.retrieve('appInit');
        if (!appInit) { appInit = {}; }

        // Assign License
        this.license = res;
        this.validLicense = this.licenseValid(res);

        // Store License
        appInit['license'] = res;
        this.localStorage.store('appInit', appInit);

        // Resolve
        resolve(true);

      },
      err => {

        // Get Stored App Init
        let appInit = this.localStorage.retrieve('appInit');
        if (!appInit) { appInit = {}; }

        // No License Info
        this.license = null;

        // Store License
        appInit['license'] = null;
        this.localStorage.store('appInit', appInit);

        // Error Message
        console.error('Upload a license to be able to use this system');

        // Reject
        resolve(true);

      }
    );
  }

  // Load License
  loadLicense(hashConfig, appConfig) {
    return new Promise(
      (resolve, reject) => {

        // Get Cookie Auth Token
        let cookieToken = this.cookieService.get('token');

        // Check Cookie Auth Token
        if (!cookieToken) {

          // Set License to Null
          let appInit = this.localStorage.retrieve('appInit');
          if (!appInit) { appInit = {}; }
          this.license = null;
          appInit['license'] = null;
          this.localStorage.store('appInit', appInit);

          // Resolve
          resolve(true);

        }

        // Get Stored Hashes
        let configHashes = this.localStorage.retrieve('configHashes');

        // Hashes Present?
        if (configHashes && objLib.lookUpKey(configHashes, 'license') && (configHashes.license)) {

          // Get Stored App Init
          let appInit = this.localStorage.retrieve('appInit');

          // Config Present & Up To Date
          if (appInit && objLib.lookUpKey(appInit, 'license') && (appInit.license) && (configHashes.license == hashConfig.config.license)) {
            console.log('Application license up-to-date');
            let licenseInfo = cloneDeep(appInit.license);
            this.license = licenseInfo;
            this.validLicense = this.licenseValid(licenseInfo);
            resolve(true);
          }

          // Config Not Present or Not Up To Date
          else {
            configHashes['license'] = cloneDeep(hashConfig.config.license);
            this.localStorage.store('configHashes', configHashes);
            this.fetchLicenseInfo(appConfig, resolve, reject);
          }

        }

        // No Hashes Stored
        else {
          if (!configHashes) { configHashes = {}; }
          configHashes['license'] = cloneDeep(hashConfig.config.license);
          this.localStorage.store('configHashes', configHashes);
          this.fetchLicenseInfo(appConfig, resolve, reject);
        }

      }
    );
  }

}
