/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-community/
    Contact:    https://neatly.be/
*/


// Imports: Required
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

// Imports: Default
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { CookieService } from 'ngx-cookie-service';
import { LocalStorageService } from 'ngx-webstorage';

// Imports: Libraries
import * as objLib from '@library/object';

// Imports: Tools
import * as cloneDeep from 'lodash/cloneDeep';


// Class Export Definition
@Injectable()
export class DataService {

  // Define Private Sources
  private shortPathSource = new BehaviorSubject<string>('');
  private fullPathSource = new BehaviorSubject<string>('');
  private leftNavigationSource = new BehaviorSubject<boolean>(true);

  // Define Observables
  public shortPath = this.shortPathSource.asObservable();
  public fullPath = this.fullPathSource.asObservable();
  public leftNavigation = this.leftNavigationSource.asObservable();

  // Define Properties
  public userData = {'info': {}, 'right': {}, 'pluginActionRight': {}, 'pluginOptionRight': {}};


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

  // Flag New Path URL
  flagNewPath(url: any) {
    this.shortPathSource.next(url[0].path);
    this.fullPathSource.next(url.map(url => url.path).join('/'));
  }

  // Flag New Left Navigation Bar Expand State
  flagLeftNavBarExpand(state: boolean) {
    this.leftNavigationSource.next(state);
  }

  // Load User Data Info
  fetchUserDataInfo(appConfig) {
    return new Promise(
      (resolve, reject) => {

        // Get Stored User Data
        let userData = this.localStorage.retrieve('userData');

        // Define API Authentication
        let headers: HttpHeaders = new HttpHeaders({"Authorization": "Token " + userData.authToken});

        // Fetch User Info
        this.http.get(`${appConfig.config.apiRootUrl}token`, { headers }).subscribe(
          (res: any[]) => {

            // Store User Info
            this.userData.info = res;

            // Store User Info
            userData['info'] = res;
            this.localStorage.store('userData', userData);

            // Resolve
            resolve(true);

          },
          err => {

            // No User Info
            this.userData.info = null;

            // Clean Up
            this.cookieService.delete('token', '/');
            this.localStorage.clear('userData');

            // Reload
            location.reload(true);

            // Message
            console.error('Unable to get user info');

            // Reject
            resolve(true);

          }
        );

      }
    );
  }

  // Load User Data Right
  fetchUserDataRight(appConfig) {
    return new Promise(
      (resolve, reject) => {

        // Get Stored User Data
        let userData = this.localStorage.retrieve('userData');

        // Define API Authentication
        let headers: HttpHeaders = new HttpHeaders({"Authorization": "Token " + userData.authToken});

        // Fetch User Right
        this.http.get(`${appConfig.config.apiRootUrl}right/list&self`, { headers }).subscribe(
          (res: any[]) => {

            // Store User Right
            this.userData.right = res;

            // Store User Right
            userData['right'] = res;
            this.localStorage.store('userData', userData);

            // Resolve
            resolve(true);

          },
          err => {

            // No User Right
            this.userData.right = null;

            // Clean Up
            this.cookieService.delete('token', '/');
            this.localStorage.clear('userData');

            // Reload
            location.reload(true);

            // Message
            console.error('Unable to get user rights');

            // Reject
            resolve(true);

          }
        );

      }
    );
  }

  // Load User Data Plugin Action Right
  fetchUserDataPluginActionRight(appConfig) {
    return new Promise(
      (resolve, reject) => {

        // Get Stored User Data
        let userData = this.localStorage.retrieve('userData');

        // Define API Authentication
        let headers: HttpHeaders = new HttpHeaders({"Authorization": "Token " + userData.authToken});

        // Fetch User Plugin Action Right
        this.http.get(`${appConfig.config.apiRootUrl}pluginactionright/list&self`, { headers }).subscribe(
          (res: any[]) => {

            // Store User Plugin Action Right
            this.userData.pluginActionRight = res;

            // Store User Plugin Action Right
            userData['pluginActionRight'] = res;
            this.localStorage.store('userData', userData);

            // Resolve
            resolve(true);

          },
          err => {

            // No User Plugin Action Right
            this.userData.pluginActionRight = null;

            // Clean Up
            this.cookieService.delete('token', '/');
            this.localStorage.clear('userData');

            // Reload
            location.reload(true);

            // Message
            console.error('Unable to get user plugin action rights');

            // Reject
            resolve(true);

          }
        );

      }
    );
  }


  // Load User Data Plugin Option Right
  fetchUserDataPluginOptionRight(appConfig) {
    return new Promise(
      (resolve, reject) => {

        // Get Stored User Data
        let userData = this.localStorage.retrieve('userData');

        // Define API Authentication
        let headers: HttpHeaders = new HttpHeaders({"Authorization": "Token " + userData.authToken});

        // Fetch User Plugin Option Right
        this.http.get(`${appConfig.config.apiRootUrl}pluginoptionright/list&self`, { headers }).subscribe(
          (res: any[]) => {

            // Store User Plugin Option Right
            this.userData.pluginOptionRight = res;

            // Store User Plugin Option Right
            userData['pluginOptionRight'] = res;
            this.localStorage.store('userData', userData);

            // Resolve
            resolve(true);

          },
          err => {

            // No User Plugin Option Right
            this.userData.pluginOptionRight = null;

            // Clean Up
            this.cookieService.delete('token', '/');
            this.localStorage.clear('userData');

            // Reload
            location.reload(true);

            // Message
            console.error('Unable to get user plugin option rights');

            // Reject
            resolve(true);

          }
        );

      }
    );
  }


