/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-community/
    Contact:    https://neatly.be/
*/


// Imports: Required
import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER, Injector } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

// Imports: Dependents
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { NgxWebstorageModule } from 'ngx-webstorage';
import { RouterModalModule } from '@modal/router-modal.module';
import { RouterFocusModule } from '@focus/router-focus.module';
import { SafePipe } from '@app/safe.pipe';
import { VarDirective } from '@app/ngvar.directive';
import { SelectDirective } from '@app/select.directive';

// Imports: Visualisation
import { AmChartsService } from "@amcharts/amcharts3-angular";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxMapboxGLModule } from 'ngx-mapbox-gl';
import { SelectFilterModule } from '@select-filter/select-filter.module';

// Imports: Translation
import { TranslateCompiler, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateMessageFormatCompiler, MESSAGE_FORMAT_CONFIG } from 'ngx-translate-messageformat-compiler';

// Imports: Default
import { AppComponent } from '@app/app.component';

// Imports: Web Storage
import { webStorageConfig } from '@app/app.def.webstorage';

// Imports: Project
import * as appDefComponents from '@app/app.def.components';
import * as appDefConfigs from '@app/app.def.configs';
import * as appDefModals from '@app/app.def.modals';
import * as appDefFocuses from '@app/app.def.focuses';
import * as appDefServices from '@app/app.def.services';
import * as appDefFormatters from '@app/app.def.formatters';

// Imports: App Initialisers
import { RouteService } from '@app/route.service';
import { HashConfig } from '@app/hash.config';
import { AppConfig } from '@app/app.config';
import { DataService } from '@app/data.service';
import { TimezoneService } from '@app/timezone.service';
import { TranslationService } from '@app/translation.service';
import { LicenseService } from '@app/license.service';
import { PluginConfig } from '@app/plugin.config';


// Module Definition
@NgModule({
  declarations: [

    // Dependents
    SafePipe,
    VarDirective,
    SelectDirective,

    // Default
    AppComponent,
    ...appDefComponents.componentImportsList

  ],
  imports: [

    // Required
    BrowserModule,
    RouterModule.forRoot([]),

    // Dependents
    HttpClientModule,
    NgxWebstorageModule.forRoot(webStorageConfig),

    // Modals
    RouterModalModule.forRoot(appDefModals.modalImportsList),

    // Focuses
    RouterFocusModule.forRoot(appDefFocuses.focusImportsList),

    // Translation
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      },
      compiler: {
          provide: TranslateCompiler,
          useClass: TranslateMessageFormatCompiler
      }
    }),

    // Visualisation
    BrowserAnimationsModule,
    FormsModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    MatSelectModule,
    SelectFilterModule,
    NgxMapboxGLModule.withConfig({
      accessToken: null,
      geocoderAccessToken: null
    })

  ],
  exports: [RouterModule],
  providers: [

    // Initialisers
    {
      provide: APP_INITIALIZER,
      deps: [HashConfig, AppConfig, DataService, PluginConfig, TimezoneService, TranslationService, LicenseService, RouteService, Injector],
      useFactory: (hashConfig: HashConfig, appConfig: AppConfig, dataService: DataService, pluginConfig: PluginConfig, timezoneService: TimezoneService, translationService: TranslationService, licenseService: LicenseService, routeService: RouteService, injector: Injector) => {
        return () => {
          return hashConfig.load().then(
            () => {
              return appConfig.load(hashConfig).then(
                () => {
                  return routeService.loadRoutes(hashConfig, appDefComponents.componentImportsDict).then(
                    () => {
                      return Promise.all([
                        routeService.initRouterModule(injector.get(Router)),
                        dataService.loadUserData(hashConfig, appConfig),
                        licenseService.loadLicense(hashConfig, appConfig),
                        translationService.loadTranslation(hashConfig, appConfig),
                        pluginConfig.load(hashConfig, appConfig),
                        timezoneService.loadTimezone()
                      ]);
                    }
                  );
                }
              );
            }
          );
        }
      },
      multi: true
    },

    // Dependents
    CookieService,

    // Translation
    {
      provide: MESSAGE_FORMAT_CONFIG,
      useValue: {
        biDiSupport: true,
        formatters: appDefFormatters.formatterDict
      }
    },

    // Visualisation
    AmChartsService,

    // Custom Services
    ...appDefServices.serviceImportsList,

    // Config Loaders
    ...appDefConfigs.configImportsList

  ],

  // Bootstrap
  bootstrap: [AppComponent],

  // Entry Components
  entryComponents: appDefComponents.componentImportsList

})


// Class Export Definition
export class AppModule {}


// Required for AOT Compilation
export function HttpLoaderFactory(http: HttpClient) { return new TranslateHttpLoader(http, './assets/translations/', '.json'); }
