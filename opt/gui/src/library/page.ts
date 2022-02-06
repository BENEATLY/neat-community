//  Author:     Thomas D'haenens
//  License:    GPL-3.0
//  Link:       https://github.com/BENEATLY/neat-community/
//  Contact:    https://neatly.be/


// Imports: Libraries
import * as objLib from '@library/object';


// Compare Page Result Limits
export function pageResultLimit(pageInfo, name) {
  if (pageInfo[name].perPage == null) { return 100; }
  else if (pageInfo[name].perPage > 1000) { return 1000; }
  else if (pageInfo[name].perPage < 10) { return 10; }
  else { return pageInfo[name].perPage; }
}

// Determine Pager Numbers
export function determinePagerNumbers(pageInfo, name) {
  if (pageInfo[name].page == 1) { return Array.from({ length: pageInfo[name].maxPage }, (_, i) => i+1).slice(0, 3); }
  else if (pageInfo[name].page == pageInfo[name].maxPage) { return Array.from({ length: pageInfo[name].maxPage }, (_, i) => i+1).reverse().slice(0, 3).reverse(); }
  else { return [(pageInfo[name].page-1), pageInfo[name].page, (pageInfo[name].page+1)]; }
}

// Determine Fixed Level
export function determineFixedLevel(name, displayOptions) {
  if (objLib.lookUpKey(displayOptions, name) && objLib.lookUpKey(displayOptions[name], 'level')) { return displayOptions[name]['level']; }
  else { return false; }
}

// Get Results Per Page List
export function getResultsPerPageList() { return [20, 50, 100, 200, 500]; }

// Generate Result Segment
export function resultSegment(pageInfo) {
  let start = 0;
  let end = 0;
  if (pageInfo.model['total'] > 0) {
    start = (pageInfo.model['page']-1) * pageInfo.model['perPage'] + 1;
    if (pageInfo.model['page'] < pageInfo.model['maxPage']) { end = pageInfo.model['page'] * pageInfo.model['perPage']; }
    else { end = pageInfo.model['total']; }
  }
  return { 'start': start, 'end': end, 'results': pageInfo.model['exist'] };
}
