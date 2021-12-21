################################################################################
# Author:     Thomas D'haenens
# License:    GPL-3.0
# Link:       https://github.com/BENEATLY/neat-community/
# Contact:    https://neatly.be/
################################################################################


# IMPORT: Standard Modules
import logging                                                                                                                                                                              # Logging Lib
from logging.handlers import RotatingFileHandler                                                                                                                                            # Rotated Logging Lib
import orjson                                                                                                                                                                               # ORJSON Lib
import json                                                                                                                                                                                 # JSON Lib
import traceback                                                                                                                                                                            # Exception Lib
from functools import wraps, lru_cache                                                                                                                                                      # Functools Lib
from sqlalchemy.ext.declarative import declarative_base, DeclarativeMeta                                                                                                                    # SQLAlchemy Declarative Lib
from sqlalchemy import Table, text                                                                                                                                                          # Table Lib
from sqlalchemy.inspection import inspect                                                                                                                                                   # SQLAlchemy Inspect
from sqlalchemy.dialects.postgresql import JSONB                                                                                                                                            # JSONB Dialect
from sqlalchemy_json import NestedMutable                                                                                                                                                   # Mutable JSON Lib
from datetime import datetime, time, timedelta, date, timezone                                                                                                                              # Date Gen Lib
from inspect import getframeinfo, stack                                                                                                                                                     # Stack Inspect Lib
from importlib.util import spec_from_loader, spec_from_file_location, module_from_spec                                                                                                      # Module Loader Lib
import inspect as inspecter                                                                                                                                                                 # Inspect Classes Lib
from operator import attrgetter                                                                                                                                                             # Attribute Getter Lib
import shutil                                                                                                                                                                               # File Operations Lib
from inflection import underscore                                                                                                                                                           # CamelCase Function
from OpenSSL import crypto as sslCheck                                                                                                                                                      # SSL Lib
from importlib import reload                                                                                                                                                                # Import Reload Function
import sqlalchemy.ext.baked                                                                                                                                                                 # SQLAlchemy Component
import sqlalchemy.sql.default_comparator                                                                                                                                                    # SQLAlchemy Component
from kafka import KafkaConsumer, KafkaProducer                                                                                                                                              # Kafka Lib
from kafka.admin import KafkaAdminClient, NewTopic                                                                                                                                          # Kafka Admin Lib
import sys                                                                                                                                                                                  # Sytem Lib
import types                                                                                                                                                                                # Types Lib
from flask.json import JSONEncoder, JSONDecoder                                                                                                                                             # JSON Encoder/Decoder Lib
from flask_sqlalchemy import SQLAlchemy                                                                                                                                                     # Flask-SQLAlchemy Lib
from flask import Flask, Response, send_file                                                                                                                                                # Flask Lib
from sqlalchemy import create_engine, select, func, or_, and_, not_                                                                                                                         # SQLAlchemy Lib
from sqlalchemy.orm import configure_mappers, scoped_session, sessionmaker, column_property, relationship, aliased                                                                          # SQLAlchemy ORM
import hashlib                                                                                                                                                                              # Hash Lib
import operator                                                                                                                                                                             # Operator Lib
from werkzeug.utils import secure_filename                                                                                                                                                  # Secure File Upload Lib
import signal                                                                                                                                                                               # Signal Lib
import threading                                                                                                                                                                            # Threading Lib
from time import sleep                                                                                                                                                                      # Sleep Function
from string import ascii_letters, digits                                                                                                                                                    # String Functions
from random import choice, choices                                                                                                                                                          # Random Gen Function
import click                                                                                                                                                                                # Click Lib
from contextlib import redirect_stdout, redirect_stderr, ExitStack                                                                                                                          # Context Lib
import sh                                                                                                                                                                                   # Shell Lib
from collections import deque                                                                                                                                                               # Collections Lib
from psutil import Process                                                                                                                                                                  # Process Lib

# IMPORT: Custom Modules
from versioning import versioningManager, detectTransactionParams, sa, request, hybrid_property, get_class_by_table, os, ujson, copy, deepcopy, contextmanager, contextAvailable, g, orm    # Versioning Lib


# CLASS: Object
class Obj(object):
    def __init__(self, d, withList=True):
        for a, b in d.items():
            if (isinstance(b, (list, tuple)) and withList):
                setattr(self, a, [Obj(x, withList=withList) if isinstance(x, dict) else x for x in b])
            else:
                setattr(self, a, Obj(b, withList=withList) if isinstance(b, dict) else b)

    def hasAttr(self, attr):
        hasattr(self, attr)

    def setAttr(self, attr, val):
        setattr(self, attr, val)

    def deleteAttr(self, attr):
        try:
            delattr(self, attr)
        except:
            pass


# CLASS: JSON Encoder (Flask)
class CustomJSONEncoder(JSONEncoder):
    def default(self, obj):
        if isinstance(obj.__class__, DeclarativeMeta):
            return orjson.dumps(obj).decode('utf-8')
        return super(CustomJSONEncoder, self).default(obj)


# CLASS: JSON Decoder (Flask)
class CustomJSONDecoder(JSONDecoder):
    def default(self, obj):
        if isinstance(obj.__class__, DeclarativeMeta):
            return orjson.loads(obj)
        return super(CustomJSONDecoder, self).default(obj)


# FUNCTION: JSON Encoder (SQL Engine)
def engineEncoder(d):
    return orjson.dumps(d).decode('utf-8')


# FUNCTION: JSON Decoder (SQL Engine)
def engineDecoder(d):
    return orjson.loads(d)


# FUNCTION: Unique Generator
def uniqueGenerator(size=100, chars=ascii_letters + digits):
    return ''.join(choice(chars) for _ in range(size))


# FUNCTION: Create Directory Path
def createDirPath(fullPath):
    splittedPath = fullPath.split('/')
    [createDir('/'.join(splittedPath[0:i])) for i in range(1, (len(splittedPath)+1)) if splittedPath[i-1]]


# FUNCTION: Create Directory
def createDir(dir):
    if (not os.path.isdir(dir)):
        os.mkdir(dir)


# FUNCTION: Suppress (stdout and/or stderr)
@contextmanager
def suppress(out=True, err=False):
    with ExitStack() as stack:
        with open(os.devnull, 'w') as null:
            if out: stack.enter_context(redirect_stdout(null))
            if err: stack.enter_context(redirect_stderr(null))
            yield


# FUNCTION: Create Logger
@lru_cache
def createLogger(name, logfile, level, makePreferred=False, wrapper=None):

    # Create Missing Directories
    createDirPath('/'.join(logfile.split('/')[0:-1]))

    # Create Empty File
    if not os.path.isfile(logfile): open(logfile, 'a').close()

    # Set Log Handler and Settings
    loggerName = ('neatly-' + name)
    handler = RotatingFileHandler(logfile, maxBytes=10*1024*1024, backupCount=3, encoding='utf-8')
    formatter = logging.Formatter(fmt='%(levelname)-7s\t%(asctime)s.%(msecs)03d: %(message)s', datefmt='%d/%m/%Y %H:%M:%S')
    handler.setFormatter(formatter)
    logger = logging.getLogger(loggerName)
    logger.setLevel(level)
    logger.addHandler(handler)

    # Log Creation Message
    if (not wrapper):
        logger.debug('Created ' + loggerName + ' logger')

    # Log Wrapper
    else:
        wrapper(logger)

    # Store Logger for Managing
    if (not hasattr(logging.root.manager, '_neatlyLoggerDict')): logging.root.manager._neatlyLoggerDict = {}
    logging.root.manager._neatlyLoggerDict[loggerName] = logger

    # Preferred Logger
    if (makePreferred):

        # Set Preferred Logger
        setPreferredLogger(logger, versioning=True)

    # Return Logger
    return logger


# FUNCTION: Create Trigger Logger
def createTriggerLogger(logger, func):

    # Take Decorators into Account
    wrappedFunc = deepcopy(func)
    while (hasattr(wrappedFunc, '__wrapped__')):
        wrappedFunc = wrappedFunc.__wrapped__

    # Get Module File Path
    filePath = inspecter.getfile(wrappedFunc)

    # Get Function Name
    functionName = wrappedFunc.__name__

    # Create Unique Reference
    triggerId = uniqueGenerator(size=8)

    # Creation Message
    logger.info('Trigger invoked with ID: ' + triggerId + ' (' + functionName + ' in ' + filePath + ')')

    # Set Log Handler and Settings
    triggerLoggerName = ('neatly-' + logger.name + '-trigger-' + str(triggerId))
    triggerFilePath = logger.handlers[0].baseFilename
    triggerHandler = RotatingFileHandler(triggerFilePath, maxBytes=10*1024*1024, backupCount=3, encoding='utf-8')
    formatter = logging.Formatter(fmt='%(levelname)-7s\t%(asctime)s.%(msecs)03d: <Trigger ' + triggerId + '> %(message)s', datefmt='%d/%m/%Y %H:%M:%S')
    triggerHandler.setFormatter(formatter)
    triggerLogger = logging.getLogger(triggerLoggerName)
    triggerLogger.setLevel(logger.level)
    triggerLogger.addHandler(triggerHandler)

    # Return Logger
    return triggerLogger


