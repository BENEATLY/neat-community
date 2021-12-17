################################################################################
# Author:     Thomas D'haenens
# License:    GPL-3.0
# Link:       https://github.com/BENEATLY/neat-community/
# Contact:    https://neatly.be/
################################################################################


# IMPORT: Custom Modules
from basic import *                                                                                             # Basic Lib


# FUNCTION: Trigger PluginOption Message
@log()
def pluginOptionHandler(options, value):

    # List of Items
    if isinstance(value, list):

        # Status Option
        if options['status']: return serializeList(value, extra=['services'])

    # Single Item
    else:

        # Log Option
        if options['logs']:

            # Download Logs
            if (options['download']): return value.getLogContent(options)

            # Log Data
            else: return serializeObject(value, extra=['logs'])

        # Status Option
        elif options['status']: return serializeObject(value, extra=['services'])
