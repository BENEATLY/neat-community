/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-start-orig/
    Contact:    https://neatly.be/
*/


// Imports: Default
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';

// Imports: Custom Services
import { TranslationService } from '@app/translation.service';
import { SnackBarService } from '@app/snackbar.service';
import { FocusService } from '@focus/services/focus.service';

// Imports: Translation
import { TranslateService } from '@ngx-translate/core';

// Imports: Libraries
import * as valLib from '@library/validate';
import * as fileLib from '@library/file';


// Declarations: JQuery
declare var $: any;


// Component Definition
@Component({selector: 'app-image-focus', templateUrl: 'image.component.html'})


// Component Export Definition
export class ImageFocusComponent implements OnInit {

  // Libraries
  valLib = valLib;
  fileLib = fileLib;

  // Constants: Focus Default
  meta;


  // Constructor
  constructor(public http: HttpClient, public cookieService: CookieService, public focusService: FocusService, public snackBar: SnackBarService, public translate: TranslateService, public translation: TranslationService) {

    // Translate
    let lang = this.translation.translation.translationFile;
    this.translate.setTranslation(lang, this.translation.translationContent);
    this.translate.setDefaultLang(lang);

    // Get the Passed Values
    this.meta = this.focusService.getValue();

  }

  // Page Initialisation
  ngOnInit() { }

}
