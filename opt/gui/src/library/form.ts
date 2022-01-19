//  Author:     Thomas D'haenens
//  License:    GPL-3.0
//  Link:       https://github.com/BENEATLY/neat-community/
//  Contact:    https://neatly.be/


// Imports: Default
import { HttpHeaders } from '@angular/common/http';

// Imports: Libraries
import * as classLib from '@library/class';
import * as valLib from '@library/validate';
import * as sortLib from '@library/sort';
import * as ttLib from '@library/tooltip';
import * as objLib from '@library/object';
import * as timeLib from '@library/time';
import * as rightLib from '@library/right';
import * as dataLib from '@library/data';

// Imports: Tools
import * as cloneDeep from 'lodash/cloneDeep';


// Input Validation
export function setInputValidation(property, state) {
  if (state) {
    classLib.removeClass(property.toLowerCase() + '-input', 'invalid-input');
    classLib.addClass(property.toLowerCase() + '-input', 'valid-input');
  }
  else {
    classLib.removeClass(property.toLowerCase() + '-input', 'valid-input');
    classLib.addClass(property.toLowerCase() + '-input', 'invalid-input')
  }
}

// File Raw Upload Process
export async function fileRawUploadProcess(config, property, fileData, httpModule, cookieService, snackBarService) {

  // Define API Authentication
  let token = cookieService.get('token');
  let headers: HttpHeaders = new HttpHeaders({"Authorization": "Token " + token});

  // Determine Upload Path
  let uploadPath = (objLib.lookUpKey(property, 'upload')?property.upload:'file/upload');

  // Perform File Upload
  return await httpModule.post(config['apiRootUrl'] + uploadPath, fileData[property.property], { headers }).toPromise().then(

    // Success
    res => { return res; },

    // Fail
    err => {
      snackBarService.httpErrorOccurred(err);
      return null;
    }

  );

}

// File Full Upload Process
export async function fileFullUploadProcess(config, userData, property, fileData, httpModule, cookieService, snackBarService) {

  // Perform File Upload
  let fileResult = await fileRawUploadProcess(config, property, fileData, httpModule, cookieService, snackBarService);

  // File Upload Successful
  if (fileResult) {

    // Add Uploader
    fileResult['uploader'] = +userData.info.id;

    // Define API Authentication
    let token = cookieService.get('token');
    let headers: HttpHeaders = new HttpHeaders({"Authorization": "Token " + token});

    // Perform File Create API Call
    await httpModule.post(config['apiRootUrl'] + 'file/create', fileResult, { headers }).toPromise().then(
      res => {},
      err => { snackBarService.httpErrorOccurred(err); }
    );

    // Retrieve File Id
    let retrievedFile = await dataLib.retrieveObjectByAttr(config, 'File', 'reference', fileResult['reference'], snackBarService, cookieService, httpModule);

    // Return Id
    if (retrievedFile) { return retrievedFile['id']; }
    else { return null; }

  }

}

