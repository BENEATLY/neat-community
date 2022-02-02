//  Author:     Thomas D'haenens
//  License:    GPL-3.0
//  Link:       https://github.com/BENEATLY/neat-community/
//  Contact:    https://neatly.be/


// Imports: Libraries
import * as objLib from '@library/object';
import * as classLib from '@library/class';
import * as valLib from '@library/validate';
import * as compLib from '@library/compare';
import * as timeLib from '@library/time';
import * as definitionsLib from '@library/definitions';
import * as translateLib from '@library/translate';
import * as numberLib from '@library/number';
import * as formatLib from '@library/format';
import * as pageLib from '@library/page';
import * as pluginLib from '@library/plugin';
import * as sortLib from '@library/sort';


// Declarations: JQuery
declare var $: any;


// Custom Presentation
export function customPresentation(config, userData, translate, obj, property) {
  if (objLib.lookUpKey(property.accepted, 'presentation')) { return readProperty(obj, property.accepted.presentation); }
  else if (valLib.hasReference(property)) { return translate.instant(translateLib.constructPropertyPresentation(valLib.hasReference(property), definitionsLib.lookUpDefinitions(config, userData.right, 'Get', valLib.hasReference(property))), {item: obj}); }
  else { return translate.instant('common.table.unknown').toUpperCase(); }
}

// Present Object
export function presentObject(item) {
  if (item.filter(obj => obj.property == 'name').length > 0) {
    return item.filter(obj => obj.property == 'name')[0].value;
  }
}

// Determine Visualisation Class
export function determineVisualisationClass(visualisation) {
  let classDict = {};
  let confClasses = (objLib.lookUpKey(visualisation, 'class')?visualisation.class.split(' '):[]);
  for (let confClass of confClasses) { classDict[confClass] = true; }
  return classDict;
}

// Determine Visualisation Function
export function determineVisualisationFunction(visualisation, modalService, modalMeta, updateRef) {
  if (objLib.lookUpKey(visualisation, 'modal')) {
    if (objLib.lookUpKey(visualisation.modal, 'update') && visualisation.modal.update) { modalService.open(visualisation.modal.type, modalMeta).subscribe(t => { updateRef.trigger("update"); }); }
    else { modalService.open(visualisation.modal.type, modalMeta).subscribe(); }
  }
}

// Get Visualisation Class
export function getVisualisationClass(property, obj, translation, specifics: object = {}) {
  if (valLib.isDefinedBoolean(property)) {
    if (getVisualisationOptions('icon', property).length) {
      let visualisations = getVisualisationOptions('icon', property);
      for (let visualisation of visualisations) {
        if (objLib.lookUpKey(visualisation, 'value')) {
          for (let val of visualisation.value) {
            let value = objLib.getSubProperty(obj, property['property']);
            let comparator = (objLib.lookUpKey(val, 'comparator')?val.comparator:'=');
            if (compLib.compareValues(value, val.value, comparator)) { return determineVisualisationClass(val); }
          }
        }
        else { return determineVisualisationClass(visualisation); }
      }
    }
    else if (getVisualisationOptions('style', property).length) {
      let visualisations = getVisualisationOptions('style', property);
      for (let visualisation of visualisations) {
        if (objLib.lookUpKey(visualisation, 'value')) {
          for (let val of visualisation.value) {
            if (objLib.lookUpKey(val, 'translated')) {
              let value = objLib.getSubProperty(obj, property['property']);
              let transDict = objLib.getSubProperty(translation.translationContent, val.translated);
              if (transDict[val.value] == value) { return determineVisualisationClass(visualisation); }
            }
            else {
              let value = objLib.getSubProperty(obj, property['property']);
              let comparator = (objLib.lookUpKey(val, 'comparator')?val.comparator:'=');
              if (compLib.compareValues(value, val.value, comparator)) { return determineVisualisationClass(visualisation); }
            }
          }
        }
      }
    }
  }
  return {};
}

