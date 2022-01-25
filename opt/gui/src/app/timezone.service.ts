/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-community/
    Contact:    https://neatly.be/
*/


// Imports: Required
import { Injectable } from '@angular/core';
import * as moment from 'moment';
import 'moment-timezone';

// Imports: Files
import backwardLink from '@assets/geojson/timezone/backward.json';


// Class Export Definition
@Injectable()
export class TimezoneService {

  // Define Properties
  public utcOffset: number = 0;
  public timeZone: string = 'GMT';
  public location: string = 'GMT';
  public locale: string = 'en-US';
  public dateFormat: string = 'DD/MM/YYYY';
  public timeFormat: string = 'HH:mm:ss';
  public dateTimeFormat: string = 'DD/MM/YYYY HH:mm:ss';


  // Constructor
  constructor() {}


  // Convert Location
  convertLocation(location) {

    // Has Backward Link
    if (location in backwardLink) { return backwardLink[location]; }

    // No Backward Link
    else { return location; }

  }

  // Load Timezone Info
  loadTimezone() {
    return new Promise(
      (resolve, reject) => {

        // Get Current Time
        let now = new Date();

        // Get UTC Offset
        this.utcOffset = -now.getTimezoneOffset();

        // Get Location
        let location = moment.tz.guess();
        location = this.convertLocation(location);
        this.location = location;

        // Get Timezone
        this.timeZone = moment.tz.zone(location).abbr(360);

        // Get Locale
        let locale = (window.navigator['userLanguage'] || window.navigator.language);
        this.locale = locale;

        // Adjust Moment Locale
        moment.locale(locale);

        // Get Date Format
        this.dateFormat = moment.localeData().longDateFormat('L');

        // Get Time Format
        this.timeFormat = moment.localeData().longDateFormat('LTS');

        // Get DateTime Format
        this.dateTimeFormat = moment.localeData().longDateFormat('L') + ' ' + moment.localeData().longDateFormat('LTS');

        // Resolve
        resolve(true);

      }
    );
  }

}
