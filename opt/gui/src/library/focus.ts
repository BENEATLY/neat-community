//  Author:     Thomas D'haenens
//  License:    GPL-3.0
//  Link:       https://github.com/BENEATLY/neat-start-orig/
//  Contact:    https://neatly.be/


// Image Focus
export function imageFocus(focusService, meta) {

  // Open Focus Window
  focusService.open('image', meta).subscribe();

}
