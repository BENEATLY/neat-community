/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-community/
    Contact:    https://neatly.be/
*/


// Imports: Config Loaders
import { AppConfig } from '@app/app.config';
import { HashConfig } from '@app/hash.config';
import { PluginConfig } from '@app/plugin.config';


// Construct Config Dictionary
const configImportsDict = {
  'AppConfig': AppConfig,
  'HashConfig': HashConfig,
  'PluginConfig': PluginConfig
};

// Construct Config List
const configImportsList = [AppConfig, HashConfig, PluginConfig];

// Get Config By Name
function getConfigImportByName(name) { return configImportsDict[name]; }


// Export Dicts, Lists & Functions
export { configImportsDict, configImportsList, getConfigImportByName };
