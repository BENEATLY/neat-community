################################################################################
# Author:     Thomas D'haenens
# License:    GPL-3.0
# Link:       https://github.com/BENEATLY/neat-community/
# Contact:    https://neatly.be/
################################################################################


# IMPORT: Custom Modules
from basic import *                                                                         # Basic Lib
import tables                                                                               # Tables Lib
import validate                                                                             # Validate Lib
import filters                                                                              # Filters Lib


# FUNCTION: Remove Id of Dictionary
@log(returnValue=(lambda x,y: x[0]), noLog=True)
def noId(attr):
    del attr['id']
    return attr


# FUNCTION: Temporary Session Decorator
@log()
def inTempSession():
    def inTempSessionInternal(func):
        @wraps(func)
        def inTempSessionWrapper(*args, **kwargs):
            if ('session' in kwargs):
                result = func(*args, **kwargs)
            else:
                session = tables.createDBSession()
                result = func(*args, **{**kwargs, 'session': session})
                session.close()
            return result
        return inTempSessionWrapper
    return inTempSessionInternal


# FUNCTION: Register Action
@log()
def registerAction(config, action=None, meta={}):
    def registerActionInternal(func):
        @wraps(func)
        def registerActionWrapper(*args, **kwargs):
            actionName = (action if action else kwargs['actionName'])
            metaData = ((meta(kwargs) if callable(meta) else meta) if meta else {})
            createByDict(kwargs['execParams'], kwargs['session'], tables.Action, plugin_id=(config['plugin']['id'] if (('plugin' in config) and config['plugin']) else None), action=actionName, meta=metaData)
            return func(*args, **kwargs)
        return registerActionWrapper
    return registerActionInternal


# FUNCTION: Manual Register Action
@log()
def manualRegisterAction(execParams, session, config, action, meta={}):
    createByDict(execParams, session, tables.Action, plugin_id=(config['plugin']['id'] if (('plugin' in config) and config['plugin']) else None), action=action, meta=meta)


# FUNCTION: Discover Property Changes
@log(returnValue=[])
def discoverPropertyChanges(pre, post, meta):
    if (not pre):
        return list(set(list(post.keys()) + (meta['changes'] if (meta and ('changes' in meta)) else [])))
    elif (not post):
        return list(set(list(pre.keys()) + (meta['changes'] if (meta and ('changes' in meta)) else [])))
    allProperties = list(set(list(post.keys()) + list(pre.keys())))
    changedProperties = []
    for property in allProperties:
        if ((property in post.keys()) and (property in pre.keys())):
            if (post[property] != pre[property]):
                changedProperties.append(property)
        else:
            changedProperties.append(property)
    return list(set(changedProperties + (meta['changes'] if (meta and ('changes' in meta)) else [])))


# FUNCTION: Merge Unique Definitions
@log()
def mergeUniqueDefinitions(uniqueDefs):
    uniqueDict = {'single': [], 'multi': []}
    for uniqueDef in uniqueDefs:
        if (isinstance(uniqueDef, str)):
            uniqueDict['single'].append(uniqueDef)
        elif (isinstance(uniqueDef, list)):
            uniqueDict['multi'].extend(uniqueDef)
    return uniqueDict


# FUNCTION: Create Plain Retrieve Filter Statement
@log()
def createPlainRetrieveFilterStatement(classDef, values, property, aliases):
    if isinstance(values[property], tables.Generic):
        return (getSubAlias(aliases[property]).id == values[property].id)
    elif (not isinstance(values[property], list)):
        return (getattr(getSubAlias(aliases[None]), property) == values[property])


# FUNCTION: Create List Retrieve Filter Statement
@log()
def createListRetrieveFilterStatement(classDef, values, property, origAliases, query):

    # List with Values
    if (values[property]):
        idList = [(getattr(item, 'id') if (hasattr(item, 'id')) else (item['id'] if (isinstance(item, dict)) else item)) for item in values[property]]
        query = query.filter(getSubAlias(origAliases[property]).id.in_(idList))
        newAliases = splitInAliases(classDef, {}, [property])
        [query, newAliases] = joinAliases(query, newAliases)
        return query.group_by(classDef.id).having(func.count(getSubAlias(newAliases[property]).id.distinct()) == len(set(idList)))

    # Empty List
    else:
        newAliases = splitInAliases(classDef, {}, [property])
        [query, newAliases] = joinAliases(query, newAliases)
        return query.filter(~getattr(getSubAlias(newAliases[None]), property).any())


