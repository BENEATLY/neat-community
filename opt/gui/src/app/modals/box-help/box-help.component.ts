/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-community/
    Contact:    https://neatly.be/
*/


// Imports: Default
import { Component, OnInit } from '@angular/core';

// Imports: Custom Services
import { TranslationService } from '@app/translation.service';
import { ModalService } from '@modal/services/modal.service';

// Imports: Translation
import { TranslateService } from '@ngx-translate/core';


// Declarations: JQuery
declare var $: any;


// Component Definition
@Component({selector: 'app-box-help-modal', templateUrl: 'box-help.component.html'})


// Component Export Definition
export class BoxHelpModalComponent implements OnInit {

  // Constants: Modal Default
  meta;


  // Constructor
  constructor(public modalService: ModalService, public translate: TranslateService, public translation: TranslationService) {

    // Translate
    let lang = this.translation.translation.translationFile;
    this.translate.setTranslation(lang, this.translation.translationContent);
    this.translate.setDefaultLang(lang);

    // Get the Passed Values
    let meta = this.modalService.getValue();

    // Assign to Variables
    this.meta = meta;

  }


  // Page Initialisation
  ngOnInit() { }

}
