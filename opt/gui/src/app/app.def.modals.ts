/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-community/
    Contact:    https://neatly.be/
*/


// Imports: Components
import * as appDefComponents from '@app/app.def.components';


// Construct Modal List
const modalImportsList = [

    // Default Modals
    { name: 'log', component: appDefComponents.componentImportsDict['LogModalComponent'] },
    { name: 'info', component: appDefComponents.componentImportsDict['InfoModalComponent'] },
    { name: 'plugin-option', component: appDefComponents.componentImportsDict['PluginOptionModalComponent'] },
    { name: 'property', component: appDefComponents.componentImportsDict['PropertyModalComponent'] },
    { name: 'service', component: appDefComponents.componentImportsDict['ServiceModalComponent'] },
    { name: 'longcontent', component: appDefComponents.componentImportsDict['LongContentModalComponent'] },
    { name: 'help', component: appDefComponents.componentImportsDict['HelpModalComponent'] },
    { name: 'box-help', component: appDefComponents.componentImportsDict['BoxHelpModalComponent'] },
    { name: 'plugin-option-help', component: appDefComponents.componentImportsDict['PluginOptionHelpModalComponent'] }

];


// Export Dicts, Lists & Functions
export { modalImportsList };