// Construct Send Data
export async function constructSendData(config, userData, properties, meta, optionalList, timezone, snackBarService = null, cookieService = null, httpModule = null, fileData = null) {

  // Create Variable
  let data = {};
  let overWrite = {};

  // Iterate over Properties
  for (let property of properties) {

    // Filter on Required Information
    if ((((((!valLib.isOptional(property)) || (valLib.isOptional(property) && (optionalList[property.property])))) && (((properties.length > 1) && (meta.type == 'Edit') && (property.value != property.initialValue)) || (properties.length == 1) || (meta.type != 'Edit'))) || ((meta.type == 'Create') && valLib.isRequired(property))) && (!((meta.type == 'Edit') && (!valLib.isEditable(property)))) && (!valLib.isExternal(property))) {

      // Has Implicit Value
      if (valLib.isImplicit(property)) {

        // Has Valid User Data
        if ((userData != null) && (!objLib.isEmptyObject(userData.info))) {

          // Get Implicit Value
          let implicit = valLib.hasImplicitValue(property);

          // Implicit Team
          if (implicit == 'Team') { data[property.property] = +userData.info.team.id; }

          // Implicit User
          else if (implicit == 'User') { data[property.property] = +userData.info.id; }

        }

      }

      // Has No Implicit Value
      else {

        // Assign 'Id' Values (Integers)
        if (valLib.isDefinedId(property) && (property.value != null)) { data[property.property] = +property.value; }

        // Assign Null Value if Empty Value
        else if ((valLib.isDefinedString(property) || valLib.isDefinedFile(property) || valLib.isTimeDependent(property)) && (property.value.length == 0) && valLib.isNullable(property)) { data[property.property] = null; }

        // Convert DateTime Related Info to UTC and ISO Format
        else if (valLib.isTimeDependent(property)) { data[property.property] = timeLib.convertToISOUTCFormat(property.value, property, timezone); }
        // Assign the Regular Value
        else { data[property.property] = property.value; }

        // Add File
        if (valLib.isDefinedFile(property) && (property.value.length > 0) && ((meta.type == 'Create') || (meta.type == 'Edit'))) {

          // Check if Sufficient Rights
          if (rightLib.sufficientRights(userData.right, 'File', 'Create', 'own')) {

            // File Raw Process
            if (valLib.isDefinedRawFile(property)) {

              // Perform File Upload
              let fileResult = await fileRawUploadProcess(config, property, fileData, httpModule, cookieService, snackBarService);
              if (fileResult) { overWrite = fileResult; }

            }

            // File Full Process
            else {

              // Perform File Upload & Creation
              data[property.property] = await fileFullUploadProcess(config, userData, property, fileData, httpModule, cookieService, snackBarService);

            }

          }

        }

      }

    }

  }

  // Overwrite Essential Data (Multi Step)
  for (let key of objLib.getKeys(overWrite)) { data[key] = overWrite[key]; }

  // Return Send Data
  return data;

}

