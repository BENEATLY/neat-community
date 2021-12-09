/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-start-orig/
    Contact:    https://neatly.be/
*/


// Imports: Default
import { Component, OnInit } from '@angular/core';

// Imports: Custom Services
import { DataService } from '@app/data.service';
import { TranslationService } from '@app/translation.service';

// Imports: Config Loaders
import { AppConfig } from '@app/app.config';

// Imports: Translation
import { TranslateService } from '@ngx-translate/core';

// Imports: Libraries
import * as objLib from '@library/object';
import * as navigationLib from '@library/navigation';

// Imports: Tools
import * as cloneDeep from 'lodash/cloneDeep';


// Component Definition
@Component({selector: 'app-leftbar', templateUrl: './leftbar.component.html'})


// Component Export Definition
export class LeftBarComponent implements OnInit {

  // Libraries
  objLib = objLib;
  navigationLib = navigationLib;

  // Path (Non-Configurable)
  shortPath: string;
  fullPath: string;

  // Navigation (Non-Configurable)
  navigation = null;
  leftNavigation = null;


  // Constructor
  constructor(public data: DataService, public appConfig: AppConfig, public translate: TranslateService, public translation: TranslationService) {

    // Translate
    let lang = this.translation.translation.translationFile;
    this.translate.setTranslation(lang, this.translation.translationContent);
    this.translate.setDefaultLang(lang);

    // Get Path & Navigation Info (Default)
    this.data.shortPath.subscribe(shortPath => this.gentleNavChange(shortPath, navigationLib.getNavigation(this.appConfig.config, this.data.userData, 'leftbar', shortPath)));
    this.data.fullPath.subscribe(fullPath => this.fullPath = fullPath);
    this.data.leftNavigation.subscribe(leftNavigation => this.leftNavigation = leftNavigation);

    // Get Navigation
    this.navigation = navigationLib.getNavigation(this.appConfig.config, this.data.userData, 'leftbar', this.shortPath);

  }


  // Gentle Change
  gentleNavChange(shortPath, navigation) {

    // Store Original Navigation
    let origNavigation = this.navigation;
    if (!origNavigation) { origNavigation = []; }

    // Change Short Path
    this.shortPath = shortPath;

    // Gentle Change Navigation
    if (navigation) { this.navigation = cloneDeep(this.gentleNavItemChange(navigation, origNavigation, 'name', ['collapse'])); }

    // Remove if not existing
    else if (this.navigation) { this.navigation = null; }

  }

  // Find Navigation Match
  findNavMatch(navigation, origNavigation, unique) {
    let foundMatch = origNavigation.find(nav => nav[unique] == navigation[unique]);
    if (foundMatch) { return foundMatch; }
    else { return null; }
  }

  // Gentle Navigation Item Change
  gentleNavItemChange(navigation, origNavigation, unique, noChange) {
    for (let nav of navigation) {
      let match = this.findNavMatch(nav, origNavigation, unique);
      if (match) {
        for (let i of noChange) { nav[i] = match[i]; }
        if (objLib.lookUpKey(nav, 'subItems') && objLib.lookUpKey(match, 'subItems')) {
          nav.subItems = this.gentleNavItemChange(nav.subItems, match.subItems, unique, noChange);
        }
      }
    }
    return navigation;
  }


  // Page Initialisation
  ngOnInit() {

    // Show Credit Footer
    this.showCreditFooter();

  }


  // Show Credit Footer
  showCreditFooter() {
    if (document.getElementsByClassName('footercreditcontent').length > 0) {
      if (window.scrollY >= (document.getElementsByClassName('app-wrapper')[0].scrollHeight - window.innerHeight - 2)) {
        let credits = document.getElementsByClassName('footercreditcontent')[0] as HTMLElement;
        credits.style.visibility = 'visible';
        credits.style.opacity = '1.0';
      }
      else {
        let credits = document.getElementsByClassName('footercreditcontent')[0] as HTMLElement;
        credits.style.visibility = 'hidden';
        credits.style.opacity = '0.0';
      }
    }
  }

  // Collapse Chain
  collapseChain(collapseInfo) {
    this.navigation = this.adjustItemCollapse(cloneDeep(this.navigation), collapseInfo['item'], collapseInfo['collapse'], 'name');
  }


  // Adjust Item Collapse
  adjustItemCollapse(item, collapseItems, collapseState, unique) {
    if (collapseItems.length > 1) {
      let foundMatch = (objLib.lookUpKey(item, 'subItems')?item.subItems:item).find(subItem => subItem[unique] == collapseItems[0][unique]);
      if (foundMatch) { foundMatch = this.adjustItemCollapse(foundMatch, collapseItems.slice(1, collapseItems.length), collapseState, unique); }
    }
    else if (collapseItems.length == 1) {
      let foundMatch = (objLib.lookUpKey(item, 'subItems')?item.subItems:item).find(subItem => subItem[unique] == collapseItems[0][unique]);
      if (foundMatch) { foundMatch.collapse = collapseState; }
    }
    return item;
  }

}
