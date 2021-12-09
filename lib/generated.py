################################################################################
# Author:     Thomas D'haenens
# License:    GPL-3.0
# Link:       https://github.com/BENEATLY/neat-community/
# Contact:    https://neatly.be/
################################################################################


# IMPORT: Custom Modules
from basic import *                                                                                              # Basic Lib


# DEFINITIONS: Generated Libraries
generatedLibraries = {}


# FUNCTION: Set Generated Library
@log()
def setGeneratedLibrary(pluginId, libSpec):
    if (pluginId):
        if (pluginId not in generatedLibraries):
            generatedLibraries[pluginId] = {libSpec: loadPluginLibrary(pluginId, libSpec, defaultPath='generated')}
        elif (libSpec not in generatedLibraries[pluginId]):
            generatedLibraries[pluginId][libSpec] = loadPluginLibrary(pluginId, libSpec, defaultPath='generated')
    else:
        if (None not in generatedLibraries):
            generatedLibraries[None] = {libSpec: loadLibrary(sys.sharedConfig.location['lib'] + '/'.join(libSpec.split('.')), autoExt=True)}
        elif (libSpec not in generatedLibraries[None]):
            generatedLibraries[None][libSpec] = loadLibrary(sys.sharedConfig.location['lib'] + '/'.join(libSpec.split('.')), autoExt=True)


# FUNCTION: Map Generated Property
@log()
def mapGeneratedProperty(generated):
    if (generated['property']['plugin']):
        if (not ((generated['property']['plugin'] in generatedLibraries) and (generated['property']['lib'] in generatedLibraries[generated['property']['plugin']]))):
            setGeneratedLibrary(generated['property']['plugin'], generated['property']['lib'])
        return getattr(generatedLibraries[generated['property']['plugin']][generated['property']['lib']], generated['property']['name'])
    else:
        if (not ((None in generatedLibraries) and ('defaultGenerated' in generatedLibraries[None]))):
            setGeneratedLibrary(None, 'defaultGenerated')
        return getattr(generatedLibraries[None]['defaultGenerated'], generated['property']['name'])


# FUNCTION: Map Generated Setter
@log()
def mapGeneratedSetter(generated):
    if (generated['setter']['plugin']):
        if (not ((generated['setter']['plugin'] in generatedLibraries) and (generated['setter']['lib'] in generatedLibraries[generated['setter']['plugin']]))):
            setGeneratedLibrary(generated['setter']['plugin'], generated['setter']['lib'])
        return getattr(generatedLibraries[generated['setter']['plugin']][generated['setter']['lib']], generated['setter']['name'])
    else:
        if (not ((None in generatedLibraries) and ('defaultGenerated' in generatedLibraries[None]))):
            setGeneratedLibrary(None, 'defaultGenerated')
        return getattr(generatedLibraries[None]['defaultGenerated'], generated['setter']['name'])
