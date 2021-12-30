################################################################################
# Author:     Thomas D'haenens
# License:    GPL-3.0
# Link:       https://github.com/BENEATLY/neat-community/
# Contact:    https://neatly.be/
################################################################################


# IMPORT: Standard Modules
import time as timeLib                                                                                           # Time Lib
from logging.handlers import RotatingFileHandler                                                                 # Rotated Logging Lib
from threading import Timer                                                                                      # Timer Lib
from site import getsitepackages                                                                                 # Site Package Function
from werkzeug.security import generate_password_hash, check_password_hash                                        # Hashing Lib
from flask_cors import CORS                                                                                      # CO Res Sharing Lib
from flask_sqlalchemy import SQLAlchemy                                                                          # SQLAlchemy Lib
from flask_httpauth import HTTPBasicAuth, HTTPTokenAuth                                                          # Basic/Token Auth Lib
from flask_caching import Cache                                                                                  # Caching Lib
from flask import g, flash, redirect, url_for, cli                                                               # Flask App Lib
from werkzeug.middleware.proxy_fix import ProxyFix                                                               # Werkzeug Proxy

# IMPORT: Custom Modules
from basic import *                                                                                              # Basic Lib
import plugins                                                                                                   # Plugins from Lib
import services                                                                                                  # Services from Lib
import actions                                                                                                   # Actions from Lib
import validate                                                                                                  # Validate from Lib
import tables                                                                                                    # Tables from Lib
import filters                                                                                                   # Filters from Lib


# CONFIGURATION: Create Logger
logger = createLogger('actions', createLogFilePath('actions'), getLogFileLevel('actions'))
setDefaultLogger(logger)


# START TIME OF SERVICE
serviceStart = datetime.now()
logger.info('Starting application')


# FUNCTION: Periodic Expire Sessions
@log()
def periodicExpireSessions():
    oldSessions = db.session.query(tables.ActiveSession).filter(and_(tables.ActiveSession.creation < (datetime.now() - timedelta(days=apiSessionConfig['expiration'])).replace(tzinfo=timezone.utc), tables.ActiveSession.static == False, tables.ActiveSession.expired == False)).all()
    [setattr(oldSession, 'expired', True) for oldSession in oldSessions]
    [actions.merge({'source': 'System (API)', 'description': 'Periodic expire sessions'}, db.session, oldSession) for oldSession in oldSessions]
    _logger.info('Expired old sessions')
    Timer(apiSessionConfig['check'], periodicExpireSessions).start()


# FUNCTION: Sys Path Check
@log()
def sysPathCheck():
    sitePackagePath = [path for path in getsitepackages() if ('site-packages' in path)][0]
    sysPathFile = sitePackagePath + ('' if (sitePackagePath.endswith('/')) else '/') + 'neatly-base.pth'
    if (os.path.isfile(sysPathFile)):
        sysPathFileContent = readTextFile(sysPathFile)
        if (sysPathFileContent == sys.sharedConfig.location['lib']):
            _logger.info('Sys path reference is up-to-date')
        else:
            _logger.debug('Updating sys path reference')
            writeTextFile(sysPathFile, sys.sharedConfig.location['lib'])
            _logger.info('Updated sys path reference')
    else:
        _logger.debug('Adding sys path reference')
        writeTextFile(sysPathFile, sys.sharedConfig.location['lib'])
        _logger.info('Added sys path reference')


# FUNCTION: Flask Banner (Development Only)
def flaskBanner(*args):
    click.echo(' * Welcome to the Neatly Base API!')


# FUNCTION: Flask Ready
@log()
def flaskReady():
    _logger.info('Application is ready')


# FUNCTION: Is Development Server
@log()
def isDevelopmentServer():
    shutDownFunc = request.environ.get('werkzeug.server.shutdown')
    return (True if shutDownFunc else False)


# FUNCTION: Shutdown Development Server
@log()
def shutdownDevelopmentServer():
    _logger.info('Shutting down Flask application (development server)')
    shutDownFunc = request.environ.get('werkzeug.server.shutdown')
    shutDownFunc()


# FUNCTION: Reload Production Server
@log()
def reloadProductionServer():
    try:
        _logger.info('Reloading UWSGI application (production server)')
        import uwsgi
        uwsgi.reload()
    except:
        _logger.error('Unable to reload production server')
        _logger.error(' '.join(str(traceback.format_exc()).split()))


# FUNCTION: Update Web Server
@log()
def updateWebServer(basePath, apiPort, apiProtocol, apiSSLCertificate, apiSSLKey, guiProtocol):
    _logger.debug('Updating Nginx configuration')
    removeFile('/etc/nginx/conf.d/neatly.conf')
    templateFolder = guiProtocol.lower() + '-gui/' + apiProtocol.lower() + '-api/'
    writeReplacedTextFile('/etc/nginx/conf.d/neatly.conf', readTextFile('/etc/nginx/templates/neatly/' + templateFolder + 'neatly.conf'), {'{{basePath}}': basePath, '{{port}}': str(apiPort), '{{certPath}}': str(apiSSLCertificate), '{{keyPath}}': str(apiSSLKey)})
    _logger.debug('Updated Nginx configuration')
    services.restartWebServer()


# FUNCTION: Load API Config
@log()
def loadAPIConfig():
    global apiConfig, basePath, apiVersion, apiPort, apiProtocol, apiSessionConfig, apiUnqueryable, apiSSLCertificate, apiSSLKey
    _logger.debug('Loading API config')
    apiConfig = readJSONFile('/etc/neatly/base/api/api.json')                                                        # API Configuration
    basePath = apiConfig['basePath']                                                                                 # API Base Path
    apiVersion = apiConfig['version']                                                                                # API Version
    apiPort = apiConfig['port']                                                                                      # API Port
    apiSessionConfig = apiConfig['session']                                                                          # API Debug Mode
    apiUnqueryable = [i.lower() for i in apiConfig['unqueryable']]                                                   # API Unqueryable Objects
    if 'protocol' in apiConfig:
        apiProtocol = apiConfig['protocol'].lower()
        if (apiProtocol.lower() == 'https'):
            if ('ssl' in apiConfig) and ('certificate' in apiConfig['ssl']) and ('key' in apiConfig['ssl']):
                apiSSLCertificate = apiConfig['ssl']['certificate']
                apiSSLKey = apiConfig['ssl']['key']
            else:
                apiProtocol, apiSSLCertificate, apiSSLKey = 'http', None, None
        else:
            apiProtocol, apiSSLCertificate, apiSSLKey = 'http', None, None
    else:
        apiProtocol, apiSSLCertificate, apiSSLKey = 'http', None, None
    _logger.debug('Loaded API config')


# FUNCTION: Load GUI Config
@log()
def loadGUIConfig():
    global guiConfig, guiVersion, guiProtocol
    _logger.debug('Loading GUI config')
    guiConfig = readJSONFile('/etc/neatly/base/gui/gui.json')                                                        # GUI Configuration
    guiVersion = guiConfig['version']                                                                                # GUI Version
    guiProtocol = guiConfig['protocol'].lower()                                                                      # GUI Protocol
    _logger.debug('Loaded GUI config')


# FUNCTION: Load Component Versions
@log()
def loadComponentVersions():
    global dbVersion, webServerVersion, messagingVersion, pythonVersion
    _logger.debug('Loading component versions')
    dbVersion = determineDBVersion(db.session)                                                                       # DB Version
    webServerVersion = determineWebServerVersion()                                                                   # Webserver Version
    messagingVersion = determineKafkaVersion()                                                                       # Messaging Version
    pythonVersion = determinePythonVersion()                                                                         # Python Version
    _logger.debug('Loaded component versions')


# SYNC: All Configuration
actions.syncAllConfigurations()


# CONFIGURATION: API Config
loadAPIConfig()

# CONFIGURATION: GUI Config
loadGUIConfig()


