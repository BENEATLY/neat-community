################################################################################
# Author:     Thomas D'haenens
# License:    GPL-3.0
# Link:       https://github.com/BENEATLY/neat-community/
# Contact:    https://neatly.be/
################################################################################


# IMPORT: Standard Modules
from urllib.request import urlretrieve                                                      # URL Retrieve Function
from tarfile import open as tarOpen                                                         # Tar Extract Function

# IMPORT: Custom Modules
from basic import *                                                                         # Basic Lib
import actions                                                                              # Actions Lib
import tables                                                                               # Tables Lib
import services                                                                             # Services Lib


# FUNCTION: Download Plugin
@log(returnValue=False)
def downloadPlugin(plugin, path):
    _logger.info('Downloading plugin')
    url = (plugin.url if plugin.url.endswith('/') else plugin.url + '/') + str(plugin.shortName) + '-' + str(plugin.version) + '.tar.gz'
    urlretrieve(url, path + 'plugin.tar.gz')
    _logger.info('Extracting plugin')
    tar = tarOpen(path + 'plugin.tar.gz', 'r:gz')
    tar.extractall(path=path)
    tar.close()
    _logger.info('Remove compressed file')
    removeFile(path + 'plugin.tar.gz')
    return True


# FUNCTION: Update Plugin Status
@log()
def updatePluginStatus(userId, session, plugin, transition, progress):
    user = session.query(tables.User).filter_by(id=userId).first()
    execParams = {'user': user, 'source': 'API', 'description': 'Plugin transition'}
    plugin.transition = transition
    plugin.progress = progress
    actions.merge(execParams, session, plugin)


