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
import { Router, NavigationExtras } from '@angular/router';
import { Injectable, Inject, Injector } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { Subscriber } from 'rxjs/Subscriber';
import { Observer } from 'rxjs/Observer';
import { ActivatedRouteSnapshot } from '@angular/router';

// Imports: Custom Services
import { DataResolver } from '@focus/services/data.resolver';
import { Result } from '@focus/models/result.model';


// Injectable Definition
@Injectable()


// Module Export Definition
export class FocusService {

  // Define Variables
  results: Result<any>[];


  // Constructor
  constructor(@Inject(Router) private router: Router, private resolver: DataResolver) { this.results = []; }


  // Get Value
  getValue(): any {
    if (this.router.routerState && this.router.routerState.snapshot && this.router.routerState.snapshot.root) {
      var snapshot:ActivatedRouteSnapshot = this.router.routerState.snapshot.root.children.filter(t => t.outlet == 'focus')[0];
      return snapshot.data.value;
    }
    return undefined;
  }

  // Open Focus
  open<T>(name: string, data?: Observable<T> | Promise<T> | T) {
    this.resolver.setValue(data);
    this.router.navigate([{outlets: {focus: [name]}}], {skipLocationChange: true});
    var result = new Result<T>(name);
    this.results.push(result);
    return result;
  }

  // Close Focus (Close)
  close() {
    this.router.navigate([{outlets: {focus: null}}], {skipLocationChange: true});
    this.results.splice(this.results.length-1, 1);
  }

  // Close Focus (OK)
  ok(value?:any) {
    this.results[this.results.length-1].nextOk(value);
    this.close();
  }

  // Close Focus (Cancel)
  cancel() {
    this.results[this.results.length-1].nextCancel();
    this.close();
  }

  // Navigate to Route (Out of Focus)
  navExternal(route) {
    this.router.navigate([{outlets: {focus: null}}], {skipLocationChange: true}).then(() => this.router.navigate(route.split('/')));
    this.results.splice(this.results.length-1, 1);
  }

}
