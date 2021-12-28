################################################################################
# Author:     Thomas D'haenens
# License:    GPL-3.0
# Link:       https://github.com/BENEATLY/neat-community/
# Contact:    https://neatly.be/
################################################################################


# IMPORT: Standard Modules
import sys                                                                                      # System Lib
import ujson                                                                                    # UJSON Lib
from werkzeug.security import generate_password_hash                                            # Hashing Lib


# FUNCTION: Read JSON File (No Logging)
def readJSONFile(file):
    with open(file, encoding='utf-8') as content:
        return ujson.load(content)


# CONFIGURATION: Determine Installation Location
locationConfig = readJSONFile('/etc/neatly/base/location.json')

# CONFIGURATION: Add Current Path to Default Python Paths
sys.path.append(locationConfig['lib'])


# IMPORT: Custom Modules
import basic                                                                                    # Basic Lib
from tables import *                                                                            # Tables Lib
import actions                                                                                  # Actions Lib
import plugins                                                                                  # Plugins Lib


# CONFIGURATION: Create Logger
logger = createLogger('resources', createLogFilePath('resources'), getLogFileLevel('resources'), makePreferred=True)

# CONFIGURATION: Executor
execParams = {'internal': True, 'source': 'Resources (default)'}


# CREATE: Session
session = createDBSession()


# INSERT: Authentication Methods
authMethods = [{'name': 'Default'}]
[actions.createByDict(execParams, session, AuthenticationMethod, **authMethod) for authMethod in authMethods]

# GET: Default Authentication Method
defaultAuthMethod = session.query(AuthenticationMethod).filter_by(plugin_id=None).first()

# INSERT: Teams
teams = [{'name': 'Administrators'}]
[actions.createByDict(execParams, session, Team, **team) for team in teams]

# GET: Root Team
rootTeam = session.query(Team).filter_by(name='Administrators').first()

# INSERT: Functions
functions = [{'name': 'Administrator'}]
[actions.createByDict(execParams, session, Function, **function) for function in functions]

# GET: Root Function
adminFunction = session.query(Function).filter_by(name='Administrator').first()

# INSERT: Users
users = [{'userName': 'admin', 'firstName': 'System', 'lastName': 'Administrator', 'mail': 'admin@neatly.be', 'phone': None, 'password': generate_password_hash('admin'), 'team': rootTeam, 'function': adminFunction, 'authenticationMethod': defaultAuthMethod}]
[actions.createByDict(execParams, session, User, **user) for user in users]

# INSERT: Translations
translations = [
    {'language': 'English', 'country': 'US', 'flag': 'us', 'translationFile': 'en-us', 'locale': 'en-us', 'enabled': True},
    {'language': 'Nederlands', 'country': 'België', 'flag': 'be', 'translationFile': 'nl-be', 'locale': 'nl-be', 'enabled': True}
]
[actions.createByDict(execParams, session, Translation, **translation) for translation in translations]

# INSERT: ApiObjects
apiObjects = [
    {'name': 'ActiveSession'},
    {'name': 'AuthenticationMethod'},
    {'name': 'User'},
    {'name': 'Team'},
    {'name': 'Function'},
    {'name': 'ApiObject'},
    {'name': 'ApiAction'},
    {'name': 'File'},
    {'name': 'Right'},
    {'name': 'Plugin'},
    {'name': 'PluginActionRight'},
    {'name': 'PluginOptionRight'},
    {'name': 'Translation'}
]
[actions.createByDict(execParams, session, ApiObject, **apiObject) for apiObject in apiObjects]

# GET: API Objects
apiObjectList = session.query(ApiObject).all()
apiObjectDict = {apiObject.name: apiObject for apiObject in apiObjectList}

# INSERT: ApiActions
apiActions = [
    {'name': 'Get'},
    {'name': 'Create'},
    {'name': 'Delete'},
    {'name': 'Edit'}
]
[actions.createByDict(execParams, session, ApiAction, **apiAction) for apiAction in apiActions]

# GET: API Actions
apiActionList = session.query(ApiAction).all()
apiActionDict = {apiAction.name: apiAction for apiAction in apiActionList}

# DEFINE: Right
rights = []

# DEFINE: Admin Rights
skipRights = [
    {'apiObject': 'Translation', 'apiAction': 'Create'},
    {'apiObject': 'ActiveSession', 'apiAction': 'Create'},
    {'apiObject': 'ActiveSession', 'apiAction': 'Edit'},
    {'apiObject': 'AuthenticationMethod', 'apiAction': 'Create'},
    {'apiObject': 'AuthenticationMethod', 'apiAction': 'Delete'}
]
rights.extend(basic.flattenArray([[{'apiObject': apiObject, 'apiAction': apiAction, 'team': [rootTeam], 'isolated': False, 'own': False, 'all': True} for apiAction in apiActionList if ({'apiObject': apiObject.name, 'apiAction': apiAction.name} not in skipRights)] for apiObject in apiObjectList]))

# DEFINE: Basic Rights

# User Rights
rights.append({'apiObject': apiObjectDict['User'], 'apiAction': apiActionDict['Edit'], 'isolated': False, 'own': True, 'all': False})
rights.append({'apiObject': apiObjectDict['User'], 'apiAction': apiActionDict['Get'], 'isolated': False, 'own': False, 'all': True})

# Translation Rights
rights.append({'apiObject': apiObjectDict['Translation'], 'apiAction': apiActionDict['Get'], 'isolated': False, 'own': False, 'all': True})

# ActiveSession Rights
rights.append({'apiObject': apiObjectDict['ActiveSession'], 'apiAction': apiActionDict['Get'], 'isolated': False, 'own': True, 'all': False})
rights.append({'apiObject': apiObjectDict['ActiveSession'], 'apiAction': apiActionDict['Delete'], 'isolated': False, 'own': True, 'all': False})

# File Rights
rights.append({'apiObject': apiObjectDict['File'], 'apiAction': apiActionDict['Create'], 'isolated': False, 'own': True, 'all': False})
rights.append({'apiObject': apiObjectDict['File'], 'apiAction': apiActionDict['Get'], 'isolated': False, 'own': False, 'all': True})

# INSERT: Rights
[actions.createByDict(execParams, session, Right, **right) for right in rights]

# INSERT: Plugin
pluginList = plugins.getPluginRepoInformation()
pluginNoReqList = basic.deepcopy(pluginList)
[plugin.update({'required': []}) for plugin in pluginNoReqList]
[actions.createByDict(execParams, session, Plugin, **plugin, forceId=True) for plugin in pluginNoReqList]

# ADD: Plugin Dependencies
for plgn in pluginList:
    plugin = session.query(Plugin).filter_by(id=plgn['id']).first()
    if plugin:
        plugin.required = [session.query(Plugin).filter_by(id=req).first() for req in plgn['required']]
        actions.merge(execParams, session, plugin)
