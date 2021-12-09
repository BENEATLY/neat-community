/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-community/
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

// Imports: Config Loaders
import { AppConfig } from '@app/app.config';

// Imports: Translation
import { TranslateService } from '@ngx-translate/core';

// Imports: Libraries
import * as rightLib from '@library/right';
import * as dataLib from '@library/data';
import * as routeLib from '@library/route';
import * as translateLib from '@library/translate';
import * as definitionsLib from '@library/definitions';


// Declarations: JQuery
declare var $: any;


// Component Definition
@Component({selector: 'app-settings-pluginoptionright', templateUrl: './pluginoptionright.component.html'})


// Component Export Definition
export class SettingsPluginOptionRightComponent implements OnInit {

  // Libraries
  rightLib = rightLib;
  dataLib = dataLib;
  routeLib = routeLib;
  translateLib = translateLib;
  definitionsLib = definitionsLib;

  // jQuery
  jquery = $;

  // Object Definitions (Non-Configurable)
  objectName = 'PluginOptionRight';
  objectDefinition = 'PluginOptionRight';

  // Results (Non-Configurable)
  resultInfo = {'model': null};

  // Table Columns (Non-Configurable)
  columns = {'model': {}};

  // Access Level (Non-Configurable)
  accessLevel = {'selected': null, 'options': []};
  disabledLevel = [];

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
  pageInfo = {'model': {'page': 1, 'perPage': 50, 'maxPage': 1, 'total': null, 'exist': null}};

  // Display Options (Non-Configurable)
  displayOptions = {};

  // Passed Parameters
  passedParameters = [];

  // CRUD Options (Non-Configurable)
  crudOptions = {};

  // Custom Modal Libraries (Non-Configurable)
  modalLibs = {};

  // Selected Right (Non-Configurable)
  selected = {'model': null};

  // Context Reference
  context = this;


  // Component Definition
  constructor(public router: Router, public route: ActivatedRoute, public data: DataService, public http: HttpClient, public cookieService: CookieService, public appConfig: AppConfig, public snackBar: SnackBarService, public timezone: TimezoneService, public translate: TranslateService, public translation: TranslationService, private license: LicenseService) {

    // Translate
    let lang = this.translation.translation.translationFile;
    this.translate.setTranslation(lang, this.translation.translationContent);
    this.translate.setDefaultLang(lang);

    // Select Correct Navbar Item (Default)
    this.data.flagNewPath(this.route.snapshot.url);

    // Route Allowed?
    this.routeAllowed();

    // Set Access Level
    this.accessLevel = definitionsLib.createViewList(this.appConfig.config, this.data.userData.right, 'Get', this.objectDefinition, this.disabledLevel);

    // Get Result ID
    this.route.params.subscribe( params => { this.passedParameters = routeLib.getRouteParameters(params); });

  }


  // Page Initialisation
  ngOnInit() {

    // Add Filtering for Passed Parameters
    routeLib.addPassedParameterFiltering(this.appConfig.config, this.data.userData.right, 'Get', this.objectDefinition, this.passedParameters, this.filterArray, 'model');

    // Update Results
    this.update();

    // Update Hook
    $('#update-required').on("update", () => { this.update(); });

  }


  // Route Allowed?
  routeAllowed() {

    // Sufficient Rights?
    if (!rightLib.sufficientRights(this.data.userData.right, this.objectDefinition, 'Edit', 'all')) { this.router.navigate([`dashboard`]); }

    // Return OK
    return true;

  }

  // Update Results
  async update() {

    // Get Page Info
    dataLib.getPageInfo(this.appConfig.config, this.data.userData, 'model', this.objectDefinition, this.columns, this.pageInfo, this.resultInfo, this.accessLevel, this.sortingArray, this.filterArray, this.filterState, this.displayOptions, [this.modParamsFunc, this.modColumnsFunc], this.translate, this.timezone, this.snackBar, this.cookieService, this.http);

  }

  // Modify Parameters Function
  modParamsFunc(translate, item) {

    // Has Description?
    if (translateLib.hasTranslation(translate, ('plugins.' + item['plugin']['id'].toString() + '.help.properties.' + item['group'] + '.' + item['option']))) {

      // Description
      item['description'] = translate.instant('plugins.' + item['plugin']['id'].toString() + '.help.properties.' + item['group'] + '.' + item['option']);

    }

    // No Description
    else { item['description'] = null; }

  }

  // Modify Columns Function
  modColumnsFunc(columns, results) {

    // Progress Function
    columns['model']['description'] = true;

  }

}
