/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-start-orig/
    Contact:    https://neatly.be/
*/


// Imports: Default
import { Component, OnInit } from '@angular/core';

// Imports: Custom Services
import { TranslationService } from '@app/translation.service';
import { ModalService } from '@modal/services/modal.service';

// Imports: Config Loaders
import { AppConfig } from '@app/app.config';

// Imports: Translation
import { TranslateService } from '@ngx-translate/core';

// Imports: Libraries
import * as objLib from '@library/object';
import * as presentLib from '@library/presentation';
import * as formatLib from '@library/format';
import * as translateLib from '@library/translate';


// Declarations: JQuery
declare var $: any;


// Component Definition
@Component({selector: 'app-plugin-option-help-modal', templateUrl: 'plugin-option-help.component.html'})


// Component Export Definition
export class PluginOptionHelpModalComponent implements OnInit {

  // Libraries
  objLib = objLib;
  presentLib = presentLib;
  formatLib = formatLib;
  translateLib = translateLib;

  // Constants: Modal Default
  meta;


  // Constructor
  constructor(public appConfig: AppConfig, public modalService: ModalService, public translate: TranslateService, public translation: TranslationService) {

    // Translate
    let lang = this.translation.translation.translationFile;
    this.translate.setTranslation(lang, this.translation.translationContent);
    this.translate.setDefaultLang(lang);

    // Get the Passed Values
    let meta = this.modalService.getValue();

    // Is Object
    if (objLib.getKeys(meta).includes('object')) {
      meta.title = translate.instant('common.label.help', {'propertyName': translate.instant(translateLib.constructSP(meta.object.name, 1))});
    }

    // Assign to Variables
    this.meta = meta;

  }


  // Page Initialisation
  ngOnInit() { }

}
