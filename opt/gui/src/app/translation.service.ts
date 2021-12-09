/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-community/
    Contact:    https://neatly.be/
*/


// Imports: Required
import { Injectable } from '@angular/core';

// Imports: Default
import { CookieService } from 'ngx-cookie-service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LocalStorageService } from 'ngx-webstorage';

// Imports: Config Loaders
import { HashConfig } from '@app/hash.config';

// Imports: Libraries
import * as objLib from '@library/object';

// Imports: Tools
import * as cloneDeep from 'lodash/cloneDeep';


// Class Export Definition
@Injectable()
export class TranslationService {

  // Define Properties
  private defaultLocale: string = 'en-US';
  public translationOptions = [];
  public translation = null;
  public translationContent = {};


  // Constructor
  constructor(private http: HttpClient, private cookieService: CookieService, private localStorage: LocalStorageService, private hashConfig: HashConfig) {}


  // Set Preference
  setPreference(translation) {

    // Set Current Translation
    this.translation = translation;

    // Store Cookie to Store Language Preference
    this.cookieService.set('langPref', translation.locale, 99999, '/');

    // Set Translation Content
    this.setTranslationContent(this.hashConfig, translation, null, null);

    // Reload Window
    location.reload();

  }

  // Is Active Translation?
  isActiveTranslation(translation) { return (this.translation.id == translation.id); }

  // Set Translation Content
  setTranslationContent(hashConfig, translation, resolve, reject) {

    // Get Hashes
    let configHashes = this.localStorage.retrieve('configHashes');

    // Hashes Stored
    if (configHashes && objLib.lookUpKey(configHashes, 'translationFile') && objLib.lookUpKey(configHashes['translationFile'], translation.translationFile + '.json') && configHashes['translationFile'][translation.translationFile + '.json']) {

      // Get Stored Translation Config
      let translationConfig = this.localStorage.retrieve('translationConfig');

      // Config Present & Up To Date
      if (translationConfig && objLib.lookUpKey(translationConfig, 'contents') && objLib.lookUpKey(translationConfig['contents'], translation.translationFile + '.json') && translationConfig['contents'][translation.translationFile + '.json'] && (configHashes['translationFile'][translation.translationFile + '.json'] == hashConfig.config.translationFile[translation.translationFile + '.json'])) {

        // Success Message
        console.log('Translation ' + translation.translationFile + '.json' + ' up-to-date');

        // Set Translation Content
        this.translationContent = translationConfig['contents'][translation.translationFile + '.json'];

        // Resolve
        if (resolve) { resolve(true); }

      }

      // Config Not Present or Not Up To Date
      else {
        configHashes['translationFile'][translation.translationFile + '.json'] = cloneDeep(hashConfig.config.translationFile[translation.translationFile + '.json']);
        this.localStorage.store('configHashes', configHashes);
        this.fetchTranslationContent(translation, resolve, reject);
      }

    }

    // No Hashes Stored
    else {
      if (!configHashes) { configHashes = {}; }
      if (!objLib.lookUpKey(configHashes, 'translationFile')) { configHashes['translationFile'] = {}; }
      configHashes['translationFile'][translation.translationFile + '.json'] = cloneDeep(hashConfig.config.translationFile[translation.translationFile + '.json']);
      this.localStorage.store('configHashes', configHashes);
      this.fetchTranslationContent(translation, resolve, reject);
    }

  }

  // Fetch Translation Content
  fetchTranslationContent(translation, resolve, reject) {

    // Refuse Caching
    let headers: HttpHeaders = new HttpHeaders({'Cache-Control': 'no-cache, no-store, must-revalidate, post-check=0, pre-check=0', 'Pragma': 'no-cache', 'Expires': '0'});

    // Get Translation Content
    this.http.get('./assets/translations/' + translation.translationFile + '.json', { headers }).subscribe(
      (content: any) => {

        // Get Stored Translation Config
        let translationConfig = this.localStorage.retrieve('translationConfig');

        // Set Translation Content
        this.translationContent = content;

        // Store Translation Content
        if (!translationConfig) { translationConfig = {}; }
        if (!objLib.lookUpKey(translationConfig, 'contents')) { translationConfig['contents'] = {}; }
        translationConfig['contents'][translation.translationFile + '.json'] = content;
        this.localStorage.store('translationConfig', translationConfig);

        // Resolve
        if (resolve) { resolve(true); }

      },
      err => {

        // Get Stored Translation Config
        let translationConfig = this.localStorage.retrieve('translationConfig');

        // Set Translation Content
        this.translationContent = null;

        // Store Translation Content
        if (!translationConfig) { translationConfig = {}; }
        if (!objLib.lookUpKey(translationConfig, 'contents')) { translationConfig['contents'] = {}; }
        translationConfig['contents'][translation.translationFile + '.json'] = null;
        this.localStorage.store('translationConfig', translationConfig);

        // Reject
        if (reject) { reject('Unable to get translation content'); }
        else { console.error('Unable to get translation content'); }

      }
    );

  }

