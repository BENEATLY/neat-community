//  Author:     Thomas D'haenens
//  License:    GPL-3.0
//  Link:       https://github.com/BENEATLY/neat-start-orig/
//  Contact:    https://neatly.be/


// Are the Rights Sufficient?
export function sufficientRights(rights, apiObject, apiAction, level) {

  // No Rights
  if (rights == null) { return false; }

  // Iterate over Rights
  for (let right of rights) {

    // Look for Matching Rights
    if ((right['apiObject']['name'] == apiObject) && (right['apiAction']['name'] == apiAction)) {
      if ((level == 'all') && (right['right'] == 'all')) { return true; }
      else if ((level == 'isolated') && ((right['right'] == 'all') || (right['right'] == 'isolated'))) { return true; }
      else if ((level == 'own') && ((right['right'] == 'all') || (right['right'] == 'isolated') || (right['right'] == 'own'))) { return true; }
      else if (!level) { return true; }
    }

  }

  // No Matching Right Found
  return false;

}

// Are the Plugin Action Rights Sufficient?
export function sufficientPluginActionRights(rights, pluginId, action, level) {

  // No Rights
  if (rights == null) { return false; }

  // Iterate over Rights
  for (let right of rights) {

    // Look for Matching Rights
    if ((right['plugin']['id'] == pluginId) && (right['action'] == action)) {
      if ((level == 'all') && (right['right'] == 'all')) { return true; }
      else if ((level == 'isolated') && ((right['right'] == 'all') || (right['right'] == 'isolated'))) { return true; }
      else if ((level == 'own') && ((right['right'] == 'all') || (right['right'] == 'isolated') || (right['right'] == 'own'))) { return true; }
    }

  }

  // No Matching Right Found
  return false;

}

// Are the Plugin Option Rights Sufficient?
export function sufficientPluginOptionRights(rights, pluginId, action, group, option) {

  // No Rights
  if (rights == null) { return false; }

  // Filter Rights
  let filteredRights = rights.filter(right => (right['plugin']['id'] == pluginId) && (right['apiAction']['name'] == action) && (right['group'] == group) && (right['option'] == option));

  // Rights Found?
  if (filteredRights.length) { return true; }

  // No Matching Right Found
  return false;

}