// Get Visualisation Function
export function getVisualisationFunction(property, item, config, objectDefinition, snackBar, modalService, timezone, translation, route, updateRef, accessLevel: string = 'all') {
  let modalMeta = {'property': property, 'object': {'name': objectDefinition, 'val': item}, 'config': config, 'route': route, 'accessLevel': accessLevel};
  if (getVisualisationOptions('icon', property).length) {
    let visualisations = getVisualisationOptions('icon', property);
    for (let visualisation of visualisations) {
      if (objLib.lookUpKey(visualisation, 'value')) {
        for (let val of visualisation.value) {
          let value = objLib.getSubProperty(item, property['property']);
          let comparator = (objLib.lookUpKey(val, 'comparator')?val.comparator:'=');
          if (compLib.compareValues(value, val.value, comparator)) { determineVisualisationFunction(visualisation, modalService, modalMeta, updateRef); }
        }
      }
      else { determineVisualisationFunction(visualisation, modalService, modalMeta, updateRef); }
    }
  }
  else if (getVisualisationOptions('style', property).length) {
    let visualisations = getVisualisationOptions('style', property);
    for (let visualisation of visualisations) {
      if (objLib.lookUpKey(visualisation, 'value')) {
        for (let val of visualisation.value) {
          if (objLib.lookUpKey(val, 'translated')) {
            let value = objLib.getSubProperty(item, property['property']);
            let transDict = objLib.getSubProperty(translation.translationContent, val.translated);
            if (transDict[val.value] == value) { determineVisualisationFunction(visualisation, modalService, modalMeta, updateRef); }
          }
          else {
            let value = objLib.getSubProperty(item, property['property']);
            let comparator = (objLib.lookUpKey(val, 'comparator')?val.comparator:'=');
            if (compLib.compareValues(value, val.value, comparator)) { determineVisualisationFunction(visualisation, modalService, modalMeta, updateRef); }
          }
        }
      }
    }
  }
}

// Compress Content
export function compressContent(property) { return ((valLib.isDefinedString(property) && ((!valLib.hasMaxConstraint(property)) || (property.accepted.max > 99))) || (valLib.isExternal(property) && valLib.isCompressed(property))); }

// Beautify JSON
export function beautifyJson(str, noString=false) { return JSON.stringify((noString?str:JSON.parse(str)), null, 4); }

// Add Unit Presentation
export function addUnitPresentation(content, property, unit=null) {
  if (property != null) {
    if (valLib.hasPreUnitPresentation(property)) { return (property.accepted.unit + ' ' + content); }
    else { return (content + ' ' + property.accepted.unit); }
  }
  else { return (content + ' ' + unit); }
}

// Apply Visualisation
export function applyVisualision(val, property, obj, timezone, translation, specifics: object = {}) {
  let returnHTML = (valLib.isTimeDependent(property)?timeLib.convertTimeDependentToString(val, property, timezone):((valLib.isDefinedNumber(property))?numberLib.formatNumber(val, timezone.locale, numberLib.numberLocaleFormattingOptions(property, val)):val));
  if (valLib.hasVisualisation(property)) {
    if (valLib.isDefinedNumber(property)) {
      if (getVisualisationOptions('sign', property).length) { returnHTML = (val<0?"":(val>0?"+":"")) + returnHTML; }
      if (getVisualisationOptions('progress-bar', property).length) { return getProgressBarVisualisation(val, property, obj, specifics); }
      if (objLib.lookUpKey(specifics, 'info') && specifics['info']) {
        if (valLib.hasUnitPresentation(val, property)) { returnHTML = addUnitPresentation(returnHTML, property); }
      }
      return returnHTML;
    }
    else if (valLib.isDefinedString(property)) {
      if (getVisualisationOptions('url', property).length) { return getURLVisualisation(returnHTML, property, obj, specifics); }
      else if (getVisualisationOptions('style', property).length) { return getStyleVisualisation(returnHTML, property, obj, translation, specifics); }
      return returnHTML;
    }
    else if (valLib.isDefinedBoolean(property)) {
      if (getVisualisationOptions('icon', property).length) { return getIconVisualisation(returnHTML, property, obj, specifics); }
      return returnHTML;
    }
    else { return returnHTML; }
  }
  else {
    if (valLib.hasUnitPresentation(val, property) && (!objLib.lookUpKey(specifics, 'unit') || specifics['unit'])) { returnHTML = addUnitPresentation(returnHTML, property); }
    return returnHTML;
  }
}

// Get Sign Visualisation Options
export function getVisualisationOptions(type, property) {
  if (!valLib.hasVisualisation(property)) { return []; }
  return property.visualisation.filter(item => item.type == type);
}

