################################################################################
# Author:     Thomas D'haenens
# License:    GPL-3.0
# Link:       https://github.com/BENEATLY/neat-community/
# Contact:    https://neatly.be/
################################################################################


# IMPORT: Custom Modules
from basic import *                                                                                        # Basic Lib


# FUNCTION: Split In Operations
@log(returnValue=[])
def splitInOperations(filter):
    inBracket = 0
    startInBracketIndex = None
    startOutBracketIndex = 0
    splitted = []
    for index, char in enumerate(filter):
        if (char == '('):
            inBracket += 1
            if (inBracket == 1):
                startInBracketIndex = index
                if (startOutBracketIndex != 0):
                    if (index != startOutBracketIndex): splitted.append(filter[startOutBracketIndex:index])
        elif (char == ')'):
            if (inBracket == 1):
                splitted.append(filter[startInBracketIndex:index+1])
                startOutBracketIndex = index+1
            inBracket -= 1
        elif (((char == '|') or (char == '&')) and (inBracket == 0)):
            if (index != startOutBracketIndex): splitted.append(filter[startOutBracketIndex:index])
            splitted.append(char)
            startOutBracketIndex = index+1
        elif (index+1 == len(filter)): splitted.append(filter[startOutBracketIndex:])
    if ((startInBracketIndex is not None) and (startOutBracketIndex-startInBracketIndex == len(filter))): splitted = splitInOperations(filter[1:-1])
    if len(splitted) == 1: return splitted[0]
    if len(splitted) == 0: return True
    return splitted


# FUNCTION: Create Operations
@log(returnValue={'value': [False], 'operation': and_})
def createOperations(filter):
    if ('&' in filter):
        calc = {'value': [], 'operation': and_}
        startIndex = 0
        for index, statement in enumerate(filter):
            if (statement == '&'):
                calc['value'].append(''.join(filter[startIndex:index]))
                startIndex = index+1
            elif (index+1 == len(filter)): calc['value'].append(''.join(filter[startIndex:]))
    elif ('|' in filter):
        calc = {'value': [], 'operation': or_}
        startIndex = 0
        for index, statement in enumerate(filter):
            if (statement == '|'):
                calc['value'].append(''.join(filter[startIndex:index]))
                startIndex = index+1
            elif (index+1 == len(filter)): calc['value'].append(''.join(filter[startIndex:]))
    else:
        return filter
    return calc


# FUNCTION: Iterate Operations
@log(returnValue={'value': [False], 'operation': and_})
def iterateOperations(filter):
    if isinstance(filter, dict):
        for index, val in enumerate(filter['value']):
            if (isinstance(val, str)):
                if (('|' in val) or ('&' in val) or ('(' in val) or (')' in val)):
                    filter['value'][index] = createOperations(splitInOperations(val))
                    filter['value'][index] = iterateOperations(filter['value'][index])
    return filter


# FUNCTION: Convert Value
def convertValue(val):
    if val.isdigit(): return int(val)
    elif (val.startswith("'") and val.endswith("'")): return val[1:-1]
    elif (val.startswith('"') and val.endswith('"')): return val[1:-1]
    elif ('.' in val): return float(val)
    elif (val == 'true'): return True
    elif (val == 'false'): return False
    elif (val == 'null'): return None


# FUNCTION: Filter By Rights
@log()
def filterByRights(query, object, accessRight, user, aliases={}):
    filters = object._properties.filters.rights
    if (hasattr(filters, accessRight)):
        accessFilter = getattr(filters, accessRight)
        for statement in accessFilter:
            if ('operator' in statement):
                [query, newAliases] = evalRightFilter(query, object, aliases, accessRight, statement['operator'], statement['statements'], user)
            else:
                [query, newAliases] = evalRightFilter(query, object, aliases, accessRight, None, [statement], user)
            aliases.update(newAliases)
    return [query, aliases]


# FUNCTION: Get All Sub Properties
@log()
def getAllSubProperties(statements):
    found = []
    for statement in statements:
        if ('operator' in statement):
            found.append(getAllSubProperties(statement['statements']))
        else:
            found.append(statement['sub'])
    return list(set(flattenArray(found)))


# FUNCTION: Load Aliases
@log()
def loadAliases(query, object, existingAliases, statements):
    foundSubProperties = getAllSubProperties(statements)
    return createAndJoinAliases(query, object, existingAliases, foundSubProperties)


# FUNCTION: Create Right Filter Statement
@log()
def createRightFilterStatement(aliases, accessRight, statement, user):
    selectedAccessRight = (statement['type'] if ('type' in statement) else accessRight)
    refValue = (statement['value'] if ('value' in statement) else (user.id if (selectedAccessRight == 'own') else user.team_id))
    return (getattr(getSubAlias(aliases[statement['sub']]), statement['attr']) == refValue)


# FUNCTION: Generate Right Filter Statements
@log()
def generateRightFilterStatements(aliases, accessRight, statements, user):
    filterStatements = []
    for statement in statements:
        if ('operator' in statement):
            subFilterStatements = generateRightFilterStatements(aliases, accessRight, statement['statements'], user)
            filterStatements.append(or_(*subFilterStatements) if (statement['operator'] == 'OR') else and_(*subFilterStatements))
        else:
            filterStatements.append(createRightFilterStatement(aliases, accessRight, statement, user))
    return filterStatements


# FUNCTION: Eval Right Filter
@log()
def evalRightFilter(query, object, existingAliases, accessRight, operator, statements, user):
    [query, aliases] = loadAliases(query, object, existingAliases, statements)
    filterStatements = generateRightFilterStatements(aliases, accessRight, statements, user)
    return [query.filter(or_(*filterStatements)) if (operator == 'OR') else query.filter(and_(*filterStatements)), aliases]