# FUNCTION: Get Default Values
@log()
def getDefaultValues(classDef):

    # Define Variable
    defaults = {}

    # Get Column Properties
    directColumns = [c for c in classDef().__table__.columns if ((c.name != 'id') and (not c.name.endswith('_id')))]
    idColumns = [c.name[0:-3] for c in classDef().__table__.columns if c.name.endswith('_id')]
    relatedProperties = classDef().getRelatedProperties()

    # Direct Properties
    for column in directColumns:

        # (Regular) Default
        if (column.default is not None):
            defaults[column.name] = (column.default.execute() if getattr(column.default, 'execute', None) else column.default.arg)

        # Server Default
        # elif (column.server_default is not None):
        #     defaults[column.name] = (column.server_default.execute() if getattr(column.server_default, 'execute', None) else column.server_default.arg)

        # Default (None)
        else:
            defaults[column.name] = None

    # Related Properties
    for property in relatedProperties:
        defaults[property] = (None if (property in idColumns) else [])

    # Return Defaults
    return defaults


# FUNCTION: Retrieve Object (By Unique)
@log()
def retrieveObjectByUnique(session, classDef, values, autoComplete=True):

    # Define Variables
    uniqueProperties = mergeUniqueDefinitions(classDef._properties.unique)
    referencedProperties = classDef().getRelatedProperties()
    mergeItems = [property for property in list(set(flattenArray(list(uniqueProperties.values())))) if (property in referencedProperties)]
    orMatch = []
    andMatch = []

    # Autocomplete
    if (autoComplete):
        objValues = objectify(values)
        objValues = completeTentativeObject(session, classDef, objValues, objValues)
        values = vars(objValues)

    # Complete Missing Properties (as Defaults)
    defaultValues = getDefaultValues(classDef)
    [values.update({property: default}) for property, default in defaultValues.items() if (property not in values)]

    # Single Unique (OR)
    if (uniqueProperties['single']):

        # Join Aliases
        [query, aliases] = createAndJoinAliases(session.query(classDef), classDef, {}, mergeItems)

        # Simple Filter
        orMatch.extend(query.filter(or_(*[createPlainRetrieveFilterStatement(classDef, values, single, aliases) for single in uniqueProperties['single'] if ((single in values) and (not isinstance(values[single], list)) and values[single])])).all())

        # Complex Filter
        [orMatch.extend(createListRetrieveFilterStatement(classDef, values, single, aliases, query).all()) for single in uniqueProperties['single'] if ((single in values) and isinstance(values[single], list))]

    # Multi Unique (AND)
    if (uniqueProperties['multi']):

        # Join Aliases
        [query, aliases] = createAndJoinAliases(session.query(classDef), classDef, {}, mergeItems)

        # Simple Filter
        andMatch.append(query.filter(and_(*[createPlainRetrieveFilterStatement(classDef, values, multi, aliases) for multi in uniqueProperties['multi'] if ((multi in values) and (not isinstance(values[multi], list)))])).all())

        # Complex Filter
        [andMatch.append(createListRetrieveFilterStatement(classDef, values, multi, aliases, query).all()) for multi in uniqueProperties['multi'] if ((multi in values) and isinstance(values[multi], list))]

    # Merge
    andMatch = list(set(andMatch[0]).intersection(*andMatch) if andMatch else [])
    orMatch = list(set(orMatch))
    results = list(set(orMatch + andMatch))

    # Return Value
    return ((results if (len(results) > 1) else results[0]) if (results) else None)


