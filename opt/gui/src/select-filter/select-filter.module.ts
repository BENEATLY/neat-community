/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-community/
    Contact:    https://neatly.be/
*/


// Imports: Required
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Imports: Custom Services
import { SelectFilterComponent } from '@select-filter/select-filter.component';


// Module Definition
@NgModule({declarations: [SelectFilterComponent], imports: [CommonModule, FormsModule], exports: [SelectFilterComponent]})


// Module Export Definition
export class SelectFilterModule { }