// Get Progress Bar Visualisation
export function getProgressBarVisualisation(val, property, obj, specifics) {
  let visualisation = getVisualisationOptions('progress-bar', property)[0];
  if (objLib.lookUpKey(visualisation, 'options')) {
    let options = visualisation.options;
    let maxValue = (objLib.lookUpKey(options, 'max')?readProperty(obj, options.max):100);
    let showValue = ((((!objLib.lookUpKey(options, 'showValue')) || (options.showValue)) && (val >= (maxValue/5))) || (objLib.lookUpKey(specifics, 'info') && specifics.info));
    let unit = (objLib.lookUpKey(options, 'unit')?options.unit:'');
    let animated = (objLib.lookUpKey(options, 'animated')?options.animated:false);
    let absolute = (objLib.lookUpKey(options, 'absolute')?options.absolute:false);
    let neatly = (objLib.lookUpKey(options, 'neatly')?compLib.compareValues(objLib.getSubProperty(obj, options.neatly.value), options.neatly.level, options.neatly.comparator):false);
    let success = (objLib.lookUpKey(options, 'success')?compLib.compareValues(objLib.getSubProperty(obj, options.success.value), options.success.level, options.success.comparator):false);
    let info = (objLib.lookUpKey(options, 'info')?compLib.compareValues(objLib.getSubProperty(obj, options.info.value), options.info.level, options.info.comparator):false);
    let warning = (objLib.lookUpKey(options, 'warning')?compLib.compareValues(objLib.getSubProperty(obj, options.warning.value), options.warning.level, options.warning.comparator):false);
    let danger = (objLib.lookUpKey(options, 'danger')?compLib.compareValues(objLib.getSubProperty(obj, options.danger.value), options.danger.level, options.danger.comparator):false);
    let width = (showValue?(((((val / maxValue) * 100)) >= 8)?(((val / maxValue) * 100)):8):(((val / maxValue) * 100)));
    let progressBarStyle = (danger?' progress-bar-danger':(warning?' progress-bar-warning':(success?' progress-bar-success':(info?' progress-bar-info':(neatly?' neatly-progress-bar':'')))));
    return '<div class="progress progress-bar-center"><div class="progress-bar' + progressBarStyle + (animated?' progress-bar-striped progress-bar-animated':'') + '" role="progressbar" style="width: ' + width.toFixed(1) + '%;">' + (showValue?(absolute?addUnitPresentation(val.toFixed(0), null, unit):addUnitPresentation((((val / maxValue) * 100)).toFixed(0), null, unit)):'&nbsp;') + '</div></div>';
  }
  else {
    let maxValue = 100;
    let showValue = ((val >= (maxValue/5)) || (objLib.lookUpKey(specifics, 'info') && specifics.info));
    let unit = '';
    let animated = false;
    let absolute = false;
    let neatly = true;
    let success = false;
    let info = false;
    let warning = false;
    let danger = false;
    let width = (showValue?(((((val / maxValue) * 100)) >= 8)?(((val / maxValue) * 100)):8):(((val / maxValue) * 100)));
    let progressBarStyle = (danger?' progress-bar-danger':(warning?' progress-bar-warning':(success?' progress-bar-success':(info?' progress-bar-info':(neatly?' neatly-progress-bar':'')))));
    return '<div class="progress progress-bar-center"><div class="progress-bar' + progressBarStyle + (animated?' progress-bar-striped progress-bar-animated':'') + '" role="progressbar" style="width: ' + width.toFixed(1) + '%;">' + (showValue?(absolute?addUnitPresentation(val.toFixed(0), null, unit):addUnitPresentation((((val / maxValue) * 100)).toFixed(0), null, unit)):'&nbsp;') + '</div></div>';
  }
}

// Get Style Visualisation
export function getStyleVisualisation(returnHTML, property, obj, translation, specifics) {
  let visualisation = getVisualisationOptions('style', property);
  for (let vis of visualisation) {
    if (objLib.lookUpKey(vis, 'value')) {
      for (let val of vis.value) {
        if (objLib.lookUpKey(val, 'translated')) {
          let value = objLib.getSubProperty(obj, property['property']);
          let transDict = objLib.getSubProperty(translation.translationContent, val.translated);
          if (transDict[val.value] == value) { returnHTML = '<div style="' + val.style + '">' + returnHTML + '</div>'; }
        }
        else {
          let value = objLib.getSubProperty(obj, property['property']);
          let comparator = (objLib.lookUpKey(val, 'comparator')?val.comparator:'=');
          if (compLib.compareValues(value, val.value, comparator)) { returnHTML = '<div style="' + val.style + '">' + returnHTML + '</div>'; }
        }
      }
    }
  }
  return returnHTML;
}

