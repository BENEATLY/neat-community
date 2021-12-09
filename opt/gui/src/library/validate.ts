//  Author:     Thomas D'haenens
//  License:    GPL-3.0
//  Link:       https://github.com/BENEATLY/neat-start-orig/
//  Contact:    https://neatly.be/


// Imports: Libraries
import * as objLib from '@library/object';


// Return Name of Object if Object
export function convertToObjectName(obj) {
  if (obj === Object(obj)) { return obj.name; }
  else { return obj; }
}

// Return Id of Object if Object
export function convertToObjectId(obj) {
  if (obj === Object(obj)) { return obj.id; }
  else { return obj; }
}

// Check If 2 Objects are Equal by Parameters
export function isEqualWithParams(a, b, params) {
  let match = [];
  for (let param of params) {
    try {
      if (convertToObjectId(a[param]) == convertToObjectId(b[param])) { match.push(true); }
      else { match.push(false); }
    }
    catch(e) { match.push(false); }
  }
  return match.every(x => x == true);
}

// Check if String is Integer (> 0)
export function isStringInt(val) { return parseInt(val); }

// Check if Object
export function isObject(obj) { return (obj === Object(obj)); }

// Check if Array
export function isArray(obj) { return (Array.isArray(obj)); }

// Check if Boolean
export function isBoolean(obj) { return (typeof obj === "boolean"); }

// Check if String
export function isString(obj) { return (typeof obj === "string"); }

// Check if Number
export function isNumber(obj) { return (typeof obj === "number"); }

// Is Visible
export function isVisible(property) { return (!(objLib.lookUpKey(property, 'visible') && (property.visible == false))); }

// Is Required
export function isRequired(property) { return (!(objLib.lookUpKey(property, 'required') && (property.required == false))); }

// Is Optional
export function isOptional(property) { return (objLib.lookUpKey(property, 'optional') && (property.optional == true)); }

// Is Implicit
export function isImplicit(property) { return (objLib.lookUpKey(property, 'implicit') && (property.implicit != false)); }

// Has Implicit Value
export function hasImplicitValue(property) {
  if (objLib.lookUpKey(property, 'implicit')) { return property.implicit; }
  else { return false; }
}

// Has Format
export function hasFormat(property, format) {
  if (format == null) { return objLib.lookUpKey(property.accepted, 'format'); }
  if (objLib.lookUpKey(property.accepted, 'format')) {
    if (objLib.isArray(property.accepted.format)) { return property.accepted.format.includes(format); }
    else { return (property.accepted.format == format); }
  }
  else { return false; }
}

// Has Restriction
export function hasRestriction(property, restriction) {
  if (restriction == null) { return objLib.lookUpKey(property.accepted, 'restriction'); }
  if (objLib.lookUpKey(property.accepted, 'restriction')) {
    if (objLib.isArray(property.accepted.restriction)) { return property.accepted.restriction.includes(restriction); }
    else { return (property.accepted.restriction == restriction); }
  }
  else { return false; }
}

// Is Disabled
export function isDisabled(property) { return (objLib.lookUpKey(property, 'disabled') && (property.disabled)); }

// Is Editable
export function isEditable(property) { return (!(objLib.lookUpKey(property, 'editable') && (!property.editable))); }

// Is Initialisable
export function isInitialisable(property) { return (!(objLib.lookUpKey(property, 'initialisable') && (!property.initialisable))); }

// Display Column
export function isDisplayColumn(property) { return (!(objLib.lookUpKey(property, 'column') && (!property.column))); }

// Is Censored
export function isCensored(property) { return (objLib.lookUpKey(property, 'censored') && (property.censored)); }

// Needs Double Input
export function needsDoubleInput(property) { return (objLib.lookUpKey(property, 'double') && (property.double)); }

// Is Defined Boolean
export function isDefinedBoolean(property) { return (property.accepted.type == 'Boolean'); }

// Is Defined List
export function isDefinedList(property) { return (property.accepted.type == 'List'); }

// Is Defined String
export function isDefinedString(property) { return (property.accepted.type == 'String'); }

