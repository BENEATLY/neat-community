/*
    Link: https://github.com/angular-patterns/ng-bootstrap-modal
    License: Open Source (Undefined)
*/


// Imports: Default
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Observable } from 'rxjs/Observable';


// Module Export Definition
export class DataResolver implements Resolve<any> {

  // Define Variables
  value: Observable<any> | Promise<any> | any;

  // Constructor
  constructor() { }

  // Set Value
  setValue(value: Observable<any> | Promise<any> | any) { this.value = value; }

  // Resolve
  resolve(route: ActivatedRouteSnapshot): Observable<any> | Promise<any> | any { return this.value; }

}
