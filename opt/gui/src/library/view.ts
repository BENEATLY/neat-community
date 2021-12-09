//  Author:     Thomas D'haenens
//  License:    GPL-3.0
//  Link:       https://github.com/BENEATLY/neat-start-orig/
//  Contact:    https://neatly.be/


// Zoom
export function zoom(factor, action, boundaries, step) {

  // Zoom In
  if (action) {
    if (factor <= boundaries[1]) { factor += step; }
  }

  // Zoom Out
  else if (factor > boundaries[0]) { factor -= step; }

  // Return Factor
  return factor;

}