  // Determine Used Translation
  determineUsedTranslation(hashConfig, options, resolve, reject) {

    // Get Locale
    let locale = (window.navigator['userLanguage'] || window.navigator.language);

    // Get Translation Options
    this.translationOptions = options;

    // Check if Cookie Preference was Set
    let langPref = this.cookieService.get('langPref');
    if (langPref.length > 0) {

      // Get Translation
      let translation = options.filter(trans => (trans.locale.toLowerCase() == langPref.toLowerCase()));
      if (translation.length == 1) {

        // Set Translation
        this.translation = translation[0];

        // Set Translation Content
        this.setTranslationContent(hashConfig, translation[0], resolve, reject);

      }
      else {

        // Set Translation
        let translation = options.filter(trans => (trans.locale.toLowerCase() == this.defaultLocale.toLowerCase()))[0];
        this.translation = translation;
        this.cookieService.delete('langPref', '/');

        // Set Translation Content
        this.setTranslationContent(hashConfig, translation, resolve, reject);

      }

    }
    else {

      // Get Translation
      let translation = options.filter(trans => (trans.locale.toLowerCase() == locale.toLowerCase()));
      if (translation.length == 1) {

        // Set Translation
        this.translation = translation[0];

        // Set Translation Content
        this.setTranslationContent(hashConfig, translation[0], resolve, reject);

      }
      else {

        // Set Translation
        let translation = options.filter(trans => (trans.locale.toLowerCase() == this.defaultLocale.toLowerCase()))[0];
        this.translation = translation;

        // Set Translation Content
        this.setTranslationContent(hashConfig, translation, resolve, reject);

      }

    }

  }

  // Fetch Available Translations
  fetchAvailableTranslations(hashConfig, appConfig, resolve, reject) {

    // Refuse Caching
    let headers: HttpHeaders = new HttpHeaders({'Cache-Control': 'no-cache, no-store, must-revalidate, post-check=0, pre-check=0', 'Pragma': 'no-cache', 'Expires': '0'});

    // Get Translations
    this.http.get(`${appConfig.config['apiRootUrl']}` + 'translation/available', { headers }).subscribe(
      (options: any) => {

        // Get Stored Translation Config
        let translationConfig = this.localStorage.retrieve('translationConfig');
        if (!translationConfig) { translationConfig = {}; }

        // Store Available Translations
        translationConfig['available'] = options;
        this.localStorage.store('translationConfig', translationConfig);

        // Determine Translation to Use
        this.determineUsedTranslation(hashConfig, options, resolve, reject);

      },
      err => {

        // Get Stored Translation Config
        let translationConfig = this.localStorage.retrieve('translationConfig');
        if (!translationConfig) { translationConfig = {}; }

        // Store Available Translations
        translationConfig['available'] = [];
        this.localStorage.store('translationConfig', translationConfig);

        // Reject
        reject('No available translation was found!');

      }
    );

  }

  // Load Translation
  loadTranslation(hashConfig, appConfig) {
    return new Promise(
      (resolve, reject) => {

        // Get Hashes
        let configHashes = this.localStorage.retrieve('configHashes');

        // Hashes Stored
        if (configHashes && objLib.lookUpKey(configHashes, 'availableTranslations') && (configHashes.availableTranslations)) {

          // Get Stored Translation Config
          let translationConfig = this.localStorage.retrieve('translationConfig');

          // Config Present & Up To Date
          if (translationConfig && objLib.lookUpKey(translationConfig, 'available') && (translationConfig.available) && (configHashes.availableTranslations == hashConfig.config.availableTranslations)) {

            // Success Message
            console.log('Available translation config up-to-date');

            // Determine Translation to Use
            this.determineUsedTranslation(hashConfig, translationConfig.available, resolve, reject);

          }

          // Config Not Present or Not Up To Date
          else {
            configHashes['availableTranslations'] = cloneDeep(hashConfig.config.availableTranslations);
            this.localStorage.store('configHashes', configHashes);
            this.fetchAvailableTranslations(hashConfig, appConfig, resolve, reject);
          }

        }

        // No Hashes Stored
        else {
          if (!configHashes) { configHashes = {}; }
          configHashes['availableTranslations'] = cloneDeep(hashConfig.config.availableTranslations);
          this.localStorage.store('configHashes', configHashes);
          this.fetchAvailableTranslations(hashConfig, appConfig, resolve, reject);
        }

      }
    );

  }

}
