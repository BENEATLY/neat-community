/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-start-orig/
    Contact:    https://neatly.be/
*/


// Imports: Default
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';

// Imports: Custom Services
import { DataService } from '@app/data.service';
import { TimezoneService } from '@app/timezone.service';
import { TranslationService } from '@app/translation.service';
import { LicenseService } from '@app/license.service';
import { SnackBarService } from '@app/snackbar.service';
import { ModalService } from '@modal/services/modal.service';

// Imports: Observables
import { Observable } from 'rxjs/Rx';

// Imports: Config Loaders
import { AppConfig } from '@app/app.config';
import { HashConfig } from '@app/hash.config';

// Imports: Translation
import { TranslateService } from '@ngx-translate/core';

// Imports: Libraries
import * as pluginLib from '@library/plugin';
import * as definitionsLib from '@library/definitions';
import * as rightLib from '@library/right';
import * as modalLib from '@library/modal';
import * as objLib from '@library/object';
import * as syncLib from '@library/sync';
import * as dataLib from '@library/data';
import * as routeLib from '@library/route';


// Declarations: JQuery
declare var $: any;


// Component Definition
@Component({selector: 'app-settings-plugin-overview', templateUrl: './overview.component.html'})


// Component Export Definition
export class SettingsPluginOverviewComponent implements OnInit {

  // Libraries
  pluginLib = pluginLib;
  definitionsLib = definitionsLib;
  rightLib = rightLib;
  modalLib = modalLib;
  objLib = objLib;
  syncLib = syncLib;
  dataLib = dataLib;
  routeLib = routeLib;

  // jQuery
  jquery = $;

  // Object Definitions (Non-Configurable)
  objectName = 'Plugin';
  objectDefinition = 'Plugin';

  // Results (Non-Configurable)
  resultInfo = {'model': null};

  // Table Columns (Non-Configurable)
  columns = {'model': {}};

  // Access Level (Non-Configurable)
  accessLevel = {'selected': 'all', 'options': ['all']};
  disabledLevel = ['isolated', 'own'];

  // Sorting (Non-Configurable)
  sortingArray = {'model': {'attr': null, 'order': true}};

  // Filtering (Non-Configurable)
  filterArray = {
    'model': [
      {
        'property': [null],
        'comparator': null,
        'ref': null,
        'object': [this.objectDefinition],
        'lastProperty': null
      }
    ]
  };
  filterState = {'applied': true, 'lastFilter': null};
  filterPanel = {'model': false};

  // Pages (Non-Configurable)
  pageInfo = {'model': {'page': 1, 'perPage': 500, 'maxPage': 1, 'total': null, 'exist': null}};

  // Display Options (Non-Configurable)
  displayOptions = {'model': {'extendQuery': 'status'}};

  // Passed Parameters
  passedParameters = [];

  // CRUD Options (Non-Configurable)
  crudOptions = {};

  // Custom Modal Libraries (Non-Configurable)
  modalLibs = {};

  // Snackbar Position
  snackBarPosition = 'double-header';

  // Plugin Verification (Non-Configurable)
  pluginVerification = {};

  // Update Observable
  updateObserver;

  // Plugin Refresh Time
  waitTime = 2500;
  refreshTime = 6000;

  // Context Reference
  context = this;


  // Component Definition
  constructor(public router: Router, public route: ActivatedRoute, public data: DataService, public http: HttpClient, public cookieService: CookieService, public appConfig: AppConfig, private hashConfig: HashConfig, public modalService: ModalService, public snackBar: SnackBarService, public timezone: TimezoneService, public translate: TranslateService, public translation: TranslationService, private license: LicenseService) {

    // Translate
    let lang = this.translation.translation.translationFile;
    this.translate.setTranslation(lang, this.translation.translationContent);
    this.translate.setDefaultLang(lang);

    // Select Correct Navbar Item (Default)
    this.data.flagNewPath(this.route.snapshot.url);

    // Route Allowed?
    this.routeAllowed();

    // Update if in Transition (every 10 seconds)
    this.updateObserver = Observable.interval(this.refreshTime).subscribe(x => {
      if (this.resultInfo.model && (!pluginLib.pluginActionPossible(this.resultInfo.model))) { this.update(); }
    });

  }