# FUNCTION: Install Plugin
@log()
def installPlugin(userId, session, id):
    try:

        # Message
        _logger.info('Installing plugin ' + str(id))

        # Transition Direction
        transitionDirection = True

        # Determine Plugin
        plugin = session.query(tables.Plugin).filter_by(id=id).first()

        # Set Transition State & Progress
        updatePluginStatus(userId, session, plugin, transitionDirection, 11)

        # Create Folders
        _logger.info('Creating plugin folder for plugin ' + str(id))
        createDir(sys.sharedConfig.location['lib'] + 'plugin')
        createDir(sys.sharedConfig.location['lib'] + 'plugin/' + str(id))

        # Set Workspace
        workspace = sys.sharedConfig.location['lib'] + 'plugin/' + str(id) + '/'

        # Download Plugin
        if (plugin.url is not None):
            _logger.info('Downloading plugin ' + str(id) + ' from: ' + str(plugin.url))
            downloaded = downloadPlugin(plugin, workspace)
            if (not downloaded):
                _logger.warning('Unable to download plugin ' + str(id) + ' from: ' + str(plugin.url)) # noCoverage
                updatePluginStatus(userId, session, plugin, None, 0) # noCoverage
                return False # noCoverage

        # Set Progress
        updatePluginStatus(userId, session, plugin, transitionDirection, 22)

        # Plugin Loggers
        if os.path.isdir(workspace + 'logging'):

            # Sync Loggers
            _logger.info('Syncing loggers of plugin ' + str(id))
            updateLoggingConfig((session.query(tables.Plugin).filter_by(installed=True).all() + [plugin]))

        # Set Progress
        updatePluginStatus(userId, session, plugin, transitionDirection, 33)

        # Plugin Tables
        if os.path.isdir(workspace + 'table'):

            # Temporary Store Original Table Config
            origTableConfig = readJSONFile('/etc/neatly/base/table/table.json' if (os.path.isfile('/etc/neatly/base/table/table.json')) else '/etc/neatly/base/table/default.json')

            # Sync Tables
            _logger.info('Syncing tables of plugin ' + str(id))
            updateTableConfig((session.query(tables.Plugin).filter_by(installed=True).all() + [plugin]))

            # Catch for Table Conflict
            try:

                # Set Progress
                updatePluginStatus(userId, session, plugin, transitionDirection, 44)

                # Reload Tables
                reload(tables)

                # Create Tables
                _logger.info('Creating new tables for plugin ' + str(id))
                status = tables.createTables()
                if (status):

                    # Migrate Tables
                    _logger.info('New tables for plugin ' + str(id) + ' are created')
                    result = migrateDB()

                    # Failed Migration
                    if (not result):

                        # Reload Tables
                        reload(tables)

                        # Update Session
                        session = tables.createDBSession()
                        plugin = session.query(tables.Plugin).filter_by(id=id).first()

                        # Undo
                        uninstallPlugin(userId, session, id) # noCoverage
                        session = tables.createDBSession() # noCoverage
                        plugin = session.query(tables.Plugin).filter_by(id=id).first() # noCoverage
                        updatePluginStatus(userId, session, plugin, None, 0) # noCoverage
                        return False # noCoverage

                    # Successful Migration
                    else:

                        # Reload Tables
                        reload(tables)

                        # Update Session
                        session = tables.createDBSession()
                        plugin = session.query(tables.Plugin).filter_by(id=id).first()

                else:
                    _logger.error('Unable to create new tables for plugin ' + str(id)) # noCoverage

                    # Reload Tables
                    reload(tables)

                    # Update Session
                    session = tables.createDBSession()
                    plugin = session.query(tables.Plugin).filter_by(id=id).first()

                    # Undo
                    uninstallPlugin(userId, session, id) # noCoverage
                    session = tables.createDBSession() # noCoverage
                    plugin = session.query(tables.Plugin).filter_by(id=id).first() # noCoverage
                    updatePluginStatus(userId, session, plugin, None, 0) # noCoverage
                    return False # noCoverage

            except:
                _logger.error('Unable to create tables')
                _logger.error(' '.join(str(traceback.format_exc()).split()))

                # Restore Original Table Config
                writeCleanJSONFile('/etc/neatly/base/table/table.json', origTableConfig)

                # Reload Tables
                reload(tables)

                # Update Session
                session = tables.createDBSession()
                plugin = session.query(tables.Plugin).filter_by(id=id).first()

                # Undo
                uninstallPlugin(userId, session, id) # noCoverage
                session = tables.createDBSession() # noCoverage
                plugin = session.query(tables.Plugin).filter_by(id=id).first() # noCoverage
                updatePluginStatus(userId, session, plugin, None, 0) # noCoverage
                return False # noCoverage

        # Set Progress
        updatePluginStatus(userId, session, plugin, transitionDirection, 56)

        # Services
        if os.path.isdir(workspace + 'service'):
            _logger.info('Copying service files')
            for dirpath, dirnames, files in os.walk(workspace + 'service'):
                for name in files:
                    if ('.service' in name.lower()):
                        _logger.info('Copying ' + name + ' with executables replacement')
                        writeReplacedTextFile('/etc/systemd/system/' + name, readTextFile(os.path.join(dirpath, name)), {'{{WorkingDirectory}}': sys.sharedConfig.location['lib'] + 'plugin/' + str(id) + '/service/files/', '{{PythonExecutable}}': sys.executables.python._path.decode().replace(' ', '\ ')})
            services.daemonReload()

        # Set Progress
        updatePluginStatus(userId, session, plugin, transitionDirection, 67)

        # Producers
        if os.path.isdir(workspace + 'messaging/producer'):
            _logger.info('Copying producer files')
            for dirpath, dirnames, files in os.walk(workspace + 'messaging/producer'):
                for name in files:
                    if ('.service' in name.lower()):
                        _logger.info('Copying ' + name + ' with executables replacement')
                        writeReplacedTextFile('/etc/systemd/system/' + name, readTextFile(os.path.join(dirpath, name)), {'{{WorkingDirectory}}': sys.sharedConfig.location['lib'] + 'plugin/' + str(id) + '/messaging/producer/files/', '{{PythonExecutable}}': sys.executables.python._path.decode().replace(' ', '\ ')})
            services.daemonReload()

        # Set Progress
        updatePluginStatus(userId, session, plugin, transitionDirection, 78)

        # Consumers
        if os.path.isdir(workspace + 'messaging/consumer'):
            _logger.info('Copying consumer files')
            for dirpath, dirnames, files in os.walk(workspace + 'messaging/consumer'):
                for name in files:
                    if ('.service' in name.lower()):
                        _logger.info('Copying ' + name + ' with executables replacement')
                        writeReplacedTextFile('/etc/systemd/system/' + name, readTextFile(os.path.join(dirpath, name)), {'{{WorkingDirectory}}': sys.sharedConfig.location['lib'] + 'plugin/' + str(id) + '/messaging/consumer/files/', '{{PythonExecutable}}': sys.executables.python._path.decode().replace(' ', '\ ')})
            services.daemonReload()

        # Set Progress
        updatePluginStatus(userId, session, plugin, transitionDirection, 89)

        # Get Activated Plugins
        activatedPlugins = session.query(tables.Plugin).filter_by(activated=True).all()

        # Resources
        if os.path.isdir(workspace + 'resources'):
            _logger.info('Adding resources')
            updateAPIConfig(activatedPlugins + [plugin])
            for dirpath, dirnames, files in os.walk(workspace + 'resources'):
                for name in files:
                    if (name == 'resources'):
                        [resourcesOut, resourcesStatus] = shHandler()(sys.executables.bash)('-c', os.path.join(dirpath, name).replace(' ', '\ '))
                        if (not resourcesStatus):
                            _logger.error(' '.join(resourcesOut.split())) # noCoverage
                            uninstallPlugin(userId, session, id) # noCoverage
                            session = tables.createDBSession() # noCoverage
                            plugin = session.query(tables.Plugin).filter_by(id=id).first() # noCoverage
                            updatePluginStatus(userId, session, plugin, None, 0) # noCoverage
                            return False # noCoverage
                        _logger.info('Added resource file: ' + str(name))

        # Set Progress (Installed)
        updatePluginStatus(userId, session, plugin, transitionDirection, 100)

        # Message
        _logger.info('Installed plugin ' + str(id))

        return True

    except:
        _logger.error(' '.join(str(traceback.format_exc()).split()))
        uninstallPlugin(userId, session, id) # noCoverage
        session = tables.createDBSession() # noCoverage
        plugin = session.query(tables.Plugin).filter_by(id=id).first() # noCoverage
        updatePluginStatus(userId, session, plugin, None, 0) # noCoverage
        return False


