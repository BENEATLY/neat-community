/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-start-orig/
    Contact:    https://neatly.be/
*/


// Imports: Default
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

// Imports: Custom Services
import { DataService } from '@app/data.service';
import { TimezoneService } from '@app/timezone.service';
import { TranslationService } from '@app/translation.service';

// Imports: Translation
import { TranslateService } from '@ngx-translate/core';

// Imports: Libraries
import * as mapLib from "@library/map";
import * as objLib from "@library/object";


// Component Definition
@Component({selector: 'app-user-timezone', templateUrl: './timezone.component.html'})


// Component Export Definition
export class UserTimezoneComponent implements OnInit {

  // Libraries
  mapLib = mapLib;
  objLib = objLib;

  // MapBox Map Config
  mapConfig: any = null;

  // Context Reference
  context = this;


  // Constructor
  constructor(public route: ActivatedRoute, public data: DataService, private http: HttpClient, public timezone: TimezoneService, public translate: TranslateService, public translation: TranslationService) {

    // Translate
    let lang = this.translation.translation.translationFile;
    this.translate.setTranslation(lang, this.translation.translationContent);
    this.translate.setDefaultLang(lang);

    // Select Correct Navbar Item (Default)
    this.data.flagNewPath(this.route.snapshot.url);

  }


  // Page Initialisation
  async ngOnInit() {

    // Set Map Config
    this.mapConfig = {
      "style": "mapbox://styles/tdha/ckc29zf7o25yg1imnuaqzhsq5",
      "zoom": 3,
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

  // Clean Location
  cleanLocation(location) { return location.replace('/', ' / ').replace('_', ' '); }

}
