/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-community/
    Contact:    https://neatly.be/
*/


// Imports: Default
import { HostListener, Component, Input, EventEmitter, Output, ElementRef, ViewChild, ViewContainerRef, OnInit } from '@angular/core';

// Imports: Custom Services
import { TranslationService } from '@app/translation.service';

// Imports: Translation
import { TranslateService } from '@ngx-translate/core';

// Imports: Libraries
import * as objLib from '@library/object';
import * as navigationLib from '@library/navigation';


// Component Definition
@Component({selector: 'app-template-left-nav-level-1', templateUrl: './left-nav-level-1.component.html'})


// Component Export Definition
export class TemplateLeftNavLevel1Component implements OnInit {

  // Libraries
  objLib = objLib;
  navigationLib = navigationLib;

  // Template Input
  @Input() item: any = null;
  @Input() leftNavigation: any = null;
  @Input() fullPath: any = null;

  // Template Output
  @Output() collapse = new EventEmitter();

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


  // Collapse Item
  collapseItem() {
    this.collapse.emit({'item': [this.item], 'collapse': (!this.item.collapse)});
  }

  // Collapse Chain
  collapseChain(collapseInfo) {
    this.collapse.emit({'item': [this.item].concat(collapseInfo['item']), 'collapse': collapseInfo['collapse']});
  }

}
