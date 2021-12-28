################################################################################
# Author:     Thomas D'haenens
# License:    GPL-3.0
# Link:       https://github.com/BENEATLY/neat-community/
# Contact:    https://neatly.be/
################################################################################


# IMPORT: Custom Modules
from basic import *                                                                                              # Basic Lib
import actions                                                                                                   # Actions Lib


# FUNCTION: Recalculate Config Hashes
@log(trigger=True)
def reCalculateConfigHashes(changes):
    _logger.info('Recalculating config hashes due to: ' + ', '.join([(str(op) + ' transaction on ' + str(target.__class__.__name__) + ' ' + str(target.id)) for target, op in changes]))
    actions.calculateConfigHashes()


# FUNCTION: Reupdate GUI Config
@log(trigger=True)
def reUpdateGUIConfig(changes):
    _logger.info('Reupdating GUI config due to: ' + ', '.join([(str(op) + ' transaction on ' + str(target.__class__.__name__) + ' ' + str(target.id)) for target, op in changes]))
    actions.syncGUIConfiguration()
    actions.calculateConfigHashes()


# FUNCTION: Reupdate Translations Config
@log(trigger=True)
def reUpdateTranslationsConfig(changes):
    _logger.info('Reupdating translations config due to: ' + ', '.join([(str(op) + ' transaction on ' + str(target.__class__.__name__) + ' ' + str(target.id)) for target, op in changes]))
    actions.syncTranslationsConfiguration()
    actions.calculateConfigHashes()


# FUNCTION: Trigger PluginOption Message
@log(trigger=True)
def triggerPluginOptionMessage(changes):
    _logger.info('Trigger plugin option update message due to: ' + ', '.join([(str(op) + ' transaction on ' + str(target.__class__.__name__) + ' ' + str(target.id)) for target, op in changes]))
    producer = createProducer()
    for target, op in changes:
        sendMessage(producer, '_internal.trigger.pluginoption', {'plugin_id': target.plugin_id, 'group': target.group, 'option': target.option})
    producer.close()
