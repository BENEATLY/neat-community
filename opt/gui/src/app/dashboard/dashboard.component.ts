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
import { TranslationService } from '@app/translation.service';
import { SnackBarService } from '@app/snackbar.service';

// Imports: Config Loaders
import { AppConfig } from '@app/app.config';

// Imports: Translation
import { TranslateService } from '@ngx-translate/core';

// Imports: Libraries
import * as sslLib from '@library/ssl';


// Declarations: JQuery
declare var $: any;


// Component Definition
@Component({selector: 'app-dashboard', templateUrl: './dashboard.component.html'})


// Component Export Definition
export class DashboardComponent implements OnInit {

  // Libraries
  sslLib = sslLib;

  // jQuery
  jquery = $;

  // Context Reference
  context = this;


  // Constructor
  constructor(public router: Router, public route: ActivatedRoute, public data: DataService, private http: HttpClient, private cookieService: CookieService, public appConfig: AppConfig, private snackBar: SnackBarService, public translate: TranslateService, public translation: TranslationService) {

    // Translate
    let lang = this.translation.translation.translationFile;
    this.translate.setTranslation(lang, this.translation.translationContent);
    this.translate.setDefaultLang(lang);

    // Select Correct Navbar Item (Default)
    this.data.flagNewPath(this.route.snapshot.url);

  }


  // Page Initialisation
  async ngOnInit() {

    // SSL Check
    sslLib.sslCheck(this.appConfig.config, this.data.userData, this.translate, this.http, this.snackBar, this.cookieService, this.router, 'double-header', false);

  }

}