# FUNCTION: Read JSON File (No Logging)
def readJSONFile(file):
    with open(file, encoding='utf-8') as content:
        return ujson.load(content)


# FUNCTION: Load Location Config
def loadLocationConfig():
    if (not hasattr(sys, 'sharedConfig')): sys.sharedConfig = types.SimpleNamespace()
    sys.sharedConfig.location = readJSONFile('/etc/neatly/base/location.json')


# FUNCTION: Load Logging Config
def loadLoggingConfig():
    if (not hasattr(sys, 'sharedConfig')): sys.sharedConfig = types.SimpleNamespace()
    sys.sharedConfig.logging = (readJSONFile('/etc/neatly/base/logging/logging.json') if (os.path.isfile('/etc/neatly/base/logging/logging.json')) else readJSONFile('/etc/neatly/base/logging/default.json'))


# FUNCTION: Load Database Config
def loadDBConfig():
    if (not hasattr(sys, 'sharedConfig')): sys.sharedConfig = types.SimpleNamespace()
    sys.sharedConfig.db = readJSONFile('/etc/neatly/base/db.json')


# FUNCTION: Load Environment Config
def loadEnvConfig():
    if (not hasattr(sys, 'sharedConfig')): sys.sharedConfig = types.SimpleNamespace()
    sys.sharedConfig.envConfig = (readJSONFile('/etc/neatly/base/env.json') if (os.path.isfile('/etc/neatly/base/env.json')) else False)


# FUNCTION: Create Log File Path (No Logging)
def createLogFilePath(component):
    return sys.sharedConfig.logging['loggers'][component]['path'] + sys.sharedConfig.logging['loggers'][component]['file']


# FUNCTION: Get Log File Debug Level (No Logging)
def getLogFileLevel(component):
    return getattr(logging, sys.sharedConfig.logging['loggers'][component]['level'])


# FUNCTION: Wrap Load Logger
def wrapLoadLogger(logger):

    # Get File Name of Initiator
    fileName = os.path.abspath(inspecter.stack()[-1][1])

    # Create Unique Reference
    logId = uniqueGenerator(size=8)

    # Creation Message
    logger.info('Created ' + logger.name + ' logger with ID: ' + logId + ' (' + fileName + ')')

    # Get Log Handler
    logHandler = logger.handlers[0]

    # Create New Format
    logFormat = logHandler.formatter._fmt.replace('%(message)', '<Logger ' + logId + '> %(message)')

    # Set New Log Format
    logHandler.setFormatter(logging.Formatter(fmt=logFormat, datefmt=logHandler.formatter.datefmt))


# CONFIGURATION: Load Location Config
loadLocationConfig()

# CONFIGURATION: Load Logging Config
loadLoggingConfig()

# CONFIGURATION: Load Database Config
loadDBConfig()

# CONFIGURATION: Load Environment Config
loadEnvConfig()


# CONFIGURATION: Create Logger
logger = createLogger('loader', createLogFilePath('loader'), getLogFileLevel('loader'), wrapper=wrapLoadLogger)


# FUNCTION: Get Default Logger
def getDefaultLogger():
    if (getattr(logging.root.manager, '_neatlyDefaultLogger', None)): return logging.root.manager._neatlyDefaultLogger
    else: return getattr(logging.root.manager, '_neatlyLoggerDict', {}).get('neatly-loader')


# FUNCTION: Set Default Logger
def setDefaultLogger(logger):
    logging.root.manager._neatlyDefaultLogger = logger


# FUNCTION: Reset Default Logger
def resetDefaultLogger():
    if (hasattr(logging.root.manager, '_neatlyDefaultLogger')): del logging.root.manager._neatlyDefaultLogger


# FUNCTION: Get Logger By Name
def getLoggerByName(name):
    return getattr(logging.root.manager, '_neatlyLoggerDict', {}).get(('neatly-' + name))


# FUNCTION: Set Preferred Logger
def setPreferredLogger(logger, versioning=False):

    # Set Preferred Logger
    if contextAvailable(): g._neatlyPreferredLogger = logger
    else: logging.root.manager._neatlyPreferredLogger = logger

    # Set Versioning Manager Logger
    if (versioning and hasattr(sys, '_versioningManager')): sys._versioningManager.setLogger(logger)


# FUNCTION: Reset Preferred Logger
def resetPreferredLogger(versioning=False):

    # Remove Preferred Logger
    if contextAvailable():
        if (hasattr(g, '_neatlyPreferredLogger')): del g._neatlyPreferredLogger
    elif (hasattr(logging.root.manager, '_neatlyPreferredLogger')): del logging.root.manager._neatlyPreferredLogger

    # Reset Versioning Manager Logger
    if (versioning and hasattr(sys, '_versioningManager')): sys._versioningManager.setLogger(getDefaultLogger())


# FUNCTION: Get Preferred Logger
def getPreferredLogger():
    if contextAvailable(): return getattr(g, '_neatlyPreferredLogger', None)
    else: return getattr(logging.root.manager, '_neatlyPreferredLogger', None)


# FUNCTION: Is Defined Logger
def isDefinedLogger(logger, name):
    return (logger.name is ('neatly-' + name))


# FUNCTION: Determine Internal Logger
def _determineInternalLogger(name, mod):

    # Define Variables
    origLogger = None
    origPreferredLogger = None
    createdPreferredLogger = False
    createdLogger = False
    logger = None

    # No Existing Logger
    if ((mod and (not hasattr(mod, '_logger'))) or (not mod)):

        # Name Overwrites Existing Logger & Sets Preferred
        if (name):
            origPreferredLogger = deepcopy(getPreferredLogger())
            logger = getLoggerByName(name)
            createdLogger = True

            # Set Preferred Logger
            if ((not origPreferredLogger) or (origPreferredLogger and (not isDefinedLogger(origPreferredLogger, name)))):
                setPreferredLogger(logger)
                createdPreferredLogger = True

        # Look for Preferred Existence
        else:

            # Preferred Exists, Reuse
            origPreferredLogger = deepcopy(getPreferredLogger())
            if (origPreferredLogger):
                logger = origPreferredLogger
                createdLogger = True

            # Preferred does Not Exist, Create
            else:
                logger = getDefaultLogger()
                createdLogger = True

    # Existing Logger & Name Defined
    elif (name):

        # Using Mod
        origLogger = deepcopy(mod._logger)

        # Store Original Preferred Logger
        origPreferredLogger = deepcopy(getPreferredLogger())

        # Current Logger is Defined Logger
        if (isDefinedLogger(origLogger, name)):
            logger = origLogger

            # Set Preferred Logger
            if ((not origPreferredLogger) or (origPreferredLogger and (not isDefinedLogger(origPreferredLogger, name)))):
                setPreferredLogger(logger)
                createdPreferredLogger = True

        # Current Logger is Not Defined Logger
        else:
            logger = getLoggerByName(name)
            createdLogger = True

            # Set Preferred Logger
            if ((not origPreferredLogger) or (origPreferredLogger and (not isDefinedLogger(origPreferredLogger, name)))):
                setPreferredLogger(logger)
                createdPreferredLogger = True

    # Existing Logger & No Name Defined
    else:

        # Using Mod
        origLogger = deepcopy(mod._logger)

        # Store Original Preferred Logger
        origPreferredLogger = deepcopy(getPreferredLogger())

        # Preferred Exists, Reuse
        if (origPreferredLogger):
            logger = origPreferredLogger
            createdLogger = True

        # Preferred does Not Exist, Reuse
        else: logger = origLogger

    # Return Logger Info
    return [origLogger, origPreferredLogger, createdPreferredLogger, createdLogger, logger]


# FUNCTION: Set Internal Mod Logger
def _setInternalModLogger(logger, mod):
    mod._logger = logger


# FUNCTION: Reset Internal Mod Logger
def _resetInternalModLogger(mod):
    if (hasattr(mod, '_logger')): del mod._logger


# FUNCTION: Set Global Logger
def _setGlobalLogger(logger):
    frames = inspecter.getouterframes(inspecter.currentframe())
    [frame.frame.f_globals.update({'_logger': logger}) for frame in frames[0:-1]]


# FUNCTION: Reset Global Logger
def _resetGlobalLogger():
    frames = inspecter.getouterframes(inspecter.currentframe())
    [frame.frame.f_globals.pop('_logger') for frame in frames[0:-1] if ('_logger' in frame.frame.f_globals)]


