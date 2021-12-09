/*
    Link: https://github.com/angular-patterns/ng-bootstrap-modal
    License: Open Source (Undefined)
*/


// Imports: Default
import { NgModule, InjectionToken, ANALYZE_FOR_ENTRY_COMPONENTS, ModuleWithProviders } from '@angular/core';
import { Router, Routes, RouterModule } from '@angular/router';

// Imports: Custom Services
import { Modal } from '@modal/models/modal.model';
import { DataResolver } from '@modal/services/data.resolver';
import { ModalService } from '@modal/services/modal.service';
import { CommonModule } from '@angular/common';
import { CommonModalModule } from '@modal/common-modal.module';


// Define Variables
export const Modals = new InjectionToken<Modal[]>('modals');

// Init Modal Function
export function InitModalService(router: Router, modals: Modal[], resolver: DataResolver) {
  var routes:Routes = modals.map(t => {return { path: t.name, component: t.component, outlet: 'modal', resolve: { value: DataResolver }}});
  var r = router.config.concat(routes);
  router.resetConfig(r);
  return new ModalService(router, resolver);
}


// Module Definition
@NgModule({imports: [CommonModule, CommonModalModule, RouterModule.forRoot([])], exports: [CommonModalModule], providers: []})


// Module Export Definition
export class ModalModule {

  // Define Required Modules and Providers
  static forRoot(modals: Modal[]): ModuleWithProviders {
    return {
      ngModule: ModalModule,
      providers: [
        {provide: Modals, useValue: modals},
        {provide: ANALYZE_FOR_ENTRY_COMPONENTS, multi: true, useValue: modals},
        {provide: ModalService, useFactory: InitModalService, deps: [Router, Modals, DataResolver]},
        DataResolver
      ]
    }
  }

}
