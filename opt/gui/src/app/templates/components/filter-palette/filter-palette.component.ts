/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-community/
    Contact:    https://neatly.be/
*/


// Imports: Default
import { HostListener, Component, Input, ElementRef, ViewChild, ViewContainerRef, OnInit } from '@angular/core';

// Imports: Custom Services
import { DataService } from '@app/data.service';
import { TranslationService } from '@app/translation.service';
import { TimezoneService } from '@app/timezone.service';

// Imports: Config Loaders
import { AppConfig } from '@app/app.config';

// Imports: Translation
import { TranslateService } from '@ngx-translate/core';

// Imports: Libraries
import * as valLib from '@library/validate';
import * as formLib from '@library/form';
import * as definitionsLib from '@library/definitions';
import * as filterLib from '@library/filter';
import * as translateLib from '@library/translate';


// Component Definition
@Component({selector: 'app-template-filter-palette', templateUrl: './filter-palette.component.html'})


// Component Export Definition
export class TemplateFilterPaletteComponent implements OnInit {

  // Libraries
  valLib = valLib;
  formLib = formLib;
  definitionsLib = definitionsLib;
  filterLib = filterLib;
  translateLib = translateLib;

  // Template Input
  @Input() context: any = null;

  // Template
  @ViewChild('template', {static: true}) template;


  // Constructor
  constructor(public appConfig: AppConfig, public data: DataService, public translate: TranslateService, public translation: TranslationService, public timezone: TimezoneService, private viewContainerRef: ViewContainerRef, private elementRef: ElementRef) {

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