# DEFINITION: Banner & Ready
cli.show_server_banner = flaskBanner

# DEFINITION: Flask Service
app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=apiConfig['nrProxy'], x_host=apiConfig['nrProxy'], x_for=apiConfig['nrProxy'])

# DEFINITION: Flask Caching
app.cache = Cache(app, config={'CACHE_TYPE': 'simple'})

# DEFINITION: Flask Authentication Services
basicAuth = HTTPBasicAuth()
tokenAuth = HTTPTokenAuth(scheme='Token')


# CONFIGURATION: Flask Application
app.config['SQLALCHEMY_DATABASE_URI'] = createDBPathConfig(sys.sharedConfig.db['connection'])
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {'pool_pre_ping': True, 'pool_recycle': 300}
app.config['JSON_SORT_KEYS'] = False
app.json_encoder = CustomJSONEncoder
app.json_decoder = CustomJSONDecoder
CORS(app, max_age=apiConfig['preFlightCache'])

# CONFIGURATION: SQL ALCHEMY
sqlOptions = {'autoflush': False}


# FUNCTION: Initialise DB
def initDB():
    global db
    db = SQLAlchemy(app, session_options=sqlOptions)
    tables.linkAfterCommitTriggers(db.session)
    tables.linkVersioning(db.session)


# CONFIGURATION: Create DB Session
initDB()

# CONFIGURATION: Component Versions
loadComponentVersions()

# CONFIGURATION: Create Logger
logger = createLogger('api', createLogFilePath('api'), getLogFileLevel('api'))


# SYS PATH CHECK (SITE-PACKAGES)
sysPathCheck()

# PLUGIN LIBRARIES
pluginLibraries = {}

# READ LICENSE
licensed = readLicense()

# PERFORM EXPIRE SESSION JOB
periodicExpireSessions()

# READ SSL INFO
app.ssl = readSSL(apiConfig)


# FUNCTION: API Argument Provider Decorator
def APIArgProvider(apiAction, attrs=[], options={}):
    def APIArgProviderInternal(func):

        # FUNCTION: Wrapper
        @wraps(func)
        def APIArgProviderWrapper(*args, **kwargs):

            # Get Attributes
            parsedAttrs = {attr: getKeyWordArgument(kwargs, attr) for attr in attrs}

            # Get Path
            path = (parsedAttrs['path'] if ('path' in parsedAttrs) else getKeyWordArgument(kwargs, 'path')).lower()

            # Path Exists
            if ((path in getAllClassNamesLowerCase(tables)) and (path not in apiUnqueryable)):

                # Get Object Name
                objectName = getClassName(path, tables)

                # Determine Rights
                rights = actions.checkRights(db.session, objectName, apiAction, g.user)
                if not rights:
                    return ('', 403) # noCoverage

                # Get Class
                classObject = getClassByName(objectName, tables)

                # Add Class Options
                classOptions = {}
                classOptions.update(classObject.option['options']['common'])
                classOptions.update(classObject.option['options'].get(determinePassedRights(rights), {}))
                options.update(classOptions)

                # Parse Options
                parsedOptions = parseAPIPathOptions(getKeyWordArgument(kwargs, 'options'), options)

                # Return Function Result
                if (apiAction == 'Get'): return func(classObject, rights, parsedAttrs, parsedOptions, bool(classOptions))
                else: return func(classObject, rights, parsedAttrs, parsedOptions)

            # Path Doesn't Exist
            return ('', 404) # noCoverage

        # Return Function
        return APIArgProviderWrapper

    # Return Function
    return APIArgProviderInternal


# FUNCTION: Plugin Action Argument Provider Decorator
def PluginActionArgProvider(func):
    @wraps(func)
    def PluginActionArgProviderWrapper(*args, **kwargs):
        id = getKeyWordArgument(kwargs, 'id')
        actionName = getKeyWordArgument(kwargs, 'action')
        authenticated = getKeyWordArgument(kwargs, 'authenticated')
        plugin = db.session.query(tables.Plugin).filter_by(**({'id': id, 'activated': True} if (id.isdigit()) else {'shortName': id, 'activated': True})).first()
        if (not plugin):
            return ('', 404) # noCoverage
        if actionName.isdigit():
            actionName = str(actionName)
            if os.path.isfile(sys.sharedConfig.location['lib'] + 'plugin/' + str(plugin.id) + '/lib/api/actions.json'):
                apiActionsConfig = readJSONFile(sys.sharedConfig.location['lib'] + 'plugin/' + str(plugin.id) + '/lib/api/actions.json')
                if (actionName in apiActionsConfig.keys()):
                    actionName = str(apiActionsConfig[actionName])
                else:
                    return ('', 404) # noCoverage
            else:
                return ('', 404) # noCoverage
        else:
            actionName = str(actionName)
        if (pluginLibExists(plugin.id, 'api.lib')):
            return func(plugin, actionName, authenticated)
        else:
            return ('', 404) # noCoverage
    return PluginActionArgProviderWrapper


# FUNCTION: Plugin Option Argument Provider Decorator
def PluginOptionArgProvider(func):
    @wraps(func)
    def PluginOptionArgProviderWrapper(*args, **kwargs):
        id = getKeyWordArgument(kwargs, 'id')
        group = getKeyWordArgument(kwargs, 'group')
        option = getKeyWordArgument(kwargs, 'option')
        plugin = db.session.query(tables.Plugin).filter_by(**({'id': id, 'activated': True} if (id.isdigit()) else {'shortName': id, 'activated': True})).first()
        if (not plugin):
            return ('', 404) # noCoverage
        return func(plugin, group, option)
    return PluginOptionArgProviderWrapper


# FUNCTION: Plugin Options Argument Provider Decorator
def PluginOptionsArgProvider(func):
    @wraps(func)
    def PluginOptionsArgProviderWrapper(*args, **kwargs):
        id = getKeyWordArgument(kwargs, 'id')
        plugin = db.session.query(tables.Plugin).filter_by(**({'id': id, 'activated': True} if (id.isdigit()) else {'shortName': id, 'activated': True})).first()
        if (not plugin):
            return ('', 404) # noCoverage
        return func(plugin)
    return PluginOptionsArgProviderWrapper


# FUNCTION: Determine Token Authenticated Decorator
def determineTokenAuthenticated(tokenAuth):
    def determineTokenAuthenticatedInternal(func):
        @wraps(func)
        def determineTokenAuthenticatedWrapper(*args, **kwargs):
            if (tokenAuth.get_auth()):
                kwargs['authenticated'] = True
                authFunc = tokenAuth.login_required(func)
                return authFunc(*args, **kwargs)
            else:
                kwargs['authenticated'] = False
                return func(*args, **kwargs)
        return determineTokenAuthenticatedWrapper
    return determineTokenAuthenticatedInternal


# FUNCTION: Has Rights Decorator
def hasRights(apiObject='Right', apiAction='Edit', level=2):
    def hasRightsInternal(func):
        @wraps(func)
        def hasRightsWrapper(*args, **kwargs):
            rights = actions.checkRights(db.session, apiObject, apiAction, g.user)
            if (not rights): return ('', 403) # noCoverage
            elif (level is not None) and (not any(rights[level:3])): return ('', 403) # noCoverage
            return func()
        return hasRightsWrapper
    return hasRightsInternal


# FUNCTION: Fetch Plugin Action Rights Decorator
def fetchPluginActionRights(func):
    @wraps(func)
    def fetchPluginActionRightsWrapper(plugin, actionName, authenticated):
        if (authenticated):
            rights = actions.checkPluginActionRights(db.session, plugin.id, actionName, g.user)
            if not rights:
                return ('', 403) # noCoverage
        else:
            rights = []
        return func(plugin, actionName, authenticated, rights)
    return fetchPluginActionRightsWrapper