// Get URL Visualisation
export function getURLVisualisation(returnHTML, property, obj, specifics) {
  let visualisation = getVisualisationOptions('url', property)[0];
  if (objLib.lookUpKey(visualisation, 'icon') && visualisation['icon']) { return '<a class="table-icon" href="' + returnHTML + '" target="' + ((objLib.lookUpKey(visualisation, 'target') && (!visualisation['target']))?'_self':'_blank') + '"><img src="' + visualisation['icon'] + '"></a>'; }
  else { return '<a class="table-icon" href="' + returnHTML + '" target="' + ((objLib.lookUpKey(visualisation, 'target') && (!visualisation['target']))?'_self':'_blank') + '"><img src="/assets/svgs/external-link-gradient.svg"></a>'; }
}

// Get Icon Visualisation
export function getIconVisualisation(returnHTML, property, obj, specifics) {
  let visualisations = getVisualisationOptions('icon', property);
  for (let visualisation of visualisations) {
    if (objLib.lookUpKey(visualisation, 'value')) {
      for (let val of visualisation.value) {
        let value = objLib.getSubProperty(obj, property['property']);
        let comparator = (objLib.lookUpKey(val, 'comparator')?val.comparator:'=');
        if (compLib.compareValues(value, val.value, comparator)) { return '<img src="' + val.link + '"></img>'; }
      }
    }
    else { return '<img src="' + visualisation.link + '"></img>'; }
  }
  return '';
}

// Get Boolean Visualisation
export function getBooleanVisualisation(property) {
  if (property.value) { return '<input type="checkbox" class="infopage-checkbox" checked disabled>'; }
  else { return '<input type="checkbox" class="infopage-checkbox" disabled>'; }
}

// Read Property
export function readProperty(obj, definitions) {
  if (!valLib.isString(definitions)) { return definitions; }
  let nrOfParameters = definitions.split('${').length - 1;
  for (var i=0; i<nrOfParameters; i++) {
    let parameter = definitions.split('${')[1].split('}')[0];
    if (!parameter.includes('.')) { definitions = definitions.replace('${' + parameter + '}', obj[parameter]); }
    else { definitions = definitions.replace('${' + parameter + '}', objLib.getSubProperty(obj, parameter)); }
  }
  return definitions;
}

// Needs Bottom Space
export function needsBottomSpace(properties) {
  if (properties.filter(prop => valLib.isTimeDependent(prop)).length) {
    let lastProperties = (properties.length>4?properties.slice(1).slice(-4):properties);
    if (lastProperties.filter(prop => valLib.isTimeDependent(prop)).length) {
      if (lastProperties.filter(prop => ((valLib.isDefinedString(prop) && ((!valLib.hasMaxConstraint(prop)) || (prop.accepted.max > 99))))).length) { return false; }
      else { return true; }
    }
    else { return false; }
  }
  else { return false; }
}

// Determine Property Line Max Width
export function determinePropertyNameLineMaxWidth(translate, objectName, properties, ratio = 1) {
  let translatedProperties = [];
  for (let property of properties) { translatedProperties.push(translate.instant(translateLib.constructPropertyName(objectName, property)).length); }
  let max = Math.max.apply(null, translatedProperties);
  if (max > 10) { return ((158 + 13*(max-10)) * ratio).toString() + 'px'; }
  else { return ((158 * ratio).toString() + 'px'); }
}

// Determine Property Line Max Width By Array
export function determinePropertyNameLineMaxWidthByArray(translate, properties, ratio = 1) {
  let translatedProperties = [];
  for (let property of properties) { translatedProperties.push(translate.instant(property).length); }
  let max = Math.max.apply(null, translatedProperties);
  if (max > 10) { return ((148 + 13*(max-10)) * ratio).toString() + 'px'; }
  else { return ((148 * ratio).toString() + 'px'); }
}

