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
import { HostListener, Component, Inject } from '@angular/core';

// Imports: Custom Services
import { FocusService } from '@focus/services/focus.service';
import { baseAnimation } from '@focus/focus.anim';


// Declarations: JQuery
declare var $: any;


// Component Definition
@Component({selector: 'focus-dialog', templateUrl: './focus-dialog.component.html', styleUrls: ['./focus-dialog.component.css'], animations: [baseAnimation]})


// Component Export Definition
export class FocusDialogComponent {


  // Host Listener
  @HostListener('keydown.escape', ['$event'])
  detectEscape(event) { this.close(); }


  // Constructor
  constructor(private focusService: FocusService) {}

  // Ensure Focus on Focus
  ngAfterViewInit() { $('#focus-focus-point').focus(); }

  // Close
  close() { this.focusService.close(); }

  // Background Close
  backgroundClose(event) {
    if (event.target.tagName.toLowerCase() != 'img') { this.close(); }
  }

}