# FUNCTION: Uninstall Plugin
@log()
def uninstallPlugin(userId, session, id):
    try:

        # Message
        _logger.info('Uninstalling plugin ' + str(id))

        # Transition Direction
        transitionDirection = False

        # Determine Plugin
        plugin = session.query(tables.Plugin).filter_by(id=id).first()

        # Set Transition State & Progress
        updatePluginStatus(userId, session, plugin, transitionDirection, 10)

        # Determine Workspace
        workspace = sys.sharedConfig.location['lib'] + 'plugin/' + str(id) + '/'

        # Stop & Remove Services
        if os.path.isdir(workspace + 'service'):

            # Stop Services
            _logger.info('Stopping plugin services')
            knownPlugins = []
            for dirpath, dirnames, files in os.walk(sys.sharedConfig.location['lib'] + 'plugin/' + str(id) + '/service/'):
                for name in files:
                    if ('.service' in name.lower()):
                        knownPlugins.append(name)
            _logger.info('Services of plugin ' + str(id) + ': ' + str(knownPlugins))
            for dirpath, dirnames, files in os.walk(workspace + 'service'):
                for name in files:
                    if (('.service' in name.lower()) and (name in knownPlugins)):
                        services.stopService(str(name))

            # Set Transition State & Progress
            updatePluginStatus(userId, session, plugin, transitionDirection, 20)

            # Remove Services
            _logger.info('Removing plugin services')
            for dirpath, dirnames, files in os.walk(workspace + 'service'):
                for name in files:
                    if ('.service' in name.lower()):
                        _logger.info('Removing service: ' + str(name))
                        removeFile('/etc/systemd/system/' + name)
            services.daemonReload()

        # Set Transition State & Progress
        updatePluginStatus(userId, session, plugin, transitionDirection, 30)

        # Stop & Remove Producers
        if os.path.isdir(workspace + 'messaging/producer'):

            # Stop Producers
            _logger.info('Stopping plugin producers')
            knownPlugins = []
            for dirpath, dirnames, files in os.walk(sys.sharedConfig.location['lib'] + 'plugin/' + str(id) + '/messaging/producer/'):
                for name in files:
                    if ('.service' in name.lower()):
                        knownPlugins.append(name)
            _logger.info('Producers of plugin ' + str(id) + ': ' + str(knownPlugins))
            for dirpath, dirnames, files in os.walk(workspace + 'messaging/producer'):
                for name in files:
                    if (('.service' in name.lower()) and (name in knownPlugins)):
                        services.stopService(str(name))

            # Set Transition State & Progress
            updatePluginStatus(userId, session, plugin, transitionDirection, 40)

            # Remove Producers
            _logger.info('Removing plugin producers')
            for dirpath, dirnames, files in os.walk(workspace + 'messaging/producer'):
                for name in files:
                    if ('.service' in name.lower()):
                        _logger.info('Removing producer: ' + str(name))
                        removeFile('/etc/systemd/system/' + name)
            services.daemonReload()

        # Set Transition State & Progress
        updatePluginStatus(userId, session, plugin, transitionDirection, 50)

        # Stop & Remove Consumers
        if os.path.isdir(workspace + 'messaging/consumer'):

            # Stop Consumers
            _logger.info('Stopping plugin consumer')
            knownPlugins = []
            for dirpath, dirnames, files in os.walk(sys.sharedConfig.location['lib'] + 'plugin/' + str(id) + '/messaging/consumer/'):
                for name in files:
                    if ('.service' in name.lower()):
                        knownPlugins.append(name)
            _logger.info('Consumers of plugin ' + str(id) + ': ' + str(knownPlugins))
            for dirpath, dirnames, files in os.walk(workspace + 'messaging/consumer'):
                for name in files:
                    if (('.service' in name.lower()) and (name in knownPlugins)):
                        services.stopService(str(name))

            # Set Transition State & Progress
            updatePluginStatus(userId, session, plugin, transitionDirection, 60)

            # Remove Consumers
            _logger.info('Removing plugin consumers')
            for dirpath, dirnames, files in os.walk(workspace + 'messaging/consumer'):
                for name in files:
                    if ('.service' in name.lower()):
                        _logger.info('Removing consumer: ' + str(name))
                        removeFile('/etc/systemd/system/' + name)
            services.daemonReload()

        # Set Transition State & Progress
        updatePluginStatus(userId, session, plugin, transitionDirection, 70)

        # Remove Tables
        if os.path.isdir(workspace + 'table'):

            # Sync Tables
            _logger.info('Unlinking tables of plugin ' + str(id))
            updateTableConfig(list(set(session.query(tables.Plugin).filter_by(installed=True).all())^set([plugin])))

            # Reload Tables
            reload(tables)

            # Migrate Tables
            result = migrateDB()

            # Update Session
            session = tables.createDBSession()
            plugin = session.query(tables.Plugin).filter_by(id=id).first()

        # Set Progress
        updatePluginStatus(userId, session, plugin, transitionDirection, 80)

        # Plugin Loggers
        if os.path.isdir(workspace + 'logging'):

            # Sync Loggers
            _logger.info('Removing loggers of plugin ' + str(id))
            updateLoggingConfig(list(set(session.query(tables.Plugin).filter_by(installed=True).all())^set([plugin])))

        # Set Progress
        updatePluginStatus(userId, session, plugin, transitionDirection, 90)

        _logger.info('Removing plugin folder')
        shutil.rmtree(sys.sharedConfig.location['lib'] + 'plugin/' + str(id))

        # Set Transition State & Progress
        updatePluginStatus(userId, session, plugin, transitionDirection, 100)

        # Message
        _logger.info('Uninstalled plugin ' + str(id))

    except:

        # Update Session
        session = tables.createDBSession()
        plugin = session.query(tables.Plugin).filter_by(id=id).first()

        # Log Error & Set Transition State & Progress
        _logger.error(' '.join(str(traceback.format_exc()).split()))
        updatePluginStatus(userId, session, plugin, None, 0)


