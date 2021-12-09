/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-start-orig/
    Contact:    https://neatly.be/
*/


// Imports: Default
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';

// Imports: Custom Services
import { DataService } from '@app/data.service';
import { TimezoneService } from '@app/timezone.service';
import { TranslationService } from '@app/translation.service';
import { SnackBarService } from '@app/snackbar.service';

// Imports: Config Loaders
import { AppConfig } from '@app/app.config';
import { PluginConfig } from '@app/plugin.config';

// Imports: Translation
import { TranslateService } from '@ngx-translate/core';

// Imports: Libraries
import * as timeLib from '@library/time';
import * as objLib from '@library/object';
import * as valLib from '@library/validate';
import * as sslLib from '@library/ssl';
import * as rightLib from '@library/right';
import * as presentLib from '@library/presentation';


// Declarations: JQuery
declare var $: any;


// Component Definition
@Component({selector: 'app-settings-ssl', templateUrl: './ssl.component.html'})


// Component Export Definition
export class SettingsSSLComponent implements OnInit {

  // Libraries
  timeLib = timeLib;
  objLib = objLib;
  valLib = valLib;
  sslLib = sslLib;
  rightLib = rightLib;
  presentLib = presentLib;

  // jQuery
  jquery = $;

  // SSL Info (Non-Configurable)
  sslInfo = {} as any;

  // Context Reference
  context = this;


  // Component Definition
  constructor(public router: Router, public route: ActivatedRoute, public data: DataService, public http: HttpClient, public cookieService: CookieService, public appConfig: AppConfig, public pluginConfig: PluginConfig, public snackBar: SnackBarService, public timezone: TimezoneService, public translate: TranslateService, public translation: TranslationService) {

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
  ngOnInit() {

    // Update Results
    this.update();

    // Update Hook
    $('#update-required').on("update", () => { this.update(); });

  }


  // Route Allowed?
  routeAllowed() {

    // Sufficient Rights?
    if (!rightLib.sufficientRights(this.data.userData.right, 'Right', 'Edit', 'all')) { this.router.navigate([`dashboard`]); }

    // Return OK
    return true;

  }

  // Update Results
  async update() {

    // Define API Authentication
    let token = this.cookieService.get('token');
    let headers: HttpHeaders = new HttpHeaders({"Authorization": "Token " + token});

    // SSL Check & Warning
    let sslInfo = await sslLib.sslCheck(this.appConfig.config, this.data.userData, this.translate, this.http, this.snackBar, this.cookieService, this.router, 'double-header', true);
    this.sslInfo = sslInfo;

  }

  // Upload Certificate
  uploadCertificate(context, event) { context.sslLib.uploadCertificateFile(event.target.files, context.appConfig.config, context.snackBar, context.cookieService, context.http, context.jquery('#update-required')); }

  // Upload Key
  uploadKey(context, event) { context.sslLib.uploadKeyFile(event.target.files, context.appConfig.config, context.snackBar, context.cookieService, context.http, context.jquery('#update-required')); }

  // Switch API Protocol
  switchAPIProtocol(context) { context.sslLib.switchAPIProtocol(context.sslLib.getAvailableAPIProtocol(context.appConfig.config), context.appConfig.config, context.snackBar, context.cookieService, context.http); }

  // Switch GUI Protocol
  switchGUIProtocol(context) { context.sslLib.switchGUIProtocol(context.sslLib.getAvailableGUIProtocol(context.appConfig.config), context.appConfig.config, context.snackBar, context.cookieService, context.http); }

}
