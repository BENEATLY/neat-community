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
import { LicenseService } from '@app/license.service';
import { SnackBarService } from '@app/snackbar.service';
import { ModalService } from '@modal/services/modal.service';
import { FocusService } from '@focus/services/focus.service';

// Imports: Config Loaders
import { AppConfig } from '@app/app.config';

// Imports: Translation
import { TranslateService } from '@ngx-translate/core';

// Imports: Libraries
import * as definitionsLib from '@library/definitions';
import * as valLib from '@library/validate';
import * as presentLib from '@library/presentation';
import * as fileLib from '@library/file';
import * as focusLib from '@library/focus';
import * as formatLib from '@library/format';
import * as modalLib from '@library/modal';
import * as translateLib from '@library/translate';
import * as navigationLib from '@library/navigation';


// Declarations: JQuery
declare var $: any;


// Component Definition
@Component({selector: 'app-template-item-box', templateUrl: './item-box.component.html'})


// Component Export Definition
export class TemplateItemBoxComponent implements OnInit {

  // Libraries
  definitionsLib = definitionsLib;
  valLib = valLib;
  presentLib = presentLib;
  fileLib = fileLib;
  focusLib = focusLib;
  formatLib = formatLib;
  modalLib = modalLib;
  translateLib = translateLib;
  navigationLib = navigationLib;

  // jQuery
  jquery = $;

  // Template Input
  @Input() context: any = null;
  @Input() title: string = '';
  @Input() titleParams: any = {};
  @Input() cornerAction: any = null;
  @Input() cornerIcon: string;
  @Input() item: any = null;
  @Input() objectDefinition: string;
  @Input() accessLevel: any = null;
  @Input() disabledLevel: any[] = [];
  @Input() needsLicense: Boolean = true;
  @Input() infoRef: any = null;
  @Input() infoRefParams: any = {};
  @Input() xxxlColWidth: number = 4;
  @Input() xxlColWidth: number = 6;
  @Input() xlColWidth: number = 6;
  @Input() lgColWidth: number = 12;
  @Input() mdColWidth: number = 12;
  @Input() smColWidth: number = 12;
  @Input() xsColWidth: number = 12;

  // Max Name Width
  maxWidth;

  // Template
  @ViewChild('template', {static: true}) template;


  // Constructor
  constructor(public router: Router, public route: ActivatedRoute, public translate: TranslateService, public translation: TranslationService, public http: HttpClient, public cookieService: CookieService, public data: DataService, public appConfig: AppConfig, public license: LicenseService, public modalService: ModalService, public focusService: FocusService, public snackBar: SnackBarService, public timezone: TimezoneService, private viewContainerRef: ViewContainerRef, private elementRef: ElementRef) {

    // Translate
    let lang = this.translation.translation.translationFile;
    this.translate.setTranslation(lang, this.translation.translationContent);
    this.translate.setDefaultLang(lang);

    // Set Access Level (if unset)
    if (!this.accessLevel) { this.accessLevel = definitionsLib.createViewList(this.appConfig.config, this.data.userData.right, 'Get', this.objectDefinition, this.disabledLevel); }

  }


  // Page Initialisation
  ngOnInit() {

    // Calculate Max Name Width
    this.maxWidth = presentLib.determinePropertyNameLineMaxWidthByArray(this.translate, formatLib.formatInfo(this.appConfig.config, this.objectDefinition, this.item, this.accessLevel).map(property => translateLib.constructPropertyName(this.objectDefinition, property)));

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
