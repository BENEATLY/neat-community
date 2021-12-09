################################################################################
# Author:     Thomas D'haenens
# License:    GPL-3.0
# Link:       https://github.com/BENEATLY/neat-start-orig/
# Contact:    https://neatly.be/
################################################################################


# IMPORT: Custom Modules
from basic import *                                                                                                                 # Basic Lib


# FUNCTION: Remove Id of Object
@log(returnValue=(lambda x,y: x[0]), noLog=True)
def noIdObject(obj):
    delattr(obj, 'id')
    return obj


# FUNCTION: Verify Existing Id
@log()
def verifyId(session, model, id):
    if (not isinstance(id, int)):
        if id.isdigit():
            id = int(id)
        else:
            _logger.warning('Attribute \'id\' is not an integer (validating id failed)') # noCoverage
            return False # noCoverage
    if (not session.query(getattr(model, 'id')).filter_by(id=id).first()):
        _logger.warning('Attribute \'id\' is not existing for ' + str(model().__class__.__name__) + ' (validating id failed)') # noCoverage
        return False # noCoverage
    return True


# FUNCTION: Convert Data Type
@log()
def convertDataType(value, dataType):
    dataType = str(dataType)
    if dataType.startswith('FLOAT'):
        if (not isinstance(value, float)) and (isinstance(value, int)):
            return float(value)
    elif dataType.startswith('TIME'):
        if (not isinstance(value, time)) and (isinstance(value, str)):
            return time.fromisoformat(value)
    elif dataType.startswith('DATETIME'):
        if (not isinstance(value, datetime)) and (isinstance(value, str)):
            return datetime.fromisoformat(value)
    elif dataType.startswith('DATE'):
        if (not isinstance(value, date)) and (isinstance(value, str)):
            return date.fromisoformat(value)
    return None


# FUNCTION: Verify Data Type
@log(returnValue=False)
def verifyDataType(value, dataType, nullable):
    dataType = str(dataType)
    if dataType.startswith('VARCHAR'):
        length = int(dataType.split('(')[1].split(')')[0]) if ('(' in dataType) else None
        if value is None:
            if not nullable: # noCoverage
                return False # noCoverage
        else:
            if not isinstance(value, str):
                return False # noCoverage
            elif len(value) < 1:
                return False # noCoverage
            elif length and (len(value) > length):
                return False # noCoverage
    elif dataType.startswith('INTEGER'):
        if value is None:
            if not nullable: # noCoverage
                return False # noCoverage
        elif not isinstance(value, int):
            return False # noCoverage
    elif dataType.startswith('BOOLEAN'):
        if value is None:
            if not nullable: # noCoverage
                return False # noCoverage
        elif not isinstance(value, bool):
            return False # noCoverage
    elif dataType.startswith('FLOAT'):
        if value is None:
            if not nullable: # noCoverage
                return False # noCoverage
        elif not isinstance(value, float):
            return False # noCoverage
    elif dataType.startswith('TIME'):
        if value is None:
            if not nullable: # noCoverage
                return False # noCoverage
        elif not isinstance(value, time):
            return False # noCoverage
    elif dataType.startswith('DATETIME'):
        if value is None:
            if not nullable: # noCoverage
                return False # noCoverage
        elif not isinstance(value, datetime):
            return False # noCoverage
    elif dataType.startswith('DATE'):
        if value is None:
            if not nullable: # noCoverage
                return False # noCoverage
        elif not isinstance(value, date):
            return False # noCoverage
    else:
        return False # noCoverage
    return True


