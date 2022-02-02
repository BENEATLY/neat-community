/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-community/
    Contact:    https://neatly.be/
*/


// Imports: Required
import { HostListener, Directive, OnInit, Renderer2 } from '@angular/core';
import { MatSelect } from '@angular/material/select';

// Imports: Libraries
import * as classLib from '@library/class';


// Class Export Definition
@Directive({selector: '[selectDir]'})


// Component Export Definition
export class SelectDirective implements OnInit {

  // Panel State
  isOpen: boolean = false;

  // Subscriptions
  openSubscription;


  // Host Listener (Resize)
  @HostListener('window:resize', ['$event'])
  onResize(event) {

    // Panel Open
    if (this.isOpen) {

      // Adjust Position
      this.adjustPosition();

    }

  }


  // Host Listener (Scroll)
  @HostListener('document:wheel', ['$event'])
  onWheel(event) {

    // Panel Open
    if (this.isOpen) {

      // Cursor Out of Panel
      if (!this.cursorInPanel(event.clientX, event.clientY)) {

        // Reset Search Input
        this.resetSearchInput();

        // Close Panel
        this.select.close();

        // Clear
        classLib.clearOverlayContainer();

        // Set Panel State
        this.isOpen = false;

      }

    }

  }


  // Host Listener (Click)
  @HostListener('document:click', ['$event'])
  onClick(event) {

    // Panel Open
    if (this.isOpen) {

      // Cursor Out of Panel
      if (!this.cursorInPanel(event.clientX, event.clientY)) {

        // Reset Search Input
        this.resetSearchInput();

        // Close Panel
        this.select.close();

        // Clear
        classLib.clearOverlayContainer();

        // Set Panel State
        this.isOpen = false;

      }

    }

  }


  // Constructor
  constructor(private select: MatSelect, private renderer: Renderer2) { }


  // Page Initialisation
  ngOnInit() {

    // Update Position
    this.openSubscription = this.select.openedChange.subscribe(isOpen => {

      // Set Panel State
      this.isOpen = isOpen;

      // Panel Open
      if (isOpen) {

        // Clear
        classLib.clearOverlayContainer();

        // Adjust Position
        this.adjustPosition();

      }

    });

  }


  // Page On Destroy
  ngOnDestroy() {

    // Unsubscribe
    this.openSubscription.unsubscribe();

    // Clear
    classLib.clearOverlayContainer();

  }


  // Cursor In Panel
  cursorInPanel(cursorX, cursorY) {

    // Has No Panel
    if (!this.select.panel) { return false; }

    // Get Panel Position
    let panelPosition = this.select.panel.nativeElement.getBoundingClientRect();

    // Check Position
    return ((cursorX >= panelPosition.left) && (cursorX <= (panelPosition.left + panelPosition.width)) && (cursorY >= panelPosition.top) && (cursorY <= (panelPosition.top + panelPosition.height)))

  }


  // Reset Search Input
  resetSearchInput() {

    // Has Panel
    if (this.select.panel) {

      // Get Input Element
      let inputElement = this.select.panel.nativeElement.children[0].children[0].children[0];

      // Create Reset Event
      let event = new CustomEvent('reset', {bubbles: true});

      // Dispatch Event
      (inputElement as any)['dispatchEvent'].apply(inputElement, [event]);

    }

  }


  // Adjust Position
  adjustPosition() {

    // Get Height
    let windowHeight = window.innerHeight;

    // Get Select Position
    let selectPosition = this.select.trigger.nativeElement.getBoundingClientRect();

    // Set Position
    this.renderer.setStyle(this.select.panel.nativeElement, 'position', 'absolute');
    this.renderer.setStyle(this.select.panel.nativeElement, 'left', `calc(${selectPosition.left}px - 12px)`);
    this.renderer.setStyle(this.select.panel.nativeElement, 'top', `calc(${selectPosition.top}px - 6px)`);

    // Set Width
    this.renderer.setStyle(this.select.panel.nativeElement, 'width', `calc(${selectPosition.width}px + 24px)`);

    // Calculate Height
    let maxHeight = (windowHeight - selectPosition.top - 30);

    // Set Height
    this.renderer.setStyle(this.select.panel.nativeElement, 'maxHeight', `${maxHeight}px`);

    // Display
    this.renderer.setStyle(this.select.panel.nativeElement, 'visibility', 'visible');

  }

}