# FUNCTION: Fetch Plugin Option Rights Decorator
def fetchPluginOptionRights(apiAction):
    def fetchPluginOptionRightsInternal(func):
        @wraps(func)
        def fetchPluginOptionRightsWrapper(plugin, group, option):
            rights = actions.checkPluginOptionRights(db.session, plugin.id, group, option, apiAction, g.user)
            if not rights:
                return ('', 403) # noCoverage
            return func(plugin, group, option)
        return fetchPluginOptionRightsWrapper
    return fetchPluginOptionRightsInternal


# FUNCTION: Fetch Plugin Options Rights Decorator
def fetchPluginOptionsRights(apiAction):
    def fetchPluginOptionsRightsInternal(func):
        @wraps(func)
        def fetchPluginOptionsRightsWrapper(plugin):
            allowedOptions = actions.checkPluginOptionsRights(db.session, plugin.id, apiAction, g.user)
            if not allowedOptions:
                return ('', 403) # noCoverage
            return func(plugin, allowedOptions)
        return fetchPluginOptionsRightsWrapper
    return fetchPluginOptionsRightsInternal


# FUNCTION: Get Plugin Logger
def getPluginLogger(pluginId, logType):
    if (hasattr(logging.root.manager, '_dynamicNeatlyLoggerDict')):
        loggerName = ('neatly-plugin-' + str(pluginId) + '-' + str(logType))
        return logging.root.manager._dynamicNeatlyLoggerDict.get(loggerName)
    return None


# FUNCTION: Get Plugin Library
def getPluginLibrary(pluginId, libSpec):
    return pluginLibraries.get(pluginId, {}).get(libSpec)


# FUNCTION: Set Plugin Logger
@log()
def setPluginLogger(pluginId, logType):
    return plugins.createPluginLogger({'id': pluginId}, logType)


# FUNCTION: Set Plugin Library
@log()
def setPluginLibrary(pluginId, libSpec):
    if (pluginId not in pluginLibraries):
        lib = loadPluginLibrary(pluginId, libSpec)
        pluginLibraries[pluginId] = {libSpec: lib}
        return lib
    elif (libSpec not in pluginLibraries[pluginId]):
        lib = loadPluginLibrary(pluginId, libSpec)
        pluginLibraries[pluginId][libSpec] = lib
        return lib


# FUNCTION: Reset Plugin Library
@log(noLog=True)
def resetPluginLibrary(pluginId):
    _logger.debug('Resetting library of plugin ' + str(pluginId))
    del pluginLibraries[pluginId]


# FUNCTION: Reset Plugin Logger
@log(noLog=True)
def resetPluginLoggers(pluginId):
    _logger.debug('Resetting loggers of plugin ' + str(pluginId))
    if (hasattr(logging.root.manager, '_dynamicNeatlyLoggerDict')):
        loggerNames = [loggerName for loggerName in logging.root.manager._dynamicNeatlyLoggerDict if loggerName.startswith('neatly-plugin-' + str(pluginId))]
        for loggerName in loggerNames:
            del logging.root.manager._dynamicNeatlyLoggerDict[loggerName]


# FUNCTION: Reset Plugin Imports
def resetPluginImports(pluginId):
    resetPluginLibrary(pluginId)
    resetPluginLoggers(pluginId)


# FUNCTION: Get Plugin Environment
@log()
def getPluginEnv(pluginId, libSpec):

    # Get Plugin Library
    pluginLib = getPluginLibrary(pluginId, libSpec)

    # Set Plugin Library
    if (not pluginLib): pluginLib = setPluginLibrary(pluginId, libSpec)

    # Get/Set Plugin Logger
    logType = libSpec.split('.')[0]
    if (not getPluginLogger(pluginId, logType)): setPluginLogger(pluginId, logType)

    # Return Plugin Library
    return pluginLib


# FUNCTION: Get KeyWord Argument
def getKeyWordArgument(args, item):
    return (args[item] if (item in args) else None)


# FUNCTION: Parse API Path Options
@log(returnValue=(lambda x,y: {x: None for x in x[1]}))
def parseAPIPathOptions(options, types):
    if options:
        parsedOptions = {}
        for type in types:
            if ((type + '=') in options):
                if (type == 'filter'):
                    parsedOptions[type] = options.split(type + '=')[1]
                    parsedOptions[type] = '&'.join([option for option in parsedOptions[type].split('&') if option.startswith('(')])
                else:
                    try:
                        parsedOptions[type] = (int(options.split(type + '=')[1].split('&')[0]) if (types[type] == 'int') else options.split(type + '=')[1].split('&')[0])
                    except:
                        parsedOptions[type] = None
            elif (not types[type]):
                parsedOptions[type] = ((('&' + type + '&') in options) or (options.endswith('&' + type)) or (options.startswith(type + '&')) or (options == type))
            else:
                parsedOptions[type] = None
        return parsedOptions
    else:
        return {x: None for x in types}


# FUNCTION: Sort By
@log()
def sortBy(x, sort):
    result = x
    for sortOption in sort.split('.'):
        result = result[sortOption]
        if (result is None):
            return 'zzzzzzzzzzzzzzzzzzzz'
    return str(result)


# FUNCTION: Sortable Properties
@log(returnValue=[])
def sortableProperties(target, right):
    return getattr(target.properties.sorts.sortable, 'common') + getattr(target.properties.sorts.sortable, right)


# FUNCTION: Filterable Properties
@log(returnValue=[])
def filterableProperties(target, right):
    return getattr(target.properties.filters.filterable, 'common') + getattr(target.properties.filters.filterable, right)


# FUNCTION: Option Allowed
@log(returnValue=(lambda x,y: [False, None, x[0], x[1]]))
def optionAllowed(query, aliases, classObject, path, getRights, propertyFunc):

    # Create Alias Path
    items = path.split('.')
    aliasPath = [None] + ['.'.join(items[0:i+1]) for i in range(0, len(items))]

    # Omit Last Property
    last = False

    # Iterate over Alias Path
    for aliasP in aliasPath:

        # Check if in Property List
        if (aliasP):
            lastProperty = aliasP.split('.')[-1]
            if (lastProperty not in propertyFunc(aliasTarget, aliasRight)): return [False, None, query, aliases]

        # Update Alias - Alias Exists
        if ((not aliasP) or (aliasP in aliases)): alias = getSubAlias(aliases[aliasP])

        # Update Alias - Does Not Exist
        else:

            # Add Alias
            if (lastProperty in aliasTarget().getRelatedProperties()):

                # Create & Update Alias
                [query, aliases] = createAndJoinAliases(query, classObject, aliases, [aliasP])
                alias = getSubAlias(aliases[aliasP])

            # Is Subproperty (Last Only!)
            elif (aliasP == path):
                last = True
                alias = getattr(alias, lastProperty)

            # Unknown Property
            else: return [False, None, query, aliases]

        # Not on Last Iteration
        if (not last):

            # Set Alias Target
            aliasTarget = (alias._aliased_insp._target if hasattr(alias, '_aliased_insp') else alias)

            # Check Rights
            aliasName = aliasTarget.__name__
            if (aliasName in getRights): aliasRight = getRights[aliasName]
            else: return [False, None, query, aliases]

    # Return
    return [True, alias, query, aliases]