# FUNCTION: Remove Internal Logger
def _removeInternalLogger(origLogger, origPreferredLogger, createdPreferredLogger, createdLogger, trigger, logger, mod):

    # Trigger Clean Up
    if (trigger):

        # Clean Up Handlers
        [logger.removeHandler(handler) for handler in logger.handlers[:]]

        # Reset Using Mod
        if (mod): _resetInternalModLogger(mod)

        # Reset Using Globals
        else: _resetGlobalLogger()

        # Has Original Preferred Logger
        if (origPreferredLogger): setPreferredLogger(origPreferredLogger)

        # No Original Preferred Logger
        else: resetPreferredLogger()

    # Created Preferred Logger
    if (createdPreferredLogger):

        # Has Original Preferred Logger
        if (origPreferredLogger): setPreferredLogger(origPreferredLogger)

        # No Original Preferred Logger
        else: resetPreferredLogger()

    # Created Logger
    if (createdLogger):

        # Has Original Logger
        if (origLogger):

            # Using Mod
            if (mod): _setInternalModLogger(origLogger, mod)

            # Using Globals
            else: _setGlobalLogger(origLogger)

        # No Original Preferred Logger
        else:

            # Using Mod
            if (mod): _resetInternalModLogger(mod)

            # Using Globals
            else: _resetGlobalLogger()


# FUNCTION: Determine Module
def _determineModule(func):

    # Take Decorators into Account
    func = deepcopy(func)
    while (hasattr(func, '__wrapped__')):
        func = func.__wrapped__

    # Check if Function in Main
    main = sys.modules['__main__']
    foundObject = getattr(main, func.__name__, None)
    if (foundObject and (foundObject is func)): return main

    # Get Function File
    filePath = inspecter.getfile(func)

    # Look for Module (File Path Found)
    if (filePath):

        # Strip File Path
        strippedFilePath = filePath[:-3]

        # Look Up Static Module Path (With .py and/or .so)
        module = inspecter.getmodule(func)
        if (module and hasattr(module, '__file__') and (module.__file__[:-3] == strippedFilePath)): return module

        # Look Up Dynamic Module Path (Without .py or .so)
        if (hasattr(sys, '_dynamicModules')): return sys._dynamicModules.get(strippedFilePath)


# FUNCTION: Log Decorator
def log(returnValue=None, name=None, noLog=False, trigger=False):
    def logInternal(func):
        @wraps(func)
        def logWrapper(*args, **kwargs):

            # Determine if Module is Linked
            mod = _determineModule(func)

            # Determine Internal Logger
            [origLogger, origPreferredLogger, createdPreferredLogger, createdLogger, logger] = _determineInternalLogger(name=name, mod=mod)

            # Set Versioning Manager Logger
            if (hasattr(sys, '_versioningManager')): sys._versioningManager.setLogger(logger)

            # Trigger: Modify Logger for More Info
            if (trigger):
                logger = createTriggerLogger(logger, func)
                setPreferredLogger(logger)

            # Set Internal Logger
            if (createdLogger and mod): _setInternalModLogger(logger, mod)
            elif (not mod): _setGlobalLogger(logger)

            # Attempt Execute Function
            try:

                # Execute Function
                res = func(*args, **kwargs)

                # Remove Internal Logger
                _removeInternalLogger(origLogger, origPreferredLogger, createdPreferredLogger, createdLogger, trigger, logger, mod)

                # Return Result
                return res

            # Failed Execution
            except:

                # Log?
                if (not noLog): logger.error(' '.join(str(traceback.format_exc()).split()))

                # Remove Internal Logger
                _removeInternalLogger(origLogger, origPreferredLogger, createdPreferredLogger, createdLogger, trigger, logger, mod)

                # Return Value
                return (returnValue(args, kwargs) if callable(returnValue) else returnValue)

        return logWrapper
    return logInternal


# FUNCTION: Self Decorator
def selfDecorator(func):
    @wraps(func)
    def selfDecoratorWrapper(**self):
        return func(Obj(self))
    return selfDecoratorWrapper


# FUNCTION: File Upload Decorator
@log()
def fileUpload(files):

    # Set Logger
    logger = _logger

    # Wrapper Function
    def fileUploadInternal(func):

        # Wrapper Function
        @wraps(func)
        def fileUploadWrapper(**kwargs):
            fileMapping = {}
            oneFileFound = False
            for file in files:
                if (file['name'] in request.files):
                    if (request.files[file['name']] and ('/' not in request.files[file['name']].filename)):
                        if ((('contentType' not in file) or (file['contentType']) in str(request.files[file['name']].content_type)) and (('extension' not in file) or ([ext for ext in file['extension'] if (request.files[file['name']].filename.lower().endswith(ext))]))):
                            fileMapping[file['name']] = {'file': request.files[file['name']], 'fileName': (secure_filename(request.files[file['name']].filename) if file['secure'] else request.files[file['name']].filename)}
                            oneFileFound = True
                        else:
                            logger.warning('File ' + str(file['name']) + ' has an incorrect content type or extension') # noCoverage
                            return ('', 400) # noCoverage
                    else:
                        logger.warning('Unsecure file name for ' + str(file['name']) + ' is not allowed for upload') # noCoverage
                        return ('', 400) # noCoverage
            if (not oneFileFound):
                logger.warning('No file was added to the upload request') # noCoverage
                return ('', 400) # noCoverage
            return func(**{**kwargs, **{'files': fileMapping}})

        # Return Function
        return fileUploadWrapper

    # Return Function
    return fileUploadInternal


# EXCEPTION: Return Code Exception
class RtnCodeException(Exception):
    pass


# FUNCTION: Evaluate Return Code
def evalRtnCode(successRtn=None, failedRtn=None, exception=RtnCodeException):
    def evalRtnCodeInternal(func):
        @wraps(func)
        def evalRtnCodeWrapper(*args, **kwargs):
            resultCode = func(*args, **kwargs)
            if (exception):
                if (not resultCode):
                    msg = 'Function "' + str(func.__name__) + '" returned a negative result code'
                    raise exception(msg)
            else:
                return (successRtn if resultCode else failedRtn)
        return evalRtnCodeWrapper
    return evalRtnCodeInternal


# REMOVE: Functions without Logging
del globals()['readJSONFile']
del globals()['createDir']
del globals()['createDirPath']


# FUNCTION: Read JSON File (Logging)
@log()
def readJSONFile(file):
    with open(file, encoding='utf-8') as content:
        _logger.debug('Found ' + str(file))
        return ujson.load(content)


# FUNCTION: Write JSON File (Logging)
@log()
def writeJSONFile(file, info):
    with open(file, 'w+') as content:
        ujson.dump(info, content)
        _logger.debug('Wrote to ' + str(file))


# FUNCTION: Write Clean JSON File (Logging)
@log()
def writeCleanJSONFile(file, info):
    with open(file, 'w+') as content:
        json.dump(info, content, indent=4, sort_keys=True)
        _logger.debug('Wrote to ' + str(file))


# FUNCTION: Read Text File (Logging)
@log()
def readTextFile(file):
    with open(file, 'r') as content:
        _logger.debug('Found ' + str(file))
        return content.read()


# FUNCTION: Read Text File Bytes (Logging)
@log()
def readTextFileBytes(file):
    with open(file, 'rb') as content:
        _logger.debug('Found ' + str(file))
        return content.read()


# FUNCTION: Write Text File (Logging)
@log()
def writeTextFile(file, info):
    content = open(file, 'w+')
    content.write(info)
    content.close()
    _logger.debug('Wrote to ' + str(file))


# FUNCTION: Write Text File Bytes (Logging)
@log()
def writeTextFileBytes(file, info):
    content = open(file, 'wb+')
    content.write(info)
    content.close()
    _logger.debug('Wrote to ' + str(file))


# FUNCTION: Write Replaced Text File (Logging)
@log()
def writeReplacedTextFile(file, info, changes):
    for orig, new in changes.items():
        info = info.replace(orig, new)
    writeTextFile(file, info)


# FUNCTION: Read Tables File
@log()
def readTablesFile():
    if (os.path.isfile('/etc/neatly/base/table/table.json')):
        return readJSONFile('/etc/neatly/base/table/table.json')
    else:
        return readJSONFile('/etc/neatly/base/table/default.json')


# FUNCTION: Generate UID from String
@log()
def generateUIDfromString(str):
    return hashlib.md5(str.encode('utf-8')).hexdigest()


# FUNCTION: Generate Get All Rights
@log()
def generateGetAllRights(apiObjects=[]):
    return [{'apiObject': {'name': apiObject}, 'apiAction': {'name': 'Get'}, 'right': 'all'} for apiObject in apiObjects]


# FUNCTION: Calculate Hash (from File)
@log()
def calculateHashFromFile(ref, path=(sys.sharedConfig.location['lib'] + 'objects' + '/')):
    md5Object = hashlib.md5()
    blockSize = 128*md5Object.block_size
    file = open((path + ref), 'rb')
    chunk = file.read(blockSize)
    while chunk:
        md5Object.update(chunk)
        chunk = file.read(blockSize)
    return md5Object.hexdigest()


# FUNCTION: Calculate Hash (from Objects)
@log()
def calculateHash(content):
    return hashlib.md5(ujson.dumps(content, sort_keys=True).encode('utf-8')).hexdigest()