// Compute Item Bar Box Width
export function computeItemBarBoxWidth(items) {
  if (items.length == 0) { return []; }
  const maxWidth = 12;
  let sum = items.map(x => x.width).reduce((a, b) => a + b, 0);
  for (let item of items) {
    item.calcWidth = item.width * (maxWidth/sum);
    item.width = Math.round(item.calcWidth);
    if (item.width == 0) {
      item.width = 1;
      item.calcWidth = 1;
    }
  }
  sum = items.map(x => x.width).reduce((a, b) => a + b, 0);
  while (maxWidth != sum) {
    if (sum < maxWidth) {
      let sorted = items.sort((n1, n2) => (n1.width-n1.calcWidth) - (n2.width-n2.calcWidth));
      items.filter(x => (x.width == sorted[0].width))[items.filter(x => (x.width == sorted[0].width)).length-1].width = sorted[0].width + 1;
      items.filter(x => (x.width == sorted[0].width))[items.filter(x => (x.width == sorted[0].width)).length-1].calcWidth = items.filter(x => (x.width == sorted[0].width))[items.filter(x => (x.width == sorted[0].width)).length-1].width;
    }
    else {
      let sorted = items.sort((n1, n2) => (n1.calcWidth-n1.width) - (n2.calcWidth-n2.width));
      items.filter(x => (x.width == sorted[0].width))[items.filter(x => (x.width == sorted[0].width)).length-1].width = sorted[0].width - 1;
      items.filter(x => (x.width == sorted[0].width))[items.filter(x => (x.width == sorted[0].width)).length-1].calcWidth = items.filter(x => (x.width == sorted[0].width))[items.filter(x => (x.width == sorted[0].width)).length-1].width;
    }
    sum = items.map(x => x.width).reduce((a, b) => a + b, 0);
  }
  return items.sort((n1, n2) => (n2.width - n1.width));
}

// Construct Parent Properties
export function constructParentProperties(config, userData, translate, objectDefinition, item, timezone, translation, displayOptions, headerOptions) {

  // Get Properties
  let properties = formatLib.formatInfo(config, objectDefinition, item, (pageLib.determineFixedLevel('model', displayOptions) || definitionsLib.lookUpDefinitions(config, userData.right, 'Get', objectDefinition)));

  // Parent Header Array
  let parentHeaderArray = [];

  // Iterate over Properties
  for (let property of properties) {

    // Filter on Parent Properties
    if (valLib.isSelfOnly(property) && valLib.isParent(property)) {

      // Presentable Value
      if (valLib.hasPresentableValue(property.value, property)) {

        // HTML Presentation
        if (valLib.hasValuePresentation(property.value, property)) { parentHeaderArray.push({'title': translate.instant(translateLib.constructPropertyName(objectDefinition, property)), 'html': applyVisualision(property.value, property, item, timezone, translation, {'info': true}), 'width': property['parent-width']}); }

        // Custom Presentation
        else if (valLib.hasCustomPresentation(property.value, property)) { parentHeaderArray.push({'title': translate.instant(translateLib.constructPropertyName(objectDefinition, property)), 'value': customPresentation(config, userData, translate, property.value, property), 'width': property['parent-width']}); }

        // Boolean Presentation
        else if (valLib.hasBooleanPresentation(property.value, property)) { parentHeaderArray.push({'title': translate.instant(translateLib.constructPropertyName(objectDefinition, property)), 'html': getBooleanVisualisation(property), 'width': property['parent-width']}); }

      }

      // No Presentable Value
      else {
        if (valLib.hasNAPresentation(property.value, property)) { parentHeaderArray.push({'title': translate.instant(translateLib.constructPropertyName(objectDefinition, property)), 'value': translate.instant('common.table.notavailable'), 'width': property['parent-width']}); }
        else { parentHeaderArray.push({'title': translate.instant(translateLib.constructPropertyName(objectDefinition, property)), 'value': '', 'width': property['parent-width']}); }
      }

    }
  }

  return [].concat(parentHeaderArray, headerOptions.fixed.parent);

}

// Get App Logo
export function getAppLogo(appConfig, pluginConfig) {
  let plugin = {"id": 16, "name": "Application Look & Feel"};
  if (pluginLib.isActivePlugin(pluginConfig.plugin, plugin['id'])) {

    // Get Plugin Option Value
    let value = pluginLib.getPublicPluginValue(appConfig.config, plugin, 'UI', 'appLogo');

    // Return Value if Set
    if (value) { return ('/assets/objects/' + value['reference']); }

  }

  // Return Default Value
  return '/assets/logos/neatly-logo-white.png';

}

// Get App Title
export function getAppTitle(appConfig, pluginConfig) {
  let plugin = {"id": 16, "name": "Application Look & Feel"};
  if (pluginLib.isActivePlugin(pluginConfig.plugin, plugin['id'])) {

    // Get Plugin Option Value
    let value = pluginLib.getPublicPluginValue(appConfig.config, plugin, 'UI', 'appTitle');

    // Return Value if Set
    if (value) { return value; }

  }

  // Return Default Value
  return 'NEATLY - Application';

}