# FUNCTION: Activate Plugin
@log()
def activatePlugin(userId, session, id):

    # Message
    _logger.info('Activating plugin ' + str(id))

    # Transition Direction
    transitionDirection = True

    # Determine Plugin
    plugin = session.query(tables.Plugin).filter_by(id=id).first()

    # Set Transition State & Progress
    updatePluginStatus(userId, session, plugin, transitionDirection, 25)

    # Determine Workspace
    workspace = sys.sharedConfig.location['lib'] + 'plugin/' + str(id) + '/'

    # Start Services
    if os.path.isdir(workspace + 'service'):
        _logger.info('Starting plugin services')
        knownPlugins = []
        for dirpath, dirnames, files in os.walk(sys.sharedConfig.location['lib'] + 'plugin/' + str(id) + '/service/'):
            for name in files:
                if ('.service' in name.lower()):
                    knownPlugins.append(name)
        _logger.info('Services of plugin ' + str(id) + ': ' + str(knownPlugins))
        for dirpath, dirnames, files in os.walk(workspace + 'service'):
            for name in files:
                if (('.service' in name.lower()) and (name in knownPlugins)):
                    services.startService(str(name))

    # Set Transition State & Progress
    updatePluginStatus(userId, session, plugin, transitionDirection, 50)

    # Start Producers
    if os.path.isdir(workspace + 'messaging/producer'):
        _logger.info('Starting plugin producers')
        knownPlugins = []
        for dirpath, dirnames, files in os.walk(sys.sharedConfig.location['lib'] + 'plugin/' + str(id) + '/messaging/producer/'):
            for name in files:
                if ('.service' in name.lower()):
                    knownPlugins.append(name)
        _logger.info('Producers of plugin ' + str(id) + ': ' + str(knownPlugins))
        for dirpath, dirnames, files in os.walk(workspace + 'messaging/producer'):
            for name in files:
                if (('.service' in name.lower()) and (name in knownPlugins)):
                    services.startService(str(name))

    # Set Transition State & Progress
    updatePluginStatus(userId, session, plugin, transitionDirection, 75)

    # Start Consumers
    if os.path.isdir(workspace + 'messaging/consumer'):
        _logger.info('Starting plugin consumers')
        knownPlugins = []
        for dirpath, dirnames, files in os.walk(sys.sharedConfig.location['lib'] + 'plugin/' + str(id) + '/messaging/consumer/'):
            for name in files:
                if ('.service' in name.lower()):
                    knownPlugins.append(name)
        _logger.info('Consumers of plugin ' + str(id) + ': ' + str(knownPlugins))
        for dirpath, dirnames, files in os.walk(workspace + 'messaging/consumer'):
            for name in files:
                if (('.service' in name.lower()) and (name in knownPlugins)):
                    services.startService(str(name))

    # Set Transition State & Progress
    updatePluginStatus(userId, session, plugin, transitionDirection, 100)

    # Message
    _logger.info('Activated plugin ' + str(id))