  // Load User Data
  loadUserData(hashConfig, appConfig) {

    // Get Cookie Auth Token
    let cookieToken = this.cookieService.get('token');

    // Check Cookie Auth Token
    if (!cookieToken) {
      return new Promise((resolve, reject) => { resolve(true); });
    }

    // Get Stored User Data
    let userData = this.localStorage.retrieve('userData');
    if (!userData) { userData = {}; }

    // No Authentication Token Match
    if ((!objLib.lookUpKey(userData, 'authToken')) || (!userData.authToken) || (userData.authToken != cookieToken)) {

      // Clean Up
      this.userData = {'info': {}, 'right': {}, 'pluginActionRight': {}, 'pluginOptionRight': {}};
      this.userData['authToken'] = cookieToken;
      userData = {'info': {}, 'right': {}, 'pluginActionRight': {}, 'pluginOptionRight': {}};
      userData['authToken'] = cookieToken;

      // Store
      this.localStorage.store('userData', userData);

      // Fetch All
      return this.fetchUserDataInfo(appConfig).then(
        () => {
          return Promise.all([
            this.fetchUserDataRight(appConfig),
            this.fetchUserDataPluginActionRight(appConfig),
            this.fetchUserDataPluginOptionRight(appConfig)
          ]);
        }
      );

    }

    // Authentication Token Match
    else if (userData.authToken == cookieToken) {

      // Cache Present
      return this.fetchUserDataInfo(appConfig).then(
        () => {

          // No Cache Functions
          let noCache = [];

          // Get Stored Hashes
          let configHashes = this.localStorage.retrieve('configHashes');

          // Get Stored User Data
          let userData = this.localStorage.retrieve('userData');

          // Hashes Present?
          if (configHashes && objLib.lookUpKey(configHashes, 'right') && (configHashes.right)) {

            // Config Present & Up To Date
            if (userData && objLib.lookUpKey(userData, 'right') && (userData.right) && (configHashes.right == hashConfig.config.right)) {
              console.log('User rights up-to-date');
              this.userData.right = cloneDeep(userData.right);
            }

            // Config Not Present or Not Up To Date
            else {
              configHashes['right'] = cloneDeep(hashConfig.config.right);
              this.localStorage.store('configHashes', configHashes);
              noCache.push(this.fetchUserDataRight(appConfig));
            }

          }

          // No Hashes Stored
          else {
            if (!configHashes) { configHashes = {}; }
            configHashes['right'] = cloneDeep(hashConfig.config.right);
            this.localStorage.store('configHashes', configHashes);
            noCache.push(this.fetchUserDataRight(appConfig));
          }

          // Hashes Present?
          if (configHashes && objLib.lookUpKey(configHashes, 'pluginActionRight') && (configHashes.pluginActionRight)) {

            // Config Present & Up To Date
            if (userData && objLib.lookUpKey(userData, 'pluginActionRight') && (userData.pluginActionRight) && (configHashes.pluginActionRight == hashConfig.config.pluginActionRight)) {
              console.log('User plugin action rights up-to-date');
              this.userData.pluginActionRight = cloneDeep(userData.pluginActionRight);
            }

            // Config Not Present or Not Up To Date
            else {
              configHashes['pluginActionRight'] = cloneDeep(hashConfig.config.pluginActionRight);
              this.localStorage.store('configHashes', configHashes);
              noCache.push(this.fetchUserDataPluginActionRight(appConfig));
            }

          }

          // No Hashes Stored
          else {
            if (!configHashes) { configHashes = {}; }
            configHashes['pluginActionRight'] = cloneDeep(hashConfig.config.pluginActionRight);
            this.localStorage.store('configHashes', configHashes);
            noCache.push(this.fetchUserDataPluginActionRight(appConfig));
          }

          // Hashes Present?
          if (configHashes && objLib.lookUpKey(configHashes, 'pluginOptionRight') && (configHashes.pluginOptionRight)) {

            // Config Present & Up To Date
            if (userData && objLib.lookUpKey(userData, 'pluginOptionRight') && (userData.pluginOptionRight) && (configHashes.pluginOptionRight == hashConfig.config.pluginOptionRight)) {
              console.log('User plugin option rights up-to-date');
              this.userData.pluginOptionRight = cloneDeep(userData.pluginOptionRight);
            }

            // Config Not Present or Not Up To Date
            else {
              configHashes['pluginOptionRight'] = cloneDeep(hashConfig.config.pluginOptionRight);
              this.localStorage.store('configHashes', configHashes);
              noCache.push(this.fetchUserDataPluginOptionRight(appConfig));
            }

          }

          // No Hashes Stored
          else {
            if (!configHashes) { configHashes = {}; }
            configHashes['pluginOptionRight'] = cloneDeep(hashConfig.config.pluginOptionRight);
            this.localStorage.store('configHashes', configHashes);
            noCache.push(this.fetchUserDataPluginOptionRight(appConfig));
          }

          // Promise all NoCache
          if (noCache.length) { return Promise.all(noCache); }

          // Nothing to do
          else { return new Promise((resolve, reject) => { resolve(true); }); }

        }
      );

    }

  }

}