# FUNCTION: Add Sort
@log(returnValue=(lambda x,y: [False, x[0], x[1]]))
def addSort(query, aliases, classObject, sort, order, getRights):

    # Sort Defined
    if (sort):

        # Sort Allowed? (Check Rights and Sortable, Create Missing Aliases)
        [status, target, query, aliases] = optionAllowed(query, aliases, classObject, sort, getRights, sortableProperties)
        if (not status): return [False, query, aliases] # noCoverage

        # Sort (Aliased Class)
        if (isinstance(target, orm.util.AliasedClass)):

            # Continue Until Final Target is Found
            while (isinstance(target, orm.util.AliasedClass)):

                # Create New Sort Path
                sort = sort + '.' + target.properties.sorts.default.property

                # Store Previous Target
                prevTarget = target

                # Sort Allowed? (Check Rights and Sortable, Create Missing Aliases)
                [status, target, query, aliases] = optionAllowed(query, aliases, classObject, sort, getRights, sortableProperties)
                if (not status): return [False, query, aliases] # noCoverage

            # Get Order
            if (order in ['asc', 'desc']): sortOrderObject = getattr(target, order)()
            else: sortOrderObject = getattr(target, ('asc' if prevTarget.properties.sorts.default.order else 'desc'))()

        # Sort (InstrumentedAttribute)
        else:

            # Get Order
            if (order in ['asc', 'desc']): sortOrderObject = getattr(target, order)()
            else: sortOrderObject = target.asc()

    # Default Sort
    else:

        # Set Target & Sort
        target = getSubAlias(aliases[None])
        sort = None

        # Continue Until Final Target is Found
        while (isinstance(target, DeclarativeMeta) or isinstance(target, orm.util.AliasedClass)):

            # Create New Sort Path
            sort = ((sort + '.') if sort else '') + target.properties.sorts.default.property

            # Store Previous Target
            prevTarget = target

            # Sort Allowed? (Check Rights and Sortable, Create Missing Aliases)
            [status, target, query, aliases] = optionAllowed(query, aliases, classObject, sort, getRights, sortableProperties)
            if (not status): return [False, query, aliases] # noCoverage

        # Get Order
        if (order in ['asc', 'desc']): sortOrderObject = getattr(target, order)()
        else: sortOrderObject = getattr(target, ('asc' if prevTarget.properties.sorts.default.order else 'desc'))()

    # Add Sort Query
    query = query.order_by(sortOrderObject)

    # Return
    return [True, query, aliases]


# FUNCTION: Split Filter Statement
@log()
def splitFilterStatement(filter):
    if ('!=' in filter): return {'value': filter.split('!='), 'operation': '!='}
    elif ('>=' in filter): return {'value': filter.split('>='), 'operation': '>='}
    elif ('<=' in filter): return {'value': filter.split('<='), 'operation': '<='}
    elif ('!~=' in filter): return {'value': filter.split('!~='), 'operation': '!~='}
    elif ('~=' in filter): return {'value': filter.split('~='), 'operation': '~='}
    elif ('=' in filter): return {'value': filter.split('='), 'operation': '='}
    elif ('>' in filter): return {'value': filter.split('>'), 'operation': '>'}
    elif ('<' in filter): return {'value': filter.split('<'), 'operation': '<'}


# FUNCTION: Create Filter Statement
@log()
def createFilterStatement(property, value, operation):
    if (operation == '!='): return (property != value)
    elif (operation == '>='): return (property >= value)
    elif (operation == '<='): return (property <= value)
    elif (operation == '!~='): return not_(property.contains(value))
    elif (operation == '~='): return property.contains(value)
    elif (operation == '='): return (property == value)
    elif (operation == '>'): return (property > value)
    elif (operation == '<'): return (property < value)


# FUNCTION: Create Filter
@log()
def createFilter(target, filter):

    # Filter (Aliased Class) -> Not Implemented Yet
    if (isinstance(target, orm.util.AliasedClass)): return None

    # Filter (InstrumentedAttribute)
    else: return createFilterStatement(target, filter['value'][1], filter['operation'])


@log(returnValue=(lambda x,y: [False, None, x[0], x[1]]))
def iterateFilters(query, aliases, classObject, filter, getRights):

    # Simple Statement
    if (isinstance(filter, str)):

        # Split Filter
        splittedFilter = splitFilterStatement(filter)

        # Same Type?
        if (len(splittedFilter['value']) != 2): return [False, None, query, aliases] # noCoverage
        splittedFilter['value'][1] = filters.convertValue(splittedFilter['value'][1])

        # Filter Allowed? (Check Rights and Filterable, Create Missing Aliases)
        [status, target, query, aliases] = optionAllowed(query, aliases, classObject, splittedFilter['value'][0], getRights, filterableProperties)
        if (not status): return [False, None, query, aliases] # noCoverage

        # Return Statement
        createdFilter = createFilter(target, splittedFilter)
        if (createdFilter is None): return [False, None, query, aliases]
        else: return [True, createdFilter, query, aliases]

    # Complex Statement
    else:

        # Return & Split in Parts
        filterResult = [iterateFilters(query, aliases, classObject, subFilter, getRights) for subFilter in filter['value']]

        # Check Return Code
        status = all([f[0] for f in filterResult])

        # Return Filter
        if (status): return [True, filter['operation'](*[f[1] for f in filterResult]), query, aliases]
        else: return [False, None, query, aliases]


# FUNCTION: Add Filter
@log(returnValue=(lambda x,y: [False, x[0], x[1]]))
def addFilter(query, aliases, classObject, filter, getRights):

    # Split Filter
    filter = filters.createOperations(filters.splitInOperations(filter))
    filter = filters.iterateOperations(filter)

    # Add Filter Query
    [status, filter, query, aliases] = iterateFilters(query, aliases, classObject, filter, getRights)
    if (status): query = query.filter(filter)

    # Return
    return [status, query, aliases]


# FUNCTION: Start Flask Application
@log()
def startApp():
    flaskReady()
    app.run(host='0.0.0.0', port=apiPort, debug=apiConfig['debug'], use_reloader=False)


# FUNCTION: Launch
@log()
def launch():

    # Start API
    startApp()

    # Log Message
    _logger.warning('API process stopped') # noCoverage


# FUNCTION: Switch API Protocol
@log()
def switchAPIProtocol(protocol):

    # Log Message & Register
    _logger.debug('Switching API to protocol: ' + protocol)
    actions.manualRegisterAction({'user': g.user, 'source': 'API', 'description': 'Switch API protocol'}, db.session, {}, 'switch-api-protocol', meta={'protocol': protocol})

    # Update Config
    updateAPIProtocol(protocol)
    actions.syncAPIConfiguration()
    actions.syncGUIConfiguration()
    actions.calculateConfigHashes()

    # Load API, GUI Config
    loadAPIConfig()
    loadGUIConfig()

    # Update Web Server Config
    updateWebServer(basePath, apiPort, apiProtocol, apiSSLCertificate, apiSSLKey, guiProtocol)


# FUNCTION: Switch GUI Protocol
@log()
def switchGUIProtocol(protocol):

    # Log Message & Register
    _logger.debug('Switching GUI to protocol: ' + protocol)
    actions.manualRegisterAction({'user': g.user, 'source': 'API', 'description': 'Switch GUI protocol'}, db.session, {}, 'switch-gui-protocol', meta={'protocol': protocol})

    # Update Config
    updateGUIProtocol(protocol)
    actions.syncAPIConfiguration()
    actions.syncGUIConfiguration()
    actions.calculateConfigHashes()

    # Load API, GUI Config
    loadAPIConfig()
    loadGUIConfig()

    # Update Web Server Config
    updateWebServer(basePath, apiPort, apiProtocol, apiSSLCertificate, apiSSLKey, guiProtocol)


# FUNCTION: Get Size of Response
def getResponseSize(response):
    try:
        return response.headers['Content-Length']
    except:
        return 0


# FUNCTION: Get Info of API Call
@log(returnValue='Something went wrong while gathering API call info')
def apiCallInfo(request, response, g):
    sep = ' - '
    return 'API' + sep + (g.user.userName.upper() if hasattr(g, 'user') else 'N/A') + sep + str(request.environ['REMOTE_ADDR']) + sep + str(request.environ['REQUEST_METHOD']) + sep + str(request.environ['REQUEST_URI']) + sep + str(response._status_code) + sep + str(int((timeLib.time()-g.start)*1000)) + 'ms' + sep + str(getResponseSize(response)) + 'B'


# FUNCTION: Measure API Response Calculation Time
@app.before_request
def beforeRequest():
    g.start = timeLib.time()