# FUNCTION: Deactivate Plugin
@log()
def deactivatePlugin(userId, session, id):

    # Message
    _logger.info('Deactivating plugin ' + str(id))

    # Transition Direction
    transitionDirection = False

    # Determine Plugin
    plugin = session.query(tables.Plugin).filter_by(id=id).first()

    # Set Transition State & Progress
    updatePluginStatus(userId, session, plugin, transitionDirection, 25)

    # Determine Workspace
    workspace = sys.sharedConfig.location['lib'] + 'plugin/' + str(id) + '/'

    # Stop Services
    if os.path.isdir(workspace + 'service'):
        _logger.info('Stopping plugin services')
        knownPlugins = []
        for dirpath, dirnames, files in os.walk(sys.sharedConfig.location['lib'] + 'plugin/' + str(id) + '/service/'):
            for name in files:
                if ('.service' in name.lower()):
                    knownPlugins.append(name)
        _logger.info('Services of plugin ' + str(id) + ': ' + str(knownPlugins))
        for dirpath, dirnames, files in os.walk(workspace + 'service'):
            for name in files:
                if (('.service' in name.lower()) and (name in knownPlugins)):
                    services.stopService(str(name))

    # Set Transition State & Progress
    updatePluginStatus(userId, session, plugin, transitionDirection, 50)

    # Stop Producers
    if os.path.isdir(workspace + 'messaging/producer'):
        _logger.info('Stopping plugin producers')
        knownPlugins = []
        for dirpath, dirnames, files in os.walk(sys.sharedConfig.location['lib'] + 'plugin/' + str(id) + '/messaging/producer/'):
            for name in files:
                if ('.service' in name.lower()):
                    knownPlugins.append(name)
        _logger.info('Producers of plugin ' + str(id) + ': ' + str(knownPlugins))
        for dirpath, dirnames, files in os.walk(workspace + 'messaging/producer'):
            for name in files:
                if (('.service' in name.lower()) and (name in knownPlugins)):
                    services.stopService(str(name))

    # Set Transition State & Progress
    updatePluginStatus(userId, session, plugin, transitionDirection, 75)

    # Stop Consumers
    if os.path.isdir(workspace + 'messaging/consumer'):
        _logger.info('Stopping plugin consumers')
        knownPlugins = []
        for dirpath, dirnames, files in os.walk(sys.sharedConfig.location['lib'] + 'plugin/' + str(id) + '/messaging/consumer/'):
            for name in files:
                if ('.service' in name.lower()):
                    knownPlugins.append(name)
        _logger.info('Consumers of plugin ' + str(id) + ': ' + str(knownPlugins))
        for dirpath, dirnames, files in os.walk(workspace + 'messaging/consumer'):
            for name in files:
                if (('.service' in name.lower()) and (name in knownPlugins)):
                    services.stopService(str(name))

    # Set Transition State & Progress
    updatePluginStatus(userId, session, plugin, transitionDirection, 100)

    # Message
    _logger.info('Deactivated plugin ' + str(id))