# FUNCTION: Log Executor
@log(returnValue='N/A')
def logExecutor(execParameter):
    if ('user' in execParameter):
        return ('User ' + str(execParameter['user'].id))
    elif ('plugin' in execParameter):
        return ('Plugin ' + str(execParameter['plugin'].id))
    elif (('internal' in execParameter) and execParameter['internal']):
        return str(execParameter['source'])
    return 'N/A'


# FUNCTION: Move Directory Files
@log()
def moveDirFiles(sourceDir, destDir):
    files = os.listdir(sourceDir)
    for file in files:
        shutil.move(sourceDir + ('' if (sourceDir.endswith('/')) else '/') + file, destDir)


# FUNCTION: Create Directory Path
@log()
def createDirPath(fullPath):
    splittedPath = fullPath.split('/')
    [createDir('/'.join(splittedPath[0:i])) for i in range(1, (len(splittedPath)+1)) if splittedPath[i-1]]


# FUNCTION: Create Directory
@log()
def createDir(dir):
    if (not os.path.isdir(dir)):
        os.mkdir(dir)


# FUNCTION: Remove Directory
@log()
def removeDir(dir):
    if (os.path.isdir(dir)):
        shutil.rmtree(dir)


# FUNCTION: Remove File
@log()
def removeFile(file):
    if (os.path.isfile(file)):
        os.remove(file)


# FUNCTION: Register File
@log()
def registerFile(dir, file):
    _logger.info('Registering ' + str(file) + ' in ' + sys.sharedConfig.location['lib'] + 'transition/' + str(dir))
    timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S-%f')
    createDir(sys.sharedConfig.location['lib'] + 'transition')
    createDir(sys.sharedConfig.location['lib'] + 'transition/' + dir)
    if (os.path.isfile(file)):
        fileContent = readTextFile(file)
        writeTextFile(sys.sharedConfig.location['lib'] + 'transition/' + dir + '/' + timestamp, fileContent)


# FUNCTION: Create Symbolic Link
@log()
def createSymbolicLink(config):
    source = (sys.sharedConfig.location[config['source']['location']] if (config['source']['location']) else '') + config['source']['path']
    target = (sys.sharedConfig.location[config['target']['location']] if (config['target']['location']) else '') + config['target']['path']
    shHandler()(sys.executables.symLink)('-fs', source, target)
    _logger.info('Successfully created symbolic link ' + (('for ' + config['type']) if (config['type']) else ('to: ' + target)))


# FUNCTION: Create DB Path from Config (Logging)
@log()
def createDBPathConfig(config):
    dbPath = config['type'] + '://' + config['userName'] + ':' + config['password'] + '@' + config['ip'] + ':' + str(config['port']) + '/' + config['db'] + ('?client_encoding=utf8' if (config['type'] == 'postgresql') else '')
    _logger.debug('Created database path')
    return dbPath


# FUNCTION: Get All Classes
def getAllClasses(tables):
    return [className[1] for className in inspecter.getmembers(tables, inspecter.isclass) if (className[1].__module__ == 'tables') and (className[0] != 'Generic')]


# FUNCTION: Get All Class Names
def getAllClassNames(tables):
    return list(tables.allKnownTables['class'].keys())


# FUNCTION: Get All Class Names (Lower Case)
def getAllClassNamesLowerCase(tables):
    return [className.lower() for className in getAllClassNames(tables)]


# FUNCTION: Get All Table Names
def getAllTableNames(tables):
    return [val['private']['__tablename__'] for key, val in tables.allKnownTables['class'].items()]


# FUNCTION: Get Table Name by Class
def getTableNameByClass(specifiedClass):
    return specifiedClass.__tablename__


# FUNCTION: Get Class by Name
def getClassByName(name, tables):
    classes = [className[1] for className in inspecter.getmembers(tables, inspecter.isclass) if (className[1].__module__ == 'tables') and (className[0] != 'Generic') and (className[0].lower() == name.lower())]
    return (classes[0] if (classes) else None)


# FUNCTION: Get Class Name
def getClassName(name, tables):
    foundClasses = [className for className in getAllClassNames(tables) if (className.lower() == name.lower())]
    return (foundClasses[0] if (foundClasses) else None)


# FUNCTION: Get Child Class
def getChildClass(specifiedClass, child):
    if isinstance(child, list):
        childClass = getattr(specifiedClass, child[0]).property.mapper.class_
        return (getChildClass(childClass, child[1:]) if (child[1:]) else childClass)
    else:
        return getattr(specifiedClass, child).property.mapper.class_


# FUNCTION: Return JSON Response
@log(returnValue=(None, 500))
def jsonify(obj):
    return (orjson.dumps(obj).decode('utf-8'), 200, {'Content-Type': 'application/json'})


# FUNCTION: Serialize List
def serializeList(objects, extra=[], **kwargs):
    if ('rights' not in kwargs): kwargs['rights'] = g.rights
    if (('user' not in kwargs) and (not kwargs.get('internal', False))): kwargs['user'] = g.user
    return [obj.getPublic(kwargs, extra=extra) for obj in objects]


# FUNCTION: Serialize Object
def serializeObject(obj, extra=[], **kwargs):
    if ('rights' not in kwargs): kwargs['rights'] = g.rights
    if (('user' not in kwargs) and (not kwargs.get('internal', False))): kwargs['user'] = g.user
    return obj.getPublic(kwargs, extra=extra)


# FUNCTION: Kill Sleeping Connections
@log(returnValue=False)
def killSleepingConnections():

    # Log Message
    _logger.info('Killing sleeping connections of: ' + str(sys.sharedConfig.db['connection']['db']))

    # Revoke Connect
    [revokeOut, revokeStatus] = shHandler(handler=shPasswordHandler(sys.sharedConfig.db['connection']['password']))(sys.executables.dbClient)('-U', sys.sharedConfig.db['connection']['userName'], sys.sharedConfig.db['connection']['db'], '-c', 'REVOKE CONNECT ON DATABASE ' + sys.sharedConfig.db['connection']['db'] + ' FROM public;')

    # Kill Connections
    [killOut, killStatus] = shHandler(handler=shPasswordHandler(sys.sharedConfig.db['connection']['password']))(sys.executables.dbClient)('-U', sys.sharedConfig.db['connection']['userName'], sys.sharedConfig.db['connection']['db'], '-c', 'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname=current_database() AND pid <> pg_backend_pid();')

    # Status
    status = (revokeStatus and killStatus)

    # Log Message
    if (status): _logger.info('Killed all sleeping connections')
    else: _logger.warning('Failed to kill sleeping connections')

    # Return Status
    return status


# FUNCTION: Allow DB Reconnect
@log(returnValue=False)
def allowDBReconnect():

    # Log Message
    _logger.info('Allowing reconnect on: ' + str(sys.sharedConfig.db['connection']['db']))

    # Allow Reconnect
    [connectOut, connectStatus] = shHandler(handler=shPasswordHandler(sys.sharedConfig.db['connection']['password']))(sys.executables.dbClient)('-U', sys.sharedConfig.db['connection']['userName'], sys.sharedConfig.db['connection']['db'], '-c', 'GRANT CONNECT ON DATABASE ' + sys.sharedConfig.db['connection']['db'] + ' TO public;')

    # Log Message
    if (connectStatus): _logger.info('Allowed reconnecting')
    else: _logger.warning('Failed to allow reconnecting')

    # Return Status
    return connectStatus


# FUNCTION: Objectify
def objectify(dictionary):
    return Obj(dictionary)


# FUNCTION: Object Key Difference
@log(returnValue=[])
def objectKeyDiff(pre, post):
    return [key for key, val in pre.items() if (val != post[key])]


# FUNCTION: Flatten Array
@log(returnValue=[])
def flattenArray(arr):
    out = []
    for i in arr:
        if isinstance(i, list):
            for j in flattenArray(i):
                if isinstance(j, list):
                    out.append(flattenArray(j))
                else:
                    out.append(j)
        else:
            out.append(i)
    return out


# FUNCTION: Cut Array in Chunks
@log(returnValue=[])
def cutArrayInChunks(arr, size):
    for i in range(0, len(arr), size):
        yield arr[i:i+size]


# FUNCTION: Split Array in Equal Parts
@log(returnValue=[])
def splitArrayInEqualParts(arr, size):
    return list(cutArrayInChunks(arr, size))


# FUNCTION: Add Sync Dicts
@log(returnValue=(lambda x,y: x[0][0]))
def addSyncDicts(dicts):
    base = dicts[0]
    for dic in dicts[1:]:
        if isinstance(dic, dict):
            for k, v in dic.items():
                base[k] = (v if (k not in base) else addSyncDicts([base[k], v]))
    return base


# FUNCTION: Add Sync Config
@log(returnValue=(lambda x,y: x[0][0]))
def addSyncConfig(dicts):
    base = dicts[0]
    for dic in dicts[1:]:
        if isinstance(dic, dict):
            for k, v in dic.items():
                if (k not in base):
                    base[k] = v
                elif (base[k] is None):
                    base[k] = v
                elif (isinstance(v, list) and isinstance(base[k], list)):
                    base[k].extend(v)
                else:
                    base[k] = addSyncConfig([base[k], v])
        elif isinstance(dic, list):
            base.extend(dic)
    return base


