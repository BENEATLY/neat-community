/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-start-orig/
    Contact:    https://neatly.be/
*/


// Imports: Default
import { HostListener, Component, ElementRef, ViewChild, ViewContainerRef, OnInit } from '@angular/core';

// Imports: Custom Services
import { TranslationService } from '@app/translation.service';

// Imports: Config Loaders
import { AppConfig } from '@app/app.config';
import { PluginConfig } from '@app/plugin.config';

// Imports: Translation
import { TranslateService } from '@ngx-translate/core';

// Imports: Libraries
import * as presentLib from '@library/presentation';
import * as timeLib from '@library/time';


// Component Definition
@Component({selector: 'app-template-footer', templateUrl: './footer.component.html'})


// Component Export Definition
export class TemplateFooterComponent implements OnInit {

  // Libraries
  presentLib = presentLib;
  timeLib = timeLib;

  // Template
  @ViewChild('template', {static: true}) template;


  // Constructor
  constructor(public appConfig: AppConfig, public pluginConfig: PluginConfig, public translate: TranslateService, public translation: TranslationService, private viewContainerRef: ViewContainerRef, private elementRef: ElementRef) {

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