// Is Defined Id
export function isDefinedId(property) { return (property.accepted.type == 'Id'); }

// Is Defined Number
export function isDefinedNumber(property) { return (property.accepted.type == 'Number'); }

// Is Defined File
export function isDefinedFile(property) { return ((property.accepted.type == 'File') || (property.accepted.type == 'File-Raw')); }

// Is Defined Raw File
export function isDefinedRawFile(property) { return (property.accepted.type == 'File-Raw'); }

// Is Defined Time
export function isDefinedTime(property) { return (property.accepted.type == 'Time'); }

// Is Defined DateTime
export function isDefinedDateTime(property) { return (property.accepted.type == 'DateTime'); }

// Is Defined Date
export function isDefinedDate(property) { return (property.accepted.type == 'Date'); }

// Is External
export function isExternal(property) { return (objLib.lookUpKey(property, 'external') && property.external); }

// Is Sortable
export function isSortable(property) { return ((!objLib.lookUpKey(property, 'sortable')) || property.sortable); }

// Is Parent
export function isParent(property) { return (objLib.lookUpKey(property, 'parent') && property.parent); }

// Has Maximum Constraint
export function hasMaxConstraint(property) { return objLib.lookUpKey(property.accepted, 'max'); }

// Has Minimim Constraint
export function hasMinConstraint(property) { return objLib.lookUpKey(property.accepted, 'min'); }

// Has Step
export function hasStep(property) { return objLib.lookUpKey(property.accepted, 'step'); }

// Has Reference
export function hasReference(property) {
  if (property && objLib.lookUpKey(property, 'reference') && property.reference) { return property.reference; }
  else { return false; }
}

// Has Sorting
export function hasSorting(property) { return (objLib.lookUpKey(property, 'sorting') && property.sorting); }

// Is Self Only
export function isSelfOnly(property) { return ((!objLib.lookUpKey(property, 'self-only')) || (!property['self-only'])); }

// Is Icon Only
export function isIconOnly(property) { return (objLib.lookUpKey(property, 'icon-only') && property['icon-only']); }

// Is Compressed
export function isCompressed(property) { return (objLib.lookUpKey(property, 'compressed') && property.compressed); }

// Is Nullable
export function isNullable(property) { return ((!objLib.lookUpKey(property.accepted, 'nullable')) || property.accepted.nullable); }

// Is Filterable
export function isFilterable(property) { return ((!objLib.lookUpKey(property, 'filterable')) || property.filterable); }

// Is Linked
export function isLinked(property) { return (objLib.lookUpKey(property, 'linked') && property.linked); }

// Is Json Format
export function isJsonFormat(property) { return hasFormat(property, 'json'); }

// Is JSON
export function isJson(item) {
  item = typeof item !== "string" ? JSON.stringify(item) : item;
  try { item = JSON.parse(item); }
  catch (e) { return false; }
  if (typeof item === "object" && item !== null) { return true; }
  return false;
}

// Is Same Dict
export function isSameObject(obj1, obj2) { return (JSON.stringify(obj1) === JSON.stringify(obj2)); }

// Is Secure File Name
export function isSecureFileName(val) { return (val.match(/^[\w\-.]+$/)); }

// Has Filter
export function hasFilter(property) { return objLib.lookUpKey(property.accepted, 'filter'); }

// Filtered Property
export function isFilteredProperty(property, filters) {

  // No Filter
  if (filters == null) { return false; }

  // Property in Filter
  return (objLib.getKeys(filters).includes(property.property));

}

// Fixed Definition
export function hasFixedDefinition(meta) {
  return (objLib.lookUpKey(meta, 'options') && objLib.lookUpKey(meta.options, 'fixed'));
}

// Is Fixed
export function isFixed(meta, property) {
  if (!hasFixedDefinition(meta)) { return false; }
  else { return objLib.lookUpKey(meta.options.fixed, property.property); }
}

// Has Accuracy
export function hasAccuracy(property) { return (objLib.lookUpKey(property.accepted, 'accuracy')); }

// Value Presentation?
export function hasValuePresentation(val, property, filters = null) { return (isVisible(property) && (!isFilteredProperty(property, filters)) && (!isBoolean(val)) && (!isArray(val)) && (!isObject(val))); }