# FUNCTION: Check Rights
@log(returnValue=False)
def checkRights(session, object, action, user):
    [query, aliases] = createAndJoinAliases(session.query(tables.Right.own, tables.Right.isolated, tables.Right.all), tables.Right, {}, ['apiObject', 'apiAction'])
    query = query.filter(and_((getSubAlias(aliases['apiObject']).name == object), (getSubAlias(aliases['apiAction']).name == action)))
    [query, aliases] = filters.filterByRights(query, tables.Right, 'own', user, aliases=aliases)
    rights = query.all()
    if rights:
        return [any(i) for i in zip(*rights)]
    _logger.debug('No rights found!') # noCoverage
    return False # noCoverage


# FUNCTION: Check Plugin Action Rights
@log(returnValue=False)
def checkPluginActionRights(session, pluginId, action, user):
    [query, aliases] = createAndJoinAliases(session.query(tables.PluginActionRight.own, tables.PluginActionRight.isolated, tables.PluginActionRight.all), tables.PluginActionRight, {}, ['plugin'])
    query = query.filter(and_((getSubAlias(aliases['plugin']).id == pluginId), (tables.PluginActionRight.action == action)))
    [query, aliases] = filters.filterByRights(query, tables.PluginActionRight, 'own', user, aliases=aliases)
    rights = query.all()
    if rights:
        return [any(i) for i in zip(*rights)]
    _logger.debug('No plugin action rights found!') # noCoverage
    return False # noCoverage


# FUNCTION: Check Plugin Option Rights
@log(returnValue=False)
def checkPluginOptionRights(session, pluginId, group, option, action, user):
    [query, aliases] = createAndJoinAliases(session.query(tables.PluginOptionRight), tables.PluginOptionRight, {}, ['plugin', 'apiAction'])
    query = query.filter(and_((getSubAlias(aliases['plugin']).id == pluginId), (getSubAlias(aliases['apiAction']).name == action), (tables.PluginOptionRight.group == group), (tables.PluginOptionRight.option == option)))
    [query, aliases] = filters.filterByRights(query, tables.PluginOptionRight, 'own', user, aliases=aliases)
    rights = query.all()
    if rights: return True
    _logger.debug('No plugin option rights found!') # noCoverage
    return False # noCoverage


# FUNCTION: Check Plugin Options Rights
@log(returnValue=False)
def checkPluginOptionsRights(session, pluginId, action, user):
    [query, aliases] = createAndJoinAliases(session.query(tables.PluginOptionRight), tables.PluginOptionRight, {}, ['plugin', 'apiAction'])
    query = query.filter(and_((getSubAlias(aliases['plugin']).id == pluginId), (getSubAlias(aliases['apiAction']).name == action)))
    [query, aliases] = filters.filterByRights(query, tables.PluginOptionRight, 'own', user, aliases=aliases)
    rights = query.all()
    result = [{'group': right.group, 'option': right.option} for right in rights]
    result = [dict(t) for t in {tuple(d.items()) for d in result}]
    if result:
        return result
    _logger.debug('No plugin options rights found!') # noCoverage
    return False # noCoverage


# FUNCTION: Check Limitations
@log(returnValue=False)
def checkLimitations(session, model, selectedRight, action, data):
    if (action == 'Create'):
        forbiddenParams = flattenArray([model._properties.notInitialisable.common, getattr(model._properties.notInitialisable, selectedRight)])
    elif (action == 'Edit'):
        forbiddenParams = flattenArray([model._properties.notEditable.common, getattr(model._properties.notEditable, selectedRight)])
    else:
        _logger.debug('Limitation: no action could be matched') # noCoverage
        return False # noCoverage
    foundParams = list(set(list(data.keys())).intersection(forbiddenParams))
    if foundParams:
        _logger.debug('Limitation: ' + str(foundParams) + ' is not ' + ('editable' if (action == 'Create') else 'initialisable'))
        return False
    return True