# FUNCTION: Determine Passed Rights
@log(returnValue=False)
def determinePassedRights(right, specificRight=None):
    if (specificRight is not None):
        if ((specificRight == 'all') and right[2]):
            return 'all'
        elif ((specificRight == 'isolated') and (right[1] or right[2])):
            return 'isolated'
        elif ((specificRight == 'own') and (right[0] or right[1] or right[2])):
            return 'own'
    if right[2]:
        return 'all'
    elif right[1]:
        return 'isolated'
    elif right[0]:
        return 'own'
    return False


# FUNCTION: Load Library
@log()
def loadLibrary(libPath, autoExt=True, dynamic=False):

    # Log Message
    _logger.debug('Loading library: ' + libPath)

    # Define Library Properties
    libName = libPath.split('/')[-1].split('.')[0]
    fullLibPath = libPath + (('.py' if (sys.sharedConfig.envConfig) else '.so') if (autoExt) else '')

    # Load Library
    spec = spec_from_file_location(libName, fullLibPath)
    lib = module_from_spec(spec)
    spec.loader.exec_module(lib)

    # Link Module to Sys
    if (dynamic):
        # Dynamic (Without .py or .so) -> Add to '_dynamicModules'
        if (not hasattr(sys, '_dynamicModules')): sys._dynamicModules = {}
        dynamicFilePath = fullLibPath[:-3]
        sys._dynamicModules[dynamicFilePath] = lib
    else:
        # Static -> Add to 'modules'
        sys.modules[libName] = lib

    # Return Library
    return lib


# FUNCTION: Get Imported Neatly Libraries
@log()
def getImportedNeatlyLibs(dynamic=True):

    # Define Variables
    modules = []

    # Regular Imported Modules
    modules.extend([mod for name, mod in sys.modules.items() if (hasattr(mod, '__file__')) and (mod.__file__.startswith(sys.sharedConfig.location['lib']))])

    # Dynamically Imported Modules
    if hasattr(sys, '_dynamicModules'):
        modules.extend([mod for path, mod in sys._dynamicModules.items() if (path.startswith(sys.sharedConfig.location['lib']))])

    # Return Modules
    return modules


# FUNCTION: Plugin Lib Exists
@log()
def pluginLibExists(pluginId, libSpec, defaultPath='lib'):
    return os.path.isfile(sys.sharedConfig.location['lib'] + 'plugin/' + str(pluginId) + '/' + '/'.join([defaultPath] + libSpec.split('.')) + ('.py' if (sys.sharedConfig.envConfig) else '.so'))


# FUNCTION: Load Plugin Library
@log()
def loadPluginLibrary(pluginId, libSpec, defaultPath='lib'):
    _logger.debug('Loading library of plugin ' + str(pluginId) + ': ' + libSpec)
    libPath = sys.sharedConfig.location['lib'] + 'plugin/' + str(pluginId) + '/' + '/'.join([defaultPath] + libSpec.split('.'))
    return loadLibrary(libPath, autoExt=True, dynamic=True)


# FUNCTION: Get File Size
@log()
def getFileSize(ref, path=(sys.sharedConfig.location['lib'] + 'objects' + '/')):
    return int(os.stat(path + ref).st_size/1024)


# FUNCTION: Unique File Reference
@log()
def uniqueFileReference(path=(sys.sharedConfig.location['lib'] + 'objects' + '/')):
    fileReference = ''.join(choices(ascii_letters + digits, k=100))
    existingFiles = next(os.walk(path))[2]
    unique = False
    while (not unique):
        if (fileReference not in existingFiles):
            unique = True
        else:
            fileReference = ''.join(choices(ascii_letters + digits, k=100))
    return fileReference


# CLASS: Recurring Task Handler
class RecurringTaskHandler():

    # FUNCTION: Initialise
    def __init__(self, name, func, params={}, checkStatus=True, keyword=True, logger=logger, evalTime=1):

        # Initialised Variables
        self.name = name
        self.func = func
        self.params = params
        self.checkStatus = checkStatus
        self.keyword = keyword
        self.logger = logger
        self.evalTime = evalTime

        # Default Variables
        self.prevExec = None
        self.nextExec = None
        self.stopping = False
        self.stopped = False
        self.evaluate = None
        self.inExec = False

        # Log Handler Creation
        self.logger.info(self.logInfo() + 'Created recurring task handler')

        # Signal Handling
        signal.signal(signal.SIGINT, self.signalHandler)
        signal.signal(signal.SIGTERM, self.signalHandler)

    # FUNCTION: Task Handler Log Info
    def logInfo(self):
        return '<RecurringTaskHandler ' + self.name + '> '

    # FUNCTION: Set Next Execution Target Time
    def setNextExec(self, target=None):
        self.nextExec = (datetime.now() if (target is True) else target)
        self.logger.info(self.logInfo() + 'Next execution target time is set to: ' + str(self.nextExec))

    # FUNCTION: Update Parameters
    def updateParams(self, params):
        self.params = params
        self.logger.info(self.logInfo() + 'Updated parameters')

    # FUNCTION: Available for Setting Next Run
    def available(self):
        return ((self.nextExec is None) and (not self.inExec))

    # FUNCTION: Start
    def start(self):
        self.logger.info(self.logInfo() + 'Starting recurring task handler')
        self.setNextExec(target=True)
        self.startEvaluating()

    # FUNCTION: Stop
    def stop(self, block=True):
        self.logger.info(self.logInfo() + 'Stopping recurring task handler')
        self.setNextExec(target=None)
        self.stopEvaluating(block=block)

    # FUNCTION: Signal Handler
    def signalHandler(self, signal, frame):
        self.logger.warning(self.logInfo() + 'Received termination signal')
        if (not self.stopping):
            self.stop()

    # FUNCTION: Start Evaluating
    def startEvaluating(self):
        self.stopping = False
        self.stopped = False
        if (not self.evaluate):
            self.evaluate = self.TimeExecIteration(self)
            self.evaluate.start()
        elif (not self.evaluate.is_alive()):
            self.evaluate.start()
        else:
            self.logger.info(self.logInfo() + 'Already evaluating execution')

    # FUNCTION: Stop Evaluating
    def stopEvaluating(self, block=True):
        self.stopping = True
        self.logger.info(self.logInfo() + 'Awaiting pending process completion')
        if (block):
            if (self.evaluate):
                while (self.evaluate.is_alive()): pass
        self.logger.info(self.logInfo() + 'Stopped evaluating execution')
        self.stopped = True
        self.stopping = False
        if (not block):
            self.inExec = False
            self.logger.info(self.logInfo() + 'Completed execution of function')

    # CLASS: Time Execution Iteration
    class TimeExecIteration(threading.Thread):

        # FUNCTION: Initialise
        def __init__(self, parent):

            # Init Thread
            threading.Thread.__init__(self)

            # Initialised Variables
            self.parent = parent

        # FUNCTION: Check Execution Time
        def checkNextExec(self):
            if (self.parent.nextExec and (self.parent.nextExec < datetime.now())):
                self.parent.inExec = True
                self.parent.prevExec = self.parent.nextExec
                self.parent.nextExec = None
                self.parent.logger.info(self.parent.logInfo() + 'Starting execution of function')
                return True
            else:
                return False

        # FUNCTION: Run
        def run(self):
            self.parent.logger.info(self.parent.logInfo() + 'Started evaluating execution')
            while (not self.parent.stopping):
                if (self.checkNextExec()):
                    execStatus = (self.parent.func(**self.parent.params) if (self.parent.keyword) else self.parent.func(self.parent.params))
                    if (self.parent.checkStatus and (not execStatus)):
                        self.parent.logger.warning(self.parent.logInfo() + 'Received failed status code from executed function, initiating stop procedure')
                        if (not self.parent.stopping):
                            self.parent.stop(block=False)
                            break
                    self.parent.inExec = False
                    self.parent.logger.info(self.parent.logInfo() + 'Completed execution of function')
                sleep(self.parent.evalTime)


# CLASS: Task Handler Setter
class TaskHandlerSetter():

    # FUNCTION: Initialise
    def __init__(self, taskHandler, nextExecFunc=None, logger=logger, evalTime=1):

        # Initialised Variables
        self.taskHandler = taskHandler
        self.nextExecFunc = nextExecFunc
        self.logger = logger
        self.evalTime = evalTime

        # Default Variables
        self.evalFunc = None
        self.evalParams = {}

        # Log Handler Creation
        self.logger.info(self.logInfo() + 'Created task handler setter')

    # FUNCTION: Task Handler Setter Log Info
    def logInfo(self):
        return '<RecurringTaskHandlerSetter ' + self.taskHandler.name + '> '

    # FUNCTION: Set Next Execution Function
    def setNextExecFunc(self, nextExecFunc):
        self.nextExecFunc = nextExecFunc
        self.logger.info(self.logInfo() + 'Updated next execution function')

    # FUNCTION: Set Eval Function
    def setEvalFunc(self, evalFunc):
        self.evalFunc = evalFunc
        self.logger.info(self.logInfo() + 'Updated evaluation function')

    # FUNCTION: Set Eval Params
    def setEvalParams(self, **kwargs):
        self.evalParams.update(kwargs)
        self.logger.info(self.logInfo() + 'Updated evaluation parameters')

    # FUNCTION: Run
    def run(self):
        self.taskHandler.start()
        while (not self.taskHandler.stopped):
            if (self.evalFunc):
                self.evalFunc(**self.evalParams)
            if (self.taskHandler.available()):
                now = datetime.now()
                nextExecTime = self.nextExecFunc(self.taskHandler)
                if (nextExecTime < now):
                    self.logger.warning(self.logInfo() + 'Next scheduled execution target time occurs in the past')
                self.taskHandler.setNextExec(nextExecTime)
            sleep(self.evalTime)


