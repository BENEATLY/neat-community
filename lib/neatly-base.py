################################################################################
# Author:     Thomas D'haenens
# License:    GPL-3.0
# Link:       https://github.com/BENEATLY/neat-community/
# Contact:    https://neatly.be/
################################################################################


# IMPORT: Standard Modules
import sys                                                                                                                                      # System Lib
import ujson                                                                                                                                    # UJSON Lib


# FUNCTION: Read JSON File (No Logging)
def readJSONFile(file):
    with open(file, encoding='utf-8') as content:
        return ujson.load(content)

# FUNCTION: Detect Termination Signal
def detectTermSignal(signal, frame):
    logger.warning('Application received termination signal')


# CONFIGURATION: Determine Installation Location
locationConfig = readJSONFile('/etc/neatly/base/location.json')

# CONFIGURATION: Add Current Path to Default Python Paths
sys.path.append(locationConfig['lib'])


# IMPORT: Custom Modules
from basic import createLogger, createLogFilePath, getLogFileLevel, readJSONFile, signal, traceback, os, shHandler


# CONFIGURATION: Create Logger
logger = createLogger('launch', createLogFilePath('launch'), getLogFileLevel('launch'))


# Check if DB is Set Up
if not os.path.isfile('/etc/neatly/base/db.json'):
    logger.error('Neatly Base is not initialised yet! Run \'init-neatly-base\' first and complete the installation.')
    sys.exit()

# Detect Termination Signal
signal.signal(signal.SIGTERM, detectTermSignal)

# Launch Application
try:

    # Specific Environment
    if (sys.sharedConfig.envConfig):

        # Lauch API with Flask and Coverage
        if (str(sys.sharedConfig.envConfig['environment']).lower() == 'test'):
            logger.info('Launching application in test mode')
            shHandler(subProcess=True)(sys.executables.coverage)('run', '--parallel-mode', '--concurrency=multiprocessing', 'api.py')
            logger.warning('Application stopped')

        # Launch API with Flask
        else:
            logger.info('Launching application in development mode')
            shHandler(subProcess=True)(sys.executables.python)('api.py')
            logger.warning('Application stopped')

    # Launch API with UWSGI
    else:
        logger.info('Launching application in production mode')
        apiConfig = readJSONFile('/etc/neatly/base/api/default.json')
        os.chdir(sys.sharedConfig.location['lib'])
        shHandler(subProcess=True)(sys.executables.bash)('-c', './neatly-base-api --http 0.0.0.0:' + str(apiConfig['port']) + ' --logger file:' + sys.sharedConfig.logging['loggers']['api']['path'].replace(' ', '\ ') + 'uwsgi.log')
        logger.warning('Application stopped')

# Failed Launch
except:
    logger.error(' '.join(str(traceback.format_exc()).split()))
    logger.error('Unable to launch application')
