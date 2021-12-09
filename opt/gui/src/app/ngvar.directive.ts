// Imports: Required
import { Input, Directive, ViewContainerRef, TemplateRef } from '@angular/core';


// Class Export Definition
@Directive({selector: '[ngVar]'})
export class VarDirective {

  // Directive Defintion
  @Input()
  set ngVar(context: any) {
    this.context.$implicit = this.context.ngVar = context;
    this.updateView();
  }


  // Define Properties
  private context: any = {};


  // Constructor
  constructor(private vcRef: ViewContainerRef, private templateRef: TemplateRef<any>) {}


  // Update View
  updateView() {
    this.vcRef.clear();
    this.vcRef.createEmbeddedView(this.templateRef, this.context);
  }

}
