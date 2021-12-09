/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-community/
    Contact:    https://neatly.be/
*/


// Imports: Default
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';

// Imports: Custom Services
import { DataService } from '@app/data.service';
import { TimezoneService } from '@app/timezone.service';
import { TranslationService } from '@app/translation.service';
import { SnackBarService } from '@app/snackbar.service';
import { ModalService } from '@modal/services/modal.service';
import { FocusService } from '@focus/services/focus.service';

// Imports: Config Loaders
import { AppConfig } from '@app/app.config';

// Imports: Translation
import { TranslateService } from '@ngx-translate/core';

// Imports: Libraries
import * as objLib from '@library/object';
import * as valLib from '@library/validate';
import * as strLib from '@library/string';
import * as navigationLib from '@library/navigation';
import * as presentLib from '@library/presentation';
import * as sortLib from '@library/sort';
import * as fileLib from '@library/file';
import * as focusLib from '@library/focus';
import * as translateLib from '@library/translate';


// Declarations: JQuery
declare var $: any;


// Component Definition
@Component({selector: 'app-info-modal', templateUrl: 'info.component.html'})


// Component Export Definition
export class InfoModalComponent implements OnInit {

  // Libraries
  objLib = objLib;
  valLib = valLib;
  strLib = strLib;
  navigationLib = navigationLib;
  presentLib = presentLib;
  sortLib = sortLib;
  fileLib = fileLib;
  focusLib = focusLib;
  translateLib = translateLib;

  // jQuery
  jquery = $;

  // Constants: Modal Default
  properties;
  meta;
  item;

  // Custom Modal Libraries (Non-Configurable)
  modalLibs = {};

  // Max Name Width
  maxWidth: any[] = [];

  // Non-Configurable
  activeTab = 0;
  maximizedProperty = null;
  infoProperty = null;


  // Constructor
  constructor(public data: DataService, public http: HttpClient, public cookieService: CookieService, public appConfig: AppConfig, public modalService: ModalService, public focusService: FocusService, public snackBar: SnackBarService, public timezone: TimezoneService, public translate: TranslateService, public translation: TranslationService) {

    // Translate
    let lang = this.translation.translation.translationFile;
    this.translate.setTranslation(lang, this.translation.translationContent);
    this.translate.setDefaultLang(lang);

    // Get the Passed Values
    let properties = this.modalService.getValue()[0];
    let meta = this.modalService.getValue()[1];

    // Construct Item
    let item = objLib.createItemByProperties(properties);

    // Ignore Properties Defined in Meta
    if (objLib.lookUpKey(meta, 'ignore')) {
      if (valLib.isArray(properties) && valLib.isArray(properties[0])) { properties = properties.map(prop => prop.filter(obj => !meta.ignore.includes(obj.property))); }
      else { properties = properties.filter(obj => !meta.ignore.includes(obj.property)); }
    }

    // Assign to Variables
    this.properties = properties;
    this.meta = meta;
    this.item = item;

  }


  // Page Initialisation
  ngOnInit() {

    // Calculate Max Name Width
    if (valLib.isArray(this.properties) && (valLib.isArray(this.properties[0]))) { this.maxWidth = this.properties.map(property => presentLib.determinePropertyNameLineMaxWidth(this.translate, this.meta.object.name, property)); }
    else if (valLib.isArray(this.properties) && (!valLib.isArray(this.properties[0]))) { this.maxWidth = [presentLib.determinePropertyNameLineMaxWidth(this.translate, this.meta.object.name, this.properties)]; }

  }


}
