################################################################################
# Author:     Thomas D'haenens
# License:    GPL-3.0
# Link:       https://github.com/BENEATLY/neat-community/
# Contact:    https://neatly.be/
################################################################################


# IMPORT: Custom Modules
from basic import *                                                                                              # Basic Lib


# DEFINITIONS: Libraries
libs = {'trigger': {}, 'generated': {}, 'option': {}, 'function': {}}


# FUNCTION: Set Library
@log()
def setLibrary(type, pluginId, libSpec):
    if (pluginId):
        if (pluginId not in libs[type]):
            libs[type][pluginId] = {libSpec: loadPluginLibrary(pluginId, libSpec, defaultPath=type)}
        elif (libSpec not in libs[type][pluginId]):
            libs[type][pluginId][libSpec] = loadPluginLibrary(pluginId, libSpec, defaultPath=type)
    else:
        if (None not in libs[type]):
            libs[type][None] = {libSpec: loadLibrary(sys.sharedConfig.location['lib'] + '/'.join(libSpec.split('.')), autoExt=True)}
        elif (libSpec not in libs[type][None]):
            libs[type][None][libSpec] = loadLibrary(sys.sharedConfig.location['lib'] + '/'.join(libSpec.split('.')), autoExt=True)


# FUNCTION: Map Generic
@log()
def mapGeneric(data, type, defaultLib):
    if (data['plugin']):
        if (not ((data['plugin'] in libs[type]) and (data['lib'] in libs[type][data['plugin']]))):
            setLibrary(type, data['plugin'], data['lib'])
        return getattr(libs[type][data['plugin']][data['lib']], data['name'])
    else:
        if (not ((None in libs[type]) and (defaultLib in libs[type][None]))):
            setLibrary(type, None, defaultLib)
        return getattr(libs[type][None][defaultLib], data['name'])


# FUNCTION: Map Trigger
def mapTrigger(data): return mapGeneric(data['function'], 'trigger', 'triggers')


# FUNCTION: Map Generated Property
def mapGeneratedProperty(data): return mapGeneric(data['property'], 'generated', 'generated')


# FUNCTION: Map Generated Setter
def mapGeneratedSetter(data): return mapGeneric(data['setter'], 'generated', 'generated')


# FUNCTION: Map Option
def mapOption(data): return mapGeneric(data, 'option', 'options')


# FUNCTION: Map Function
def mapFunction(data): return mapGeneric(data, 'function', 'functions')