# CLASS: Model Change Event
class ModelChangeEvent():

    # FUNCTION: Initialise
    def __init__(self, session, callbacks):

        # Track Model Changes
        self.model_changes = {}

        # Allow Only after_commit Triggers
        self.callbacks = [callback for callback in callbacks if (callback[1] in ('after_commit_insert', 'after_commit_update', 'after_commit_delete'))]

        # Triggers
        sa.event.listen(session, 'before_flush', self.recordOperations)
        sa.event.listen(session, 'before_commit', self.recordOperations)
        sa.event.listen(session, 'after_commit', self.afterCommit)
        sa.event.listen(session, 'after_rollback', self.afterRollback)

    # FUNCTION: Record Operations
    def recordOperations(self, session, flush_context=None, instances=None):
        for targets, operation in ((session.new, 'insert'), (session.dirty, 'update'), (session.deleted, 'delete')):
            for target in targets:
                state = inspect(target)
                key = state.identity_key if state.has_identity else id(target)
                self.model_changes[key] = (target, operation)

    # FUNCTION: After Commit
    def afterCommit(self, session):
        if self.model_changes:
            allChanges = list(self.model_changes.values())
            for callback in self.callbacks:
                changes = [(target, op) for target, op in allChanges if isinstance(target, callback[0]) and (op == callback[1].split('_')[-1])]
                if (changes):
                    callback[2](changes)
            self.model_changes.clear()

    # FUNCTION: After Rollback
    def afterRollback(self, session):
        self.model_changes.clear()


# FUNCTION: Map Alias
@log(returnValue=(lambda x,y: aliased(x[1])))
def mapAliases(subPropertyElement, joinElement, aliases):
    for aliasKey, aliasDefinitions in aliases.items():
        for aliasDefinition in aliasDefinitions:
            if ((aliasDefinition['joinElement'] is joinElement) and (aliasDefinition['subPropertyElement'] == subPropertyElement)):
                return aliasDefinition['alias']
    return aliased(joinElement)


# FUNCTION: Split in Aliases
@log()
def splitInAliases(object, aliases, foundSubProperties):
    for subProperty in foundSubProperties:
        if (subProperty not in aliases):
            if (subProperty):
                joinElement = object
                for subPropertyElement in subProperty.split('.'):
                    if (subProperty not in aliases): aliases[subProperty] = []
                    joinElement = (getattr(getSubAlias(aliases[subProperty]), subPropertyElement) if (aliases[subProperty]) else getattr(joinElement, subPropertyElement))
                    aliases[subProperty].append({'subPropertyElement': subPropertyElement, 'joinElement': joinElement, 'alias': mapAliases(subPropertyElement, joinElement, aliases), 'loaded': False})
    aliases[None] = [{'subPropertyElement': None, 'joinElement': None, 'alias': object, 'loaded': False}]
    return aliases


# FUNCTION: Join Aliases
@log()
def joinAliases(query, aliases):
    joinedAliases = []
    for subProperty, subAliases in aliases.items():
        for subAlias in subAliases:
            if ((subAlias['joinElement']) and (subAlias['alias'] not in joinedAliases) and (not subAlias['loaded'])):
                query = query.outerjoin(subAlias['alias'], subAlias['joinElement'])
                joinedAliases.append(subAlias['alias'])
                subAlias['loaded'] = True
    return [query, aliases]


# FUNCTION: Create and Join Aliases
@log()
def createAndJoinAliases(query, object, aliases, foundSubProperties):
    aliases = splitInAliases(object, aliases, foundSubProperties)
    [query, aliases] = joinAliases(query, aliases)
    return [query, aliases]


# FUNCTION: Get Count
@log()
def getCount(query):
    countQuery = query.statement.with_only_columns([func.count()]).order_by(None)
    return query.session.execute(countQuery).scalar()


# FUNCTION: Get Sub Alias
@log()
def getSubAlias(aliasList):
    return aliasList[-1]['alias']


# FUNCTION: Read Topics
@log(returnValue=[])
def readTopics():
    consumer = KafkaConsumer(group_id='neatly', bootstrap_servers=['localhost:9092'])
    topics = list(consumer.topics())
    consumer.close()
    return topics


# FUNCTION: Create Topics
@log()
def createTopics(default=False):
    topics = (readJSONFile('/etc/neatly/base/messaging/topic/default.json') if (default) else readJSONFile('/etc/neatly/base/messaging/topic/topic.json'))
    _logger.info('Creating all topics')
    existingTopics = readTopics()
    for topic in topics:
        if (topic['name'] not in existingTopics):
            createTopic(topic)
        else:
            _logger.debug('Topic ' + topic['name'] + ' already exists')
    _logger.debug('Created all topics')


# FUNCTION: Create Topic
@log()
def createTopic(topic):
    _logger.info('Creating topic: ' + str(topic['name']))
    adminClient = KafkaAdminClient(bootstrap_servers='localhost:9092', client_id='neatly')
    topicList = [NewTopic(name=topic['name'], num_partitions=topic['numPartitions'], replication_factor=topic['replicationFactor'])]
    adminClient.create_topics(new_topics=topicList, validate_only=False)
    adminClient.close()
    _logger.debug('Created topic: ' + str(topic['name']))


# FUNCTION: Create Producer
@log()
def createProducer():
    _logger.debug('Creating messaging producer')
    if (not os.path.isfile('/etc/neatly/base/messaging/topic/topic.json')):
        createTopics(True)
    return KafkaProducer(bootstrap_servers=['localhost:9092'], value_serializer=(lambda x: orjson.dumps(x)))


# FUNCTION: Create Consumer
@log()
def createConsumer(topics, group=None, earliest=False):
    _logger.debug('Creating messaging consumer on topics: ' + ','.join(topics))
    if (not os.path.isfile('/etc/neatly/base/messaging/topic/topic.json')):
        createTopics(True)
    return KafkaConsumer(*topics, bootstrap_servers=['localhost:9092'], auto_offset_reset=('earliest' if earliest else 'latest'), enable_auto_commit=True, group_id=group, value_deserializer=(lambda x: orjson.loads(x.decode('utf-8'))))


# FUNCTION: Send Message
@log(returnValue=False)
def sendMessage(producer, topic, message, timeout=60):
    response = producer.send(topic, message)
    return (True if response.get(timeout=timeout) else False)


# FUNCTION: Create Plugin Option Dict
@log(returnValue={})
def createPluginOptionDict(pluginOption):
    return {'plugins': {str(pluginOption.plugin_id): {pluginOption.group: {pluginOption.option: pluginOption.value}}}}


# FUNCTION: Update Config Generic
@log()
def updateConfigGeneric(name, plugins, defaultFile, targetFile, pluginFile, syncMethod=addSyncConfig, wrapper=None):

    # Log Message
    _logger.info('Updating ' + str(name) + ' config')
    _logger.info('Including plugins: ' + (', '.join([str(plugin.id) for plugin in plugins]) if (plugins) else str(None)))

    # Load Default File
    defaultConfig = readJSONFile(sys.sharedConfig.location['config'] + defaultFile)
    configDicts = [defaultConfig]

    # Add Plugin Config
    for plugin in plugins:
        configFilePath = sys.sharedConfig.location['lib'] + 'plugin/' + str(plugin.id) + '/' + pluginFile
        if (os.path.isfile(configFilePath)):
            configDicts.append(readJSONFile(configFilePath))

    # Wrapper
    if (wrapper): wrapper(configDicts)

    # Sync Configurations
    newConfig = syncMethod(configDicts)

    # Write Target Configuration
    writeCleanJSONFile(sys.sharedConfig.location['config'] + targetFile, newConfig)

    # Log Message
    _logger.info('Successfully updated ' + str(name) + ' config')


# FUNCTION: Update GUI Config
@log()
def updateGUIConfig(plugins, publicPluginOptions):
    wrapper = (lambda config: [config.append(createPluginOptionDict(publicPluginOption)) for publicPluginOption in publicPluginOptions])
    updateConfigGeneric('GUI', plugins, 'gui/default.json', 'gui/gui.json', 'gui/config/gui.json', wrapper=wrapper)


# FUNCTION: Update API Config
def updateAPIConfig(plugins):
    updateConfigGeneric('API', plugins, 'api/default.json', 'api/api.json', 'api/api.json')


