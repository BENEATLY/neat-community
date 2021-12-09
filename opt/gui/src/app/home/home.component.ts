/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-start-orig/
    Contact:    https://neatly.be/
*/


// Imports: Default
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';

// Imports: Custom Services
import { DataService } from '@app/data.service';
import { TranslationService } from '@app/translation.service';
import { SnackBarService } from '@app/snackbar.service';

// Imports: Translation
import { TranslateService } from '@ngx-translate/core';


// Declarations: JQuery
declare var $: any;


// Component Definition
@Component({selector: 'app-home', templateUrl: './home.component.html'})


// Component Export Definition
export class HomeComponent implements OnInit {

  // jQuery
  jquery = $;

  // Context Reference
  context = this;

  // Background Video (Configurable)
  videoLink = 'assets/backgrounds/Traffic.mp4';


  // Constructor
  constructor(private router: Router, private route: ActivatedRoute, public data: DataService, private cookieService: CookieService, private snackBar: SnackBarService, public translate: TranslateService, public translation: TranslationService) {

    // Translate
    let lang = this.translation.translation.translationFile;
    this.translate.setTranslation(lang, this.translation.translationContent);
    this.translate.setDefaultLang(lang);

    // Select Correct Navbar Item (Default)
    this.data.flagNewPath(this.route.snapshot.url);

  }


  // Page Initialisation
  ngOnInit() {

    // Manual Log Out
    if (this.cookieService.get('logout-manual')) {
      this.cookieService.delete('logout-manual', '/');
      this.cookieService.delete('token', '/');
      this.snackBar.manualLogOut(this.translate, this.router, 'bottom');
    }

    // Expired Log Out
    if (this.cookieService.get('logout-expired')) {
      this.cookieService.delete('logout-expired', '/');
      this.cookieService.delete('token', '/');
      this.snackBar.expiredLogOut(this.translate, this.router, 'bottom');
    }

    // Play & Replay Backgroud Video (avoid Promise Error)
    let element = document.getElementById('video-background') as HTMLVideoElement;
    element.muted = true;
    element.currentTime = 1;
    element.pause();
    setTimeout(function() { element.play(); }, 150);
    setInterval(function() { element.currentTime = 0; }, 36000);

  }

}
