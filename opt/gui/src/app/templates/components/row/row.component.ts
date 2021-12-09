/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-community/
    Contact:    https://neatly.be/
*/


// Imports: Default
import { HostListener, Component, Input, ElementRef, ViewChild, ViewContainerRef, OnInit } from '@angular/core';


// Component Definition
@Component({selector: 'app-template-row', templateUrl: './row.component.html'})


// Component Export Definition
export class TemplateRowComponent implements OnInit {

  // Template Input
  @Input() xxxlColWidth: number = 3;
  @Input() xxlColWidth: number = 6;
  @Input() xlColWidth: number = 6;
  @Input() lgColWidth: number = 12;
  @Input() mdColWidth: number = 12;
  @Input() smColWidth: number = 12;
  @Input() xsColWidth: number = 12;

  // Template
  @ViewChild('template', {static: true}) template;


  // Constructor
  constructor(private viewContainerRef: ViewContainerRef, private elementRef: ElementRef) {}


  // Page Initialisation
  ngOnInit() {

    // Render Template
    this.viewContainerRef.createEmbeddedView(this.template);

  }

  // Page After View Initialisation
  ngAfterViewInit() {

    // Remove Empty Component Selector
    let selectorName = this.elementRef.nativeElement.tagName.toLowerCase();
    let element = document.querySelectorAll(selectorName)[0];
    element.parentNode.removeChild(element);

  }

}