# FUNCTION: Update Translations Config
@log()
def updateTranslationsConfig(plugins):

    # Log Message
    _logger.info('Updating translations config')

    # Get Original Translations
    translations = next(os.walk(sys.sharedConfig.location['config'] + 'gui/translations/original/'))[2]

    # Iterate over Translations
    for trans in translations:

        # Update Translation
        updateConfigGeneric(('translation ' + trans.replace('.json', '')), plugins, ('gui/translations/original/' + trans), ('gui/translations/' + trans), ('gui/translations/' + trans))

    # Log Message
    _logger.info('Successfully updated translations config')


# FUNCTION: Update Topic Config
def updateTopicConfiguration(plugins):
    updateConfigGeneric('topic', plugins, 'messaging/topic/default.json', 'messaging/topic/topic.json', 'messaging/topic/topic.json')


# FUNCTION: Update Service Config
def updateServiceConfig(plugins):
    updateConfigGeneric('service', plugins, 'service/default.json', 'service/service.json', 'service/service.json')


# FUNCTION: Update Producer Config
def updateProducerConfig(plugins):
    updateConfigGeneric('producer', plugins, 'messaging/producer/default.json', 'messaging/producer/producer.json', 'messaging/producer/producer.json')


# FUNCTION: Update Consumer Config
def updateConsumerConfig(plugins):
    updateConfigGeneric('consumer', plugins, 'messaging/consumer/default.json', 'messaging/consumer/consumer.json', 'messaging/consumer/consumer.json')


# FUNCTION: Update Logging Config
def updateLoggingConfig(plugins):
    updateConfigGeneric('logging', plugins, 'logging/default.json', 'logging/logging.json', 'logging/logging.json')


# FUNCTION: Update Table Config
def updateTableConfig(plugins):
    updateConfigGeneric('table', plugins, 'table/default.json', 'table/table.json', 'table/table.json')


# FUNCTION: Update Symbolic Link Config
def updateSymbolicLinkConfig(plugins):
    updateConfigGeneric('symbolic link', plugins, 'gui/symlink/default.json', 'gui/symlink/symlink.json', 'gui/symlink/symlink.json')


# FUNCTION: Symbolic Link Config Files
@log()
def symbolicLinkConfigFiles():
    symbolicLinks = readJSONFile('/etc/neatly/base/gui/symlink/symlink.json')
    [createSymbolicLink(symbolicLink) for symbolicLink in symbolicLinks]


# FUNCTION: Determine DB Version
@lru_cache
@log()
def determineDBVersion(session):
    if (sys.sharedConfig.db['connection']['type'].startswith('postgresql')):
        return ' '.join(session.execute('SELECT VERSION();').fetchone()[0].split(' ')[0:2])
    _logger.error('Unable to read the database version') # noCoverage
    return None # noCoverage


# FUNCTION: Determine Web Server Version
@lru_cache
@log()
def determineWebServerVersion():
    [out, status] = shHandler()(sys.executables.nginx)('-v')
    return out.split('/')[1].replace('\n', '')


# FUNCTION: Determine Kafka Version
@lru_cache
@log()
def determineKafkaVersion():
    kafkaLibs = next(os.walk('/opt/kafka/libs/'))[2]
    kafkaJar = min([f for f in kafkaLibs if f.startswith('kafka_')], key=len)
    kafkaVersion = kafkaJar.split('-')[1].replace('.jar', '')
    return kafkaVersion


# FUNCTION: Determine Python Version
@lru_cache
@log()
def determinePythonVersion():
    return sys.version.split(' ')[0]


# FUNCTION: Update API Protocol
@log()
def updateAPIProtocol(protocol):
    defaultAPIConfig = readJSONFile('/etc/neatly/base/api/default.json')
    defaultAPIConfig['protocol'] = protocol
    writeCleanJSONFile('/etc/neatly/base/api/default.json', defaultAPIConfig)
    defaultGUIConfig = readJSONFile('/etc/neatly/base/gui/default.json')
    defaultGUIConfig['apiRootUrl'] = protocol + '://' + defaultGUIConfig['apiRootUrl'].split('://')[1]
    writeCleanJSONFile('/etc/neatly/base/gui/default.json', defaultGUIConfig)


# FUNCTION: Update GUI Protocol
@log()
def updateGUIProtocol(protocol):
    defaultGUIConfig = readJSONFile('/etc/neatly/base/gui/default.json')
    defaultGUIConfig['protocol'] = protocol
    writeCleanJSONFile('/etc/neatly/base/gui/default.json', defaultGUIConfig)


# FUNCTION: Read SSL
@log()
def readSSL(config):
    sslInfo = {}
    if ('ssl' in config):
        _logger.debug('Found SSL config')
        sslInfo['certificate'] = (config['ssl']['certificate'].split('/')[-1] if ('certificate' in config['ssl']) else None)
        sslInfo['key'] = (config['ssl']['key'].split('/')[-1] if ('key' in config['ssl']) else None)
        if (sslInfo['certificate']):
            cert = sslCheck.load_certificate(sslCheck.FILETYPE_PEM, open(config['ssl']['certificate']).read())
            issuer = cert.get_issuer()
            sslInfo['issuer'] = {
                'organisation': (issuer.O if (issuer.O) else None),
                'location': ((issuer.L + ', ' + issuer.C if (issuer.L) else issuer.C) if (issuer.C) else None)
            }
            sslInfo['expiryDate'] = datetime.strptime(cert.get_notAfter().decode('ascii'), '%Y%m%d%H%M%SZ').isoformat()
        return sslInfo
    else:
        _logger.info('No SSL config present')
        return None


# FUNCTION: Has Valid SSL
@log(returnValue=False)
def hasValidSSL(config):
    sslInfo = readSSL(config)
    if (sslInfo and sslInfo['certificate'] and sslInfo['key'] and (datetime.fromisoformat(sslInfo['expiryDate']) > datetime.now())):
        _logger.debug('Valid SSL config detected')
        return True
    _logger.warning('Invalid SSL config detected')
    return False


# FUNCTION: Update SSL Config
@log()
def updateSSLConfig(type, fileName):
    defaultConfig = readJSONFile('/etc/neatly/base/api/default.json')
    if (type == 'certificate'):
        if ('ssl' not in defaultConfig):
            defaultConfig['ssl'] = {}
        defaultConfig['ssl']['certificate'] = '/etc/neatly/base/ssl/' + fileName
    if (type == 'key'):
        if ('ssl' not in defaultConfig):
            defaultConfig['ssl'] = {}
        defaultConfig['ssl']['key'] = '/etc/neatly/base/ssl/' + fileName
    writeCleanJSONFile('/etc/neatly/base/api/default.json', defaultConfig)


# FUNCTION: Read License
def readLicense():
    return {'type': 'opensource', 'expiryDate': '2999-01-01T00:00:00', 'licensee': 'Community'}


# FUNCTION: Return Exit Code
def returnExitCode(val):
    (sys.exit(0) if val else sys.exit(1))


# FUNCTION: SH Interactive Password Handler
@log()
def shInteractivePasswordHandler(password, timeout=5):

    # FUNCTION: SH Password Handler
    def internalShInteractivePasswordHandler(process):

        # Timer Variables
        timeInWait = 0
        step = 0.1

        # Wait for Input
        while (timeInWait <= timeout):

            # Determine Last Line of Buffer
            lastLine = (process._handlerBuffer.split('\n')[-1] if hasattr(process, '_handlerBuffer') else '')

            # Request for Password?
            if (('password' in lastLine.lower()) and lastLine.endswith(': ')):
                process._stdin_stream.stdin.put(password + '\n')
                break

            # Wait
            sleep(step)
            timeInWait += step

        # Return
        return (timeInWait <= timeout)

    # Return Function
    return internalShInteractivePasswordHandler