# FUNCTION: Get Own Rights
@log(returnValue=[])
def getOwnRights(session, user):
    aliases = splitInAliases(tables.Right, {}, ['apiObject', 'apiAction'])
    query = session.query(getSubAlias(aliases['apiObject']).id, getSubAlias(aliases['apiObject']).name, getSubAlias(aliases['apiAction']).id, getSubAlias(aliases['apiAction']).name, func.count(1).filter(tables.Right.own), func.count(1).filter(tables.Right.isolated), func.count(1).filter(tables.Right.all))
    [query, aliases] = joinAliases(query, aliases)
    [query, aliases] = filters.filterByRights(query, tables.Right, 'own', user, aliases=aliases)
    query = query.group_by(getSubAlias(aliases['apiObject']).id, getSubAlias(aliases['apiAction']).id)
    rights = query.all()
    return [{'apiObject': {'id': right[0], 'name': right[1]}, 'apiAction': {'id': right[2], 'name': right[3]}, 'right': ('all' if (right[6]) else ('isolated' if (right[5]) else 'own'))} for right in rights]


# FUNCTION: Get Own Plugin Action Rights (Only Activated Plugins)
@log(returnValue=[])
def getOwnPluginActionRights(session, user):
    aliases = splitInAliases(tables.PluginActionRight, {}, ['plugin'])
    query = session.query(getSubAlias(aliases['plugin']).id, getSubAlias(aliases['plugin']).name, tables.PluginActionRight.action, func.count(1).filter(tables.PluginActionRight.isolated), func.count(1).filter(tables.PluginActionRight.all))
    [query, aliases] = joinAliases(query, aliases)
    [query, aliases] = filters.filterByRights(query, tables.PluginActionRight, 'own', user, aliases=aliases)
    query = query.filter(getSubAlias(aliases['plugin']).activated==True)
    query = query.group_by(getSubAlias(aliases['plugin']).id, tables.PluginActionRight.action)
    rights = query.all()
    return [{'plugin': {'id': right[0], 'name': right[1]}, 'action': right[2], 'right': ('all' if (right[4]) else ('isolated' if (right[3]) else 'own'))} for right in rights]


# FUNCTION: Get Own Plugin Option Rights (Only Activated Plugins)
@log(returnValue=[])
def getOwnPluginOptionRights(session, user):
    aliases = splitInAliases(tables.PluginOptionRight, {}, ['plugin', 'apiAction'])
    query = session.query(getSubAlias(aliases['plugin']).id, getSubAlias(aliases['plugin']).name, getSubAlias(aliases['apiAction']).id, getSubAlias(aliases['apiAction']).name, tables.PluginOptionRight.group, tables.PluginOptionRight.option)
    [query, aliases] = joinAliases(query, aliases)
    [query, aliases] = filters.filterByRights(query, tables.PluginOptionRight, 'own', user, aliases=aliases)
    query = query.filter(getSubAlias(aliases['plugin']).activated==True)
    rights = query.all()
    return [{'plugin': {'id': right[0], 'name': right[1]}, 'apiAction': {'id': right[2], 'name': right[3]}, 'group': right[4], 'option': right[5]} for right in rights]


# FUNCTION: Get Active Plugins
@log(returnValue=[])
def getActivePlugins(session):
    activePlugins = session.query(tables.Plugin.id, tables.Plugin.name).filter(tables.Plugin.activated==True).all()
    return [{'id': plugin[0], 'name': plugin[1]} for plugin in activePlugins]


# FUNCTION: Complete Tentative Object
@log(returnValue=False)
def completeTentativeObject(session, model, obj, item):
    columns = model.__table__.columns
    relationships = inspect(model).relationships
    tableNameSplit = model.__tablename__ + '.'
    for rel_key, rel_val in relationships.items():
        idRef = rel_key + '_id'
        col = [col for col in columns if str(col).split(tableNameSplit)[1] == idRef]
        if len(col) == 1:
            col = col[0]
            if (idRef in vars(deepcopy(obj))):
                setattr(item, rel_key, session.query(getChildClass(model, [rel_key])).filter_by(id=getattr(obj, idRef)).first())
    return item


