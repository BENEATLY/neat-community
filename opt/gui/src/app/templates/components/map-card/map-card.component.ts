/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-start-orig/
    Contact:    https://neatly.be/
*/


// Imports: Default
import { HostListener, Component, Input, ElementRef, ViewChild, ViewContainerRef, OnInit } from '@angular/core';

// Imports: Custom Services
import { TranslationService } from '@app/translation.service';
import { ModalService } from '@modal/services/modal.service';

// Imports: Translation
import { TranslateService } from '@ngx-translate/core';

// Imports: Libraries
import * as objLib from '@library/object';
import * as presentLib from '@library/presentation';
import * as modalLib from '@library/modal';


// Component Definition
@Component({selector: 'app-template-map-card', templateUrl: './map-card.component.html'})


// Component Export Definition
export class TemplateMapCardComponent implements OnInit {

  // Libraries
  objLib = objLib;
  presentLib = presentLib;
  modalLib = modalLib;

  // Template Input
  @Input() context: any = null;
  @Input() position: any = null;
  @Input() title: any = null;
  @Input() titleParams: any = {};
  @Input() cornerAction: any = null;
  @Input() cornerIcon: string;
  @Input() item: any = null;
  @Input() definitions: any[] = [];
  @Input() infoRef: any = null;
  @Input() infoRefParams: any = {};

  // Max Name Width
  maxWidth;

  // Template
  @ViewChild('template', {static: true}) template;


  // Constructor
  constructor(public translate: TranslateService, public translation: TranslationService, public modalService: ModalService, private viewContainerRef: ViewContainerRef, private elementRef: ElementRef) {

    // Translate
    let lang = this.translation.translation.translationFile;
    this.translate.setTranslation(lang, this.translation.translationContent);
    this.translate.setDefaultLang(lang);

  }


  // Page Initialisation
  ngOnInit() {

    // Calculate Max Name Width
    this.maxWidth = presentLib.determinePropertyNameLineMaxWidthByArray(this.translate, this.definitions.filter(obj => objLib.lookUpKey(obj, 'title')).map(obj => obj['title']['text']), 0.9);

    // Render Template
    this.viewContainerRef.createEmbeddedView(this.template);

  }

}
