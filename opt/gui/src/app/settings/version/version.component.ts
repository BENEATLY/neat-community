/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-community/
    Contact:    https://neatly.be/
*/


// Imports: Default
import { Component, OnInit, VERSION } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';

// Imports: Custom Services
import { DataService } from '@app/data.service';
import { TranslationService } from '@app/translation.service';
import { SnackBarService } from '@app/snackbar.service';

// Imports: Config Loaders
import { AppConfig } from '@app/app.config';

// Imports: Translation
import { TranslateService } from '@ngx-translate/core';


// Declarations: JQuery
declare var $: any;


// Component Definition
@Component({selector: 'app-settings-version', templateUrl: './version.component.html'})


// Component Export Definition
export class SettingsVersionComponent implements OnInit {

  // jQuery
  jquery = $;

  // Results
  results = [];


  // Component Definition
  constructor(public route: ActivatedRoute, public data: DataService, public http: HttpClient, public cookieService: CookieService, public appConfig: AppConfig, public snackBar: SnackBarService, public translate: TranslateService, public translation: TranslationService) {

    // Translate
    let lang = this.translation.translation.translationFile;
    this.translate.setTranslation(lang, this.translation.translationContent);
    this.translate.setDefaultLang(lang);

    // Select Correct Navbar Item (Default)
    this.data.flagNewPath(this.route.snapshot.url);

  }


  // Page Initialisation
  async ngOnInit() {

    // Update Results
    await this.update();

  }

  // Update Results
  update() {

    return new Promise(
      (resolve, reject) => {

        // Define API Authentication
        let token = this.cookieService.get('token');
        let headers: HttpHeaders = new HttpHeaders({"Authorization": "Token " + token});

        // Get API Version Info
        this.http.get(`${this.appConfig.config['apiRootUrl']}version/all`, {}).subscribe(

          // Success
          (res: any[]) => {

            // Store Results
            this.results = [
              {'icon': '/assets/svgs/network-wired.svg', 'background': 'linear-gradient(90deg, rgba(51,57,124,1) 0%, rgba(102,36,131,1) 100%)', 'title': 'common.version.api', 'content': res['api']},
              {'icon': '/assets/svgs/angular.svg', 'background': 'linear-gradient(90deg, rgba(161,37,44,1) 0%, rgba(212,86,81,1) 100%)', 'title': 'common.version.angular', 'content': VERSION.full},
              {'icon': '/assets/svgs/network.svg', 'background': 'linear-gradient(90deg, rgb(61, 67, 64) 0%, rgb(102, 100, 111) 100%)', 'title': 'common.version.messaging', 'content': res['messaging']},
              {'icon': '/assets/svgs/nginx.svg', 'background': 'linear-gradient(90deg, rgba(41,137,64,1) 0%, rgba(52,186,81,1) 100%)', 'title': 'common.version.webserver', 'content': res['webserver']},
              {'icon': '/assets/svgs/screen.svg', 'background': 'linear-gradient(90deg, rgb(111, 57, 114) 0%, rgb(182, 76, 181) 100%)', 'title': 'common.version.gui', 'content': this.appConfig.config['version']},
              {'icon': '/assets/svgs/python.svg', 'background': 'linear-gradient(90deg, rgb(61, 117, 114) 0%, rgb(82, 176, 161) 100%)', 'title': 'common.version.python', 'content': res['python']},
              {'icon': '/assets/svgs/database-2.svg', 'background': 'linear-gradient(90deg, rgb(51, 57, 124) 0%, rgb(72, 76, 171) 100%)', 'title': 'common.version.database', 'content': res['db']}
            ];

            // Resolve
            resolve(true);

          },

          // Fail
          err => {

            // Error Occurred
            this.snackBar.httpErrorOccurred(err);

            // Resolve
            resolve(true);

          }

        );

      }
    );

  }

}
