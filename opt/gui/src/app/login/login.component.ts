/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-community/
    Contact:    https://neatly.be/
*/


// Imports: Default
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';

// Imports: Custom Services
import { DataService } from '@app/data.service';
import { TranslationService } from '@app/translation.service';
import { SnackBarService } from '@app/snackbar.service';

// Imports: Config Loaders
import { AppConfig } from '@app/app.config';
import { PluginConfig } from '@app/plugin.config';

// Imports: Translation
import { TranslateService } from '@ngx-translate/core';

// Imports: Libraries
import * as routeLib from '@library/route';
import * as presentLib from '@library/presentation';


// Declarations: JQuery
declare var $: any;


// Component Definition
@Component({selector: 'app-login', templateUrl: './login.component.html'})


// Component Export Definition
export class LogInComponent implements OnInit {

  // Libraries
  routeLib = routeLib;
  presentLib = presentLib;

  // jQuery
  jquery = $;

  // Login Limitations (Configurable)
  MaxUserNameLength = 20;
  MaxPasswordLength = 40;
  userName = '';
  password = '';

  // Application Info
  appLogo = '';


  // Constructor
  constructor(private router: Router, private route: ActivatedRoute, public data: DataService, private http: HttpClient, private cookieService: CookieService, public appConfig: AppConfig, public pluginConfig: PluginConfig, private snackBar: SnackBarService, public translate: TranslateService, public translation: TranslationService) {

    // Translate
    let lang = this.translation.translation.translationFile;
    this.translate.setTranslation(lang, this.translation.translationContent);
    this.translate.setDefaultLang(lang);

    // Select Correct Navbar Item (Default)
    this.data.flagNewPath(this.route.snapshot.url);

    // Get App Logo
    this.appLogo = presentLib.getAppLogo(this.appConfig, this.pluginConfig);

  }


  // Page Initialisation
  ngOnInit() { }


  // Log In Submit Disabled
  logInSubmitDisabled() { return ((this.userName.length == 0) || (this.password.length == 0)); }

  // Perform Log In Attempt
  logInAttempt() {

    // Define API Authentication (Basic Auth)
    let headers: HttpHeaders = new HttpHeaders({"Authorization": "Basic " + btoa(this.userName + ':' + this.password)});

    // Perform Log In API Call
    this.http.get(`${this.appConfig.config['apiRootUrl']}login`, { headers }).subscribe(

      // Successful Authentication
      res => {

        // Authentication Successful
        if (res['authentication']) {

          // Dismiss Snackbar
          this.snackBar.dismiss();

          // Store Token
          this.cookieService.set('token', res['token'], res['expiryDate'], '/');

          // Trigger Log In
          $('#update-required').trigger("login");

        }

        // Missing Info in Response
        else {

          // Reset Password
          this.password = '';

          // Logon Error Snackbar
          this.snackBar.logonError(this.translate, this.router, 'bottom');

        }
      },

      // Failed Authentication
      err => {

        // Reset Password
        this.password = '';

        // Invalid Credentials Snackbar
        this.snackBar.invalidCredentials(this.translate, this.router, 'bottom');

      }

    );

  }

}
