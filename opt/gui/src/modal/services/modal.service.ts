/*
    Link: https://github.com/angular-patterns/ng-bootstrap-modal
    License: Open Source (Undefined)
*/


// Imports: Default
import { Router, NavigationExtras } from '@angular/router';
import { Injectable, Inject, Injector } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { Subscriber } from 'rxjs/Subscriber';
import { Observer } from 'rxjs/Observer';
import { ActivatedRouteSnapshot } from '@angular/router';

// Imports: Custom Services
import { DataResolver } from '@modal/services/data.resolver';
import { Result } from '@modal/models/result.model';


// Injectable Definition
@Injectable()


// Module Export Definition
export class ModalService {

  // Define Variables
  results: Result<any>[];


  // Constructor
  constructor(@Inject(Router) private router: Router, private resolver: DataResolver) { this.results = []; }


  // Get Value
  getValue(): any {
    if (this.router.routerState && this.router.routerState.snapshot && this.router.routerState.snapshot.root) {
      var snapshot:ActivatedRouteSnapshot = this.router.routerState.snapshot.root.children.filter(t => t.outlet == 'modal')[0];
      return snapshot.data.value;
    }
    return undefined;
  }

  // Open Modal
  open<T>(name: string, data?: Observable<T> | Promise<T> | T) {
    this.resolver.setValue(data);
    this.router.navigate([{outlets: {modal: [name]}}], {skipLocationChange: true});
    var result = new Result<T>(name);
    this.results.push(result);
    return result;
  }

  // Close Modal (Close)
  close() {
    this.router.navigate([{outlets: {modal: null}}], {skipLocationChange: true});
    this.results.splice(this.results.length-1, 1);
  }

  // Close Modal (OK)
  ok(value?:any) {
    this.results[this.results.length-1].nextOk(value);
    this.close();
  }

  // Close Modal (Cancel)
  cancel() {
    this.results[this.results.length-1].nextCancel();
    this.close();
  }

  // Navigate to Route (Out of Modal)
  navExternal(route) {
    this.router.navigate([{outlets: {modal: null}}], {skipLocationChange: true}).then(() => this.router.navigate(route.split('/')));
    this.results.splice(this.results.length-1, 1);
  }

}
