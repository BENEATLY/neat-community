/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-start-orig/
    Contact:    https://neatly.be/
*/


// Translation Item Property Function
export function getTranslationItemProperty(item, lang, property) {
  try { return property.split('.').reduce((o,i)=>o[i], item); }
  catch(err) { return 'N/A'; }
}

// Construct Formatter Dictionary
const formatterDict = {
  'property': getTranslationItemProperty
};

// Export Formatter Dict
export { formatterDict };