# FUNCTION: Log API Call
@app.after_request
@log(name='api')
def afterRequest(response):
    _logger.info(apiCallInfo(request, response, g))
    if (hasattr(g, 'session')):
        g.session.lastActive = datetime.now().replace(tzinfo=timezone.utc)
        try:
            db.session.commit()
        except:
            pass
    return response


# FUNCTION: Basic Auth Validation (User/Pass)
@basicAuth.verify_password
@log(returnValue=False)
def basicAuthVerifyPassword(userName, password):
    user = db.session.query(tables.User).filter_by(userName=userName).first()
    if user:
        g.user = user

        # Get Plugin
        plugin = user.authenticationMethod.plugin

        # Default Authentication
        if (plugin is None):
            return (False if (not g.user.password) else check_password_hash(g.user.password, password))

        # Plugin Authentication
        else:
            libSpec = 'auth.lib'
            pluginLib = getPluginEnv(plugin.id, libSpec)
            if (pluginLib):
                loggerName = ('plugin-' + str(plugin.id) + '-' + libSpec.split('.')[0])
                execParams = {'user': g.user, 'plugin': plugin, 'source': 'API', 'description': 'Login'}
                return log(returnValue=False, name=loggerName)(pluginLib.authenticate)(execParams=execParams, plugin=plugin, user=user, password=password)
            return False

    else:
        return False


# FUNCTION: Token Auth Validation
@tokenAuth.verify_token
@log(returnValue=False)
def tokenAuthVerifyToken(token):
    session = db.session.query(tables.ActiveSession).filter_by(token=token, expired=False).first()
    if session:
        g.user = session.user
        g.session = session
        g.rights = actions.getOwnRights(db.session, session.user)
        return True
    else:
        return False


# CALL: Basic Auth Success Result
@app.route(basePath + 'login', methods=['GET'])
@basicAuth.login_required
@log(returnValue=('', 409))
def basicAuthSuccess():
    newToken = uniqueGenerator()
    g.user.activeSession.append(tables.ActiveSession(token=newToken, ip=request.remote_addr, client=(request.headers['User-Agent'] if ('User-Agent' in request.headers) else None), user=g.user))
    execParams = {'user': g.user, 'source': 'API', 'description': 'Login'}
    if (actions.merge(execParams, db.session, g.user)):
        return jsonify({'authentication': True, 'token': newToken, 'expiryDate': apiSessionConfig['expiration']})
    else:
        return jsonify({'authentication': False}) # noCoverage


# CALL: Basic Auth Error Message
@basicAuth.error_handler
def basicAuthError():
    return jsonify({'authentication': False})


# CALL: Token Auth Success Result
@app.route(basePath + 'token', methods=['GET'])
@tokenAuth.login_required
@log(returnValue=('', 409))
def tokenAuthSuccess():
    return jsonify({'authentication': True, **serializeObject(g.user)})

# CALL: Token Auth Error Message
@tokenAuth.error_handler
def tokenAuthError():
    return jsonify({'authentication': False})


# PUT: Expire Active Session
@app.route(basePath + 'activesession/expire', methods=['PUT'])
@tokenAuth.login_required
@log(returnValue=('', 409))
def putExpireActiveSession():
    g.session.expired = True
    actions.merge({'user': g.user, 'source': 'API', 'description': 'Expire active session'}, db.session, g.session)
    return ('', 200)


# GET: Own Rights
@app.route(basePath + 'right/list&self', methods=['GET'])
@tokenAuth.login_required
@log(returnValue=('', 409))
def getOwnRightsList():
    return jsonify(actions.getOwnRights(db.session, g.user))


# GET: Own Plugin Action Rights
@app.route(basePath + 'pluginactionright/list&self', methods=['GET'])
@tokenAuth.login_required
@log(returnValue=('', 409))
def getOwnPluginActionRightsList():
    return jsonify(actions.getOwnPluginActionRights(db.session, g.user))


# GET: Own Plugin Option Rights
@app.route(basePath + 'pluginoptionright/list&self', methods=['GET'])
@tokenAuth.login_required
@log(returnValue=('', 409))
def getOwnPluginOptionRightsList():
    return jsonify(actions.getOwnPluginOptionRights(db.session, g.user))


# GET: Active Plugin List
@app.route(basePath + 'plugin/list/active', methods=['GET'])
@app.cache.cached(timeout=0, key_prefix='getActivePlugins')
@log(returnValue=('', 409))
def getActivePluginList():
    return jsonify(actions.getActivePlugins(db.session))


# GET: Item by Id
@app.route(basePath + '<path:path>/id/<int:id>', methods=['GET'])
@app.route(basePath + '<path:path>/id/<int:id>&<string:options>', methods=['GET'])
@tokenAuth.login_required
@log(returnValue=('', 409))
@APIArgProvider(apiAction='Get', attrs=['path', 'id'])
def getItemById(classObject, rights, attrs, options, hasClassOptions):

    # Begin Query
    query = db.session.query(classObject).filter_by(id=attrs['id'])

    # Add Basic Joins
    [query, aliases] = createAndJoinAliases(query, classObject, {}, classObject.properties.joins)

    # Filter On Rights
    [query, aliases] = filters.filterByRights(query, classObject, determinePassedRights(rights), g.user, aliases=aliases)

    # Get Result
    item = query.first()

    # Return Result
    if item:

        # Has Class Options & Option Handler
        if (hasClassOptions and classObject.option['handler']):
            result = classObject.option['handler'](options, item)
            if (result is not None):
                if isinstance(result, Response): return result
                else: return jsonify(result)

        # No Class Options
        return jsonify(serializeObject(item))

    # No Result
    else: return ('', 404) # noCoverage


# GET: Item List
@app.route(basePath + '<path:path>/list', methods=['GET'])
@app.route(basePath + '<path:path>/list&<string:options>', methods=['GET'])
@tokenAuth.login_required
@log(returnValue=('', 409))
@APIArgProvider(apiAction='Get', attrs=['path'], options={'level': 'str', 'filter': 'str', 'perPage': 'int', 'page': 'int', 'sort': 'str', 'order': 'str', 'count': None})
def getItemList(classObject, rights, attrs, options, hasClassOptions):

    # Get Main Options
    perPage = options['perPage']
    page = options['page']

    # Page Return Approach
    pageReturn = (perPage and page)

    # Check Required Page Return Options
    if (pageReturn and (page < 1)): return ('', 400) # noCoverage

    # Begin Query
    query = db.session.query(classObject)

    # Add Basic Joins
    [query, aliases] = createAndJoinAliases(query, classObject, {}, classObject.properties.joins)

    # Filter On Rights
    [query, aliases] = filters.filterByRights(query, classObject, determinePassedRights(rights, specificRight=options['level']), g.user, aliases=aliases)

    # Determine Get Rights
    getRights = {right['apiObject']['name']: right['right'] for right in g.rights if (right['apiAction']['name'] == 'Get')}

    # Filter
    if (options['filter']):
        [status, query, aliases] = addFilter(query, aliases, classObject, options['filter'], getRights)
        if (not status): return ('', 400) # noCoverage

    # Get Count
    count = getCount(query)

    # Return Count
    if (options['count']): jsonify(count)

    # Sort
    [status, query, aliases] = addSort(query, aliases, classObject, options['sort'], options['order'], getRights)
    if (not status): return ('', 400) # noCoverage

    # Page Return
    if (pageReturn):

        # Check PerPage Limit
        if (perPage > apiConfig['maxPerPage']): perPage = apiConfig['maxPerPage']

        # Determine Maximum Nr of Pages
        maxPage = int((count-0.5)/perPage) + 1

        # Valid Page?
        if (page > maxPage): return ('', 404) # noCoverage

        # Add Offset
        if (page > 1): query = query.offset((page - 1) * perPage)

        # Add Limit
        query = query.limit(perPage)

        # Get Result
        result = query.all()

        # Has Class Options & Option Handler
        if (result and hasClassOptions and classObject.option['handler']):
            modResult = classObject.option['handler'](options, result)
            result = (serializeList(result) if (modResult is None) else modResult)

        # Has No Class Options or Option Handler
        else: result = serializeList(result)

        # Return Result
        return jsonify({'page': page, 'maxPage': maxPage, 'perPage': perPage, 'total': len(result), 'exist': count, 'content': result})

    # Regular Return
    else:

        # Get Result
        result = query.all()

        # Has Class Options & Option Handler
        if (result and hasClassOptions and classObject.option['handler']):
            modResult = classObject.option['handler'](options, result)
            result = (serializeList(result) if (modResult is None) else modResult)

        # Has No Class Options or Option Handler
        else: result = serializeList(result)

        # Return Result
        return jsonify(result)


