/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-community/
    Contact:    https://neatly.be/
*/


// Imports: Required
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

// Imports: Default
import { AppModule } from '@app/app.module';
import { environment } from '@environments/environment';


// Determine if Production Build is Required
if (environment.production) { enableProdMode(); }


// Bootstrap Project
platformBrowserDynamic().bootstrapModule(AppModule).catch(err => console.log(err));
