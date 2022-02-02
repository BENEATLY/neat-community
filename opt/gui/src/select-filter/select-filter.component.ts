/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-community/
    Contact:    https://neatly.be/
*/


// Imports: Required
import { Component, Input, EventEmitter, Output, ViewChild, OnDestroy } from '@angular/core';
import { A, Z, ZERO, NINE, SPACE, END, HOME } from '@angular/cdk/keycodes';


// Component Definition
@Component({selector: 'select-filter', templateUrl: './select-filter.component.html'})


// Component Export Definition
export class SelectFilterComponent {

  // Inputs
  @Input('fullList') fullList: any[] = [];
  @Input('searchAttribute') searchAttribute: string;
  @Input('searchPlaceHolder') searchPlaceHolder: string = '';

  // Outputs
  @Output() searchResult = new EventEmitter<any>();

  // Input Field
  @ViewChild('input', { static: true }) input;

  // Definitions (Non-Configurable)
  filteredList: any = [];
  inputValue: string = '';


  // Constructor
  constructor() { }


  // On Page Destroy
  ngOnDestroy() {

    // Return Full List
    this.searchResult.emit(this.fullList);

  }

  // Value Change
  valueChange(newValue) {

    // Update Input Value
    this.inputValue = newValue;

    // Update Query
    this.queryList(newValue);

  }

  // Reset Value
  resetValue(event) {

    // Reset Input Value
    this.inputValue = '';

    // Return Full List
    this.searchResult.emit(this.fullList);

  }

  // Query List
  queryList(value) {

    // Has Value
    if (value) {

      // Has No Search Attribute
      if (this.searchAttribute == null) { this.filteredList = this.fullList.filter(name => name.toLowerCase().includes(value.toLowerCase())); }

      // Has Search Attribute
      else { this.filteredList = this.fullList.filter(item => item[this.searchAttribute].toLowerCase().includes(value.toLowerCase())); }

    }

    // No Value
    else { this.filteredList = this.fullList.slice(); }

    // Return Search Result
    this.searchResult.emit(this.filteredList);

  }

  // Prevent Propagation for All Alphanumeric Chars
  handleKeydown(event: KeyboardEvent) {
    if ((event.key && event.key.length === 1) || (event.keyCode >= A && event.keyCode <= Z) || (event.keyCode >= ZERO && event.keyCode <= NINE) || (event.keyCode === SPACE)) { event.stopPropagation(); }
  }

}
