//  Author:     Thomas D'haenens
//  License:    GPL-3.0
//  Link:       https://github.com/BENEATLY/neat-start-orig/
//  Contact:    https://neatly.be/


// Imports: Libraries
import * as definitionsLib from '@library/definitions';
import * as objLib from '@library/object';


// Has Translation
export function hasTranslation(translate, ref, prop={}) { return (ref.toLowerCase() != translate.instant(ref, prop).toLowerCase()); }

// Construct Property Name Translation
export function constructPropertyName(objectDefinition, property) { return ('object.' + objectDefinition + '.properties.' + property.property); }

// Construct Property Help Object Intro Translation
export function constructObjectHelpIntro(objectDefinition) { return ('object.' + objectDefinition + '.help.intro'); }

// Construct Property Help Message Translation
export function constructPropertyHelpMessage(objectDefinition, property) { return ('object.' + objectDefinition + '.help.properties.' + property.property); }

// Construct Plugin Option Name Translation
export function constructPluginOptionName(plugin, group, property) { return ('plugins.' + plugin['id'].toString() + '.' + group + '.' + property.property); }

// Construct Plugin Group Name Translation
export function constructPluginGroupName(plugin, group) { return ('plugins.' + plugin['id'].toString() + '.groups.' + group); }

// Construct Help Plugin Option Intro Translation
export function constructPluginOptionHelpIntro(plugin, group) { return ('plugins.' + plugin['id'].toString() + '.help.intro.' + group); }

// Construct Plugin Option Help Message Translation
export function constructPluginOptionHelpMessage(plugin, group, property) { return ('plugins.' + plugin['id'].toString() + '.help.properties.' + group + '.' + property.property); }

// Construct Comparator Translation
export function constructComparatorName(comparator) { return ('common.comparator.' + comparator.comparator); }

// Construct Singular Plural (by Number)
export function constructSP(objectDefinition, number) {
  if (number == 1) { return ('object.' + objectDefinition + '.naming.singular'); }
  else { return ('object.' + objectDefinition + '.naming.plural'); }
}

// Construct Modal Title Translation
export function constructModalTitleTranslation(objectDefinition, modalType) { return ('object.' + objectDefinition + '.modal.' + modalType + '.title'); }

// Construct Property Presentation Translation
export function constructPropertyPresentation(objectDefinition, level) { return ('object.' + objectDefinition + '.presentation.' + level); }

// Construct Property Value Translation
export function constructPropertyValuePresentation(objectDefinition, property, item) { return ('object.' + objectDefinition + '.values.' + property + '.' + item[property].replace(/\s/g, '-')); }

// Construct Translation Properties
export function constructTranslationProperties(config, right, pageObjectDefinition, objectDefinition, action, name, displayOptions, translate) { return definitionsLib.getDefinitionsForPage(config, right, pageObjectDefinition, objectDefinition, action, name, displayOptions).map(property => translate.instant(constructPropertyName(objectDefinition, property))); }

// Construct Translation Plugin Options
export function constructTranslationPluginOptions(config, plugin, group, translate) { return definitionsLib.getDefinitionsForPlugin(config, plugin, group).map(property => translate.instant(constructPluginOptionName(plugin, group, property))); }

// Get Object Name
export function getObjectName(config, name) {
  let objectNames = objLib.getKeys(config['definitions']['Object']).filter(x => (x.toLowerCase() == name.toLowerCase()));
  if (objectNames.length == 1) { return objectNames[0]; }
  else { return null; }
}