# FUNCTION: Get Plugin Log Data
@log(returnValue={})
def getPluginLogData(pluginId):
    dir = sys.sharedConfig.logging['loggers']['plugin']['path'] + str(pluginId) + '/'
    resp = {'logs': []}
    _logger.debug('Listing log files in: ' + str(dir))
    for dirpath, dirnames, files in os.walk(dir):
        for name in files:
            if ('.log' in name.lower()):
                fullPath = os.path.join(dirpath, name)
                _logger.debug('Found log: ' + str(fullPath))
                fileStat = os.stat(fullPath)
                fullPath = fullPath.replace(dir, '')
                filePath = dirpath.replace(dir, '')
                if (not filePath):
                    filePath = None
                resp['logs'].append({'uid': generateUIDfromString(fullPath), 'file': name, 'path': filePath, 'fullPath': fullPath, 'size': round(fileStat.st_size/1024, 1), 'creation': datetime.fromtimestamp(fileStat.st_ctime), 'lastEntry': datetime.fromtimestamp(fileStat.st_mtime)})
    resp['logs'] = sorted(resp['logs'], key=lambda x: x['lastEntry'], reverse=True)
    return resp


# FUNCTION: Get Plugin Log Content
@log(returnValue=('', 404))
def getPluginLogContent(options, pluginId):
    dir = sys.sharedConfig.logging['loggers']['plugin']['path'] + str(pluginId) + '/'
    logList = getPluginLogData(dir)
    if ('logs' in logList):
        foundLogs = [log for log in logList['logs'] if (log['uid'] == options['uid'])]
        if (len(foundLogs) == 1):
            foundLogs = foundLogs[0]
            return send_file(dir + foundLogs['fullPath'], attachment_filename=foundLogs['file'])
    return ('', 404)


# FUNCTION: Migrate DB
@log()
def migrateDB():

    # Log Message
    _logger.info('Starting database migration')

    # Attempt
    try:

        # Kill Sleeping Connections
        result = killSleepingConnections()
        if (not result):
            return False # noCoverage

        # Migrate Tables
        status = tables.migrateTables()

        # Allow Reconnect to DB
        allowDBReconnect()

        # Return Status
        return status

    except:

        # Log Message
        _logger.error('Migration of database failed')
        _logger.error(' '.join(str(traceback.format_exc()).split()))

        # Allow Reconnect to DB
        allowDBReconnect()

        # Failed
        return False


# FUNCTION: Get Plugin Repo Information
@log()
def getPluginRepoInformation():
    version = readJSONFile('/etc/neatly/base/api/default.json')['version'].split('-')[0]
    pluginRepoConfig = readJSONFile('/etc/neatly/base/pluginRepo.json')
    if version in pluginRepoConfig.keys():
        _logger.info('Found plugin configuration for version: ' + str(version))
        return pluginRepoConfig[version]
    _logger.warning('Unable to find plugin configuration for version: ' + str(version)) # noCoverage
    return [] # noCoverage


