################################################################################
# Author:     Thomas D'haenens
# License:    GPL-3.0
# Link:       https://github.com/BENEATLY/neat-community/
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
            if not nullable: return False
        else:
            if not isinstance(value, str): return False
            elif len(value) < 1: return False
            elif length and (len(value) > length): return False
    elif dataType.startswith('INTEGER'):
        if value is None:
            if not nullable: return False
        elif not isinstance(value, int): return False
    elif dataType.startswith('BOOLEAN'):
        if value is None:
            if not nullable: return False
        elif not isinstance(value, bool): return False
    elif dataType.startswith('FLOAT'):
        if value is None:
            if not nullable: return False
        elif not isinstance(value, float): return False
    elif dataType.startswith('TIME'):
        if value is None:
            if not nullable: return False
        elif not isinstance(value, time): return False
    elif dataType.startswith('DATETIME'):
        if value is None:
            if not nullable: return False
        elif not isinstance(value, datetime): return False
    elif dataType.startswith('DATE'):
        if value is None:
            if not nullable: return False
        elif not isinstance(value, date): return False
    else:
        return False # noCoverage
    return True


# FUNCTION: Check If Creation is OK with these Values
@log()
def validateObject(session, model, obj, ignore):

    # Log Message
    _logger.info('Validating ' + str(model().__class__.__name__) + ' object')

    # Valid Id?
    if 'id' not in ignore:

        # Id is Integer
        if not isinstance(obj.id, int):
            _logger.warning('Attribute \'id\' is not an integer (validating object failed)') # noCoverage
            return None # noCoverage

        # Id Does Not Exist
        if (not session.query(getattr(model, 'id')).filter_by(id=obj.id).first()):
            _logger.warning('Attribute \'id\' is not existing for ' + str(model().__class__.__name__) + ' (validating object failed)') # noCoverage
            return None # noCoverage

    # Remove Id (To Be Sure)
    else:
        try: del obj['id']
        except: pass

    # Get Most Important Model Info
    columns = model.__table__.columns
    relationships = inspect(model).relationships

    # Determine Plain Columns
    plainColumns = [col for col in columns if (not col.expression.foreign_keys) and (col.key != 'id')]

    # Iterate over Plain Columns
    for col in plainColumns:

        # Get Column Name
        columnName = col.key

        # Object Has Property
        if hasattr(obj, columnName):

            # Get Value
            value = getattr(obj, columnName)

            # Value is None
            if (value is None):

                # Can't be None
                if (not col.nullable):
                    _logger.warning('Attribute \'' + str(columnName) + '\' is none, but can\'t be none (validating object failed)') # noCoverage
                    return None # noCoverage

                # Set None
                setattr(obj, columnName, None)

            # Value is Not None
            else:

                # Is Not Unique
                if (col.unique) and (session.query(getattr(model, 'id')).filter_by(**{columnName: value}).first()):
                    _logger.warning('Attribute \'' + str(columnName) + '\' must be unique, but is already present in another entry (validating object failed)') # noCoverage
                    return None # noCoverage

                # Data Type Conversion
                convertedValue = convertDataType(value, col.type)
                if (convertedValue is not None):
                    setattr(obj, columnName, convertedValue)

                # Doesn't Meet Data Format
                if (not verifyDataType(value, col.type, col.nullable)):
                    _logger.warning('Attribute \'' + str(columnName) + '\' does not meet the defined data format for this column (validating object failed)') # noCoverage
                    return None # noCoverage

        # Object Doesn't Have Property and Not Nullable
        elif (not col.nullable):
            _logger.warning('Attribute \'' + str(columnName) + '\' is none, but can\'t be none (validating object failed)') # noCoverage
            return None # noCoverage

    # Determine Relationship Keys
    relationshipKeys = [rel._dependency_processor.key for rel in relationships]

    # Determine ID Columns
    idColumns = [col for col in columns if col.key.endswith('_id')]

    # Iterate over Relationship Keys
    for key in relationshipKeys:

        # Create ID Key
        idRef = (key + '_id')

        # ID Column Exists
        if (idRef in columns):

            # Get Column
            col = columns[idRef]

            # Object Has ID Property
            if hasattr(obj, idRef):

                # Get Value
                value = getattr(obj, idRef)

                # Value is None
                if (value is None):

                    # Can't be None
                    if (not col.nullable):
                        _logger.warning('Attribute \'' + str(idRef) + '\' is none, but can\'t be none (validating object failed)') # noCoverage
                        return None # noCoverage

                    # Set None
                    obj.deleteAttr(idRef)
                    setattr(obj, key, None)

                # Value is Not None
                else:

                    # Doesn't Exist
                    if (not session.query(getattr(getChildClass(model, [key]), 'id')).filter_by(id=value).first()):
                        _logger.warning('Attribute \'' + str(idRef) + '\' is not known in the target table (validating object failed)') # noCoverage
                        return None # noCoverage

                    # Doesn't Meet Data Format
                    if (not verifyDataType(value, col.type, col.nullable)):
                        _logger.warning('Attribute \'' + str(idRef) + '\' does not meet the defined data format for this column (validating object failed)') # noCoverage
                        return None # noCoverage

            # Object Doesn't Have ID Property --> Full Reference?
            else:

                # Object Has Full Reference Property
                if hasattr(obj, key):

                    # Get Value
                    value = getattr(obj, key)

                    # Value is None
                    if (value is None):

                        # Can't be None
                        if (not col.nullable):
                            _logger.warning('Attribute \'' + str(key) + '\' is none, but can\'t be none (validating object failed)') # noCoverage
                            return None # noCoverage

                        # Set None
                        obj.deleteAttr(idRef)
                        setattr(obj, key, None)

                    # Value is Not None
                    else:

                        # Is Integer
                        if isinstance(value, int):

                            # Lookup Item
                            foundItem = session.query(getChildClass(model, [key])).filter_by(id=value).first()

                            # Doesn't Exist
                            if (not foundItem):
                                _logger.warning('Attribute \'' + str(key) + '\' is not known in the target table (validating object failed)') # noCoverage
                                return None # noCoverage

                            # Set Found Item
                            obj.deleteAttr(idRef)
                            setattr(obj, key, foundItem)

                        # Has ID Property
                        elif hasattr(value, 'id'):

                            # Get Child Class
                            childClass = getChildClass(model, [key])

                            # Lookup Item
                            foundItem = session.query(childClass).filter_by(id=value.id).first()

                            # Doesn't Exist
                            if ((not isinstance(value, childClass)) and (not foundItem)):
                                _logger.warning('Attribute \'' + str(key) + '\' is not known in the target table (validating object failed)') # noCoverage
                                return None # noCoverage

                            # Doesn't Exist
                            elif (isinstance(value, Obj) and (value is not foundItem)):
                                _logger.warning('Attribute \'' + str(key) + '\' is not known in the target table (validating object failed)') # noCoverage
                                return None # noCoverage

                            # Set Found Item
                            obj.deleteAttr(idRef)
                            setattr(obj, key, foundItem)

                        # Has No ID Property
                        else:
                            _logger.warning('Attribute \'' + str(key) + '\' does not meet the defined data format for the target (validating object failed)') # noCoverage
                            return None # noCoverage

                # Object Has No Full Reference Property
                elif not col.nullable:
                    _logger.warning('Attribute \'' + str(key) + '\' is none, but can\'t be none (validating object failed)') # noCoverage
                    return None # noCoverage

        # ID Column Doesn't Exist and Object Has Full Reference
        elif hasattr(obj, key):

            # Get Value
            value = getattr(obj, key)

            # Get Child Class
            childClass = getChildClass(model, [key])

            # Value is None
            if (value is None):

                # Set None
                setattr(obj, key, None)

            # Value is List
            elif isinstance(value, list):

                # Has ID Attribute
                if all((hasattr(val, '__dict__') and hasattr(val, 'id') and (not isinstance(val, childClass))) for val in value):
                    value = [val.id for val in value]

                # List Doesn't Consist of Integers
                if not all(isinstance(val, int) for val in value):
                    _logger.warning('Attribute \'' + str(key) + '\' list contains a value which is no integer (validating object failed)') # noCoverage
                    return None # noCoverage

                # Has Duplicates
                if len(set(value)) != len(value):
                    _logger.warning('Attribute \'' + str(key) + '\' list contains a value which is already present in the list (validating object failed)') # noCoverage
                    return None # noCoverage

                # Get Child Class
                childClass = getChildClass(model, [key])

                # Lookup Items
                foundItems = session.query(childClass).filter(getattr(childClass, 'id').in_(value)).all()

                # Not All Exist
                if (len(foundItems) != len(value)):
                    _logger.warning('Attribute \'' + str(key) + '\' list contains a value which is not known in the target table (validating object failed)') # noCoverage
                    return None # noCoverage

                # Set Found Items
                setattr(obj, key, foundItems)

            # Value is Integer
            elif isinstance(value, int):

                # Lookup Item
                foundItem = session.query(childClass).filter_by(id=value).first()

                # Does Exist
                if foundItem: setattr(obj, key, foundItem)

                # Doesn't Exist
                else:
                    _logger.warning('Attribute \'' + str(key) + '\' is not known in the target table (validating object failed)') # noCoverage
                    return None # noCoverage

            # Has ID Attribute
            elif hasattr(value, '__dict__') and hasattr(value, 'id') and (not isinstance(value, childClass)):

                # ID is Integer
                if isinstance(value.id, int):

                    # Lookup Item
                    foundItem = session.query(childClass).filter_by(id=value.id).first()

                    # Does Exist
                    if foundItem: setattr(obj, key, foundItem)

                    # Doesn't Exist
                    else:
                        _logger.warning('Attribute \'' + str(key) + '\' is not known in the target table (validating object failed)') # noCoverage
                        return None # noCoverage

                # No ID
                else:
                    _logger.warning('Attribute \'' + str(key) + '\' does not meet the defined data format for this column (validating object failed)') # noCoverage
                    return None # noCoverage

            # Doesn't Exist
            elif (not isinstance(value, childClass)):
                _logger.warning('Attribute \'' + str(key) + '\' does not meet the defined data format for this column (validating object failed)') # noCoverage
                return None # noCoverage

            # Set New Value
            else:
                setattr(obj, key, value)

    # Log Message
    _logger.info('Validating object of ' + str(model().__class__.__name__) + ' succeeded')

    # Return Object
    return obj


