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


# DEFINITIONS: Reduction
lowAccuracy = 0.015
midAccuracy = 0.005


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

def lowResConversion(coordinates, accuracy):
    lastPoint = None
    rtnCoordinates = []
    prevPoint = None
    totalCoordinates = len(coordinates)
    for index, coordinate in enumerate(coordinates):
        if (lastPoint is None):
            lastPoint = coordinate
            rtnCoordinates.append(coordinate)
        elif (index == (totalCoordinates - 1)):
            lastPoint = coordinate
            rtnCoordinates.append(coordinate)
        else:

            # Calculate Distance
            dist = pow((pow(abs(coordinate[0] - lastPoint[0]), 2) + pow(abs(coordinate[1] - lastPoint[1]), 2)), 0.5)

            # Higher Distance Than Required Accuracy?
            if (dist > accuracy):

                # Calculate Distance
                prevDist = pow((pow(abs(coordinate[0] - prevPoint[0]), 2) + pow(abs(coordinate[1] - prevPoint[1]), 2)), 0.5)

                # Higher Distance Than Required Accuracy?
                if (prevDist > accuracy):

                    # Not same Point
                    if (prevPoint != lastPoint): rtnCoordinates.append(prevPoint)

                lastPoint = coordinate
                rtnCoordinates.append(coordinate)

        prevPoint = coordinate

    # Log Message
    print('Reduced to ' + str(len(rtnCoordinates)) + ' coordinates from ' + str(totalCoordinates) + ' coordinates')

    # Recalculation Required
    if (len(rtnCoordinates) <= 2):
        print('Insufficient coordinates, recalculating..')
        return lowResConversion(coordinates, accuracy/2)

    return rtnCoordinates

def isCoordinate(item):
    return ((len(item) == 2) and (isinstance(item[0], float) or isinstance(item[0], int)) and (isinstance(item[1], float) or isinstance(item[1], int)))

# FUNCTION: Reduce Contour Resolution
def reduceContourResolution(feature, accuracy):
    for i, coordinateSet in enumerate(feature['geometry']['coordinates']):
        if (coordinateSet and (isCoordinate(coordinateSet[0]))):
            feature['geometry']['coordinates'][i] = lowResConversion(coordinateSet, accuracy)
        else:
            for j, contours in enumerate(coordinateSet):
                feature['geometry']['coordinates'][i][j] = lowResConversion(contours, accuracy)
    return feature

# ACTION: Read in Timezone Link
timezoneLink = readJSONFile('timezoneLink.json')

# ACTION: Read in Timezone Coverage
timezoneCoverage = readJSONFile('timezoneCoverage.json')

# ACTION: Create Timezone File for each Timezone
for timezone in timezoneLink:

    # High Resolution
    logPrint('INFO', 'Creating high resolution timezone file for timezone ' + timezone['timeZone'])
    features = [feature for feature in timezoneCoverage['features'] if (feature['properties']['tzid'] in timezone['locations'])]
    if (features):
        info = {"type": "FeatureCollection", "features": features}
        writeJSONFile('./files/high-res/' + timezone['timeZone'].lower() + '.json', info)
        logPrint('INFO', 'Created high resolution timezone file for timezone ' + timezone['timeZone'])
    else:
        logPrint('WARNING', 'No features available for timezone ' + timezone['timeZone'] + ', skipping..')

    # Mid Resolution
    logPrint('INFO', 'Creating mid resolution timezone file for timezone ' + timezone['timeZone'])
    features = [reduceContourResolution(feature, midAccuracy) for feature in timezoneCoverage['features'] if (feature['properties']['tzid'] in timezone['locations'])]
    if (features):
        info = {"type": "FeatureCollection", "features": features}
        writeJSONFile('./files/mid-res/' + timezone['timeZone'].lower() + '.json', info)
        logPrint('INFO', 'Created mid resolution timezone file for timezone ' + timezone['timeZone'])
    else:
        logPrint('WARNING', 'No features available for timezone ' + timezone['timeZone'] + ', skipping..')

    # Low Resolution
    logPrint('INFO', 'Creating low resolution timezone file for timezone ' + timezone['timeZone'])
    features = [reduceContourResolution(feature, lowAccuracy) for feature in timezoneCoverage['features'] if (feature['properties']['tzid'] in timezone['locations'])]
    if (features):
        info = {"type": "FeatureCollection", "features": features}
        writeJSONFile('./files/low-res/' + timezone['timeZone'].lower() + '.json', info)
        logPrint('INFO', 'Created low resolution timezone file for timezone ' + timezone['timeZone'])
    else:
        logPrint('WARNING', 'No features available for timezone ' + timezone['timeZone'] + ', skipping..')

# ACTION: Remove Original Files
logPrint('INFO', 'Delete Source Files')
os.remove('timezoneCoverage.json')
os.remove('createLinks.py')
os.remove('momentTimeZones.json')
os.remove('splitTimezones.py')
logPrint('INFO', 'Deleted Source Files')
