/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-community/
    Contact:    https://neatly.be/
*/


// Imports: Default
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

// Imports: Custom Services
import { DataService } from '@app/data.service';
import { TranslationService } from '@app/translation.service';

// Imports: Translation
import { TranslateService } from '@ngx-translate/core';


// Declarations: JQuery
declare var $: any;


// Component Definition
@Component({selector: 'app-user-logout', templateUrl: './logout.component.html'})


// Component Export Definition
export class UserLogOutComponent implements OnInit {


  // Constructor
  constructor(public route: ActivatedRoute, public data: DataService, public translate: TranslateService, public translation: TranslationService) {

    // Translate
    let lang = this.translation.translation.translationFile;
    this.translate.setTranslation(lang, this.translation.translationContent);
    this.translate.setDefaultLang(lang);

    // Select Correct Navbar Item (Default)
    this.data.flagNewPath(this.route.snapshot.url);

  }


  // Page Initialisation
  ngOnInit() {

    // Log Out
    $('#update-required').trigger("logout");

  }

}
