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
import * as modalLib from '@library/modal';


// Component Definition
@Component({selector: 'app-template-action-box', templateUrl: './action-box.component.html'})


// Component Export Definition
export class TemplateActionBoxComponent implements OnInit {

  // Libraries
  modalLib = modalLib;

  // Template Input
  @Input() size: Number = 6;
  @Input() type: string = 'regular';
  @Input() context: any = null;
  @Input() title: string = '';
  @Input() titleParams: any = {};
  @Input() cornerAction: any = null;
  @Input() cornerIcon: string;
  @Input() buttonAction: any = null;
  @Input() buttonIcon: string;
  @Input() buttonText: string = '';
  @Input() buttonTextParams: any = {};
  @Input() descriptiveText: string = '';
  @Input() descriptiveTextParams: any = {};
  @Input() reference: string;
  @Input() accept: any = null;
  @Input() target: string = '';
  @Input() infoRef: any = null;
  @Input() infoRefParams: any = {};

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

    // Render Template
    this.viewContainerRef.createEmbeddedView(this.template);

  }

  // Page After View Initialisation
  ngAfterViewInit() {

    // Remove Empty Component Selector
    let selectorName = this.elementRef.nativeElement.tagName.toLowerCase();
    let element = document.querySelectorAll(selectorName)[0];
    element.parentNode.removeChild(element);

  }

}
