/*
    Link: https://github.com/angular-patterns/ng-bootstrap-modal
    License: Open Source (Undefined)
*/


// Imports: Default
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';

// Imports: Custom Services
import { ModalDialogComponent } from '@modal/modal-dialog/modal-dialog.component';
import { ModalOutletComponent } from '@modal/modal-outlet/modal-outlet.component';


// Module Definition
@NgModule({imports: [CommonModule, BrowserAnimationsModule, RouterModule.forChild([])], declarations: [ModalDialogComponent, ModalOutletComponent], exports: [ModalDialogComponent, ModalOutletComponent], providers: []})


// Module Export Definition
export class CommonModalModule { }