# POST: Item (CREATE)
@app.route(basePath + '<path:path>/create', methods=['POST'])
@tokenAuth.login_required
@log(returnValue=('', 409))
@APIArgProvider(apiAction='Create', attrs=['path'])
def createItem(classObject, rights, attrs, options):
    if not actions.checkLimitations(db.session, classObject, determinePassedRights(rights), 'Create', orjson.loads(request.data)):
        return ('', 404) # noCoverage
    data = validate.validateObject(db.session, classObject, objectify(orjson.loads(request.data)), ['id'])
    if not data:
        return ('', 403) # noCoverage
    # TODO: Fix ComplyRights
    data = actions.complyRights(db.session, classObject, data, rights, g.user)
    if data:
        if ((classObject is tables.User) and hasattr(data, 'password')):
            data.password = generate_password_hash(data.password)
        execParams = {'user': g.user, 'source': 'API', 'description': 'Create'}
        result = actions.createByDict(execParams, db.session, classObject, **vars(data))
        return (('', 201) if result else ('', 409))
    else:
        return ('', 403) # noCoverage


# PUT: Item (DELETE)
@app.route(basePath + '<path:path>/delete/<int:id>', methods=['PUT'])
@tokenAuth.login_required
@log(returnValue=('', 409))
@APIArgProvider(apiAction='Delete', attrs=['path', 'id'])
def deleteItem(classObject, rights, attrs, options):

    # Verify Id
    if not validate.verifyId(db.session, classObject, attrs['id']): return ('', 404) # noCoverage

    # Verify Rights
    [query, aliases] = filters.filterByRights(db.session.query(classObject).filter_by(id=attrs['id']), classObject, determinePassedRights(rights), g.user)
    if not query.first(): return ('', 404) # noCoverage

    # Define Exec Parameters
    execParams = {'user': g.user, 'source': 'API', 'description': 'Delete'}

    # Delete Item
    if actions.deleteById(execParams, db.session, classObject, attrs['id']): return ('', 200)
    else: return ('', 404) # noCoverage


# POST: Item (EDIT)
@app.route(basePath + '<path:path>/edit/<int:id>', methods=['POST'])
@app.route(basePath + '<path:path>/edit/<int:id>&<string:options>', methods=['POST'])
@tokenAuth.login_required
@log(returnValue=('', 409))
@APIArgProvider(apiAction='Edit', attrs=['path', 'id'])
def editItem(classObject, rights, attrs, options):

    # Verify Id
    if not validate.verifyId(db.session, classObject, attrs['id']): return ('', 404) # noCoverage

    # Verify Rights
    [query, aliases] = filters.filterByRights(db.session.query(classObject).filter_by(id=attrs['id']), classObject, determinePassedRights(rights), g.user)
    if not query.first():
        return ('', 404) # noCoverage

    # Verify Limitations
    if not actions.checkLimitations(db.session, classObject, determinePassedRights(rights), 'Edit', orjson.loads(request.data)): return ('', 404) # noCoverage

    # Validate Editability
    data = validate.validateEditability(db.session, classObject, objectify(orjson.loads(request.data)))

    # Valid
    if data:

        # Plugin Transition
        if (classObject is tables.Plugin) and operator.xor(hasattr(data, 'activated'), hasattr(data, 'installed')):

            # Get User ID
            userId = deepcopy(g.user.id)

            # Install Plugin
            if hasattr(data, 'installed') and data.installed:

                # Install
                installation = plugins.installPlugin(userId, db.session, attrs['id'])

                # Success
                if (installation): initDB()

                # Failed
                else: return ('', 409) # noCoverage

            # Uninstall Plugin
            if hasattr(data, 'installed') and not data.installed:
                plugins.uninstallPlugin(userId, db.session, attrs['id'])

            # Activate Plugin
            if hasattr(data, 'activated') and data.activated:
                plugins.activatePlugin(userId, db.session, attrs['id'])

            # Deactivate Plugin
            if hasattr(data, 'activated') and not data.activated:

                # Deactivate
                plugins.deactivatePlugin(userId, db.session, attrs['id'])

                # Reset Plugin Imports
                resetPluginImports(attrs['id'])

            # Reload Major Libraries
            reload(tables)
            reload(validate)
            reload(actions)
            reload(plugins)
            _logger.info('Reloaded major libraries')

            # Reinitialise DB Connection
            initDB()

            # Update Plugin Status
            plugin = db.session.query(tables.Plugin).filter_by(id=attrs['id']).first()
            if hasattr(data, 'installed'): plugin.installed = data.installed
            if hasattr(data, 'activated'): plugin.activated = data.activated
            plugins.updatePluginStatus(userId, db.session, plugin, None, 0)

            # Sync Configurations
            actions.syncAllConfigurations()

            # Update Logging Config
            loadLoggingConfig()

        # User Object w/ Password
        elif (classObject is tables.User) and hasattr(data, 'password'):
            data.password = generate_password_hash(data.password)
            execParams = {'user': g.user, 'source': 'API', 'description': 'Edit'}
            actions.edit(execParams, db.session, classObject, attrs['id'], **vars(data))

        # Regular Object
        else:
            execParams = {'user': g.user, 'source': 'API', 'description': 'Edit'}
            actions.edit(execParams, db.session, classObject, attrs['id'], **vars(data))

        # Return Success
        return ('', 200)

    # Invalid
    else:
        return ('', 404) # noCoverage


# GET/POST/PUT: Plugin Action
# TODO: Rights! (Removed gui.json code, unsafe)
@app.route(basePath + 'plugin/<string:id>/action/<string:action>', methods=['GET', 'POST', 'PUT'])
@determineTokenAuthenticated(tokenAuth)
@log(returnValue=('', 409))
@PluginActionArgProvider
@fetchPluginActionRights
def pluginAction(plugin, actionName, authenticated, rights):
    libSpec = 'api.lib'
    pluginLib = getPluginEnv(plugin.id, libSpec)
    if (pluginLib):
        loggerName = ('plugin-' + str(plugin.id) + '-' + libSpec.split('.')[0])
        execParams = ({'user': g.user, 'plugin': plugin, 'source': 'API', 'description': 'Plugin action'} if (authenticated) else {'plugin': plugin, 'source': 'API', 'description': 'Plugin action'})
        return log(returnValue=('', 409), name=loggerName)(pluginLib.handleAPIRequest)(authenticated=authenticated, request=request, actionName=actionName, execParams=execParams, session=db.session, plugin=plugin, rights=rights)
    return ('', 404)


# POST: File Upload
@app.route(basePath + 'file/upload', methods=['POST'])
@tokenAuth.login_required
@log(returnValue=('', 409))
@hasRights(apiObject='File', apiAction='Create', level=None)
@fileUpload([{'name': 'file', 'secure': True}])
def postUploadFile(**params):
    fileReference = uniqueFileReference()
    _logger.info('Uploading new file "' + params['files']['file']['fileName'] + '" with reference: ' + fileReference)
    params['files']['file']['file'].save(sys.sharedConfig.location['lib'] + 'objects' + '/' + fileReference)
    actions.manualRegisterAction({'user': g.user, 'source': 'API', 'description': 'Upload file'}, db.session, {}, 'upload-file', meta={'file': {'name': params['files']['file']['fileName'], 'reference': fileReference}})
    creationData = {'name': params['files']['file']['fileName'], 'reference': fileReference, 'creation': None, 'size': getFileSize(ref=fileReference)}
    return jsonify(creationData)


