/*
    Link: https://github.com/angular-patterns/ng-bootstrap-modal
    License: Open Source (Undefined)
*/


// Imports: Default
import { HostListener, Component, Inject } from '@angular/core';

// Imports: Custom Services
import { ModalService } from '@modal/services/modal.service';
import { baseAnimation } from '@modal/modal.anim';


// Declarations: JQuery
declare var $: any;


// Component Definition
@Component({selector: 'modal-dialog', templateUrl: './modal-dialog.component.html', styleUrls: ['./modal-dialog.component.css'], animations: [baseAnimation]})


// Component Export Definition
export class ModalDialogComponent {


  // Host Listener
  @HostListener('keydown.escape', ['$event'])
  detectEscape(event) { this.close(); }


  // Constructor
  constructor(private modalService: ModalService) {}

  // Ensure Focus on Modal
  ngAfterViewInit() { $('#modal-focus-point').focus(); }

  // Close
  close() { this.modalService.close(); }

}
