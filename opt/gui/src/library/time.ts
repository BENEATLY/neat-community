//  Author:     Thomas D'haenens
//  License:    GPL-3.0
//  Link:       https://github.com/BENEATLY/neat-community/
//  Contact:    https://neatly.be/


// Imports: Libraries
import * as valLib from '@library/validate';
import * as objLib from '@library/object';
import moment from 'moment';
import 'moment-timezone';


// Convert Time Dependent to String
export function convertTimeDependentToString(val, property, timezone) {
  if (valLib.isDefinedTime(property)) { return moment(new Date().toISOString().split('T')[0] + 'T' + val + '+0000').format(getTimeFormat(property, timezone)); }
  else if (valLib.isDefinedDateTime(property)) { return moment(val + '+0000').format(getDateTimeFormat(property, timezone)); }
  else if (valLib.isDefinedDate(property)) { return moment(val).format(timezone.dateFormat); }
  else { return val; }
}

// Add Leading Zeros
export function addLeadingZeros(num, size) {
    var s = num.toString();
    while (s.length < size) s = "0" + s;
    return s;
}

// Construct Timezone String
export function constructTimezoneString(timezone) {
  return (timezone.utcOffset>=0?'+':'-') + addLeadingZeros((Math.floor(Math.abs(timezone.utcOffset)/60)), 2) + addLeadingZeros((Math.abs(timezone.utcOffset) % 60), 2);
}

// Get Date Format
export function getDateFormat(property, timezone) { return timezone.dateFormat; }

// Get DateTime Format
export function getDateTimeFormat(property, timezone) {
  if (valLib.hasAccuracy(property)) {
    let accuracy = (property.accepted.accuracy>3?3:property.accepted.accuracy);
    return timezone.dateTimeFormat.replace('ss', 'ss.' + 'S'.repeat(accuracy));
  }
  else { return timezone.dateTimeFormat; }
}

// Get Time Format
export function getTimeFormat(property, timezone) {
  if (valLib.hasAccuracy(property)) {
    let accuracy = (property.accepted.accuracy>3?3:property.accepted.accuracy);
    return timezone.timeFormat.replace('ss', 'ss.' + 'S'.repeat(accuracy));
  }
  else { return timezone.timeFormat; }
}

// Convert To ISO UTC Format
export function convertToISOUTCFormat(val, property, timezone) {
  if (valLib.isDefinedTime(property)) { return moment(val + constructTimezoneString(timezone), getTimeFormat(property, timezone) + 'ZZ').utc().format('HH:mm:ss.SSS'); }
  else if (valLib.isDefinedDateTime(property)) { return moment(val + constructTimezoneString(timezone), getDateTimeFormat(property, timezone) + 'ZZ').utc().format('YYYY-MM-DDTHH:mm:ss.SSS'); }
  else if (valLib.isDefinedDate(property)) { return moment(val, getDateFormat(property, timezone)).format('YYYY-MM-DD'); }
}

// Get Current DateTime
export function getNow() { return moment(); }

// DateTime Picker Settings
export function dateTimePickerSettings(type, now, property, timezone, translation) {

  // Format
  let format = { icons: { time: 'clock', date: 'calendar', up: 'up', down: 'down', previous: '', next: '', today: '', clear: '', close: ''}, locale: translation.translation.locale };
  if (valLib.isDefinedDate(property)) { format['format'] = getDateFormat(property, timezone); }
  else if (valLib.isDefinedDateTime(property)) { format['format'] = getDateTimeFormat(property, timezone); }
  else if (valLib.isDefinedTime(property)) { format['format'] = getTimeFormat(property, timezone); }

  // Debug
  // format['debug'] = true;

  // Restrictions
  let restrictions = {};
  if (type == 'Create') {
    if (valLib.hasRestriction(property, 'past-now')) { restrictions['minDate'] = now; }
    else if (valLib.hasRestriction(property, 'before-now')) { restrictions['maxDate'] = now; }
    if (valLib.hasRestriction(property, 'weekend-only')) { restrictions['daysOfWeekDisabled'] = [1, 2, 3, 4, 5]; }
    else if (valLib.hasRestriction(property, 'week-only')) { restrictions['daysOfWeekDisabled'] = [0, 6]; }
  }

  // Merge
  return Object.assign({}, format, restrictions);

}

// Get Current Year
export function getCurrentYear() { return new Date().getFullYear(); }

// Within Range
export function closeToTarget(ref, targetDiff, over = false) {

  // Has Target Date
  if (ref) {

    // Determine Reference Date
    let refDate = new Date(ref + '+0000');

    // Determine Current Date
    let currentDate = new Date();

    // Calculate Difference
    let refDiff = (refDate.getTime() - currentDate.getTime())/(1000*60*60*24);

    // Return
    if (over) { return (((targetDiff > 0) && (refDiff < targetDiff)) || ((targetDiff < 0) && (refDiff > targetDiff))); }
    else { return (((targetDiff > 0) && (refDiff > 0) && (refDiff < targetDiff)) || ((targetDiff < 0) && (refDiff < 0) && (refDiff > targetDiff))); }

  }

  // No Target Date
  else { return false; }

}
