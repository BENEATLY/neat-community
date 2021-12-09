//  Author:     Thomas D'haenens
//  License:    GPL-3.0
//  Link:       https://github.com/BENEATLY/neat-community/
//  Contact:    https://neatly.be/


// Imports: Libraries
import * as valLib from '@library/validate';
import * as objLib from '@library/object';


// Info Modal
export function infoModal(modalService, entries, meta) {

  // Gather Properties
  let properties = entries;

  // Open Modal Window
  modalService.open('info', [properties, meta]).subscribe();

}

// Option Modal
export function pluginOptionModal(modalService, entries, meta, updateRef) {

  // Gather Properties
  let properties = [];
  for (let entry of entries) {
    properties.push({'property': entry.property, 'value': entry.value, 'initialValue': entry.value, 'comparedValue': null, 'accepted': entry.accepted, 'existingList': [], 'visible': valLib.isVisible(entry), 'required': valLib.isRequired(entry), 'optional': valLib.isOptional(entry), 'implicit': valLib.hasImplicitValue(entry), 'disabled': valLib.isDisabled(entry), 'editable': valLib.isEditable(entry), 'initialisable': valLib.isInitialisable(entry), 'censored': valLib.isCensored(entry), 'double': valLib.needsDoubleInput(entry), 'external': valLib.isExternal(entry), 'self-only': valLib.isSelfOnly(entry), 'compressed': valLib.isCompressed(entry), 'reference': valLib.hasReference(entry), 'config': entry.config});
  }

  // Open Modal Window
  modalService.open('plugin-option', [properties, meta]).subscribe(t => { updateRef.trigger("reload"); });

}

// Property Modal
export function propertyModal(modalService, entries, meta, updateRef) {

  // Construct List
  if (!objLib.lookUpKey(meta, 'list')) { meta.list = (meta.config['apiRootUrl'] + meta.object.name.toLowerCase() + '/list'); }

  // Construct URL
  if (!objLib.lookUpKey(meta, 'url')) {
    if (meta.type == 'Edit') { meta.url = (meta.config['apiRootUrl'] + meta.object.name.toLowerCase() + '/edit/'); }
    else if (meta.type == 'Delete') { meta.url = (meta.config['apiRootUrl'] + meta.object.name.toLowerCase() + '/delete/'); }
    else if (meta.type == 'Create') { meta.url = (meta.config['apiRootUrl'] + meta.object.name.toLowerCase() + '/create'); }
  }

  // Gather Properties
  let properties = [];
  for (let entry of entries) {
    properties.push({'property': entry.property, 'value': entry.value, 'initialValue': entry.value, 'comparedValue': null, 'accepted': entry.accepted, 'existingList': [], 'visible': valLib.isVisible(entry), 'required': valLib.isRequired(entry), 'optional': valLib.isOptional(entry), 'implicit': valLib.hasImplicitValue(entry), 'disabled': valLib.isDisabled(entry), 'editable': valLib.isEditable(entry), 'initialisable': valLib.isInitialisable(entry), 'censored': valLib.isCensored(entry), 'double': valLib.needsDoubleInput(entry), 'external': valLib.isExternal(entry), 'self-only': valLib.isSelfOnly(entry), 'compressed': valLib.isCompressed(entry), 'reference': valLib.hasReference(entry)});
  }

  // Open Modal Window
  modalService.open('property', [properties, meta]).subscribe(t => { updateRef.trigger("update"); });

}

// Long Content Modal
export function longContentModal(modalService, meta) {

  // Open Modal Window
  modalService.open('longcontent', meta).subscribe();

}

// Help Modal
export function helpModal(modalService, meta) {

  // Open Modal Window
  modalService.open('help', meta).subscribe();

}

// Box Help Modal
export function boxHelpModal(modalService, meta) {

  // Open Modal Window
  modalService.open('box-help', meta).subscribe();

}

// Plugin Option Help Modal
export function pluginOptionHelpModal(modalService, meta) {

  // Open Modal Window
  modalService.open('plugin-option-help', meta).subscribe();

}
