//  Author:     Thomas D'haenens
//  License:    GPL-3.0
//  Link:       https://github.com/BENEATLY/neat-community/
//  Contact:    https://neatly.be/


// Declarations: JQuery
declare var $: any;


// Class Exists?
export function classExists(name) { return ($('.' + name).length?true:false); }

// Has Class
export function hasClass(id, ref) { return $('#' + id).hasClass(ref); }

// Add Class to Id
export function addClass(id, ref) { $('#' + id).addClass(ref); }

// Remove Class to Id
export function removeClass(id, ref) { $('#' + id).removeClass(ref); }

// Add Class to Class
export function addClassbyClass(name, ref) { $('.' + name).addClass(ref); }

// Remove Class to Class
export function removeClassbyClass(name, ref) { $('.' + name).removeClass(ref); }

// Get Class List
export function getClassListByClass(name) { return $('.' + name).attr('class').split(/\s+/); }

// Clear Overlay Container
export function clearOverlayContainer() {

  // Check if Overlay Exists
  if (classExists('cdk-overlay-container')) {

    // Get Overlay Class List
    let classList = getClassListByClass('cdk-overlay-container');

    // Remove Other Classes
    for (let cla of classList) {
      if (cla != 'cdk-overlay-container') { removeClassbyClass('cdk-overlay-container', cla); }
    }

  }

}

// Add Overlay Class
export function addOverlayClass(name) { addClassbyClass('cdk-overlay-container', name); }
