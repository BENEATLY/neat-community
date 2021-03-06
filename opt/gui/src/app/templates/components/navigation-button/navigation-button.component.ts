/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-community/
    Contact:    https://neatly.be/
*/


// Imports: Default
import { HostListener, Component, Input, ElementRef, ViewChild, ViewContainerRef, OnInit } from '@angular/core';

// Imports: Custom Services
import { TranslationService } from '@app/translation.service';

// Imports: Translation
import { TranslateService } from '@ngx-translate/core';


// Component Definition
@Component({selector: 'app-template-navigation-button', templateUrl: './navigation-button.component.html'})


// Component Export Definition
export class TemplateNavigationButtonComponent implements OnInit {

  // Template Input
  @Input() type: string = 'regular';
  @Input() context: any = null;
  @Input() title: string = '';
  @Input() titleParams: any = {};
  @Input() icon: string;
  @Input() action: any = null;
  @Input() reference: string;
  @Input() accept: any = null;

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

}