# TODO: No checkOwnAllowed and checkIsolatedAllowed, will need to change
# FUNCTION: Comply Rights
@log(returnValue=False)
def complyRights(session, model, obj, rights, user):
    if rights[2]:
        return obj
    if rights[1]:
        newItem = model(**vars(obj))
        item = completeTentativeObject(session, model, obj, newItem)
        if item:
        # TODO: Check if item is not out of user's scope (Team)
        # if item and checkIsolatedAllowed(item, user):
            session.expunge(item)
            return obj
        return False
    if rights[0]:
        newItem = model(**vars(obj))
        item = completeTentativeObject(session, model, obj, newItem)
        if item:
        # TODO: Check if item is not out of user's scope (Self)
        # if item and checkOwnAllowed(item, user):
            session.expunge(item)
            return obj
        return False
    return False


# FUNCTION: Determine JSON Object Joins
@log(returnValue=[])
def determineJSONObjectJoins(cls, value, src=None):
    joins = []
    for key, val in value.items():
        if isinstance(val, dict):
            joins = flattenArray([joins, determineJSONObjectJoins(getattr(cls, key), val, ((src + '.' + key) if (src) else key))])
        else:
            joins.append(src)
    return list(set(joins))


# FUNCTION: Create JSON Object Filters
@log(returnValue=[])
def createJSONObjectFilters(aliases, value, src=None):
    filters = []
    for key, val in value.items():
        if isinstance(val, dict):
            filters = flattenArray([filters, createJSONObjectFilters(aliases, val, ((src + '.' + key) if (src) else key))])
        else:
            filters.append((getattr(getSubAlias(aliases[src]), key) == val))
    return filters


# FUNCTION: Find JSON Object
@log()
def findJSONObject(session, objectClass, attr, value):
    subClass = get_class_by_table(tables.Base, inspect(objectClass).relationships[attr].target)
    [query, aliases] = createAndJoinAliases(session.query(subClass), subClass, {}, determineJSONObjectJoins(subClass, value))
    return query.filter(*createJSONObjectFilters(aliases, value)).first()


# FUNCTION: Complete JSON Related Object
@log(returnValue={})
def completeJSONRelatedObject(session, data, objectClass):
    replacedItems = {}
    for key, value in data.items():
        if isinstance(value, dict):
            replacedItems[key] = findJSONObject(session, objectClass, key, value)
        elif isinstance(value, list):
            replacedItems[key] = [findJSONObject(session, objectClass, key, val) for val in value]
    return replacedItems


# FUNCTION: Create Item By Dictionary (if not Existing)
@log(returnValue=False)
def createByDict(execParameter, sessionParameter, modelParameter, **kwargs):
    if (('forceId' in kwargs) and (kwargs['forceId'])):
        del kwargs['forceId']
        if 'id' in kwargs:
            if sessionParameter.query(modelParameter).filter_by(id=kwargs['id']).first():
                _logger.warning('Failed create transaction [' + str(modelParameter.__table__) + ' ' + str(kwargs['id']) + ' already exists] - ' + logExecutor(execParameter)) # noCoverage
                return False # noCoverage
    else:
        kwargs = noId(kwargs)
    found = retrieveObjectByUnique(sessionParameter, modelParameter, kwargs)
    if (found):
        _logger.warning('Failed create transaction [' + str(modelParameter.__table__) + ' not unique] - ' + logExecutor(execParameter)) # noCoverage
        return True # noCoverage
    else:
        regularKwargs = {}
        linkedKwargs = {}
        tableNameSplit = modelParameter.__tablename__ + '.'
        columns = [str(col).split(tableNameSplit)[1] for col in modelParameter.__table__.columns]
        relationships = inspect(modelParameter).relationships
        for key, val in kwargs.items():
            if key in columns:
                regularKwargs[key] = val
            if key in relationships:
                linkedKwargs[key] = val
        objectToAdd = modelParameter(**regularKwargs)
        [setattr(objectToAdd, key, val) for key, val in linkedKwargs.items()]
        sessionParameter.add(objectToAdd)
        try:
            versioningManager.setTransactionValues(detectTransactionParams(execParameter))
            sessionParameter.commit()
            versioningManager.resetTransactionValues()
            return True
        except:
            sessionParameter.rollback() # noCoverage
            _logger.error('Failed create transaction [' + str(modelParameter.__table__) + ' rollback] - ' + logExecutor(execParameter)) # noCoverage
            _logger.error(' '.join(str(traceback.format_exc()).split()))
            return False # noCoverage


