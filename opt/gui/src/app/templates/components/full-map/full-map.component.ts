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

// Imports: Translation
import { TranslateService } from '@ngx-translate/core';

// Imports: Libraries
import * as mapLib from "@library/map";
import * as presentLib from '@library/presentation';
import * as objLib from '@library/object';


// Component Definition
@Component({selector: 'app-template-full-map', templateUrl: './full-map.component.html'})


// Component Export Definition
export class TemplateFullMapComponent implements OnInit {

  // Libraries
  presentLib = presentLib;
  objLib = objLib;
  mapLib = mapLib;

  // Map
  map: any = null;

  // Template Input
  @Input() context: any = null;
  @Input() mapConfig: any = null;
  @Input() cards: any[] = [];

  // Template
  @ViewChild('template', {static: true}) template;


  // Constructor
  constructor(public translate: TranslateService, public translation: TranslationService, private viewContainerRef: ViewContainerRef, private elementRef: ElementRef) {

    // Translate
    let lang = this.translation.translation.translationFile;
    this.translate.setTranslation(lang, this.translation.translationContent);
    this.translate.setDefaultLang(lang);

  }


  // Page Initialisation
  ngOnInit() {

    // Assign to Map & Add Map Load
    this.map = mapLib.addMapLoad(this.mapConfig);

    // Map Load Listener
    let listener = setInterval(
      () => {

        // Verify Map Loading Progress
        mapLib.verifyMapLoad(this.map, listener);

      }
    , 500);

  }

  // Page After View Initialisation
  ngAfterViewInit() {

    // Render Template
    this.viewContainerRef.createEmbeddedView(this.template);

    // Remove Empty Component Selector
    let selectorName = this.elementRef.nativeElement.tagName.toLowerCase();
    let element = document.querySelectorAll(selectorName)[0];
    element.parentNode.removeChild(element);

  }

}