// Get App Icon
export function getAppIcon(appConfig, pluginConfig) {
  let plugin = {"id": 16, "name": "Application Look & Feel"};
  if (pluginLib.isActivePlugin(pluginConfig.plugin, plugin['id'])) {

    // Get Plugin Option Value
    let value = pluginLib.getPublicPluginValue(appConfig.config, plugin, 'UI', 'appIcon');

    // Return Value if Set
    if (value) { return ('/assets/objects/' + value['reference']); }

  }

  // Dark Theme
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) { return '/assets/icons/neatly-icon-white.ico'; }

  // White Theme
  else { return '/assets/icons/neatly-icon-gradient.ico'; }

}

// Slide Panel
export function slidePanel(event) {
  let heading = $(event.target.closest('.panel-heading'));
  if (heading.hasClass('collapsed')) { heading.removeClass('collapsed'); }
  else { heading.addClass('collapsed'); }
  heading.next('.panel-wrapper').slideToggle("slow");
}

// Toggle NavBar Collapse
export function toggleNavBarCollapse() {

  // Check Collapse State
  let collapsed = classLib.hasClass('content-page', 'collapse-visibility');

  // Uncollapse
  if (collapsed) {
    classLib.removeClass('content-page', 'collapse-visibility');
    classLib.removeClass('left-nav-bar', 'collapse-visibility');
    classLib.removeClass('navbar-brand', 'collapse-visibility');
  }

  // Collapse
  else {
    classLib.addClass('content-page', 'collapse-visibility');
    classLib.addClass('left-nav-bar', 'collapse-visibility');
    classLib.addClass('navbar-brand', 'collapse-visibility');
  }

}

// Generate Greeting
export function generateGreeting(type, translation, now) {
  let translations = [];
  for (let transl of objLib.getKeys(translation.translationContent['common']['greetings'][type]['regular'])) { translations.push('common.greetings.' + type + '.regular.' + transl); }
  for (let transl of objLib.getKeys(translation.translationContent['common']['greetings'][type]['time-based']['week'])) {
    if (+transl == now.day()) { translations.push('common.greetings.' + type + '.time-based.week.' + transl); }
  }
  let smallestDiff = 24;
  let hoursDiff = [];
  for (let transl of objLib.getKeys(translation.translationContent['common']['greetings'][type]['time-based']['day'])) {
    let diff = now.hour() - (+transl);
    if (diff < 0) { diff += 24; }
    if (diff < smallestDiff) {
      smallestDiff = diff;
      hoursDiff = [transl];
    }
    else if (diff == smallestDiff) { hoursDiff.push(transl); }
  }
  for (let transl of hoursDiff) { translations.push('common.greetings.' + type + '.time-based.day.' + transl); }
  return translations[Math.floor(Math.random() * translations.length)];
}

// Get Profile Picture
export function getProfilePicture(userData) {
  if (objLib.lookUpKey(userData, 'info') && objLib.lookUpKey(userData.info, 'image') && (userData.info.image != null)) { return '/assets/objects/' + userData.info.image.reference; }
  else { return '/assets/images/profile.png'; }
}

// Get Contact Link
export function getContactLink(appConfig, pluginConfig) {
  let plugin = {"id": 16, "name": "Application Look & Feel"};
  if (pluginLib.isActivePlugin(pluginConfig.plugin, plugin['id'])) {

    // Get Plugin Option Value
    let value = pluginLib.getPublicPluginValue(appConfig.config, plugin, 'UI', 'contactLink');

    // Return Value if Set
    if (value) { return value; }

  }

  // Return Default Value
  return 'https://neatly.be/';

}

// Type Conversion
export function typeConversion(val, property) {
  if (valLib.isJsonFormat(property) && valLib.isObject(val)) { return beautifyJson(val, true); }
  return val;
}

// Get Model Value
export function getModelValue(item, property) {
  let subProperty = objLib.getSubProperty(item, property.property);
  return typeConversion(subProperty, property);
}

// Apply Select Presentation
export function applySelectPresentation(config, data, translate, items, property) {

  // Add Presentation Value
  let modItems = items.map(item => ({ ...item, _presentationValue: customPresentation(config.config, data.userData, translate, item, property) }));

  // Sort According to Presentation Value & Return
  return sortLib.sortBy(modItems, '_presentationValue', true);

}