# FUNCTION: Delete Item By Id (if Existing)
@log(returnValue=False)
def deleteById(execParameter, sessionParameter, modelParameter, idParameter):
    instance = sessionParameter.query(modelParameter).filter_by(id=idParameter).first()
    if instance:
        sessionParameter.delete(instance)
        try:
            versioningManager.setTransactionValues(detectTransactionParams(execParameter))
            sessionParameter.commit()
            versioningManager.resetTransactionValues()
            return True
        except:
            sessionParameter.rollback() # noCoverage
            _logger.error('Failed delete transaction [' + str(modelParameter.__table__) + ' rollback] - ' + logExecutor(execParameter)) # noCoverage
            _logger.error(' '.join(str(traceback.format_exc()).split()))
            return False # noCoverage
    else:
        _logger.warning('Failed delete transaction [' + str(modelParameter.__table__) + ' ' + str(idParameter) + ' does not exist] - ' + logExecutor(execParameter)) # noCoverage
        return False # noCoverage


# FUNCTION: Edit Item By Id (if Existing)
@log(returnValue=False)
def edit(execParameter, sessionParameter, modelParameter, idParameter, **kwargs):
    instance = sessionParameter.query(modelParameter).filter_by(id=idParameter).first()
    if instance:
        [setattr(instance, key, value) for key, value in kwargs.items()]
        try:
            versioningManager.setTransactionValues(detectTransactionParams(execParameter))
            sessionParameter.commit()
            versioningManager.resetTransactionValues()
            return True
        except:
            sessionParameter.rollback() # noCoverage
            _logger.error('Failed edit transaction [' + str(modelParameter.__table__) + ' rollback] - ' + logExecutor(execParameter)) # noCoverage
            _logger.error(' '.join(str(traceback.format_exc()).split()))
            return False # noCoverage
    else:
        _logger.warning('Failed edit transaction [' + str(modelParameter.__table__) + ' ' + str(idParameter) + ' does not exist] - ' + logExecutor(execParameter)) # noCoverage
        return False # noCoverage


# FUNCTION: Merge Item
@log(returnValue=False)
def merge(execParameter, sessionParameter, item):
    sessionParameter.merge(item)
    try:
        versioningManager.setTransactionValues(detectTransactionParams(execParameter))
        sessionParameter.commit()
        versioningManager.resetTransactionValues()
        return True
    except:
        sessionParameter.rollback() # noCoverage
        _logger.error('Failed merge transaction [' + str(item.__table__) + ' rollback] - ' + logExecutor(execParameter)) # noCoverage
        _logger.error(' '.join(str(traceback.format_exc()).split()))
        return False # noCoverage


# FUNCTION: Bulk Commit
@log(returnValue=False)
def bulkCommit(execParameter, sessionParameter):
    try:
        versioningManager.setTransactionValues(detectTransactionParams(execParameter))
        sessionParameter.commit()
        versioningManager.resetTransactionValues()
        return True
    except:
        sessionParameter.rollback() # noCoverage
        _logger.error('Failed bulk transaction [rollback] - ' + logExecutor(execParameter)) # noCoverage
        _logger.error(' '.join(str(traceback.format_exc()).split()))
        return False # noCoverage


# FUNCTION: Sync All Configurations
@log()
@inTempSession()
def syncAllConfigurations(session):
    syncAPIConfiguration(session=session)
    syncTranslationsConfiguration(session=session)
    syncGUIConfiguration(session=session)
    syncServiceConfiguration(session=session)
    syncMessagingConfigurations(session=session)
    syncLoggingConfiguration(session=session)
    syncSymbolicLinkConfiguration(session=session)
    symbolicLinkConfigFiles()
    calculateConfigHashes(session=session)


# FUNCTION: Sync Messaging Configurations
@log()
@inTempSession()
def syncMessagingConfigurations(session):
    syncTopicConfiguration(session=session)
    syncProducerConfiguration(session=session)
    syncConsumerConfiguration(session=session)


