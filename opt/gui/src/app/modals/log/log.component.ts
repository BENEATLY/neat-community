/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-start-orig/
    Contact:    https://neatly.be/
*/


// Imports: Default
import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';

// Imports: Custom Services
import { TimezoneService } from '@app/timezone.service';
import { TranslationService } from '@app/translation.service';
import { SnackBarService } from '@app/snackbar.service';
import { ModalService } from '@modal/services/modal.service';

// Imports: Config Loaders
import { AppConfig } from '@app/app.config';

// Imports: Translation
import { TranslateService } from '@ngx-translate/core';

// Imports: Libraries
import * as objLib from '@library/object';
import * as presentLib from '@library/presentation';
import * as fileLib from '@library/file';


// Declarations: JQuery
declare var $: any;


// Component Definition
@Component({selector: 'app-log-modal', templateUrl: 'log.component.html'})


// Component Export Definition
export class LogModalComponent implements OnInit {

  // Libraries
  objLib = objLib;
  presentLib = presentLib;
  fileLib = fileLib;

  // Constants: Modal Default
  meta;

  // Non-Configurable
  items = [];
  object;
  dateTimeProperty = {"accepted": {"type": "DateTime"}};
  initDone = false;


  // Constructor
  constructor(public http: HttpClient, public cookieService: CookieService, public appConfig: AppConfig, public modalService: ModalService, public snackBar: SnackBarService, public timezone: TimezoneService, public translate: TranslateService, public translation: TranslationService) {

    // Translate
    let lang = this.translation.translation.translationFile;
    this.translate.setTranslation(lang, this.translation.translationContent);
    this.translate.setDefaultLang(lang);

    // Get the Passed Values
    let meta = this.modalService.getValue();

    // Generate Title
    meta.title = this.translate.instant('modal.log.title', {item: meta.object.val});

    // Assign to Variables
    this.meta = meta;

    // Get Info URL
    let infoUrl = '';
    if (objLib.lookUpKey(meta, 'info')) { infoUrl = meta.info; }
    else { infoUrl = this.appConfig.config['apiRootUrl'] + 'plugin/id/' + meta.object.val.id.toString() + '&logs'; }

    // Define API Authentication
    let token = this.cookieService.get('token');
    let headers: HttpHeaders = new HttpHeaders({"Authorization": "Token " + token});

    // Get Logs
    this.http.get(infoUrl, { headers }).subscribe(

      // Success
      res => {

        // Store Object
        this.object = res;

        // Store Services
        if ('logs' in res) {

          // Assign Items
          this.items = res['logs'];

          // Init Done
          this.initDone = true;

        }

      },

      // Fail
      err => {

        // Snackbar Error Message
        this.snackBar.httpErrorOccurred(err);

        // Init Done
        this.initDone = true;

      }

    );

  }


  // Page Initialisation
  ngOnInit() { }


}
