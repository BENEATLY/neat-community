################################################################################
# Author:     Thomas D'haenens
# License:    GPL-3.0
# Link:       https://github.com/BENEATLY/neat-community/
# Contact:    https://neatly.be/
################################################################################


# IMPORT: Custom Modules
from basic import *                                                                                              # Basic Lib


# DEFINITIONS: Trigger Libraries
triggerLibraries = {}


# FUNCTION: Set Trigger Library
@log()
def setTriggerLibrary(pluginId, libSpec):
    if (pluginId):
        if (pluginId not in triggerLibraries):
            triggerLibraries[pluginId] = {libSpec: loadPluginLibrary(pluginId, libSpec, defaultPath='trigger')}
        elif (libSpec not in triggerLibraries[pluginId]):
            triggerLibraries[pluginId][libSpec] = loadPluginLibrary(pluginId, libSpec, defaultPath='trigger')
    else:
        if (None not in triggerLibraries):
            triggerLibraries[None] = {libSpec: loadLibrary(sys.sharedConfig.location['lib'] + '/'.join(libSpec.split('.')), autoExt=True)}
        elif (libSpec not in triggerLibraries[None]):
            triggerLibraries[None][libSpec] = loadLibrary(sys.sharedConfig.location['lib'] + '/'.join(libSpec.split('.')), autoExt=True)


# FUNCTION: Map Trigger Function
@log()
def mapTriggerFunction(trigger):
    if (trigger['function']['plugin']):
        if (not ((trigger['function']['plugin'] in triggerLibraries) and (trigger['function']['lib'] in triggerLibraries[trigger['function']['plugin']]))):
            setTriggerLibrary(trigger['function']['plugin'], trigger['function']['lib'])
        return getattr(triggerLibraries[trigger['function']['plugin']][trigger['function']['lib']], trigger['function']['name'])
    else:
        if (not ((None in triggerLibraries) and ('defaultTriggers' in triggerLibraries[None]))):
            setTriggerLibrary(None, 'defaultTriggers')
        return getattr(triggerLibraries[None]['defaultTriggers'], trigger['function']['name'])


# TODO: What to do with producer and consumer?
# TODO: Check if get_class_by_table can be used
# TODO: Add transaction and activity