# FUNCTION: Check If Creation is OK with these Values
@log()
def validateObject(session, model, obj, ignore):
    _logger.info('Validating ' + str(model().__class__.__name__) + ' object')
    if 'id' not in ignore:
        if not isinstance(obj.id, int):
            _logger.warning('Attribute \'id\' is not an integer (validating object failed)') # noCoverage
            return None # noCoverage
        if (session.query(getattr(model, 'id')).filter_by(id=obj.id).first()):
            _logger.warning('Attribute \'id\' is not existing for ' + str(model().__class__.__name__) + ' (validating object failed)') # noCoverage
            return None # noCoverage
    else:
        try:
            del obj['id']
        except:
            pass
    columns = model.__table__.columns
    relationships = inspect(model).relationships
    tableNameSplit = model.__tablename__ + '.'
    for col in columns:
        columnName = str(col).split(tableNameSplit)[1]
        if (columnName != 'id') and (not columnName.endswith('_id')):
            if hasattr(obj, columnName):
                if (not col.nullable) and (getattr(obj, columnName) is None):
                    _logger.warning('Attribute \'' + str(columnName) + '\' is none, but can\'t be none (validating object failed)') # noCoverage
                    return None # noCoverage
                if (getattr(obj, columnName) is not None) and (col.unique) and (session.query(getattr(model, 'id')).filter_by(**{columnName: getattr(obj, columnName)}).first()):
                    _logger.warning('Attribute \'' + str(columnName) + '\' must be unique, but is already present in another entry (validating object failed)') # noCoverage
                    return None # noCoverage
                if (convertDataType(getattr(obj, columnName), col.type) is not None):
                    setattr(obj, columnName, convertDataType(getattr(obj, columnName), col.type))
                if (getattr(obj, columnName) is not None) and (not verifyDataType(getattr(obj, columnName), col.type, col.nullable)):
                    _logger.warning('Attribute \'' + str(columnName) + '\' does not meet the defined data format for this column (validating object failed)') # noCoverage
                    return None # noCoverage
            elif not col.nullable:
                _logger.warning('Attribute \'' + str(columnName) + '\' is none, but can\'t be none (validating object failed)') # noCoverage
                return None # noCoverage
    for key in relationships:
        key = str(key).split('.')[-1]
        idRef = (key + '_id')
        col = [col for col in columns if str(col).split(tableNameSplit)[1] == idRef]
        if len(col) == 1:
            col = col[0]
            if hasattr(obj, idRef):
                if (not col.nullable) and (getattr(obj, idRef) is None):
                    _logger.warning('Attribute \'' + str(idRef) + '\' is none, but can\'t be none (validating object failed)') # noCoverage
                    return None # noCoverage
                if (not session.query(getattr(getChildClass(model, [key]), 'id')).filter_by(id=getattr(obj, idRef)).first()):
                    _logger.warning('Attribute \'' + str(idRef) + '\' is not known in the target table (validating object failed)') # noCoverage
                    return None # noCoverage
                if (getattr(obj, idRef) is not None) and (not verifyDataType(getattr(obj, idRef), col.type, col.nullable)):
                    _logger.warning('Attribute \'' + str(idRef) + '\' does not meet the defined data format for this column (validating object failed)') # noCoverage
                    return None # noCoverage
            else:
                if hasattr(obj, key):
                    val = getattr(obj, key)
                    if (not col.nullable) and (val is None):
                        _logger.warning('Attribute \'' + str(key) + '\' is none, but can\'t be none (validating object failed)') # noCoverage
                        return None # noCoverage
                    if not isinstance(val, int):
                        if (val is not None):
                            if hasattr(val, 'id'):
                                foundItem = session.query(getChildClass(model, [key])).filter_by(id=val.id).first()
                                if ((not isinstance(val, getChildClass(model, [key]))) and (not foundItem)):
                                    _logger.warning('Attribute \'' + str(key) + '\' is not known in the target table (validating object failed)') # noCoverage
                                    return None # noCoverage
                                elif (isinstance(val, Obj) and (val is not foundItem)):
                                    _logger.warning('Attribute \'' + str(key) + '\' is not known in the target table (validating object failed)') # noCoverage
                                    return None # noCoverage
                                obj.deleteAttr(idRef)
                                setattr(obj, key, foundItem)
                            else:
                                _logger.warning('Attribute \'' + str(key) + '\' does not meet the defined data format for the target (validating object failed)') # noCoverage
                                return None # noCoverage
                        else:
                            obj.deleteAttr(idRef)
                            setattr(obj, key, None)
                    else:
                        foundItem = session.query(getChildClass(model, [key])).filter_by(id=val).first()
                        if (not foundItem):
                            _logger.warning('Attribute \'' + str(idRef) + '\' is not known in the target table (validating object failed)') # noCoverage
                            return None # noCoverage
                        obj.deleteAttr(idRef)
                        setattr(obj, key, foundItem)
                elif not col.nullable:
                    _logger.warning('Attribute \'' + str(key) + '\' is none, but can\'t be none (validating object failed)') # noCoverage
                    return None # noCoverage
        elif hasattr(obj, key):
            val = getattr(obj, key)
            if isinstance(val, list):
                newList = []
                for value in val:
                    if isinstance(value, int):
                        foundItem = session.query(getChildClass(model, [key])).filter_by(id=value).first()
                        if foundItem:
                            newList.append(foundItem)
                        else:
                            _logger.warning('Attribute \'' + str(key) + '\' is not known in the target table (validating object failed)') # noCoverage
                            return None # noCoverage
                    elif hasattr(value, '__dict__') and hasattr(value, 'id') and (not isinstance(value, getChildClass(model, [key]))):
                        if isinstance(value.id, int):
                            foundItem = session.query(getChildClass(model, [key])).filter_by(id=value.id).first()
                            if foundItem:
                                newList.append(foundItem)
                            else:
                                _logger.warning('Attribute \'' + str(key) + '\' is not known in the target table (validating object failed)') # noCoverage
                                return None # noCoverage
                        else:
                            _logger.warning('Attribute \'' + str(key) + '\' does not meet the defined data format for this column (validating object failed)') # noCoverage
                            return None # noCoverage
                    elif (not isinstance(value, getChildClass(model, [key]))):
                        _logger.warning('Attribute \'' + str(key) + '\' does not meet the defined data format for this column (validating object failed)') # noCoverage
                        return None # noCoverage
                setattr(obj, key, newList)
            elif (val is None):
                setattr(obj, key, None)
            elif isinstance(value, int):
                foundItem = session.query(getChildClass(model, [key])).filter_by(id=value).first()
                if foundItem:
                    setattr(obj, key, foundItem)
                else:
                    _logger.warning('Attribute \'' + str(key) + '\' is not known in the target table (validating object failed)') # noCoverage
                    return None # noCoverage
            elif hasattr(value, '__dict__') and hasattr(value, 'id') and (not isinstance(value, getChildClass(model, [key]))):
                if isinstance(value.id, int):
                    foundItem = session.query(getChildClass(model, [key])).filter_by(id=value.id).first()
                    if foundItem:
                        setattr(obj, key, foundItem)
                    else:
                        _logger.warning('Attribute \'' + str(key) + '\' is not known in the target table (validating object failed)') # noCoverage
                        return None # noCoverage
                else:
                    _logger.warning('Attribute \'' + str(key) + '\' does not meet the defined data format for this column (validating object failed)') # noCoverage
                    return None # noCoverage
            elif (not isinstance(value, getChildClass(model, [key]))):
                _logger.warning('Attribute \'' + str(key) + '\' does not meet the defined data format for this column (validating object failed)') # noCoverage
                return None # noCoverage
            else:
                setattr(obj, key, value)
    _logger.info('Validating object of ' + str(model().__class__.__name__) + ' succeeded')
    return obj