# GET: Plugin Option (GET)
@app.route(basePath + 'plugin/<string:id>/group/<string:group>/option/<string:option>', methods=['GET'])
@tokenAuth.login_required
@log(returnValue=('', 409))
@PluginOptionArgProvider
@fetchPluginOptionRights(apiAction='Get')
def getPluginOption(plugin, group, option):
    pluginOption = db.session.query(tables.PluginOption).filter_by(plugin=plugin, group=group, option=option).first()
    return (jsonify(pluginOption.value) if (pluginOption) else ('', 404))


# POST: Plugin Option (EDIT)
@app.route(basePath + 'plugin/<string:id>/group/<string:group>/option/<string:option>', methods=['POST'])
@tokenAuth.login_required
@log(returnValue=('', 409))
@PluginOptionArgProvider
@fetchPluginOptionRights(apiAction='Edit')
def setPluginOption(plugin, group, option):
    pluginOption = db.session.query(tables.PluginOption).filter_by(plugin=plugin, group=group, option=option).first()
    execParams = {'user': g.user, 'source': 'API', 'description': 'Edit'}
    return (('', 200) if (plugins.setOption(execParams, db.session, pluginOption)) else ('', 403))


# GET: Plugin Options (GET)
@app.route(basePath + 'plugin/<string:id>/options', methods=['GET'])
@tokenAuth.login_required
@log(returnValue=('', 409))
@PluginOptionsArgProvider
@fetchPluginOptionsRights(apiAction='Get')
def getPluginOptions(plugin, allowedOptions):
    return jsonify(plugins.getOptionDict(db.session, plugin, allowedOptions))


# GET: Plugin Options (EDIT)
@app.route(basePath + 'plugin/<string:id>/options', methods=['POST'])
@tokenAuth.login_required
@log(returnValue=('', 409))
@PluginOptionsArgProvider
@fetchPluginOptionsRights(apiAction='Edit')
def setPluginOptions(plugin, allowedOptions):
    execParams = {'user': g.user, 'source': 'API', 'description': 'Edit'}
    return (('', 200) if (plugins.setOptionDict(execParams, db.session, plugin, allowedOptions)) else ('', 403))


# POST: Plugin Upload
@app.route(basePath + 'plugin/upload', methods=['POST'])
@tokenAuth.login_required
@log(returnValue=('', 409))
@hasRights(apiObject='Plugin', apiAction='Create')
@fileUpload([{'name': 'plugin', 'secure': True, 'extension': ['.tar.gz']}])
def postPluginUpload(**params):

    # Create Storage Directory
    createDirPath(sys.sharedConfig.location['files'] + 'plugin-packages/uploads/')
    createDirPath(sys.sharedConfig.location['files'] + 'plugin-packages/contents/')

    # Upload File
    fileReference = uniqueFileReference(sys.sharedConfig.location['files'] + 'plugin-packages/uploads/')
    tmpFilePath = sys.sharedConfig.location['files'] + 'plugin-packages/uploads/' + fileReference
    uploadDir = sys.sharedConfig.location['files'] + 'plugin-packages/uploads/'
    _logger.info('Uploading new plugin package: ' + params['files']['plugin']['fileName'] + ' as file ID ' + fileReference)
    params['files']['plugin']['file'].save(tmpFilePath)
    actions.manualRegisterAction({'user': g.user, 'source': 'API', 'description': 'Upload plugin package'}, db.session, {}, 'upload-plugin-package', meta={'file': {'name': params['files']['plugin']['fileName']}})

    # Check if File Doesn't Exist
    if (not os.path.isfile(tmpFilePath)): return ('', 400) # noCoverage

    # Create Storage Directory
    dirReference = uniqueDirReference(sys.sharedConfig.location['files'] + 'plugin-packages/contents/')
    extractPath = sys.sharedConfig.location['files'] + 'plugin-packages/contents/' + dirReference + '/'
    createDirPath(extractPath)

    # Unpack Compressed File
    tar = tarOpen(tmpFilePath, 'r:gz')
    tar.extractall(path=extractPath)
    tar.close()

    # Read Package Info
    packageFile = extractPath + 'package.json'
    if (not os.path.isfile(packageFile)): return ('', 400) # noCoverage
    packageInfo = readJSONFile(packageFile)

    # Remove Storage Directory
    removeDir(extractPath)

    # Check if already existing
    matchingPlugins = db.session.query(tables.Plugin).filter(or_(tables.Plugin.id == packageInfo['id'], tables.Plugin.shortName == packageInfo['shortName'])).all()

    # Define Exec Parameters
    execParams = {'user': g.user, 'source': 'API', 'description': 'Update plugin package'}

    # Plugin Exists Already
    if (matchingPlugins):

        # Not Installed
        if (not any([plugin.installed for plugin in matchingPlugins])):

            # Remove Existing Plugins
            for plugin in matchingPlugins:

                # Remove Plugin
                if (not actions.deleteById(execParams, db.session, tables.Plugin, plugin.id)): return ('', 400 ) # noCoverage

            # Verify Dependencies
            if (packageInfo['required']):
                dependencies = [db.session.query(tables.Plugin).filter_by(id=req).first() for req in packageInfo['required']]
                if (not all(dependencies)): return ('', 400) # noCoverage
            else:
                dependencies = []

            # Add New Plugin
            noReqPackageInfo = deepcopy(packageInfo)
            noReqPackageInfo.update({'required': []})
            actions.createByDict(execParams, db.session, tables.Plugin, **noReqPackageInfo, forceId=True)

            # Add Plugin Dependencies
            plugin = db.session.query(tables.Plugin).filter_by(id=packageInfo['id']).first()
            if plugin:
                plugin.required = dependencies
                actions.merge(execParams, db.session, plugin)

        # Installed
        else: return ('', 400) # noCoverage

    # Add New Plugin
    else:

        # Verify Dependencies
        if (packageInfo['required']):
            dependencies = [db.session.query(tables.Plugin).filter_by(id=req).first() for req in packageInfo['required']]
            if (not all(dependencies)): return ('', 400) # noCoverage
        else:
            dependencies = []

        # Add New Plugin
        noReqPackageInfo = deepcopy(packageInfo)
        noReqPackageInfo.update({'required': []})
        actions.createByDict(execParams, db.session, tables.Plugin, **noReqPackageInfo, forceId=True)

        # ADD: Plugin Dependencies
        plugin = db.session.query(tables.Plugin).filter_by(id=packageInfo['id']).first()
        if plugin:
            plugin.required = dependencies
            actions.merge(execParams, db.session, plugin)

    # Change File Name
    filePath = uploadDir + str(packageInfo['shortName']) + '-' + str(packageInfo['version']) + '.tar.gz'
    os.rename(tmpFilePath, filePath)

    # Return Response
    return ('', 200)


# GET: License Info
@app.route(basePath + 'license/info', methods=['GET'])
@tokenAuth.login_required
@app.cache.cached(timeout=0, key_prefix='getLicense')
@log(returnValue=('', 409))
def getLicenseInfo():
    if (licensed): return jsonify(licensed)
    else: return ('', 404) # noCoverage


# GET: SSL Info
@app.route(basePath + 'ssl/info', methods=['GET'])
@tokenAuth.login_required
@hasRights()
@app.cache.cached(timeout=0, key_prefix='getSSL')
@log(returnValue=('', 409))
def getSSLInfo():
    if (current_app.ssl): return jsonify(current_app.ssl)
    else: return ('', 404) # noCoverage


