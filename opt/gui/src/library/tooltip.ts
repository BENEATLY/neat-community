//  Author:     Thomas D'haenens
//  License:    GPL-3.0
//  Link:       https://github.com/BENEATLY/neat-start-orig/
//  Contact:    https://neatly.be/


// Imports: Libraries
import * as objLib from '@library/object';


// Declarations: JQuery
declare var $: any;


// Enable ToolTip
export function enableToolTip(activeToolTips, property, message, placement = 'bottom') {

  // New ToolTip
  if (!Object.keys(activeToolTips).includes(property)) {

    // Register ToolTip
    activeToolTips[property] = [true, message];

    // Show ToolTip
    $('#' + property.toLowerCase() + '-input').tooltip({title: message, placement: placement, trigger: 'manual'}).tooltip('show');

  }

  // Existing ToolTip
  else {

    // Different Message
    if (activeToolTips[property][1] != message) {

      // Change Message
      activeToolTips[property] = [true, message];

      // Show ToolTip
      $('#' + property.toLowerCase() + '-input').attr('title', message).tooltip('_fixTitle').tooltip('show');

    }

    // Hidden ToolTip
    if (!activeToolTips[property][0]) {

      // Register ToolTip as Active
      activeToolTips[property][0] = true;

      // Show ToolTip
      $('#' + property.toLowerCase() + '-input').tooltip('show');

    }

  }
}

// Disable ToolTip
export function disableToolTip(activeToolTips, property) {

  // Existing and Active ToolTip
  if ((property in activeToolTips) && (activeToolTips[property][0])) {

    // Register ToolTip as Inactive
    activeToolTips[property][0] = false;

    // Hide ToolTip
    $('#' + property.toLowerCase() + '-input').tooltip('hide');

  }

}

// Clear ToolTips
export function clearToolTips(activeToolTips) {

  // Iterate over Tooltips
  for (let tooltip of objLib.getKeys(activeToolTips)) {

    // Existing and Active ToolTip
    if (activeToolTips[tooltip][0]) {

      // Register ToolTip as Inactive
      activeToolTips[tooltip][0] = false;

      // Hide ToolTip
      $('#' + tooltip.toLowerCase() + '-input').tooltip('hide');

    }

  }

}

// Hide Active ToolTips
export function hideActiveToolTips(activeToolTips) {

  // Iterate over Tooltips
  for (let tooltip of objLib.getKeys(activeToolTips)) {

    // Existing and Active ToolTip
    if (activeToolTips[tooltip][0]) {

      // Hide ToolTip
      $('#' + tooltip.toLowerCase() + '-input').tooltip('hide');

    }

  }

}

// Show Active ToolTips
export function showActiveToolTips(activeToolTips) {

  // Iterate over Tooltips
  for (let tooltip of objLib.getKeys(activeToolTips)) {

    // Existing and Active ToolTip
    if (activeToolTips[tooltip][0]) {

      // Hide ToolTip
      $('#' + tooltip.toLowerCase() + '-input').tooltip('show');

    }

  }

}
