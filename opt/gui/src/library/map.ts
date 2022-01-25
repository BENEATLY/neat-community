//  Author:     Thomas D'haenens
//  License:    GPL-3.0
//  Link:       https://github.com/BENEATLY/neat-community/
//  Contact:    https://neatly.be/


// Imports: Libraries
import * as valLib from '@library/validate';

// Imports: Files
import timezoneLink from '@assets/geojson/timezone/timezoneLink.json';

// Imports: Tools
import * as math from 'mathjs';


// Get Contours By Location
export async function getContoursByLocation(location, httpModule) {
  for (let timezone of timezoneLink) {
    if (timezone['locations'].includes(location)) { return await getTimezoneContours((timezone['timeZone'].toLowerCase() + '.json'), httpModule); }
  }
  return null;
}

// Get Timezone Contours
export async function getTimezoneContours(file, httpModule) {

  // Return File Content
  return await httpModule.get('./assets/geojson/timezone/files/low-res/' + file).toPromise().then(

    // Success
    res => { return res; },

    // Fail
    err => { console.warn('Unable to fetch timezone file'); }

  );

}

// Filter Out Original Timezone
export function filterOriginalTimezone(location, contours, exclude) {
  let features = contours.features.filter(feature => (exclude?(feature.properties.tzid != location):(feature.properties.tzid == location)));
  return {features: features, type: 'FeatureCollection'};
}


// Get All Sub Coordinates
export function getSubCoordinates(contours, index, coordinates: any[] = []) {
  for (let contour of contours) {
    if ((contour[0].length == 2) && valLib.isNumber(contour[0][0])) { coordinates = coordinates.concat(contour.map(coordinate => coordinate[index])); }
    else { coordinates = getSubCoordinates(contour, index, coordinates); }
  }
  return coordinates;
}

// Find Contour Center Point
export function findContourCenterPoint(contours) {
  let xCoordinates = getSubCoordinates(contours.features[0].geometry.coordinates, 0);
  let yCoordinates = getSubCoordinates(contours.features[0].geometry.coordinates, 1);
  return [math.mean(xCoordinates), math.mean(yCoordinates)];
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
