/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-community/
    Contact:    https://neatly.be/
*/


// Imports: Default
import { HostListener, Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

// Imports: Custom Services
import { DataService } from '@app/data.service';
import { TranslationService } from '@app/translation.service';

// Imports: Translation
import { TranslateService } from '@ngx-translate/core';

// Imports: Libraries
import * as routeLib from '@library/route';


// Component Definition
@Component({selector: 'app-language', templateUrl: './language.component.html'})


// Component Export Definition
export class LanguageComponent implements OnInit {

  // Libraries
  routeLib = routeLib;


  // Host Listener
  @HostListener('window:resize', ['$event'])
  onResize(event) {

    // Resize To Home
    this.resizeToHome(window.innerWidth);

  }


  // Constructor
  constructor(private router: Router, private route: ActivatedRoute, public data: DataService, public translate: TranslateService, public translation: TranslationService) {

    // Translate
    let lang = this.translation.translation.translationFile;
    this.translate.setTranslation(lang, this.translation.translationContent);
    this.translate.setDefaultLang(lang);

    // Select Correct Navbar Item (Default)
    this.data.flagNewPath(this.route.snapshot.url);

  }


  // Page Initialisation
  ngOnInit() { }

  // Resize To Home
  resizeToHome(width) {
    if (width > 991) { routeLib.navigate(this.router, 'home'); }
  }

}
