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
import { SnackBarService } from '@app/snackbar.service';

// Imports: Config Loaders
import { AppConfig } from '@app/app.config';
import { HashConfig } from '@app/hash.config';

// Imports: Translation
import { TranslateService } from '@ngx-translate/core';

// Imports: Libraries
import * as rightLib from '@library/right';
import * as presentLib from '@library/presentation';
import * as mapLib from '@library/map';
import * as dataLib from '@library/data';
import * as objLib from '@library/object';
import * as timeLib from '@library/time';
import * as routeLib from '@library/route';


// Declarations: JQuery
declare var $: any;


// Component Definition
@Component({selector: 'app-user-info', templateUrl: './info.component.html'})


// Component Export Definition
export class UserInfoComponent implements OnInit {

  // Libraries
  rightLib = rightLib;
  presentLib = presentLib;
  mapLib = mapLib;
  dataLib = dataLib;
  objLib = objLib;
  timeLib = timeLib;
  routeLib = routeLib;

  // jQuery
  jquery = $;

  // Object Definitions (Non-Configurable)
  objectName = 'User';
  objectDefinition = 'User';

  // Results (Non-Configurable)
  resultInfo = {'activesession': null};

  // Display Options (Non-Configurable)
  displayOptions = {'model': {'level': 'own'}};

  // Custom Modal Libraries (Non-Configurable)
  modalLibs = {};

  // MapBox Map Config
  mapConfig: any = null;

  // Context Reference
  context = this;


  // Constructor
  constructor(public router: Router, public route: ActivatedRoute, public data: DataService, public http: HttpClient, public cookieService: CookieService, public appConfig: AppConfig, private hashConfig: HashConfig, public snackBar: SnackBarService, public timezone: TimezoneService, public translate: TranslateService, public translation: TranslationService) {

    // Translate
    let lang = this.translation.translation.translationFile;
    this.translate.setTranslation(lang, this.translation.translationContent);
    this.translate.setDefaultLang(lang);

    // Select Correct Navbar Item (Default)
    this.data.flagNewPath(this.route.snapshot.url);

    // Route Allowed?
    this.routeAllowed();

  }


  // Page Initialisation
  async ngOnInit() {

    // Update Hook
    $('#update-required').on("update", () => { this.reloadConfig(); });

    // Get Page Info
    dataLib.getPageInfo(this.appConfig.config, this.data.userData, 'activesession', 'ActiveSession', dataLib.defaultColumns('activesession'), dataLib.defaultPageInfo('activesession', 21), this.resultInfo, null, dataLib.defaultSortingArray('activesession'), dataLib.defaultFilterArray('activesession', this.objectDefinition), dataLib.defaultFilterState(), {'activesession': {'level': 'own'}}, null, this.translate, this.timezone, this.snackBar, this.cookieService, this.http);

    // Set Map Config
    this.mapConfig = {
      "style": "mapbox://styles/tdha/ckc29zf7o25yg1imnuaqzhsq5",
      "zoom": 2,
      "center": await mapLib.findLocationCenterPoint(this.timezone.location, this.http),
      "minzoom": 1,
      "maxzoom": 10,
      "layer": [
        {
          "name": "timezone",
          "type": "fill",
          "layout": {},
          "paint": {"fill-color": "#222", "fill-opacity": 0.5},
          "source": {
            "type": "geojson",
            "data": await mapLib.determineTimezoneContoursByLocation(this.timezone.location, this.http, true)
          }
        },
        {
          "name": "current-location",
          "type": "fill",
          "layout": {},
          "paint": {"fill-color": "#272e64", "fill-opacity": 0.8},
          "source": {
            "type": "geojson",
            "data": await mapLib.determineTimezoneContoursByLocation(this.timezone.location, this.http, false)
          }
        }
      ]
    };

  }


  // Route Allowed?
  routeAllowed() {

    // Sufficient Rights?
    if (!rightLib.sufficientRights(this.data.userData.right, 'User', 'Get', 'own')) { this.router.navigate([`dashboard`]); }
    if (!rightLib.sufficientRights(this.data.userData.right, 'ActiveSession', 'Get', 'own')) { this.router.navigate([`dashboard`]); }

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

  // Log Out
  logOut(context) { context.routeLib.navigate(context.router, 'user/logout'); }

  // Navigate to Session
  navigateToSession(context) { context.routeLib.navigate(context.router, 'user/session'); }

  // Navigate to Language
  navigateToLanguage(context) { context.routeLib.navigate(context.router, 'user/language'); }

  // Navigate to Timezone
  navigateToTimezone(context) { context.routeLib.navigate(context.router, 'user/timezone'); }

}
