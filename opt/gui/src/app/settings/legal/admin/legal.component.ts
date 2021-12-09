/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-start-orig/
    Contact:    https://neatly.be/
*/


// Imports: Default
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

// Imports: Custom Services
import { DataService } from '@app/data.service';
import { TimezoneService } from '@app/timezone.service';
import { TranslationService } from '@app/translation.service';
import { LicenseService } from '@app/license.service';
import { SnackBarService } from '@app/snackbar.service';
import { ModalService } from '@modal/services/modal.service';

// Imports: Config Loaders
import { AppConfig } from '@app/app.config';
import { PluginConfig } from '@app/plugin.config';

// Imports: Translation
import { TranslateService } from '@ngx-translate/core';

// Imports: Libraries
import * as modalLib from '@library/modal';
import * as timeLib from '@library/time';
import * as objLib from '@library/object';
import * as valLib from '@library/validate';
import * as rightLib from '@library/right';
import * as presentLib from '@library/presentation';


// Declarations: JQuery
declare var $: any;


// Component Definition
@Component({selector: 'app-settings-legal-admin', templateUrl: './legal.component.html'})


// Component Export Definition
export class SettingsLegalAdminComponent implements OnInit {

  // Libraries
  modalLib = modalLib;
  timeLib = timeLib;
  objLib = objLib;
  valLib = valLib;
  rightLib = rightLib;
  presentLib = presentLib;

  // jQuery
  jquery = $;

  // Context Reference
  context = this;


  // Component Definition
  constructor(public router: Router, public route: ActivatedRoute, public data: DataService, public timezone: TimezoneService, public appConfig: AppConfig, public pluginConfig: PluginConfig, public modalService: ModalService, public snackBar: SnackBarService, public translate: TranslateService, public translation: TranslationService, public license: LicenseService) {

    // Translate
    let lang = this.translation.translation.translationFile;
    this.translate.setTranslation(lang, this.translation.translationContent);
    this.translate.setDefaultLang(lang);

    // Select Correct Navbar Item (Default)
    this.data.flagNewPath(this.route.snapshot.url);

    // Route Allowed?
    this.routeAllowed();

  }


  // Page Initialisation
  ngOnInit() {}


  // Route Allowed?
  routeAllowed() {

    // Sufficient Rights?
    if (!rightLib.sufficientRights(this.data.userData.right, 'Right', 'Edit', 'all')) { this.router.navigate([`dashboard`]); }

    // Return OK
    return true;

  }

}