# FUNCTION: Create Plugin Logger
@log()
def createPluginLogger(plugin, loggerName, config={}, makePreferred=False, wrapper=None):

    # Get Plugin Id
    pluginId = (plugin['id'] if (isinstance(plugin, dict)) else plugin.id)

    # Get Logger Config
    mainLogPath = sys.sharedConfig.logging.get('loggers', {}).get('plugin', {}).get('path', None)
    logConfig = sys.sharedConfig.logging.get('loggers', {}).get('plugin', {}).get('plugins', {}).get(str(pluginId), {}).get(loggerName, None)

    # Check if Logger Config Found
    if (not (mainLogPath and logConfig)):
        _logger.error('Unable to create logger for plugin ' + str(pluginId) + ' (' + str(loggerName) + '), missing config')
        return None

    # Update Config (w/ Forced Config)
    logConfig.update(config)

    # Create Logger Properties
    loggerName = 'plugin-' + str(pluginId) + '-' + loggerName + (('-' + str(logConfig['tag'])) if logConfig.get('tag', None) else '')
    loggerPath = mainLogPath + str(pluginId) + (('/' + '/'.join(logConfig['subPath'])) if logConfig.get('subPath', None) else '') + '/' + logConfig['file']
    loggerLevel = logConfig['level']

    # Create Logger
    logger = createLogger(loggerName, loggerPath, loggerLevel, makePreferred=makePreferred, wrapper=wrapper)

    # Return Logger
    return logger


# FUNCTION: Construct Resource Path
@log()
def constructPath(config, subDir=None):
    return sys.sharedConfig.location['lib'] + 'plugin' + '/' + str(config['plugin']['id']) + '/' + (('/'.join(subDir) + '/') if (subDir) else '')


# FUNCTION: Construct Plugin Parameters
@log()
def constructPluginParams(pluginConfig, inSession=False):
    def constructPluginParamsInternal(func):
        @wraps(func)
        def constructPluginParamsWrapper(**kwargs):
            plugin = (Obj(pluginConfig['plugin']) if isinstance(pluginConfig['plugin'], dict) else pluginConfig['plugin'])
            kwargs['pluginParams'] = {'plugin': plugin, 'tables': tables, 'execParams': {'plugin': plugin, 'source': 'Plugin', 'description': 'Plugin action'}}
            if (inSession):
                kwargs['pluginParams']['session'] = tables.createDBSession()
                result = func(**kwargs)
                kwargs['pluginParams']['session'].close()
                return result
            else:
                return func(**kwargs)
        return constructPluginParamsWrapper
    return constructPluginParamsInternal


# CLASS: Plugin API Handler
class PluginAPIHandler:

    # Default Action
    DEFAULT = '_DEFAULT'
    def _default(**params):
        return ('', 404) # noCoverage

    # Function Mapper
    _func_map = {(DEFAULT, DEFAULT, DEFAULT): _default}

    # Initialise
    def __init__(self, authenticated, method, actionName):
        self.authenticated = authenticated
        self.method = method
        self.actionName = actionName

    # Call
    def __call__(self, f):
        self._func_map[(self.authenticated, self.method, self.actionName)] = f
        return f

    # Execute
    @classmethod
    def execute(cls, **params):
        return cls._func_map.get((params['authenticated'], params['request'].method, params['actionName']), cls._func_map[(cls.DEFAULT, cls.DEFAULT, cls.DEFAULT)])(**params)


# FUNCTION: Minimum Plugin Action Rights Check
@log(returnValue=False)
def minimumPluginActionRightsCheck(rights, ref):
    if (ref == 'own'): return (rights[0] or rights[1] or rights[2])
    elif (ref == 'isolated'): return (rights[1] or rights[2])
    elif (ref == 'all'): return rights[2]
    elif (not ref): return True
    return False


# FUNCTION: Minimum Plugin Action Rights
@log(returnValue=('', 403))
def minimumPluginActionRights(right):
    def minimumPluginActionRightsInternal(func):
        @wraps(func)
        def minimumPluginActionRightsWrapper(**kwargs):
            if (minimumPluginActionRightsCheck(kwargs['rights'], right)):
                return func(**kwargs)
            else:
                return ('', 403)
        return minimumPluginActionRightsWrapper
    return minimumPluginActionRightsInternal


