/*
    Link: https://github.com/angular-patterns/ng-bootstrap-modal
    License: Open Source (Undefined)
*/


// Export Class
export class Result<T> {

  // Define Variables
  name: string;
  ok?: (value:T)=>void;
  cancel?: ()=>void;

  // Constructor
  constructor(name: string) { this.name = name; }

  // Subscribe
  subscribe(ok?: (value:T)=>void, cancel?:()=>void) {
    this.ok = ok;
    this.cancel = cancel;
  }

  // Next OK
  nextOk(value: T) {
    if (this.ok) { this.ok(value); }
  }

  // Next Cancel
  nextCancel() {
    if (this.cancel) { this.cancel(); }
  }

}
