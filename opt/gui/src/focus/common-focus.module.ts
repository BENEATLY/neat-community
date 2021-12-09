/*

    Contains code from the following sources:

    Link: https://github.com/angular-patterns/ng-bootstrap-modal
    License: Open Source (Undefined)

    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-start-orig/
    Contact:    https://neatly.be/

*/


// Imports: Default
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';

// Imports: Custom Services
import { FocusDialogComponent } from '@focus/focus-dialog/focus-dialog.component';
import { FocusOutletComponent } from '@focus/focus-outlet/focus-outlet.component';


// Module Definition
@NgModule({imports: [CommonModule, BrowserAnimationsModule, RouterModule.forChild([])], declarations: [FocusDialogComponent, FocusOutletComponent], exports: [FocusDialogComponent, FocusOutletComponent], providers: []})


// Module Export Definition
export class CommonFocusModule { }