  // Page Initialisation
  ngOnInit() {

    // Update Results
    this.update();

    // Update Hook
    $('#update-required').on("update", () => { this.update(); });

    // Config Hook
    $('#update-required').on("config", () => { this.reloadConfig(); });

  }

  // Page Destruction
  ngOnDestroy() {

    // Cancel Subscription
    this.updateObserver.unsubscribe();

  }


  // Route Allowed?
  routeAllowed() {

    // Sufficient Rights?
    if (!rightLib.sufficientRights(this.data.userData.right, this.objectDefinition, 'Edit', 'all')) { this.router.navigate([`dashboard`]); }

    // Return OK
    return true;

  }

  // Reload Config
  async reloadConfig() {

    // Load New Config
    await this.appConfig.load(this.hashConfig);

    // Reload
    location.reload(true);

  }

  // Modify Parameters Function
  modParamsFunc(translate, item) {

    // Description
    item['description'] = translate.instant('plugin.' + item['shortName'] + '.description');

    // Status
    if (item['installed']) {

      if (item['activated']) {

        // Deactivating
        if (item['transition'] != null) { item['status'] = translate.instant('common.plugin.deactivating'); }

        // Activated
        else { item['status'] = translate.instant('common.plugin.activated'); }

      }

      else {

        if (item['transition'] != null) {

          // Activating
          if (item['transition']) { item['status'] = translate.instant('common.plugin.activating'); }

          // Uninstalling
          else { item['status'] = translate.instant('common.plugin.uninstalling'); }

        }

        // Installed
        else { item['status'] = translate.instant('common.plugin.installed'); }

        // No Configuration Possible
        item['configPage'] = null;

      }

    }
    else {

      // No Configuration Possible
      item['configPage'] = null;

      // Installing
      if (item['transition'] != null) { item['status'] = translate.instant('common.plugin.installing'); }

      // Not Installed
      else { item['status'] = translate.instant('common.plugin.not-installed'); }

    }

    // Progress
    if (item['progress'] == 0) { item['progress'] = null; }

    // Tags
    item['tags'] = translate.instant('plugin.' + item['shortName'] + '.tags');

    // Logs
    item['logs'] = true;

    // Service Status
    if (item.services.length > 0) {
      if (item.services.map(service => service.status).includes(false)) { item['serviceStatus'] = translate.instant('service.status.failed'); }
      else { item['serviceStatus'] = translate.instant('service.status.running'); }
    }
    else { item['serviceStatus'] = null; }

  }

  // Modify Columns Function
  modColumnsFunc(columns, results) {

    // Progress Function
    columns['model']['progress'] = results.filter(x => (x['transition'] != null)).length;

  }

  // Update Results
  async update() {

    // Get Page Info
    dataLib.getPageInfo(this.appConfig.config, this.data.userData, 'model', this.objectDefinition, this.columns, this.pageInfo, this.resultInfo, this.accessLevel, this.sortingArray, this.filterArray, this.filterState, this.displayOptions, [this.modParamsFunc, this.modColumnsFunc], this.translate, this.timezone, this.snackBar, this.cookieService, this.http);

  }

  // Open Help
  openHelp(context) { context.modalLib.helpModal(context.modalService, {'object': {'name': context.objectName, 'definition': context.objectDefinition, 'properties': context.objLib.getKeys(context.columns.model), 'right': context.definitionsLib.lookUpDefinitions(context.appConfig.config, context.data.userData.right, 'Get', context.objectDefinition), 'accessLevel': context.accessLevel.selected}}); }

}
