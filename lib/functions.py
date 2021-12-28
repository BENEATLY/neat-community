################################################################################
# Author:     Thomas D'haenens
# License:    GPL-3.0
# Link:       https://github.com/BENEATLY/neat-community/
# Contact:    https://neatly.be/
################################################################################


# IMPORT: Custom Modules
from basic import *                                                                                             # Basic Lib


# FUNCTION: Plugin -> Get Log Content
@log(returnValue=('', 404))
def pluginGetLogContent(self, options):
    foundLogs = [log for log in self.logs if (log['uid'] == options['uid'])]
    if (len(foundLogs) == 1):
        foundLogs = foundLogs[0]
        return send_file(dir + foundLogs['fullPath'], attachment_filename=foundLogs['file'])
    return ('', 404)


# FUNCTION: Plugin -> Get Package Translation Content
@log(returnValue={})
def pluginGetPackageTranslationContent(self, translation):
    return self.meta.get('translations', {}).get(translation, {})
