//  Author:     Thomas D'haenens
//  License:    GPL-3.0
//  Link:       https://github.com/BENEATLY/neat-start-orig/
//  Contact:    https://neatly.be/


// Imports: Libraries
import * as objLib from '@library/object';

// Imports: Files
import timezoneLink from '@assets/geojson/timezone/timezone-link.json';

// Imports: Tools
import * as math from 'mathjs';


// Determine Timezone File By Location
export async function determineTimezoneContoursByLocation(location, httpModule, exclude = null) {
  for (let timezone of timezoneLink) {
    if (timezone['utc'].includes(location)) { return await getTimezoneContoursByFile(location, (timezone['abbr'].toLowerCase() + '.json'), httpModule, exclude); }
  }
  return null;
}

// Get Timezone Contours By File
export async function getTimezoneContoursByFile(location, file, httpModule, exclude = null) {

  // Get File Content
  let result = await httpModule.get('./assets/geojson/timezone/files/low-res/' + file).toPromise().then(

    // Success
    res => { return res; },

    // Fail
    err => { console.warn('Unable to fetch timezone file'); }

  );

  // Filter File Content
  if (result == null) { return null; }
  if (exclude == null) { return result; }
  else { return filterOriginalTimezone(location, result, exclude); }

}

// Filter Out Original Timezone
export function filterOriginalTimezone(location, contours, exclude) {
  contours.features = contours.features.filter(feature => (exclude?(feature.properties.tzid != location):(feature.properties.tzid == location)));
  return contours;
}

// Find Location Center Point
export async function findLocationCenterPoint(location, httpModule) {
  let contours = await determineTimezoneContoursByLocation(location, httpModule, false);
  if (contours != null) { return [math.mean(contours['features'][0]['geometry']['coordinates'].map(region => [].concat.apply([], region.map(coordinates => [].concat.apply([], coordinates.map(coordinate => coordinate[0])))))), math.mean(contours['features'][0]['geometry']['coordinates'].map(region => [].concat.apply([], region.map(coordinates => [].concat.apply([], coordinates.map(coordinate => coordinate[1]))))))]; }
  else { return [0, 0]; }
}

// Add Map Load
export function addMapLoad(map, time = 2500) {
  map.rendering = {
    'done': false,
    'lastUpdate': new Date().getTime(),
    'waitTime': time,
    'meta': {
      'progress': 0,
      'action': 'common.map.loadingmap'
    }
  };
  return map;
}

// Map Render Update
export function mapRenderUpdate(map, type) {
  if (type == 'load') {
    map.rendering.meta.progress = map.rendering.meta.progress + 5;
    map.rendering.meta.action = 'common.map.loadinglayers';
  }
  else {
    if (map.rendering.meta.progress < 80) { map.rendering.meta.progress = map.rendering.meta.progress + Math.floor(Math.random() * 4); }
    else if (map.rendering.meta.progress < 90) { map.rendering.meta.progress = map.rendering.meta.progress + 1; }
  }
  map.rendering.lastUpdate = new Date().getTime();
}

// Verify Map Load
export function verifyMapLoad(map, checker) {
  if ((map != null) && objLib.lookUpKey(map, 'rendering') && (!map.rendering.done) && ((new Date().getTime()) >= (map.rendering.lastUpdate + map.rendering.waitTime))) {
    if (map.rendering.meta.progress != 100) {
      map.rendering.meta.progress = 100;
      map.rendering.meta.action = 'common.map.ready';
    }
    else {
      map.rendering.done = true;
      clearInterval(checker);
    }
  }
}