# FUNCTION: Check If Edit is OK with these Values
@log()
def validateEditability(session, model, obj):

    # Log Message
    _logger.info('Validating ' + str(model().__class__.__name__) + ' editability')

    # Remove ID
    obj = noIdObject(obj)

    # Copy Object
    objTemp = copy(obj)

    # Get Most Important Model Info
    columns = model.__table__.columns
    relationships = inspect(model).relationships

    # Iterate Over Object
    for key, value in vars(obj).items():

        # Column Exists
        if (key in columns):

            # Is Plain Column
            if (key != 'id') and (not key.endswith('_id')):

                # Get Column
                col = columns[key]

                # Value is None
                if (value is None):

                    # Can't be None
                    if (not col.nullable):
                        _logger.warning('Attribute \'' + str(key) + '\' is none, but can\'t be none (validating editability failed)') # noCoverage
                        return None # noCoverage

                    # Set None
                    setattr(objTemp, key, None)

                # Value is Not None
                else:

                    # Is Not Unique
                    if (col.unique) and (session.query(getattr(model, 'id')).filter_by(**{key: value}).first()):
                        _logger.warning('Attribute \'' + str(key) + '\' must be unique, but is already present in another entry (validating editability failed)') # noCoverage
                        return None # noCoverage

                    # Data Type Conversion
                    convertedValue = convertDataType(value, col.type)
                    if (convertedValue is not None):
                        setattr(objTemp, key, convertedValue)

                    # Doesn't Meet Data Format
                    if (not verifyDataType(value, col.type, col.nullable)):
                        _logger.warning('Attribute \'' + str(key) + '\' does not meet the defined data format for this column (validating editability failed)') # noCoverage
                        return None # noCoverage

            # No Plain Column
            else:
                _logger.warning('Attribute \'' + str(key) + '\' is an id or a reference to another table, only direct properties can be edited (validating editability failed)') # noCoverage
                return None # noCoverage

        # Column Doesn't Exist
        else:

            # Relationship Exists
            if key in relationships:

                # Create ID Key
                idRef = (key + '_id')

                # ID Column Exists
                if (idRef in columns):

                    # Get Column
                    col = columns[idRef]

                    # Get Column Name
                    columnName = col.key[0:-3]

                    # Value is None
                    if (value is None):

                        # Can't be None
                        if (not col.nullable):
                            _logger.warning('Attribute \'' + str(key) + '\' is none, but can\'t be none (validating editability failed)') # noCoverage
                            return None # noCoverage

                        # Remove ID Reference Value
                        if hasattr(objTemp, idRef): delattr(objTemp, idRef)

                        # Set None
                        setattr(objTemp, key, None)

                    # Value is Not None
                    else:

                        # Is Integer
                        if isinstance(value, int):

                            # Lookup Item
                            foundItem = session.query(getChildClass(model, [key])).filter_by(id=value).first()

                            # Doesn't Exist
                            if (not foundItem):
                                _logger.warning('Attribute \'' + str(key) + '\' is not known in the target table (validating editability failed)') # noCoverage
                                return None # noCoverage

                            # Remove ID Reference Value
                            if hasattr(objTemp, idRef): delattr(objTemp, idRef)

                            # Set Found Item
                            setattr(objTemp, key, foundItem)



                        # Has ID Property
                        elif hasattr(value, 'id'):

                            # Get Child Class
                            childClass = getChildClass(model, [key])

                            # Lookup Item
                            foundItem = session.query(childClass).filter_by(id=value.id).first()

                            # Doesn't Exist
                            if ((not isinstance(value, childClass)) and (not foundItem)):
                                _logger.warning('Attribute \'' + str(key) + '\' is not known in the target table (validating editability failed)') # noCoverage
                                return None # noCoverage

                            # Doesn't Exist
                            elif (isinstance(value, Obj) and (value is not foundItem)):
                                _logger.warning('Attribute \'' + str(key) + '\' is not known in the target table (validating editability failed)') # noCoverage
                                return None # noCoverage

                            # Remove ID Reference Value
                            if hasattr(objTemp, idRef): delattr(objTemp, idRef)

                            # Set Found Item
                            setattr(objTemp, key, foundItem)

                        # Has No ID Property
                        else:
                            _logger.warning('Attribute \'' + str(key) + '\' does not meet the defined data format for the target (validating editability failed)') # noCoverage
                            return None # noCoverage

                # ID Column Doesn't Exist and Object Has Full Reference List
                else:

                    # Is List
                    if not isinstance(value, list):
                        _logger.warning('Attribute \'' + str(key) + '\' is not a list (validating editability failed)') # noCoverage
                        return None # noCoverage

                    # Has ID Attribute
                    if all((hasattr(val, '__dict__') and hasattr(val, 'id')) for val in value):
                        value = [val.id for val in value]

                    # List Doesn't Consist of Integers
                    if not all(isinstance(val, int) for val in value):
                        _logger.warning('Attribute \'' + str(key) + '\' list contains a value which is no integer (validating editability failed)') # noCoverage
                        return None # noCoverage

                    # Has Duplicates
                    if len(set(value)) != len(value):
                        _logger.warning('Attribute \'' + str(key) + '\' list contains a value which is already present in the list (validating editability failed)') # noCoverage
                        return None # noCoverage

                    # Get Child Class
                    childClass = getChildClass(model, [key])

                    # Lookup Items
                    foundItems = session.query(childClass).filter(getattr(childClass, 'id').in_(value)).all()

                    # Not All Exist
                    if (len(foundItems) != len(value)):
                        _logger.warning('Attribute \'' + str(key) + '\' list contains a value which is not known in the target table (validating editability failed)') # noCoverage
                        return None # noCoverage

                    # Set Found Items
                    setattr(objTemp, key, foundItems)

            # No Relationship
            else:
                _logger.warning('Attribute \'' + str(key) + '\' is not known in the table (validating editability failed)') # noCoverage
                return None # noCoverage

    # Log Message
    _logger.info('Validating editability of ' + str(model().__class__.__name__) + ' succeeded')

    # Return Object
    return objTemp
