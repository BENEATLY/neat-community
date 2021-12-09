/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-start-orig/
    Contact:    https://neatly.be/
*/


// Imports: Default
import { HostListener, Component, Input, ElementRef, ViewChild, ViewContainerRef, OnInit } from '@angular/core';

// Imports: Custom Services
import { DataService } from '@app/data.service';
import { RouteService } from '@app/route.service';
import { TranslationService } from '@app/translation.service';

// Imports: Config Loaders
import { AppConfig } from '@app/app.config';
import { PluginConfig } from '@app/plugin.config';

// Imports: Translation
import { TranslateService } from '@ngx-translate/core';

// Imports: Libraries
import * as objLib from '@library/object';
import * as pluginLib from '@library/plugin';


// Component Definition
@Component({selector: 'app-template-important-message', templateUrl: './important-message.component.html'})


// Component Export Definition
export class TemplateImportantMessageComponent implements OnInit {

  // Libraries
  objLib = objLib;
  pluginLib = pluginLib;

  // Plugin (Non-Configurable)
  plugin = {"id": 16, "name": "Application Look & Feel"};
  pluginGroup = 'ImportantMessage';

  // Important Message Properties
  importantMessage: any = {};

  // Path (Non-Configurable)
  shortPath: string;

  // Routing Context (Non-Configurable)
  publicPages = [];


  // Template
  @ViewChild('template', {static: true}) template;


  // Constructor
  constructor(private appConfig: AppConfig, private data: DataService, private pluginConfig: PluginConfig, public translate: TranslateService, public translation: TranslationService, private routing: RouteService, private viewContainerRef: ViewContainerRef, private elementRef: ElementRef) {

    // Get Public Pages
    this.publicPages = this.routing.getPublicRoutes();

    // Translate
    let lang = this.translation.translation.translationFile;
    this.translate.setTranslation(lang, this.translation.translationContent);
    this.translate.setDefaultLang(lang);

    // Get Path Info (Default)
    this.data.shortPath.subscribe(shortPath => { this.shortPath = shortPath; });

    // Get Plugin Options
    if (pluginLib.isActivePlugin(this.pluginConfig.plugin, this.plugin.id)) {
      this.importantMessage = pluginLib.getPublicPluginValues(this.appConfig.config, this.plugin, this.pluginGroup);
    }

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
