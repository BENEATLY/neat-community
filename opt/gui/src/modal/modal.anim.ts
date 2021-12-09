/*
    Link: https://github.com/angular-patterns/ng-bootstrap-modal
    License: Open Source (Undefined)
*/


// Imports: Default
import { trigger, animate, style, group, state, transition, AnimationTriggerMetadata } from '@angular/animations';


// Define Modal Animation
export const baseAnimation: AnimationTriggerMetadata =
  trigger('baseAnimation', [

    state('void', style({position: 'fixed', opacity: 0}) ),

    // Route 'enter' transition
    transition(':enter', [

      // CSS styles at start of transition
      style({opacity: 0, 'z-index': '999999'}),

      // Animation and styles at end of transition
      animate('0.2s', style({opacity: 1, 'z-index': '999999'}))

    ]),
    transition(':leave', [

      // CSS styles at start of transition
      style({opacity: 1}),

      // Animation and styles at end of transition
      animate('0.2s', style({opacity: 0, 'z-index': '999999'}))

    ]),
  ])