// Validate Input
export function validateInput(translate, properties, acceptedList, currentList, existingList, optionalList, partUnique, activeToolTips) {

  // Determine Sorted Property List
  let sortedPropertyList = sortLib.visuallyOrderProperties(properties);

  // Determine Part Unique Property List
  let partUniquePropertyList = sortedPropertyList.filter(x => (valLib.hasRestriction(x, 'part-unique')));

  // Combinated Parts are Unique
  if (partUniquePropertyList.length > 0) {

    // Iterate over Current List
    for (let item of currentList.filter(obj => (obj.id != properties[0].id))) {

      // Determine the Unique Parts
      let partUniqueProperties = cloneDeep(partUniquePropertyList);

      // Total # of Unique Parts
      let maxPartUnique = partUniqueProperties.length;

      // Counter of # of Unique Parts
      let found = 0;

      // Iterate over Unique Parts
      for (let property of partUniqueProperties) {

        // Item is Object
        if (valLib.isObject(item[property.property])) {

          // Has Id
          if (objLib.lookUpKey(item[property.property], 'id')) {

            // Increase Counter if Id is the Same
            if (property.value == item[property.property].id) { found++; }

          }

        }

        // Item is Value & Increase Counter if Value is the Same
        else if (property.value == item[property.property]) { found++; }

      }

      // # Found Equals # Unique Parts & Edited
      if ((found == maxPartUnique) && (partUniqueProperties.some(property => (property.value != property.initialValue)))) {

        // Trigger Warning for Unique Parts
        for (let property of partUniqueProperties) {
          setInputValidation(property.property, false);
          ttLib.enableToolTip(activeToolTips, property.property, translate.instant('common.validate.combinationExists'));
        }

        // Unique Parts Detected
        return false;

      }

    }

  }

  // Iterate over Visually Ordered Properties
  for (let sortedProperty of sortedPropertyList) {

    // Get Index of Properties
    let i = properties.findIndex(obj => obj.property == sortedProperty.property);
    let property = properties[i];

    // Filter on Required Information
    if ((!valLib.isImplicit(property)) && ((!valLib.isOptional(property)) || (valLib.isOptional(property) && (optionalList[property.property])))) {

      // String or File Input
      if (valLib.isDefinedString(property) || valLib.isDefinedFile(property)) {

        // Not Nullable
        if ((property.value == '') && (!valLib.isNullable(property))) {
          setInputValidation(property.property, false);
          ttLib.enableToolTip(activeToolTips, property.property, translate.instant('common.validate.emptyInput'));
          return false;
        }

        // No New Information
        if ((property.initialValue == property.value) && (properties.length == 1)) { return false; }

        // Given Input too Short
        if (valLib.hasMinConstraint(property) && (property.value.length < property.accepted.min) && ((property.value.length != 0) || (!valLib.isNullable(property)))) {
          setInputValidation(property.property, false);
          ttLib.enableToolTip(activeToolTips, property.property, translate.instant('common.validate.minChar', {'chars': property.accepted.min.toString()}));
          return false;
        }

        // Given Input too Long
        if (valLib.hasMaxConstraint(property) && (property.value.length > property.accepted.max)) {
          setInputValidation(property.property, false);
          ttLib.enableToolTip(activeToolTips, property.property, translate.instant('common.validate.maxChar', {'chars': property.accepted.max.toString()}));
          return false;
        }

        // Has Restriction
        if (valLib.hasRestriction(property, null)) {

          // Only Name Chars Allowed
          if (valLib.hasRestriction(property, 'name-chars')) {

            // Only Characters, Spaces and Single Quotes
            if (!property.value.match(/^([a-zA-Z ']*)+$/)) {
              setInputValidation(property.property, false);
              ttLib.enableToolTip(activeToolTips, property.property, translate.instant('common.validate.plainCharOnly'));
              return false;
            }

            // No Double Spaces Allowed
            if (property.value.includes("  ")) {
              setInputValidation(property.property, false);
              ttLib.enableToolTip(activeToolTips, property.property, translate.instant('common.validate.doubleSpace'));
              return false;
            }

            // No Double Quotes Allowed
            if (property.value.includes("''")) {
              setInputValidation(property.property, false);
              ttLib.enableToolTip(activeToolTips, property.property, translate.instant('common.validate.doubleQuote'));
              return false;
            }

          }

          // Only Characters and Spaces
          if (valLib.hasRestriction(property, 'plain-chars')) {
            if (!property.value.match(/^([a-zA-Z ]*)+$/)) {
              setInputValidation(property.property, false);
              ttLib.enableToolTip(activeToolTips, property.property, translate.instant('common.validate.plainCharOnly'));
              return false;
            }
          }

          // No White Spaces Allowed
          if (valLib.hasRestriction(property, 'no-whitespace')) {
            if (property.value.includes(" ")) {
              setInputValidation(property.property, false);
              ttLib.enableToolTip(activeToolTips, property.property, translate.instant('common.validate.whitespace'));
              return false;
            }
          }

          // Only Lower Case Allowed
          if (valLib.hasRestriction(property, 'lowercase')) {
            if (!(property.value === property.value.toLowerCase())) {
              setInputValidation(property.property, false);
              ttLib.enableToolTip(activeToolTips, property.property, translate.instant('common.validate.lowerCaseOnly'));
              return false;
            }
          }

          // Only Upper Case Allowed
          else if (valLib.hasRestriction(property, 'uppercase')) {
            if (!(property.value === property.value.toUpperCase())) {
              setInputValidation(property.property, false);
              ttLib.enableToolTip(activeToolTips, property.property, translate.instant('common.validate.upperCaseOnly'));
              return false;
            }
          }

          // Only Unique Values Allowed
          if (valLib.hasRestriction(property, 'unique')) {

            // Property Not in ExisingList
            if (!(property.property in existingList)) {
              setInputValidation(property.property, false);
              ttLib.enableToolTip(activeToolTips, property.property, translate.instant('common.validate.exists'));
              return false;
            }

            // Value Not in ExisingList
            if ((existingList[property.property].map(a => a[property.property]).includes(property.value)) && (property.value != property.initialValue)) {
              setInputValidation(property.property, false);
              ttLib.enableToolTip(activeToolTips, property.property, translate.instant('common.validate.exists'));
              return false;
            }

          }

        }

        // Property has Specific Format
        if (valLib.hasFormat(property, null) && ((!valLib.isNullable(property)) || (property.value.length > 0))) {

          // Mail Format
          if (valLib.hasFormat(property, 'mail')) {
            if (!property.value.match(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)) {
              setInputValidation(property.property, false);
              ttLib.enableToolTip(activeToolTips, property.property, translate.instant('common.validate.invalidMail'));
              return false;
            }
          }

          // JSON Format
          else if (valLib.isJsonFormat(property)) {
            if (!valLib.isJson(property.value)) {
              setInputValidation(property.property, false);
              ttLib.enableToolTip(activeToolTips, property.property, translate.instant('common.validate.invalidJSON'));
              return false;
            }
          }

          // Phone Format
          else if (valLib.hasFormat(property, 'phone')) {
            if (!property.value.match(/^[+]*[(]{0,1}[0-9]{1,3}[)]{0,1}[-\./0-9 ]*$/)) {
              setInputValidation(property.property, false);
              ttLib.enableToolTip(activeToolTips, property.property, translate.instant('common.validate.invalidPhone'));
              return false;
            }
          }

          // IP Format
          else if (valLib.hasFormat(property, 'ip')) {
            if (!property.value.match(/^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/)) {
              setInputValidation(property.property, false);
              ttLib.enableToolTip(activeToolTips, property.property, translate.instant('common.validate.invalidIP'));
              return false;
            }
          }

          // MAC Format
          else if (valLib.hasFormat(property, 'mac')) {
            property.value = property.value.toUpperCase();
            if (!property.value.match(/^(([A-F0-9]{2}[:]){5}[A-F0-9]{2}[,]?)+$/)) {
              setInputValidation(property.property, false);
              ttLib.enableToolTip(activeToolTips, property.property, translate.instant('common.validate.invalidMAC'));
              return false;
            }
          }

          // Hexadecimal Color Format
          else if (valLib.hasFormat(property, 'hexColor')) {
            if (!property.value.match(/^#+([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/)) {
              setInputValidation(property.property, false);
              ttLib.enableToolTip(activeToolTips, property.property, translate.instant('common.validate.invalidHexColor'));
              return false;
            }
          }

          // Special Char Format
          if (valLib.hasFormat(property, 'specialCharReq')) {
            var regex = /[ !@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
            if (!regex.test(property.value)) {
              setInputValidation(property.property, false);
              ttLib.enableToolTip(activeToolTips, property.property, translate.instant('common.validate.oneSpecialChar'));
              return false;
            }
          }

          // Capital Letter Required
          if (valLib.hasFormat(property, 'capitalLetterReq')) {
            var regex = /[A-Z]/;
            if (!regex.test(property.value)) {
              setInputValidation(property.property, false);
              ttLib.enableToolTip(activeToolTips, property.property, translate.instant('common.validate.oneUpperCaseChar'));
              return false;
            }
          }

          // Number Required
          if (valLib.hasFormat(property, 'numberReq')) {
            var regex = /[0-9]/;
            if (!regex.test(property.value)) {
              setInputValidation(property.property, false);
              ttLib.enableToolTip(activeToolTips, property.property, translate.instant('common.validate.oneNumberChar'));
              return false;
            }
          }

        }

        // Double Input Validation
        if (valLib.needsDoubleInput(property)) {

          // Disable ToolTip
          ttLib.disableToolTip(activeToolTips, property.property);

          // Matching Inputs
          if (property.value != property.comparedValue) {
            setInputValidation((property.property + '-compared'), false);
            ttLib.enableToolTip(activeToolTips, (property.property + '-compared'), translate.instant('common.validate.matching'));
            setInputValidation(property.property, true);
            return false;
          }
          else {
            setInputValidation((property.property + '-compared'), true);
            ttLib.disableToolTip(activeToolTips, (property.property + '-compared'));
          }

        }

        // Secure File Name
        if (valLib.isDefinedFile(property) && (valLib.hasRestriction(property, 'secure-file-name')) && (!valLib.isSecureFileName(property.value))) {
          setInputValidation(property.property, false);
          ttLib.enableToolTip(activeToolTips, property.property, translate.instant('common.validate.secureFileName'));
          return false;
        }

      }

      // List Input
      else if (valLib.isDefinedList(property)) {

        // Empty List Not Allowed (Not Nullable)
        if ((property.value.length == 0) && (!valLib.isNullable(property))) {
          setInputValidation(property.property, false);
          ttLib.enableToolTip(activeToolTips, property.property, translate.instant('common.validate.emptyList'), 'top');
          return false;
        }

        // No New Information
        if ((property.initialValue == property.value) && (properties.length == 1)) { return false; }

      }

      // Id Input
      else if (valLib.isDefinedId(property)) {

        // Not Nullable
        if ((property.value == null) && (!valLib.isNullable(property))) {
          setInputValidation(property.property, false);
          ttLib.enableToolTip(activeToolTips, property.property, translate.instant('common.validate.emptySelection'));
          return false;
        }

        // No New Information
        if ((property.initialValue == property.value) && (properties.length == 1)) { return false; }

        // Value Not Null
        if (property.value != null) {

          // Property Not in AcceptedList
          if (!(property.property in acceptedList)) {
            setInputValidation(property.property, false);
            ttLib.enableToolTip(activeToolTips, property.property, translate.instant('common.validate.notInPossibilities'));
            return false;
          }

          // Value Not in AcceptedList
          if (!(acceptedList[property.property].map(a => a.id.toString()).includes(property.value.toString()))) {
            setInputValidation(property.property, false);
            ttLib.enableToolTip(activeToolTips, property.property, translate.instant('common.validate.notInPossibilities'));
            return false;
          }

        }

      }

      // Number Input
      else if (valLib.isDefinedNumber(property)) {

        // Not Nullable
        if ((property.value == null) && (!valLib.isNullable(property))) {
          setInputValidation(property.property, false);
          ttLib.enableToolTip(activeToolTips, property.property, translate.instant('common.validate.invalidNumber'));
          return false;
        }

        // No New Information
        if ((property.initialValue == property.value) && (properties.length == 1)) { return false; }

        // Value Not Null
        if (property.value != null) {

          // Given Input too High
          if (valLib.hasMaxConstraint(property) && (property.value > property.accepted.max)) {
            setInputValidation(property.property, false);
            ttLib.enableToolTip(activeToolTips, property.property, translate.instant('common.validate.maxNumber', {'number': property.accepted.max.toString()}));
            return false;
          }

          // Given Input too Low
          if (valLib.hasMinConstraint(property) && (property.value < property.accepted.min)) {
            setInputValidation(property.property, false);
            ttLib.enableToolTip(activeToolTips, property.property, translate.instant('common.validate.minNumber', {'number': property.accepted.min.toString()}));
            return false;
          }

          // Fixed Value Step
          if (valLib.hasStep(property) && (property.accepted.step != 'any') && ((Math.round(Math.round(property.value*1000000) % Math.round(property.accepted.step*1000000))) != 0)) {
            setInputValidation(property.property, false);
            ttLib.enableToolTip(activeToolTips, property.property, translate.instant('common.validate.precisionNumber', {'precision': property.accepted.step.toString()}));
            return false;
          }

        }

      }

      // Date, Time or DateTime Input
      else if (valLib.isTimeDependent(property)) {

        // Not Nullable
        if ((property.value == '') && (!valLib.isNullable(property))) {
          setInputValidation(property.property, false);
          ttLib.enableToolTip(activeToolTips, property.property, translate.instant('common.validate.emptyInput'));
          return false;
        }

        // No New Information
        if ((property.initialValue == property.value) && (properties.length == 1)) { return false; }

      }

      // All OK
      setInputValidation(property.property, true);
      ttLib.disableToolTip(activeToolTips, property.property);

    }

  }

  // List with Results of if Each Property equals the Initial Value
  let combine = [];

  // Only for Multiple Properties
  if (properties.length > 1) {

    // Iterate over Properties
    for (let property of properties) {

      // Filter on Required Information
      if ((!valLib.isImplicit(property)) && ((!valLib.isOptional(property)) || (valLib.isOptional(property) && (optionalList[property.property]))) && (!valLib.isExternal(property))) {

        // Initial Value is Null
        if (property.initialValue == null) {

          // Value Equal to Initial Value
          if (property.value == null) { combine.push(false); }

          // Value Not Equal to Initial Value
          else { combine.push(true); }

        }

        // Initial Value is Not Null
        else {

          // Value can Not be Null when Initial Value is Defined
          if (property.value == null) { combine.push(false); }

          else {

            // Determine Parsed Values
            let parsedInitialValue = objLib.convertForComparison(property.initialValue);
            let parsedValue = objLib.convertForComparison(property.value);

            // Value Equal to Initial Value
            if (parsedInitialValue == parsedValue) { combine.push(false); }

            // Value Not Equal to Initial Value
            else { combine.push(true); }

          }

        }

      }

    }

    // Check if at Least One Value Changed
    if (combine.every(x => x == false)) { return false; }

  }

  // Return Success
  return true;

}

// Disabled Property
export function disabledProperty(meta, property) {

  // Is Disabled
  if (valLib.isDisabled(property)) {

    // Object Not Present
    if (meta.object == null) { return false; }

    // Object Present
    let item = meta.object;

    // Iterate over Disabled Statements
    for (let statement of property.accepted.disabled) {

      // Determine # Parameters
      let nrOfParameters = statement.split('${').length - 1;

      // Iterate over Parameters
      for (var i=0; i<nrOfParameters; i++) {

        // Content of Parameter
        let parameter = statement.split('${')[1].split('}')[0];

        // Sub Attribute
        if (!parameter.includes('.')) {

          // Has No Length Function
          if (!parameter.includes('len(')) { statement = statement.replace('${' + parameter + '}', item[parameter]); }

          // Has Length Function
          else {
            parameter = parameter.split('len(')[1].split(')')[0];
            statement = statement.replace('${len(' + parameter + ')}', item[parameter].length);
          }

        }

        // Direct Attribute
        else {

          // Has No Length Function
          if (!parameter.includes('len(')) { statement = statement.replace('${' + parameter + '}', objLib.getSubProperty(item[parameter.split('.')[0]], parameter.split(parameter.split('.')[0] + '.')[1])); }

          // Has Length Function
          else {
            parameter = parameter.split('len(')[1].split(')')[0];
            statement = statement.replace('${len(' + parameter + ')}', objLib.getSubProperty(item[parameter.split('.')[0]], parameter.split(parameter.split('.')[0] + '.')[1]).length);
          }

        }

        // Equal Filter
        if (statement.includes(' == ')) {
          if (statement.split(' == ')[0] == statement.split(' == ')[1]) { return true; }
        }

        // Not Equal Filter
        if (statement.includes(' != ')) {
          if (statement.split(' != ')[0] != statement.split(' != ')[1]) { return true; }
        }

      }

    }

  }

  // Return False
  return false;

}

// Get Fixed Value
export function getFixedValue(meta, property) { return meta.options.fixed[property.property]; }

// Evaluate Strict Number (Filter Only)
export function evaluateStrictNumber(e, filterLine) {
  if (e.srcElement.defaultValue == "") { e.srcElement.defaultValue = "0"; }
  if ((e.data == ",") && (e.target.value != "") && (!e.target.value.includes('.'))) {
    e.target.value = e.srcElement.defaultValue + '.0';
    filterLine.ref = Number(e.target.value);
  }
  else if (e.target.value == "") {
    if ((e.data == ".") && (!e.srcElement.defaultValue.includes('.'))) { e.target.value = e.srcElement.defaultValue + '.0'; }
    else if (e.srcElement.value != "") { e.target.value = e.srcElement.value; }
    else { e.target.value = e.srcElement.defaultValue; }
    filterLine.ref = Number(e.target.value);
  }
  else { e.srcElement.defaultValue = e.target.value; }
}

// Generate Format List
export function generateFormatList(property) {
  if (objLib.isArray(property)) { return property.accepted.format.join(','); }
  else { return property.accepted.format; }
}

// Filter Non Initialisable Properties
export function filterNonInitialisable(properties) { return properties.filter(property => valLib.isInitialisable(property)); }
