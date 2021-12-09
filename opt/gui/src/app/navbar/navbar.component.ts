/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-start-orig/
    Contact:    https://neatly.be/
*/


// Imports: Default
import { HostListener, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { LocalStorageService } from 'ngx-webstorage';

// Imports: Reload
import { PlatformLocation } from '@angular/common';

// Imports: Custom Services
import { DataService } from '@app/data.service';
import { RouteService } from '@app/route.service';
import { TranslationService } from '@app/translation.service';
import { LicenseService } from '@app/license.service';

// Imports: Config Loaders
import { AppConfig } from '@app/app.config';
import { HashConfig } from '@app/hash.config';
import { PluginConfig } from '@app/plugin.config';

// Imports: Translation
import { TranslateService } from '@ngx-translate/core';

// Imports: Libraries
import * as objLib from '@library/object';
import * as classLib from '@library/class';
import * as syncLib from '@library/sync';
import * as navigationLib from '@library/navigation';
import * as routeLib from '@library/route';
import * as presentLib from '@library/presentation';


// Declarations: JQuery
declare var $: any;


// Component Definition
@Component({selector: 'app-navbar', templateUrl: './navbar.component.html'})


// Component Export Definition
export class NavbarComponent implements OnInit {

  // Libraries
  objLib = objLib;
  classLib = classLib;
  syncLib = syncLib;
  navigationLib = navigationLib;
  routeLib = routeLib;
  presentLib = presentLib;

  // jQuery
  jquery = $;

  // Path (Non-Configurable)
  shortPath: string;

  // Navigation (Non-Configurable)
  middleNavigation = null;
  rightNavigation = null;
  leftNavigation = null;
  innerWidth;
  publicPages = [];

  // Application Info
  appLogo = '';


  // Host Listener
  @HostListener('window:resize', ['$event'])
  onResize(event) {

    // Window Width
    this.innerWidth = window.innerWidth;

    // Collapse Background Revert
    this.collapseBackgroundRevert(window.innerWidth);

    // Responsive Navbar
    this.responsiveNav(window.innerWidth);

  }


  // Constructor
  constructor(private router: Router, public data: DataService, private http: HttpClient, private cookieService: CookieService, private platformLocation: PlatformLocation, public appConfig: AppConfig, public pluginConfig: PluginConfig, private hashConfig: HashConfig, public translate: TranslateService, public translation: TranslationService, private license: LicenseService, private localStorage: LocalStorageService, private routing: RouteService) {

    // Get Public Pages
    this.publicPages = this.routing.getPublicRoutes();

    // Translate
    let lang = this.translation.translation.translationFile;
    this.translate.setTranslation(lang, this.translation.translationContent);
    this.translate.setDefaultLang(lang);

    // Get App Logo
    this.appLogo = presentLib.getAppLogo(this.pluginConfig.plugin, this.appConfig.config);

    // Get Path & Navigation Info (Default)
    this.data.shortPath.subscribe(
      shortPath => {
        this.shortPath = shortPath;
        this.middleNavigation = navigationLib.getNavigation(this.appConfig.config, this.data.userData, 'navbar', 'middle');
        this.rightNavigation = navigationLib.getNavigation(this.appConfig.config, this.data.userData, 'navbar', 'right');
      }
    );
    this.data.leftNavigation.subscribe(leftNavigation => this.leftNavigation = leftNavigation);

    // Get Navigation
    this.middleNavigation = navigationLib.getNavigation(this.appConfig.config, this.data.userData, 'navbar', 'middle');
    this.rightNavigation = navigationLib.getNavigation(this.appConfig.config, this.data.userData, 'navbar', 'right');

    // Reload Page on Page Back
    platformLocation.onPopState(() => { location.reload(); });

  }


  // Page Initialisation
  async ngOnInit() {

    // Logout Hook
    $('#update-required').on("logout", () => { this.manualLogOut(); });

    // Login Hook
    $('#update-required').on("login", () => { this.logIn(); });

    // Token Check Hook
    $('#update-required').on("token-check", () => { this.tokenCheck(); });

    // Window Width
    this.innerWidth = window.innerWidth;

    // On Log In Page?
    if (window.location.pathname.includes('login') || (window.location.pathname.includes('home')) && (!this.cookieService.get('logout-manual')) && (!this.cookieService.get('logout-expired'))) {

      // Valid User Data
      if ((!objLib.isEmptyObject(this.data.userData.info)) && (!objLib.isEmptyObject(this.data.userData.right))) {

        // Immediately Navigate to Dashboard
        this.router.navigate([`dashboard`]);

      }

      // Invalid User Data
      else {

        // Log Out
        this.logOut();

      }

    }
    else {

      // Invalid User Data
      if (objLib.isEmptyObject(this.data.userData.info) || objLib.isEmptyObject(this.data.userData.right)) {

        // Log Out
        this.logOut();

      }

    }

  }


  // Log Out
  async logOut() {

    // Define API Authentication
    let token = this.cookieService.get('token');
    let headers: HttpHeaders = new HttpHeaders({"Authorization": "Token " + token});

    // Expire Current Session
    if (token) {
      await this.http.put(this.appConfig.config['apiRootUrl'] + 'activesession/expire', {}, { headers }).toPromise().then(
        res => {},
        err => { console.error('Unable to expire session'); }
      );
    }

    // Clear Stored Data
    this.cookieService.delete('token', '/');
    this.localStorage.clear('userData');

    // Navigate to Home
    this.router.navigate([`home`]);

  }

  // Manual Log Out
  manualLogOut() {

    // Set Cookie to Visualise Snackbar for Successful Log Out
    this.cookieService.set('logout-manual', 'yes', undefined, '/');

    // Trigger Log Out
    this.logOut();

  }

  // Perform Log In
  async logIn() {

    // Update User Data
    await this.data.loadUserData(this.hashConfig, this.appConfig);

    // Update License Info
    await this.license.loadLicense(this.hashConfig, this.appConfig);

    // Navigate to Dashboard
    this.router.navigate([`dashboard`]);

  }

  // Token Check
  async tokenCheck() {

    // Get Token Information
    let token = this.cookieService.get('token');

    // Valid Session Variable
    let validSession = false;

    // Check if Token is Valid
    if (token) {

      // Define API Authentication
      let headers: HttpHeaders = new HttpHeaders({"Authorization": "Token " + token});

      // Check Session Validity
      validSession = await this.http.get(this.appConfig.config['apiRootUrl'] + 'token', { headers }).toPromise().then(
        res => { return true; },
        err => { console.info('Current session does not exist or is expired!'); return false; }
      );

    }

    // No Token
    else { console.info('No token was found!'); }

    // Log Out
    if (!validSession) {

      // Clear Stored Token
      this.cookieService.delete('token', '/');

      // Set Cookie to Visualise Snackbar for Expired Session
      this.cookieService.set('logout-expired', 'yes', undefined, '/');

      // Trigger Log Out
      this.logOut();

    }

  }

  // Collapse Active?
  collapseActive() {
    if ($(window).width() < 992) { return true; }
    else { return false; }
  }

  // Let NavBar Settings/LogOut Appear on Collapsed Screen
  iconOnlyResize() {
    if ($(window).width() > 991) { return true; }
    else { return false; }
  }

  // Switch Left Navigation Expand
  async switchLeftNavExpand() {

    // Expand
    if (!this.leftNavigation) {
      this.displayNavBarLogo();
      this.switchNavBarBrandArrowDirection(true);
    }

    // Minimize
    else {
      classLib.addClass('navbar-logo', 'no-display');
      classLib.removeClass('navbar-logo', 'full-opacity');
      classLib.addClass('navbar-logo', 'zero-opacity');
      classLib.addClass('left-nav-bar', 'left-nav-bar-no-display');
      this.switchNavBarBrandArrowDirection(false);
    }

    // Trigger Switch
    this.data.flagLeftNavBarExpand(!this.leftNavigation);

  }

  // Display NavBar Logo
  async displayNavBarLogo() {

    // Asynchronous Wait
    await syncLib.asyncWait(500);

    // Make Navbar Logo Visible
    classLib.removeClass('navbar-logo', 'no-display');

    // Asynchronous Wait
    await syncLib.asyncWait(100);

    // Opacity Transition for Navbar
    classLib.removeClass('navbar-logo', 'zero-opacity');
    classLib.addClass('navbar-logo', 'full-opacity');

    // Left Nav Bar Content
    classLib.removeClass('left-nav-bar', 'left-nav-bar-no-display');

  }

  // Switch Navbar Brand Arrow Direction
  async switchNavBarBrandArrowDirection(state) {

    // Asynchronous Wait
    await syncLib.asyncWait(1000);

    // Minimized
    if (state) { classLib.removeClass('navbar-brand-arrow-left', 'half-rotate'); }

    // Expanded
    else { classLib.addClass('navbar-brand-arrow-left', 'half-rotate'); }

  }

  // Collapse Navigate
  collapseNav(path) { routeLib.navigateCollapse(this.router, path, this.innerWidth); }

  // Collapse Background Revert
  collapseBackgroundRevert(width) {
    if (width > 991) {
      if (classLib.hasClass('content-page', 'collapse-visibility')) {
        classLib.removeClass('content-page', 'collapse-visibility');
        classLib.removeClass('left-nav-bar', 'collapse-visibility');
        classLib.removeClass('navbar-brand', 'collapse-visibility');
        classLib.removeClass('NavBar', 'show');
      }
    }
  }

  // Make Sure NavBar is Responsive
  responsiveNav(width) {
    if (width < 992) {
      classLib.addClassbyClass('navbar-item', 'navbar-collapse-separation');
      classLib.addClass('NavBarToggle', 'navbar-dropdown-button-collapse-active');
    }
    else {
      classLib.removeClassbyClass('navbar-item', 'navbar-collapse-separation');
      classLib.removeClass('NavBarToggle', 'navbar-dropdown-button-collapse-active');
    }
  }

}