# FUNCTION: Has Plugin Option Rights
@log(returnValue=('', 403))
def hasPluginOptionRights(group, option, action):
    def hasPluginOptionRightsInternal(func):
        @wraps(func)
        def hasPluginOptionRightsWrapper(**kwargs):
            if (actions.checkPluginOptionRights(kwargs['session'], kwargs['plugin'].id, group, option, action, g.user)):
                return func(**kwargs)
            else:
                return ('', 403)
        return hasPluginOptionRightsWrapper
    return hasPluginOptionRightsInternal


# FUNCTION: Create Option Dict
@log(returnValue={})
def createOptionDict(options):
    result = {}
    for option in options:
        if (option is not None):
            if (option.group not in result):
                result[option.group] = {}
            result[option.group][option.option] = option.value
    return result


# FUNCTION: Get Option Dict
@log(returnValue={})
def getOptionDict(session, plugin, options):
    optionsQuery = [session.query(tables.PluginOption).filter_by(plugin=plugin, group=option['group'], option=option['option']).first() for option in options]
    return createOptionDict(optionsQuery)


# FUNCTION: Read Option Dict by Plugin
@log(returnValue={})
def readOptionDictByPlugin(plugin):
    session = tables.createDBSession()
    optionsQuery = session.query(tables.PluginOption).filter_by(plugin_id=(plugin['id'] if (isinstance(plugin, dict)) else plugin.id)).all()
    result = createOptionDict(optionsQuery)
    session.close()
    return result


# FUNCTION: Set Option
@log(returnValue=False)
def setOption(execParameter, session, option):
    if (option):
        data = orjson.loads(request.data)
        if ((data is None) and (not option.nullable)):
            return False # noCoverage
        else:
            return actions.edit(execParameter, session, option.__class__, option.id, **{'value': data})
    else:
        return False


# FUNCTION: Parse Sent Options
@log(returnValue=[])
def parseSentOptions():
    data = orjson.loads(request.data)
    if isinstance(data, dict):
        return flattenArray([[{'group': group, 'option': option, 'value': value} for option, value in optionsDict.items()] for group, optionsDict in data.items()])
    else:
        return []


# FUNCTION: Options Allowed
@log(returnValue=False)
def optionsAllowed(parsed, allowed):
    if (parsed):
        return all([any([(i.items() <= parse.items()) for i in allowed]) for parse in parsed])
    return False


# FUNCTION: Options Null Allowed
@log(returnValue=False)
def optionsNullAllowed(options):
    if all([option['ref'] for option in options]):
        return all([((option['value'] is not None) or option['ref'].nullable) for option in options])
    return False


# FUNCTION: Set Option Dict
@log(returnValue=False)
def setOptionDict(execParameter, session, plugin, options):
    data = orjson.loads(request.data)
    parsedOptions = parseSentOptions()
    if optionsAllowed(parsedOptions, options):
        [parsedOption.update({'ref': session.query(tables.PluginOption).filter_by(plugin=plugin, group=parsedOption['group'], option=parsedOption['option']).first()}) for parsedOption in parsedOptions]
        if optionsNullAllowed(parsedOptions):
            [setattr(parsedOption['ref'], 'value', parsedOption['value']) for parsedOption in parsedOptions]
            actions.bulkCommit(execParameter, session)
            return True
    return False


# FUNCTION: Create Option Filter
def createOptionFilter(change, configChange):
    if (('options' in configChange) and configChange['options']):
        return any(cnfChange for cnfChange in configChange['options'] if ((change.value['group'] == cnfChange['group']) if (('group' in cnfChange) and cnfChange['group']) else True) and ((change.value['option'] == cnfChange['option']) if (('option' in cnfChange) and cnfChange['option']) else True))
    else:
        return True


# FUNCTION: Filter Option Changes
def filterOptionChanges(changes, config):
    if (('configListener' in config) and config['configListener']):
        return flattenArray([[change for change in changes if (change.value['plugin_id'] == configChange['plugin']['id']) and createOptionFilter(change, configChange)] for configChange in config['configListener']])
    else:
        return changes


# FUNCTION: Detect Option Changes via Message
def detectOptionChangesViaMessage(consumer, config):
    optionChanges = flattenArray(list(consumer.poll().values()))
    relevantChanges = filterOptionChanges(optionChanges, config)
    return (True if relevantChanges else False)