// Custom Presentation?
export function hasCustomPresentation(val, property, filters = null) { return (isVisible(property) && (!isFilteredProperty(property, filters)) && (!isBoolean(val)) && (!isArray(val)) && isObject(val)); }

// List Presentation?
export function hasListPresentation(val, property, filters = null) { return (isVisible(property) && (!isFilteredProperty(property, filters)) && isArray(val) && (val.length > 0)); }

// Any Presentation?
export function hasAnyPresentation(val, property, filters = null) { return (isVisible(property) && (!isFilteredProperty(property, filters)) && isArray(val) && (val.length == 0) && (objLib.lookUpKey(property, 'any') && property.any)); }

// Boolean Presentation?
export function hasBooleanPresentation(val, property, filters = null) { return (isVisible(property) && (!isFilteredProperty(property, filters)) && isBoolean(val)); }

// Invisible Presentation?
export function hasInvisiblePresentation(val, property, filters = null) { return ((!isVisible(property)) && (!isFilteredProperty(property, filters))); }

// Presentable Value?
export function hasPresentableValue(val, property) {
  if ((isDefinedString(property) || isDefinedBoolean(property) || isDefinedFile(property) || isDefinedNumber(property) || isTimeDependent(property)) && (val == null)) { return false; }
  else if (isDefinedId(property) && ((val == null) || (val.id == null))) { return false; }
  else if (isDefinedList(property) && isArray(val) && (val.length == 0) && (!hasAnyPresentation(val, property))) { return false; }
  else { return true; }
}

// Has N/A Presentation
export function hasNAPresentation(val, property) { return ((!objLib.lookUpKey(property.accepted, 'na')) || (objLib.lookUpKey(property.accepted, 'na') && property.accepted.na)); }

// Has Unit Presentation
export function hasUnitPresentation(val, property) { return ((objLib.lookUpKey(property.accepted, 'unit')) && (property.accepted.unit != null)); }

// Has Pre Unit Presentation
export function hasPreUnitPresentation(property) { return ((objLib.lookUpKey(property.accepted, 'pre-unit')) && property.accepted['pre-unit']); }

// Has Visualisation
export function hasVisualisation(property) { return (objLib.lookUpKey(property, 'visualisation')); }

// Is Downloadable File
export function isDownloadAbleFile(property) { return (isDefinedFile(property) && (!isDefinedRawFile(property)) && ((!objLib.lookUpKey(property, 'download')) || ((!objLib.lookUpKey(property.download, 'enabled')) || property.download.enabled))); }

// Is Image File
export function isImageFile(property) {
  if (isDefinedFile(property) && (!isDefinedRawFile(property)) && hasFormat(property, null)) {
    if (objLib.isArray(property.accepted.format)) { return property.accepted.format.filter(f => f.startsWith('image')).length; }
    else { return property.accepted.format.startsWith('image'); }
  }
  else { return false; }
}

// Is Time Dependent
export function isTimeDependent(property) { return ((property.accepted.type == 'Time') || (property.accepted.type == 'DateTime') || (property.accepted.type == 'Date')); }

// Fake DateTime Property
export function fakeDateTimeProperty() { return {'accepted': {'type': 'DateTime'}}; }

// Fake Time Property
export function fakeTimeProperty() { return {'accepted': {'type': 'Time'}}; }

// Fake Date Property
export function fakeDateProperty() { return {'accepted': {'type': 'Date'}}; }

// Is Deletable
export function isDeletable(config, apiObject, item, accessLevel, totalResults, filterArray) {
  if (objLib.lookUpKey(config['definitions']['Object'][apiObject], 'settings')) {
    if (objLib.lookUpKey(config['definitions']['Object'][apiObject]['settings'], 'total') && objLib.lookUpKey(config['definitions']['Object'][apiObject]['settings']['total'], 'min') && (accessLevel == 'all') && (filterArray.length == 1) && (totalResults <= config['definitions']['Object'][apiObject]['settings']['total']['min'])) { return false; }
  }
  return true;
}