# Function: Sync API Configuration
@log()
@inTempSession()
def syncAPIConfiguration(session):
    updateAPIConfig(session.query(tables.Plugin).filter_by(activated=True).all())


# Function: Sync Translations Configuration
@log()
@inTempSession()
def syncTranslationsConfiguration(session):
    updateTranslationsConfig(session.query(tables.Plugin).all(), session.query(tables.Plugin).filter_by(activated=True).all())


# Function: Sync GUI Configuration
@log()
@inTempSession()
def syncGUIConfiguration(session):
    updateGUIConfig(session.query(tables.Plugin).filter_by(activated=True).all(), session.query(tables.PluginOption).filter_by(public=True).all())


# Function: Sync Table Configuration
@log()
@inTempSession()
def syncTableConfiguration(session):
    updateTableConfig(session.query(tables.Plugin).filter_by(installed=True).all())


# Function: Sync Service Configuration
@log()
@inTempSession()
def syncServiceConfiguration(session):
    updateServiceConfig(session.query(tables.Plugin).filter_by(activated=True).all())


# Function: Sync Topic Configuration
@log()
@inTempSession()
def syncTopicConfiguration(session):
    updateTopicConfiguration(session.query(tables.Plugin).filter_by(activated=True).all())
    createTopics()


# Function: Sync Producer Configuration
@log()
@inTempSession()
def syncProducerConfiguration(session):
    updateProducerConfig(session.query(tables.Plugin).filter_by(activated=True).all())


# Function: Sync Consumer Configuration
@log()
@inTempSession()
def syncConsumerConfiguration(session):
    updateConsumerConfig(session.query(tables.Plugin).filter_by(activated=True).all())


# Function: Sync Logging Configuration
@log()
@inTempSession()
def syncLoggingConfiguration(session):
    updateLoggingConfig(session.query(tables.Plugin).filter_by(installed=True).all())


# Function: Sync Symbolic Link Configuration
@log()
@inTempSession()
def syncSymbolicLinkConfiguration(session):
    updateSymbolicLinkConfig(session.query(tables.Plugin).filter_by(activated=True).all())


# FUNCTION: Calculate Config Hashes
@log()
@inTempSession()
def calculateConfigHashes(session):
    if (os.path.isfile('/etc/neatly/base/gui/gui.json')):
        license = readLicense()
        configHashes = {
            'config': calculateHash(readJSONFile('/etc/neatly/base/gui/gui.json')),
            'availableTranslations': calculateHash(serializeList(session.query(tables.Translation).filter_by(enabled=True).all(), internal=True, source='HashCalculation', rights=generateGetAllRights(['Translation']))),
            'right': calculateHash(serializeList(session.query(tables.Right).all(), internal=True, source='HashCalculation', rights=generateGetAllRights(['Right', 'ApiAction', 'ApiObject', 'Team', 'Function']))),
            'pluginActionRight': calculateHash(serializeList(session.query(tables.PluginActionRight).all(), internal=True, source='HashCalculation', rights=generateGetAllRights(['PluginActionRight', 'Plugin', 'Team', 'Function']))),
            'pluginOptionRight': calculateHash(serializeList(session.query(tables.PluginOptionRight).all(), internal=True, source='HashCalculation', rights=generateGetAllRights(['PluginOptionRight', 'ApiAction', 'Plugin', 'Team', 'Function']))),
            'routes': calculateHash(readJSONFile('/etc/neatly/base/gui/routes/routes.json')),
            'translationFile': {translationFile: calculateHash(readJSONFile('/etc/neatly/base/gui/translations/' + translationFile)) for translationFile in next(os.walk('/etc/neatly/base/gui/translations/'))[2]},
            'license': calculateHash((license if license else {})),
            'plugin': calculateHash([{'id': plugin.id, 'name': plugin.name} for plugin in session.query(tables.Plugin).filter_by(activated=True).all()])
        }
        _logger.info('Generated config hashes')
        writeJSONFile('/etc/neatly/base/gui/hashes/config.json', configHashes)
    else:
        _logger.debug('Not generating config hashes yet, awaiting generation of gui config')
