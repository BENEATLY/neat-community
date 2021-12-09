/*
    Link: https://github.com/angular-patterns/ng-bootstrap-modal
    License: Open Source (Undefined)
*/


// Imports: Default
import { CommonModule } from '@angular/common';
import { NgModule, ANALYZE_FOR_ENTRY_COMPONENTS, ModuleWithProviders } from '@angular/core';

// Imports: Custom Services
import { Modals, InitModalService } from '@modal/modal.module';
import { ModalService } from '@modal/services/modal.service';
import { Router } from '@angular/router';
import { DataResolver } from '@modal/services/data.resolver';
import { Modal } from '@modal/models/modal.model';
import { CommonModalModule } from '@modal/common-modal.module';


// Module Definition
@NgModule({imports: [CommonModule, CommonModalModule], exports: [CommonModalModule]})


// Module Export Definition
export class RouterModalModule {

  // Define Required Modules and Providers
  static forRoot(modals: Modal[]): ModuleWithProviders {
    return {
      ngModule: RouterModalModule,
      providers: [
        {provide: Modals, useValue: modals},
        {provide: ANALYZE_FOR_ENTRY_COMPONENTS, multi: true, useValue: modals},
        {provide: ModalService, useFactory: InitModalService, deps: [Router, Modals, DataResolver]},
        DataResolver
      ]
    }
  }

}
