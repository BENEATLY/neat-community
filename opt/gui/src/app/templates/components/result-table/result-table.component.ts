/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-start-orig/
    Contact:    https://neatly.be/
*/


// Imports: Default
import { HostListener, Component, Input, ElementRef, ViewChild, ViewContainerRef, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';

// Imports: Custom Services
import { DataService } from '@app/data.service';
import { TranslationService } from '@app/translation.service';
import { TimezoneService } from '@app/timezone.service';
import { SnackBarService } from '@app/snackbar.service';
import { ModalService } from '@modal/services/modal.service';
import { FocusService } from '@focus/services/focus.service';

// Imports: Config Loaders
import { AppConfig } from '@app/app.config';

// Imports: Translation
import { TranslateService } from '@ngx-translate/core';

// Imports: Libraries
import * as valLib from '@library/validate';
import * as sortLib from '@library/sort';
import * as presentLib from '@library/presentation';
import * as fileLib from '@library/file';
import * as focusLib from '@library/focus';
import * as definitionsLib from '@library/definitions';
import * as navigationLib from '@library/navigation';
import * as formatLib from '@library/format';
import * as modalLib from '@library/modal';
import * as pageLib from '@library/page';
import * as rightLib from '@library/right';
import * as translateLib from '@library/translate';


// Component Definition
@Component({selector: 'app-template-result-table', templateUrl: './result-table.component.html'})


// Component Export Definition
export class TemplateResultTableComponent implements OnInit {

  // Libraries
  valLib = valLib;
  sortLib = sortLib;
  presentLib = presentLib;
  fileLib = fileLib;
  focusLib = focusLib;
  definitionsLib = definitionsLib;
  navigationLib = navigationLib;
  formatLib = formatLib;
  modalLib = modalLib;
  pageLib = pageLib;
  rightLib = rightLib;
  translateLib = translateLib;

  // Template Input
  @Input() context: any = null;
  @Input() pageNav: Boolean = true;
  @Input() actionTemplate: any = null;

  // Template
  @ViewChild('template', {static: true}) template;


  // Constructor
  constructor(public appConfig: AppConfig, public data: DataService, public translate: TranslateService, public translation: TranslationService, public router: Router, public route: ActivatedRoute, public http: HttpClient, public cookieService: CookieService, public modalService: ModalService, public focusService: FocusService, public snackBar: SnackBarService, public timezone: TimezoneService, private viewContainerRef: ViewContainerRef, private elementRef: ElementRef) {

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
