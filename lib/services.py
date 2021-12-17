################################################################################
# Author:     Thomas D'haenens
# License:    GPL-3.0
# Link:       https://github.com/BENEATLY/neat-community/
# Contact:    https://neatly.be/
################################################################################


# IMPORT: Custom Modules
from basic import *                                                                         # Basic Lib


# FUNCTION: Get All Services
@log(returnValue=[])
def getAllServices():
    services = readJSONFile('/etc/neatly/base/service/service.json')
    services = [getServiceStatus(service) for service in services]
    return services


# FUNCTION: Get Service Status
@log(returnValue=(lambda x,y: x[0]))
def getServiceStatus(service):
    [runningOut, runningStatus] = shHandler()(sys.executables.systemctl)('is-active', '--quiet', service['service'])
    if (runningStatus):
        [pidOut, pidStatus] = shHandler()(sys.executables.systemctl)('show', service['service'], '--property=MainPID')
        mainPID = int(pidOut.replace('MainPID=', '').replace('\n', ''))
        service['upTime'] = Process(mainPID).create_time()
    else:
        service['upTime'] = None # noCoverage
    return service


# FUNCTION: Daemon Reload
@log()
def daemonReload():
    _logger.debug('Reload systemctl daemon')
    [daemonReloadOut, daemonReloadStatus] = shHandler()(sys.executables.systemctl)('daemon-reload')
    if (not daemonReloadStatus): _logger.error(' '.join(daemonReloadOut.split())) # noCoverage
    else: _logger.info('Reloaded systemctl daemon')


# FUNCTION: Stop Service
@log()
def stopService(service):
    _logger.debug('Stopping service: ' + service)
    [serviceOut, serviceStatus] = shHandler()(sys.executables.systemctl)('stop', service)
    if (not serviceStatus): _logger.error(' '.join(serviceOut.split())) # noCoverage
    else: _logger.info('Stopped service: ' + service)


# FUNCTION: Start Service
@log()
def startService(service):
    _logger.debug('Starting service: ' + service)
    [serviceOut, serviceStatus] = shHandler()(sys.executables.systemctl)('start', service)
    if (not serviceStatus): _logger.error(' '.join(serviceOut.split())) # noCoverage
    else: _logger.info('Started service: ' + service)


# FUNCTION: Reload Service
@log()
def reloadService(service):
    _logger.debug('Reloading service: ' + service)
    [serviceOut, serviceStatus] = shHandler()(sys.executables.systemctl)('reload', service)
    if (not serviceStatus): _logger.error(' '.join(serviceOut.split())) # noCoverage
    else: _logger.info('Reloaded service: ' + service)


# FUNCTION: Kill Process By User
@log()
def killProcessByUser(user):
    _logger.debug('Killing all processes of user: ' + user)
    [killOut, killStatus] = shHandler()(sys.executables.kill)('-u', user)
    if (not killStatus): _logger.error(' '.join(killOut.split())) # noCoverage
    else: _logger.info('Killed all processes of user: ' + user)


# FUNCTION: Kill Process By Name
@log()
def killProcessByName(name, force=False):
    _logger.debug('Killing all processes by name: ' + name)
    [killOut, killStatus] = shHandler()(sys.executables.kill)('-f', name, ('-9' if force else None))
    if (not killStatus): _logger.error(' '.join(killOut.split())) # noCoverage
    else: _logger.info('Killed all processes by name: ' + name)


# FUNCTION: Restart Web Server
@log()
def restartWebServer():
    stopService('nginx')
    killProcessByName('nginx', True)
    startService('nginx')
