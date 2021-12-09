################################################################################
# Author:     Thomas D'haenens
# License:    GPL-3.0
# Link:       https://github.com/BENEATLY/neat-community/
# Contact:    https://neatly.be/
################################################################################


# IMPORT: Standard Modules
import os                                                                                   # OS Lib
import json                                                                                 # JSON Lib
from datetime import datetime                                                               # Date Gen Lib


# FUNCTION: Read JSON File (No Logging)
def readJSONFile(file):
    with open(file) as content:
        return json.load(content)

# FUNCTION: Write JSON File (No Logging)
def writeJSONFile(file, info):
    with open(file, 'w') as content:
        json.dump(info, content, indent=4, sort_keys=True)

# FUNCTION: Write Text File (No Logging)
def writeTextFile(file, info):
    content = open(file, 'w+')
    content.write(info)
    content.close()

# FUNCTION: Print Log
def logPrint(severity, text):
    print(datetime.now().strftime('%Y-%m-%d %H:%M:%S') + ' ' + severity + ': ' + text)

# FUNCTION: Reduce Contour Resolution
def reduceContourResolution(feature, factor):
    for i, coordinateSet in enumerate(feature['geometry']['coordinates']):
        for j, contours in enumerate(coordinateSet):
            tempContours = [contours[0]]
            tempContours.extend(contours[1:-1][::factor])
            tempContours.append(contours[-1])
            feature['geometry']['coordinates'][i][j] = tempContours
    return feature


# DEFINITION: Contour Reduction Factor
contourReductionFactor = 8


# ACTION: Read in Timezone Link
timezoneLink = readJSONFile('timezone-link.json')

# ACTION: Read in Timezone Coverage
timezoneCoverage = readJSONFile('timezone-coverage.json')

# ACTION: Create Timezone File for each Timezone
for timezone in timezoneLink:
    logPrint('INFO', 'Creating High Resolution Timezone File for Timezone ' + timezone['abbr'])
    info = {"type": "FeatureCollection", "features": [feature for feature in timezoneCoverage['features'] if (feature['properties']['tzid'] in timezone['utc'])]}
    writeJSONFile('./files/high-res/' + timezone['abbr'].lower() + '.json', info)
    logPrint('INFO', 'Created High Resolution Timezone File for Timezone ' + timezone['abbr'])
    logPrint('INFO', 'Creating Low Resolution Timezone File for Timezone ' + timezone['abbr'])
    info = {"type": "FeatureCollection", "features": [reduceContourResolution(feature, contourReductionFactor) for feature in timezoneCoverage['features'] if (feature['properties']['tzid'] in timezone['utc'])]}
    writeJSONFile('./files/low-res/' + timezone['abbr'].lower() + '.json', info)
    logPrint('INFO', 'Created Low Resolution Timezone File for Timezone ' + timezone['abbr'])

# ACTION: Remove Original Files
logPrint('INFO', 'Delete Source Files')
os.remove('timezone-coverage.json')
os.remove('splitTimezones.py')
logPrint('INFO', 'Deleted Source Files')