# FUNCTION: Check If Edit is OK with these Values
@log()
def validateEditability(session, model, obj):
    _logger.info('Validating ' + str(model().__class__.__name__) + ' editability')
    obj = noIdObject(obj)
    objTemp = copy(obj)
    columns = model.__table__.columns
    relationships = inspect(model).relationships
    tableNameSplit = model.__tablename__ + '.'
    for key, val in vars(obj).items():
        if key in [str(col).split(tableNameSplit)[1] for col in columns]:
            if (key != 'id') and (not key.endswith('_id')):
                col = [col for col in columns if str(col).split(tableNameSplit)[1] == key][0]
                if (not col.nullable) and (val is None):
                    _logger.warning('Attribute \'' + str(key) + '\' is none, but can\'t be none (validating editability failed)') # noCoverage
                    return None # noCoverage
                if (val is not None) and (col.unique) and session.query(getattr(model, 'id')).filter_by(**{key: val}).first():
                    _logger.warning('Attribute \'' + str(key) + '\' must be unique, but is already present in another entry (validating editability failed)') # noCoverage
                    return None # noCoverage
                if (convertDataType(val, col.type) is not None):
                    val = convertDataType(val, col.type)
                if (val is not None) and (not verifyDataType(val, col.type, col.nullable)):
                    _logger.warning('Attribute \'' + str(key) + '\' does not meet the defined data format for this column (validating editability failed)') # noCoverage
                    return None # noCoverage
            else:
                _logger.warning('Attribute \'' + str(key) + '\' is an id or a reference to another table, only direct properties can be edited (validating editability failed)') # noCoverage
                return None # noCoverage
        else:
            if key in relationships:
                idRef = (key + '_id')
                col = [col for col in columns if str(col).split(tableNameSplit)[1] == idRef]
                if len(col) == 1:
                    col = col[0]
                    columnName = str(col).split(underscore(model().__class__.__name__) + '.')[1][0:-3]
                    if (val is not None):
                        if isinstance(val, int):
                            foundItem = session.query(getChildClass(model, [key])).filter_by(id=val).first()
                            if (not foundItem):
                                _logger.warning('Attribute \'' + str(key) + '\' is not known in the target table (validating editability failed)') # noCoverage
                                return None # noCoverage
                            if hasattr(objTemp, idRef):
                                delattr(objTemp, idRef)
                            setattr(objTemp, key, foundItem)
                        elif hasattr(val, 'id'):
                            foundItem = session.query(getChildClass(model, [key])).filter_by(id=val.id).first()
                            if ((not isinstance(val, getChildClass(model, [key]))) and (not foundItem)):
                                _logger.warning('Attribute \'' + str(key) + '\' is not known in the target table (validating object failed)') # noCoverage
                                return None # noCoverage
                            elif (isinstance(val, Obj) and (val is not foundItem)):
                                _logger.warning('Attribute \'' + str(key) + '\' is not known in the target table (validating object failed)') # noCoverage
                                return None # noCoverage
                            obj.deleteAttr(idRef)
                            setattr(obj, key, foundItem)
                        else:
                            _logger.warning('Attribute \'' + str(key) + '\' does not meet the defined data format for this column (validating editability failed)') # noCoverage
                            return None # noCoverage
                    else:
                        if (not col.nullable):
                            _logger.warning('Attribute \'' + str(key) + '\' is none, but can\'t be none (validating editability failed)') # noCoverage
                            return None # noCoverage
                        if hasattr(objTemp, idRef):
                            delattr(objTemp, idRef)
                        setattr(objTemp, key, None)
                else:
                    if not isinstance(val, list):
                        _logger.warning('Attribute \'' + str(key) + '\' is not a list (validating editability failed)') # noCoverage
                        return None # noCoverage
                    if all(hasattr(value, '__dict__') for value in val) and all(hasattr(value, 'id') for value in val):
                        val = [value.id for value in val]
                    if any((verifyDataType(value, 'INTEGER', False) == False) for value in val):
                        _logger.warning('Attribute \'' + str(key) + '\' list contains a value which is no integer (validating editability failed)') # noCoverage
                        return None # noCoverage
                    if len(set(val)) != len(val):
                        _logger.warning('Attribute \'' + str(key) + '\' list contains a value which is already present in the list (validating editability failed)') # noCoverage
                        return None # noCoverage
                    foundItems = [session.query(getChildClass(model, [key])).filter_by(id=value).first() for value in val]
                    if (not all(foundItems)):
                        _logger.warning('Attribute \'' + str(key) + '\' list contains a value which is not known in the target table (validating editability failed)') # noCoverage
                        return None # noCoverage
                    setattr(objTemp, key, foundItems)
            else:
                _logger.warning('Attribute \'' + str(key) + '\' is not known in the table (validating editability failed)') # noCoverage
                return None # noCoverage
    _logger.info('Validating editability of ' + str(model().__class__.__name__) + ' succeeded')
    return objTemp
