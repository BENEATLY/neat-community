################################################################################
# Author:     Thomas D'haenens
# License:    GPL-3.0
# Link:       https://github.com/BENEATLY/neat-start-orig/
# Contact:    https://neatly.be/
################################################################################


# IMPORT: Standard Modules
import sys                                                                                          # System Lib
import ujson                                                                                        # UJSON Lib


# FUNCTION: Read JSON File (No Logging)
def readJSONFile(file):
    with open(file, encoding='utf-8') as content:
        return ujson.load(content)


# CONFIGURATION: Determine Installation Location
locationConfig = readJSONFile('/etc/neatly/base/location.json')

# CONFIGURATION: Add Current Path to Default Python Paths
sys.path.append(locationConfig['lib'])


# IMPORT: Custom Modules
from basic import loadLibrary, createLogger, createLogFilePath, getLogFileLevel, returnExitCode     # Basic Lib


# CONFIGURATION: Create Logger
logger = createLogger('tables', createLogFilePath('tables'), getLogFileLevel('tables'), makePreferred=True)


# IMPORT: Tables
tables = loadLibrary(sys.sharedConfig.location['lib'] + 'tables')


# CREATE: Tables
result = tables.createTables()


# RETURN: Status
print(('Successfully created tables' if result else 'Failed to create tables, see ' + str(createLogFilePath('tables')) + ' for more information.'))
returnExitCode(result)