# POST: SSL Upload
@app.route(basePath + 'ssl/upload', methods=['POST'])
@tokenAuth.login_required
@log(returnValue=('', 409))
@hasRights()
@fileUpload([{'name': 'certificate', 'secure': True, 'extension': ['.crt']}, {'name': 'key', 'secure': True, 'extension': ['.key']}])
def postSSLUpload(**params):

    # Create SSL Storage Path
    createDirPath('/etc/neatly/base/ssl')

    # Certificate
    if ('certificate' in params['files']):
        _logger.info('Uploading new certificate: ' + params['files']['certificate']['fileName'])
        params['files']['certificate']['file'].save('/etc/neatly/base/ssl/' + params['files']['certificate']['fileName'])
        actions.manualRegisterAction({'user': g.user, 'source': 'API', 'description': 'Upload SSL certificate'}, db.session, {}, 'upload-ssl-certificate', meta={'file': {'name': params['files']['certificate']['fileName']}})
        updateSSLConfig('certificate', params['files']['certificate']['fileName'])

    # Key
    if ('key' in params['files']):
        _logger.info('Uploading new key: ' + params['files']['key']['fileName'])
        params['files']['key']['file'].save('/etc/neatly/base/ssl/' + params['files']['key']['fileName'])
        actions.manualRegisterAction({'user': g.user, 'source': 'API', 'description': 'Upload SSL key'}, db.session, {}, 'upload-ssl-key', meta={'file': {'name': params['files']['key']['fileName']}})
        updateSSLConfig('key', params['files']['key']['fileName'])

    # Update Config
    actions.syncAPIConfiguration()

    # Load API, GUI Config
    loadAPIConfig()
    loadGUIConfig()

    # Update Web Server Config
    if ((apiProtocol.lower() == 'https') or (guiProtocol.lower() == 'https')):
        updateWebServer(basePath, apiPort, apiProtocol, apiSSLCertificate, apiSSLKey, guiProtocol)

    # Reload SSL Config
    current_app.ssl = readSSL(apiConfig)
    current_app.cache.delete('getSSL')

    # Return Response
    return ('', 200)


# POST: API Protocol Switch
@app.route(basePath + 'protocol/api/switch', methods=['POST'])
@tokenAuth.login_required
@log(returnValue=('', 409))
@hasRights()
def postAPIProtocolSwitch():
    data = orjson.loads(request.data)
    if (('protocol' in data) and (data['protocol'].lower() in ['http', 'https'])):
        if (apiProtocol.lower() == data['protocol'].lower()):
            _logger.debug('Switch to already active protocol (' + apiProtocol.upper() + '), no action required')
            return ('', 200)
        elif (data['protocol'].lower() == 'http'):
            _logger.debug('Switch to different protocol (' + data['protocol'].lower() + ')')
            switchAPIProtocol(data['protocol'].lower())
            return ('', 200)
        _logger.debug('Switch to different protocol (' + data['protocol'].lower() + ')')
        if (hasValidSSL(current_app.ssl)):
            switchAPIProtocol(data['protocol'].lower())
            return ('', 200)
        return ('', 400) # noCoverage
    _logger.warning('No protocol or invalid protocol defined') # noCoverage
    return ('', 400) # noCoverage


# POST: GUI Protocol Switch
@app.route(basePath + 'protocol/gui/switch', methods=['POST'])
@tokenAuth.login_required
@log(returnValue=('', 409))
@hasRights()
def postGUIProtocolSwitch():
    data = orjson.loads(request.data)
    if (('protocol' in data) and (data['protocol'].lower() in ['http', 'https'])):
        if (guiProtocol.lower() == data['protocol'].lower()):
            _logger.debug('Switch to already active protocol (' + guiProtocol.upper() + '), no action required')
            return ('', 200)
        elif (data['protocol'].lower() == 'http'):
            _logger.debug('Switch to different protocol (' + data['protocol'].lower() + ')')
            switchGUIProtocol(data['protocol'].lower())
            return ('', 200)
        _logger.debug('Switch to different protocol (' + data['protocol'].lower() + ')')
        if (hasValidSSL(current_app.ssl)):
            switchGUIProtocol(data['protocol'].lower())
            return ('', 200)
        return ('', 400) # noCoverage
    _logger.warning('No protocol or invalid protocol defined') # noCoverage
    return ('', 400) # noCoverage


# GET: Enabled Translations
@app.route(basePath + 'translation/available', methods=['GET'])
@app.cache.cached(timeout=0, key_prefix='getAvailableTranslations')
@log(returnValue=('', 409))
def getEnabledTranslations():
    return jsonify(serializeList(db.session.query(tables.Translation).filter_by(enabled=True).all(), user=None, rights=generateGetAllRights(['Translation'])))


# GET: Uptime
@app.route(basePath + 'uptime', methods=['GET'])
@log(returnValue=('', 409))
def getUptime():
    return jsonify({'uptime': str(datetime.now()-serviceStart)})


# GET: Version (All)
@app.route(basePath + 'version/all', methods=['GET'])
@app.cache.cached(timeout=0, key_prefix='getVersionAll')
@log(returnValue=('', 409))
def getVersionAll():
    return jsonify({'api': str(apiVersion), 'gui': str(guiVersion), 'db': str(dbVersion), 'webserver': str(webServerVersion), 'messaging': str(messagingVersion), 'python': str(pythonVersion)})


# GET: API Version
@app.route(basePath + 'version/api', methods=['GET'])
@app.cache.cached(timeout=0, key_prefix='getAPIVersion')
@log(returnValue=('', 409))
def getAPIVersion():
    return jsonify({'version': str(apiVersion)})


# GET: GUI Version
@app.route(basePath + 'version/gui', methods=['GET'])
@app.cache.cached(timeout=0, key_prefix='getGUIVersion')
@log(returnValue=('', 409))
def getGUIVersion():
    return jsonify({'version': str(guiVersion)})


# GET: DB Version
@app.route(basePath + 'version/db', methods=['GET'])
@app.cache.cached(timeout=0, key_prefix='getDBVersion')
@log(returnValue=('', 409))
def getDBVersion():
    return jsonify({'version': str(dbVersion)})


# GET: Web Server Version
@app.route(basePath + 'version/webserver', methods=['GET'])
@app.cache.cached(timeout=0, key_prefix='getWebServerVersion')
@log(returnValue=('', 409))
def getWebServerVersion():
    return jsonify({'version': str(webServerVersion)})


# GET: Messaging Bus Version
@app.route(basePath + 'version/messaging', methods=['GET'])
@app.cache.cached(timeout=0, key_prefix='getMessagingVersion')
@log(returnValue=('', 409))
def getMessagingVersion():
    return jsonify({'version': str(messagingVersion)})


# GET: Python Version
@app.route(basePath + 'version/python', methods=['GET'])
@app.cache.cached(timeout=0, key_prefix='getPythonVersion')
@log(returnValue=('', 409))
def getPythonVersion():
    return jsonify({'version': str(pythonVersion)})


# GET: Health
@app.route(basePath + 'health', methods=['GET'])
@log(returnValue=('', 409))
def getHealth():
    return jsonify({'memory': Process(os.getpid()).memory_info().rss, 'cpuPercent': Process(os.getpid()).cpu_percent()})


# POST: Shutdown (Testing Only)
@app.route(basePath + 'shutdown', methods=['POST'])
@log(returnValue=('', 409))
def postShutdown():
    if (sys.sharedConfig.envConfig):
        if (isDevelopmentServer()):
            actions.manualRegisterAction({'source': 'API', 'description': 'Shutdown'}, db.session, {}, 'shutdown', meta={})
            shutdownDevelopmentServer()
            return ('', 200)
    return ('', 404) # noCoverage


# START: Flask Application
if __name__ == '__main__':
    launch()
