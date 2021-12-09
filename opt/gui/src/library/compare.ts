//  Author:     Thomas D'haenens
//  License:    GPL-3.0
//  Link:       https://github.com/BENEATLY/neat-community/
//  Contact:    https://neatly.be/


// Compare Values
export function compareValues(val1, val2, comparator) {
  if (comparator == '>') { return (val1 > val2); }
  if (comparator == '>=') { return (val1 >= val2); }
  if (comparator == '<') { return (val1 < val2); }
  if (comparator == '<=') { return (val1 <= val2); }
  if (comparator == '=') { return (val1 == val2); }
  if (comparator == '!=') { return (val1 != val2); }
}
