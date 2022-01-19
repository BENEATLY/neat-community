################################################################################
# Author:     Thomas D'haenens
# License:    GPL-3.0
# Link:       https://github.com/BENEATLY/neat-community/
# Contact:    https://neatly.be/
################################################################################


# IMPORT: Standard Modules
from sqlalchemy import select, func, or_, and_                                                                                              # SQLAlchemy Lib
from sqlalchemy.orm import aliased                                                                                                          # SQLAlchemy ORM

# IMPORT: Custom Modules
from basic import *                                                                                                                         # Basic Lib
import tables                                                                                                                               # Tables Lib
import services                                                                                                                             # Services Lib


# FUNCTION: Temporary Session Decorator
@log()
def inTempSession():
    def inTempSessionInternal(func):
        @wraps(func)
        def inTempSessionWrapper(*args):
            session = tables.createDBSession()
            result = func(*args, session)
            session.close()
            return result
        return inTempSessionWrapper
    return inTempSessionInternal


# FUNCTION: Plugin Option Value Getter (Hybrid Property)
@log()
@inTempSession()
def pluginOptionValue(self, session):

    # Linked to Object
    objName = self.objectName
    if (objName):

        # Known in Tables
        tableObject = getattr(tables, objName, None)
        if (tableObject):

            # Get Raw Value
            rawValue = self.rawValue

            # Is List
            if (isinstance(rawValue, list)):
                objs = session.query(tableObject).filter(tableObject.id.in_(rawValue)).all()
                if contextAvailable(): return serializeList(objs)
                else: return serializeList(objs, internal=True, rights=generateGetAllRights(getAllClassNames(tables)))

            # Is Id
            elif (isinstance(rawValue, int)):
                obj = session.query(tableObject).filter_by(id=rawValue).first()
                if (obj):
                    if contextAvailable(): return serializeObject(obj)
                    else: return serializeObject(obj, internal=True, rights=generateGetAllRights(getAllClassNames(tables)))

        # Not Known in Tables or No Valid Value
        return None

    # All Other Cases
    return self.rawValue


# FUNCTION: Plugin Option Value Setter (Hybrid Property)
def pluginOptionValueSetter(self, value):
    setattr(self, 'rawValue', value)


# FUNCTION: Plugin Logs Getter (Hybrid Property)
@log(returnValue=[])
def pluginLogs(self):

    # Determine Log Directory
    dir = sys.sharedConfig.logging['loggers']['plugin']['path'] + str(self.id) + '/'

    # Result Variable
    result = []

    # Walk Subdirectories
    for dirPath, dirNames, files in os.walk(dir):

        # Iterate over Files
        for name in files:

            # Is Log File?
            if ('.log' in name.lower()):

                # Get File Info
                fullPath = os.path.join(dirPath, name)
                fileStat = os.stat(fullPath)

                # Get Relative Paths
                fullPath = fullPath.replace(dir, '')
                filePath = dirPath.replace(dir, '')
                if (not filePath): filePath = None

                # Append to Result
                result.append({'uid': generateUIDfromString(fullPath), 'file': name, 'path': filePath, 'fullPath': fullPath, 'size': round(fileStat.st_size/1024, 1), 'creation': datetime.fromtimestamp(fileStat.st_ctime), 'lastEntry': datetime.fromtimestamp(fileStat.st_mtime)})

    # Sort By Last Entry & Return
    return sorted(result, key=lambda x: x['lastEntry'], reverse=True)


# FUNCTION: Plugin Services Getter (Hybrid Property)
@log(returnValue=[])
def pluginServices(self):
    services = readJSONFile('/etc/neatly/base/service/service.json')
    return [services.getServiceStatus(service) for service in services if (service['plugin'] == self.id)]


# FUNCTION: File Size Getter (Hybrid Property)
@log(returnValue=0)
def fileSize(self): return getFileSize(self.reference)


# FUNCTION: Column Property (Example)
# @selfDecorator
# def columnPropertyExample(self):
#    return select([func.count(tables.User.id)]).where(tables.User.team_id==self.id).correlate_except(tables.User)
