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
import { TranslationService } from '@app/translation.service';
import { SnackBarService } from '@app/snackbar.service';
import { ModalService } from '@modal/services/modal.service';

// Imports: Config Loaders
import { AppConfig } from '@app/app.config';

// Imports: Translation
import { TranslateService } from '@ngx-translate/core';

// Imports: Libraries
import * as objLib from '@library/object';


// Declarations: JQuery
declare var $: any;


// Component Definition
@Component({selector: 'app-service-modal', templateUrl: 'service.component.html'})


// Component Export Definition
export class ServiceModalComponent implements OnInit {

  // Libraries
  objLib = objLib;

  // Constants: Modal Default
  meta;

  // Non-Configurable
  items = [];
  object;
  times = [];


  // Constructor
  constructor(private http: HttpClient, private cookieService: CookieService, public appConfig: AppConfig, public modalService: ModalService, private snackBar: SnackBarService, public translate: TranslateService, public translation: TranslationService) {

    // Translate
    let lang = this.translation.translation.translationFile;
    this.translate.setTranslation(lang, this.translation.translationContent);
    this.translate.setDefaultLang(lang);

    // Get the Passed Values
    let meta = this.modalService.getValue();

    // Generate Title
    meta.title = this.translate.instant('modal.service.title', {item: meta.object.val});

    // Assign to Variables
    this.meta = meta;

    // Get Info URL
    let infoUrl = '';
    if (objLib.lookUpKey(meta, 'info')) { infoUrl = meta.info; }
    else { infoUrl = this.appConfig.config['apiRootUrl'] + 'plugin/id/' + meta.object.val.id.toString() + '&status'; }

    // Define API Authentication
    let token = this.cookieService.get('token');
    let headers: HttpHeaders = new HttpHeaders({"Authorization": "Token " + token});

    // Get Services
    this.http.get(infoUrl, { headers }).subscribe(

      // Success
      res => {

        // Store Object
        this.object = res;

        // Store Services
        if ('services' in res) {

          // Assign Items
          this.items = res['services'];

          // Create Times
          if (res['services']) { this.times = new Array((res['services'] as any[]).length).fill(-1); }

        }

      },

      // Fail
      err => { this.snackBar.httpErrorOccurred(err); }

    );

  }


  // Page Initialisation
  ngOnInit() {

    // Current Time
    let currentTime = new Date().getTime();

    // Calculate Initial Service Uptime
    this.recalculateUpTime(currentTime);

    // Recalculate Service Uptime every Second
    setInterval(() => { this.recalculateUpTime(currentTime); }, 1000);

  }


  // Recalculate Service Uptime
  recalculateUpTime(referenceTime) {

    // Iterate over Services
    for (var i=0; i<this.items.length; i++) {

      // Calculate Uptime if Service is Running
      if (this.items[i].status) { this.times[i] = this.msToTimeDelta(new Date().getTime() - (referenceTime - this.items[i].upTime*1000)); }

      // Set Uptime Null if Service Failed
      else { this.times[i] = null; }

    }

  }

  // Convert Milli Seconds to Time Delta
  msToTimeDelta(duration) {

    // Determine Days, Hours, Minutes & Seconds
    let seconds = Math.floor((duration / 1000) % 60);
    let minutes = Math.floor((duration / (1000 * 60)) % 60);
    let hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
    let days = Math.floor((duration / (1000 * 60 * 60)) / 24);

    // Convert Hours, Minutes & Seconds to String
    let hoursString = (hours < 10) ? "0" + hours.toString() : hours.toString();
    let minutesString = (minutes < 10) ? "0" + minutes.toString() : minutes.toString();
    let secondsString = (seconds < 10) ? "0" + seconds.toString() : seconds.toString();

    // Return Time Delta if there are Days
    if (days > 0) { return days.toString() + " days, " + hoursString + ":" + minutesString + ":" + secondsString; }

    // Return Time Delta if there are No Days
    else { return hoursString + ":" + minutesString + ":" + secondsString; }

  }

  // Times Calculated
  timesCalculated() {
    if (this.times.length && (!this.times.every(function(v) { return v === -1; }))) { return true; }
    else { return false; }
  }

}
