/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-start-orig/
    Contact:    https://neatly.be/
*/


// Imports: Default
import { HostListener, Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

// Imports: Custom Services
import { DataService } from '@app/data.service';
import { RouteService } from '@app/route.service';

// Imports: Config Loaders
import { AppConfig } from '@app/app.config';
import { PluginConfig } from '@app/plugin.config';

// Imports: Libraries
import * as presentLib from '@library/presentation';
import * as navigationLib from '@library/navigation';


// Declarations: JQuery
declare var $: any;


// Component Definition
@Component({selector: 'app-root', templateUrl: './app.component.html'})


// Class Export Definition
export class AppComponent {

  // Libraries
  presentLib = presentLib;
  navigationLib = navigationLib;

  // jQuery
  jquery = $;

  // Path (Non-Configurable)
  shortPath: string;
  fullPath: string;

  // Navigation (Non-Configurable)
  navigation = null;
  leftNavigation = null;
  innerWidth;
  publicPages = [];
  noNavPages = [];

  // Scroll
  contentScroll = {'active': false, 'offset': 0};


  // Host Listener
  @HostListener('window:resize', ['$event'])
  onResize(event) {

    // Window Width
    this.innerWidth = window.innerWidth;

  }


  // Constructor
  constructor(public appConfig: AppConfig, public pluginConfig: PluginConfig, private titleService: Title, public data: DataService, private routing: RouteService) {

    // Get Public & No Navigation Pages
    this.publicPages = this.routing.getPublicRoutes();
    this.noNavPages = this.routing.getNoNavRoutes();

    // Set App Icon
    let appIcon = document.querySelector('#app-icon') as HTMLLinkElement;
    appIcon.href = presentLib.getAppIcon(this.pluginConfig.plugin, this.appConfig.config);

    // Set App Title
    this.titleService.setTitle(presentLib.getAppTitle(this.pluginConfig.plugin, this.appConfig.config));

    // Get Path & Navigation Info (Default)
    this.data.shortPath.subscribe(
      shortPath => {
        this.shortPath = shortPath;
        this.navigation = navigationLib.getNavigation(this.appConfig.config, this.data.userData, 'leftbar', shortPath);
      }
    );
    this.data.fullPath.subscribe(fullPath => this.fullPath = fullPath);
    this.data.leftNavigation.subscribe(leftNavigation => this.leftNavigation = leftNavigation);

    // Get Navigation
    this.navigation = navigationLib.getNavigation(this.appConfig.config, this.data.userData, 'leftbar', this.shortPath);

  }


  // Page Initialisation
  async ngOnInit() {

    // Window Width
    this.innerWidth = window.innerWidth;

  }

  // Scroll Content
  scrollContent(event) {

    // Active
    if ($('#content-page').scrollTop() > 150) { this.contentScroll.active = true; }
    else { this.contentScroll.active = false; }

    // Offset
    if ($('.credit-footer').length || $('.important-message').length) {
      let maxHeight = $('#content-page')[0].scrollHeight;
      if ($('.credit-footer').length) { maxHeight = maxHeight - $('.credit-footer').height(); }
      if ($('.important-message').length) { maxHeight = maxHeight - $('.important-message').height(); }
      let overflowHeight = ($('#content-page').scrollTop() + $('#content-page').height() - maxHeight);
      if (overflowHeight > 0) { this.contentScroll.offset = overflowHeight; }
      else { this.contentScroll.offset = 0; }
    }
    else { this.contentScroll.offset = 0; }

  }

  // Scroll to Top
  scrollToTop() { $('#content-page')[0].scroll({top: 0, behavior: 'smooth'}); }

}
