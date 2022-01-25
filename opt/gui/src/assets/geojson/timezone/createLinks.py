################################################################################
# Author:     Thomas D'haenens
# License:    GPL-3.0
# Link:       https://github.com/BENEATLY/neat-community/
# Contact:    https://neatly.be/
################################################################################


# IMPORT: Standard Modules
import json                                                                     # JSON Lib
import pytz as tz                                                               # Timezone Lib
from datetime import datetime, timedelta                                        # DateTime Lib


#   SOURCES:
#   Location Link: https://data.iana.org/time-zones/releases/ -> "backward" -> backwards.txt
#   Moment.js: https://gist.github.com/diogocapela/12c6617fc87607d11fd62d2a4f42b02a


# FUNCTION: Print Log
def logPrint(severity, text):
    print(datetime.now().strftime('%Y-%m-%d %H:%M:%S') + ' ' + severity + ': ' + text)

# FUNCTION: Write Clean JSON File
def writeCleanJSONFile(file, info):
    with open(file, 'w+') as content:
        json.dump(info, content, indent=4, sort_keys=True)

# FUNCTION: Read Text File
def readTextFile(file):
    with open(file, 'r') as content:
        return content.read()

# FUNCTION: Read JSON File
def readJSONFile(file):
    with open(file) as content:
        return json.load(content)

# FUNCTION: Flatten Array
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

# FUNCTION: Convert UTC Offset
def convertUTCOffset(offset):
    if (offset > timedelta(0)):
        seconds = offset.seconds
        hours = seconds//3600
        minutes = (seconds//60)%60
        return '+' + '{:02d}'.format(hours) + ((':' + '{:02d}'.format(minutes)) if minutes else '')
    elif (offset < timedelta(0)):
        seconds = abs(offset).seconds
        hours = seconds//3600
        minutes = (seconds//60)%60
        return '-' + '{:02d}'.format(hours) + ((':' + '{:02d}'.format(minutes)) if minutes else '')
    else: return '+00'

# FUNCTION: Construct TimeZone Link File
def constructTimeZoneLinkFile(timezones, backwards):

    # Define Variables
    export = []

    # Define DST Dates
    winter = datetime(2020, 12, 25, 0, 1, 1)
    summer = datetime(2020, 7, 4, 0, 1, 1)

    # Remove Backwards Time Zones
    timezones = list(set(timezones) - set(backwards))

    # Log Message
    logPrint('INFO', 'Determining timezones:')

    # Iterate over Timezones
    for timezone in timezones:

        # Define Timezone
        CT = tz.timezone(timezone)

        # Get Standard Time
        standardZone = CT.localize(winter, is_dst=None).tzname()
        standardUTCOffset = convertUTCOffset(CT.localize(winter, is_dst=None).utcoffset())

        # Get Savings Time
        savingsZone = CT.localize(summer, is_dst=None).tzname()
        savingsUTCOffset = convertUTCOffset(CT.localize(summer, is_dst=None).utcoffset())

        # Uses DST?
        useDST = (standardZone != savingsZone)

        # Log Message
        logPrint('INFO', 'Detected ' + timezone + ' -> ' + standardZone + ' (' + str(standardUTCOffset) + ') -> ' + savingsZone + ' (' + str(savingsUTCOffset) + ') -> ' + str(useDST))

        # Search Export
        tzExport = [exp for exp in export if (standardZone == exp['timeZone'])]

        # Existing Export
        if (tzExport):

            # Add Location
            tzExport[0]['locations'].append(timezone)

        # New Export
        else:

            export.append({'timeZone': standardZone, 'utcOffset': str(standardUTCOffset), 'dst': ({'timeZone': savingsZone, 'utcOffset': str(savingsUTCOffset)} if (useDST) else None), 'locations': [timezone]})

    # Write JSON File
    writeCleanJSONFile('timezoneLink.json', export)


# Construct JSON File for Backwards
# content = readTextFile('backwards.txt')
# content = {cnt.split(' ')[1]: cnt.split(' ')[0] for cnt in content.split('\n')[0:-1]}
# writeCleanJSONFile('backwards.json', content)

# Construct JSON File for Moment TimeZones
# content = readTextFile('momentTimeZones.txt')
# content = [cnt for cnt in content.split('\n')[0:-1]]
# writeCleanJSONFile('momentTimeZones.json', content)


# Read Backwards TimeZones
backwardsTimeZones = list(readJSONFile('backward.json').keys())

# Read TimeZone Coverage TimeZones
timeZoneCoverageTimeZones = flattenArray([feature['properties']['tzid'] for feature in readJSONFile('timezoneCoverage.json')['features']])

# Read Moment TimeZones
momentTimeZones = readJSONFile('momentTimeZones.json')

# Construct TimeZone Link File
constructTimeZoneLinkFile(momentTimeZones, backwardsTimeZones)



# Log Message Overview
logPrint('INFO', 'Moment time zones: ' + str(len(momentTimeZones)))
logPrint('INFO', 'Coverage time zones: ' + str(len(timeZoneCoverageTimeZones)))
logPrint('INFO', 'Backwards time zones: ' + str(len(backwardsTimeZones)))

# Log Message Differences
logPrint('INFO', 'Items in backwards, but not in moment: ' + str(list(set(backwardsTimeZones) - set(momentTimeZones))))

# Reduce Moment Timezones
logPrint('INFO', 'Reducing moment timezones')
momentTimeZones = [tz for tz in momentTimeZones if (tz not in backwardsTimeZones)]
logPrint('INFO', 'Moment time zones: ' + str(len(momentTimeZones)))

# Log Message Differences
logPrint('INFO', 'Items in moment timezones, but not in coverage (assuming full zones): ' + str(list(set(momentTimeZones) - set(timeZoneCoverageTimeZones))))