# FUNCTION: SH Interactive Handler
@log()
def shInteractiveHandler(handler=None, okCode=0, noLog=False):

    # Set Logger
    logger = _logger

    # Wrapper Function
    def shInteractiveHandlerInternal(func):

        # CLASS: Standard Input Interactive Thread
        class StdInInteractive(threading.Thread):

            # FUNCTION: Initialise
            def __init__(self, wrappedStdIn, stdIn, process):

                # Init Thread
                threading.Thread.__init__(self)

                # Initialised Variables
                self.wrappedStdIn = wrappedStdIn
                self.stdIn = stdIn
                self.process = process

            # FUNCTION: Run
            def run(self):

                # Set Standard Input Connected
                self.process._inConnected = True

                # Listen to Standard Input (Non-Stop) & Add to Wrapped Standard Input
                while True: self.wrappedStdIn.put(self.stdIn.read(1))


        # FUNCTION: Default Interactive Handler
        def defaultInteractiveHandler(char, stdin, process):

            # Create Default Settings
            if (not hasattr(process, '_outAllowed')): process._outAllowed = False
            if (not hasattr(process, '_inConnected')): process._inConnected = False
            if (not hasattr(process, '_byteChar')): process._byteChar = b''

            # Create Buffer for Handler
            if (not hasattr(process, '_handlerBuffer')): process._handlerBuffer = ''

            # Byte?
            if (isinstance(char, bytes)): process._byteChar = process._byteChar + char
            elif (process._byteChar):

                # Byte Sequence Over -> Decode
                str = process._byteChar.decode('utf-8')

                # Append Output to Buffer
                process._handlerBuffer += str

                # Write Out Decoded Bytes
                if (process._outAllowed):
                    sys.stdout.write(str)
                    sys.stdout.flush()

                # Clear Byte Sequence
                process._byteChar = b''

            # Connect Interactive Standard Input
            if (not process._inConnected):
                a = StdInInteractive(stdin, sys.stdin, process)
                a.start()

            # No Bytes
            if (not process._byteChar):

                # Append Output to Buffer
                process._handlerBuffer += char

                # Write Out Standard Output
                if (process._outAllowed):
                    sys.stdout.write(char)
                    sys.stdout.flush()


        # FUNCTION: Wrapper
        @wraps(func)
        def shInteractiveHandlerWrapper(*args, **kwargs):

            # Add Interactive Parameters
            kwargs.update({'_out': defaultInteractiveHandler, '_out_bufsize': 0, '_tty_in': True, '_unify_ttys': True, '_bg': True, '_encoding': 'utf-8'})

            # Log Message
            if (not noLog): logger.info('Spawning interactive sub process: ' + str(func.__name__))

            # Run Interactive Process
            process = func(*args, **kwargs)

            # Attempt
            try:

                # Handler
                if (handler):

                    # Execute Handler
                    status = handler(process.process)

                    # Failed Handling
                    if (not status):

                        # Kill
                        try: process.kill()
                        except: pass

                        # Add Handler Buffer to Standard Output
                        process.process._stdout = deque([process.process._handlerBuffer.encode()])

                        # Log Message
                        if (not noLog):
                            logger.warning('Interactive sub process ' + str(func.__name__) + ' was terminated due to failed handling')
                            logger.warning('Ran command: ' + str(e.full_cmd))
                            logger.warning('STDOUT: ' + e.stdout.decode())
                            logger.warning('STDERR: ' + e.stderr.decode())

                        # Return
                        return [process.process.stdout.decode() + process.process.stderr.decode(), (process.process.exit_code == okCode)]

                    # Allow Output
                    process.process._outAllowed = True

                # No Handler
                else: process.process._outAllowed = True

                # Wait
                process.wait()

                # Log Message
                if (not noLog): logger.info('Interactive sub process ' + str(func.__name__) + ' ended')

                # Add Handler Buffer to Standard Output
                process.process._stdout = deque([process.process._handlerBuffer.encode()])

                # Return
                return [process.process.stdout.decode() + process.process.stderr.decode(), (process.process.exit_code == okCode)]

            except Exception as e:

                # Kill
                try: process.kill()
                except: pass

                # Add Handler Buffer to Standard Output
                process.process._stdout = deque([process.process._handlerBuffer.encode()])

                # Log Message
                if (not noLog):
                    logger.warning('Interactive sub process ' + str(func.__name__) + ' was killed')
                    logger.warning('Ran command: ' + str(e.full_cmd))
                    logger.warning('STDOUT: ' + e.stdout.decode())
                    logger.warning('STDERR: ' + e.stderr.decode())

                # Return
                return [process.process.stdout.decode() + process.process.stderr.decode(), (process.process.exit_code == okCode)]


        # Return Function
        return shInteractiveHandlerWrapper

    # Return Function
    return shInteractiveHandlerInternal


# FUNCTION: SH Password Handler
@log()
def shPasswordHandler(password):

    # FUNCTION: SH Password Handler
    def internalShPasswordHandler(char, stdin, process):

        # Create Default Settings and Buffer for Handler
        if (not hasattr(process, '_byteChar')): process._byteChar = b''
        if (not hasattr(process, '_handlerBuffer')): process._handlerBuffer = ''

        # Byte?
        if (isinstance(char, bytes)): process._byteChar = process._byteChar + char
        elif (process._byteChar):

            # Byte Sequence Over -> Decode
            str = process._byteChar.decode('utf-8')

            # Append Output to Buffer
            process._handlerBuffer += str

            # Clear Byte Sequence
            process._byteChar = b''

        # No Bytes
        if (not process._byteChar):

            # Append Output to Buffer
            process._handlerBuffer += char

        # Determine Last Line of Buffer
        lastLine = process._handlerBuffer.split('\n')[-1]

        # Request for Password?
        if (('password' in lastLine.lower()) and lastLine.endswith(': ')): stdin.put(password + '\n')

    # Return Function
    return internalShPasswordHandler


# FUNCTION: SH Handler
@log()
def shHandler(subProcess=False, handler=None, okCode=0, noLog=False):

    # Set Logger
    logger = _logger

    # Wrapper Function
    def shHandlerInternal(func):

        # FUNCTION: Spawn Subprocess
        def spawnSubprocess(*args, **kwargs):

            # Add Background to kwargs
            kwargs['_bg'] = True

            # Log Message
            if (not noLog): logger.info('Spawning sub process: ' + str(func.__name__))

            # Run Process
            process = func(*args, **kwargs)

            # Attempt
            try:

                # Wait
                process.wait()

                # Log Message
                if (not noLog): logger.info('Sub process ' + str(func.__name__) + ' was completed')

                # Handler
                if (handler): process.process._stdout = deque([process.process._handlerBuffer.encode()])

                # Return
                return [process.process.stdout.decode() + process.process.stderr.decode(), (process.process.exit_code == okCode)]

            except Exception as e:

                # Kill
                try: process.kill()
                except: pass

                # Handler
                if (handler):
                    process.process._stdout = deque([process.process._handlerBuffer.encode()])

                # Log Message
                if (not noLog):
                    logger.warning('Sub process ' + str(func.__name__) + ' was killed')
                    logger.warning('Ran command: ' + str(e.full_cmd))
                    logger.warning('STDOUT: ' + e.stdout.decode())
                    logger.warning('STDERR: ' + e.stderr.decode())

                # Return
                return [process.process.stdout.decode() + process.process.stderr.decode(), (process.process.exit_code == okCode)]


        # FUNCTION: Spawn Process
        def spawnProcess(*args, **kwargs):

            # Log Message
            if (not noLog): logger.info('Spawning process: ' + str(func.__name__))

            # Process
            process = None

            # Attempt
            try:

                # Run Process
                process = func(*args, **kwargs)

                # Log Message
                if (not noLog): logger.info('Process ' + str(func.__name__) + ' was completed')

                # Handler
                if (handler): process.process._stdout = deque([process.process._handlerBuffer.encode()])

                # Return
                return [process.process.stdout.decode() + process.process.stderr.decode(), (process.process.exit_code == okCode)]

            # Fail
            except Exception as e:

                # Output
                strOut = ''

                # Handler
                if (handler):
                    if (process):
                        process.process._stdout = deque([process.process._handlerBuffer.encode()])
                        strOut += (process.process.stdout.decode() + process.process.stderr.decode())
                    else: strOut += ' '.join(str(traceback.format_exc()).split())

                # No Handler
                else:
                    if (process): strOut += (process.process.stdout.decode() + process.process.stderr.decode())
                    else: strOut += ' '.join(str(traceback.format_exc()).split())

                # Log Message
                if (not noLog):
                    logger.warning('Process ' + str(func.__name__) + ' failed')
                    logger.warning('Ran command: ' + str(e.full_cmd))
                    logger.warning('STDOUT: ' + e.stdout.decode())
                    logger.warning('STDERR: ' + e.stderr.decode())

                # Return
                return [strOut, False]


        # FUNCTION: Wrapper
        @wraps(func)
        def shHandlerWrapper(*args, **kwargs):

            # Set Encoding
            kwargs.update({'_encoding': 'utf-8'})

            # Has Handler
            if (handler): kwargs.update({'_out': handler, '_out_bufsize': 0, '_tty_in': True, '_unify_ttys': True})

            # Is Subprocess
            if (subProcess): return spawnSubprocess(*args, **kwargs)

            # No subProcess
            else: return spawnProcess(*args, **kwargs)


        # Return Function
        return shHandlerWrapper

    # Return Function
    return shHandlerInternal


# FUNCTION: Determine Executable Locations
@log()
def determineExecutableLocations():

    # Log Message
    _logger.debug('Determining executable locations')

    # Executable Linking
    executables = {'systemctl': 'systemctl', 'python': 'python3', 'dbDump': 'pg_dump', 'dbRestore': 'pg_restore', 'dbClient': 'psql', 'coverage': 'coverage', 'bash': 'bash', 'symLink': 'ln', 'nginx': 'nginx', 'kill': 'pkill'}

    # Get & Set Executables
    if (not hasattr(sys, 'executables')): sys.executables = types.SimpleNamespace()
    [setattr(sys.executables, name, getattr(sh, executable, None)) for name,executable in executables.items()]


# Determine Executable Locations
determineExecutableLocations()
