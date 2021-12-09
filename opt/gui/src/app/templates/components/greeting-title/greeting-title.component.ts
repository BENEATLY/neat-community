/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-start-orig/
    Contact:    https://neatly.be/
*/


// Imports: Default
import { HostListener, Component, Input, ElementRef, ViewChild, ViewContainerRef, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

// Imports: Custom Services
import { DataService } from '@app/data.service';
import { TranslationService } from '@app/translation.service';
import { LicenseService } from '@app/license.service';

// Imports: Config Loaders
import { AppConfig } from '@app/app.config';

// Imports: Translation
import { TranslateService } from '@ngx-translate/core';

// Imports: Libraries
import * as presentLib from '@library/presentation';
import * as timeLib from '@library/time';
import * as sslLib from '@library/ssl';


// Component Definition
@Component({selector: 'app-template-greeting-title', templateUrl: './greeting-title.component.html'})


// Component Export Definition
export class TemplateGreetingTitleComponent implements OnInit {

  // Libraries
  presentLib = presentLib;
  timeLib = timeLib;
  sslLib = sslLib;

  // Template Input
  @Input() item: any = null;
  @Input() level: string = 'polite';
  @Input() type: string = 'regular';

  // Greeting Properties
  greetingTitle: any = null;

  // Template
  @ViewChild('template', {static: true}) template;


  // Constructor
  constructor(public route: ActivatedRoute, public translate: TranslateService, public translation: TranslationService, public data: DataService, public appConfig: AppConfig, public license: LicenseService, private viewContainerRef: ViewContainerRef, private elementRef: ElementRef) {

    // Translate
    let lang = this.translation.translation.translationFile;
    this.translate.setTranslation(lang, this.translation.translationContent);
    this.translate.setDefaultLang(lang);

  }


  // Page Initialisation
  ngOnInit() {

    // Generate Greeting Title
    if (this.type == 'regular') { this.greetingTitle = this.translate.instant(presentLib.generateGreeting(this.level, this.translation, timeLib.getNow()), {'info': this.data.userData.info}); }
    else if (this.type == 'legal') { this.greetingTitle = this.translate.instant(this.license.generateGreeting(), {'info': this.data.userData.info}); }
    else if (this.type == 'ssl') { this.greetingTitle = this.translate.instant(sslLib.generateSSLGreeting(this.appConfig.config, this.item), {'info': this.data.userData.info}); }

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
