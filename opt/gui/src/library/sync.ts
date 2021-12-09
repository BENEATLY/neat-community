//  Author:     Thomas D'haenens
//  License:    GPL-3.0
//  Link:       https://github.com/BENEATLY/neat-community/
//  Contact:    https://neatly.be/


// Synchronous Wait (Blocking)
export function syncWait(ms) {
  var start = new Date().getTime();
  var end = start;
  while(end < start+ms) { end = new Date().getTime(); }
}

// Asynchronous Wait (Non-Blocking)
export function asyncWait(ms): Promise<boolean> {
  return new Promise<boolean>(resolve => { setTimeout(() => { resolve(true); }, ms); });
}
