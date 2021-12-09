################################################################################
# Author:     Thomas D'haenens
# License:    GPL-3.0
# Link:       https://github.com/BENEATLY/neat-community/
# Contact:    https://neatly.be/
################################################################################


# IMPORT: Standard Modules
from alembic.config import Config as AlembicConfig                                                                                  # Alembic Config Function
from alembic import command as AlembicCommand                                                                                       # Alembic Command Lib

# IMPORT: Custom Modules
from basic import *                                                                                                                 # Basic Lib
from triggers import mapTriggerFunction                                                                                             # Trigger Lib
from generated import mapGeneratedProperty, mapGeneratedSetter                                                                      # Generated Lib

# FUNCTION: Read Internal Tables
@log()
def readInternalTablesFile():
    return readJSONFile('/etc/neatly/base/table/internal.json')


# FUNCTION: Initialise Versioning Manager (& Set Reference)
@log()
def initVersioningManager(Base):
    versioningManager.init(Base, _logger)
    sys._versioningManager = versioningManager


# FUNCTION: Generate Foreign Key Object
@log()
def generateForeignKeyObject(fkDefinition):
    passedParams = {}
    passedParams['column'] = underscore(fkDefinition['column']['object'])+ '.' + fkDefinition['column']['attribute']
    passedParams.update({k: v for k, v in fkDefinition.items() if (k not in ['column'])})
    return sa.ForeignKey(**passedParams)


# FUNCTION: Generate Reference Join
@log()
def generateReferencedJoin(joinDefinition):
    return underscore(joinDefinition[0]['object']) + '.c.' + joinDefinition[0]['attribute'] + '==' + underscore(joinDefinition[1]['object']) + '.c.' + joinDefinition[1]['attribute']


# FUNCTION: Generate Static Table Definitions (No References)
@log()
def generateStaticTableDefinitions(classDef):

    # Table Definitions Variable
    tableDefinitions = {}

    # PRIVATE PROPERTIES
    tableDefinitions.update(classDef['private'])

    # COMMON PROPERTIES
    tableDefinitions['properties'] = Obj(classDef['properties'], withList=False)

    # DIRECT PROPERTIES
    for refName, refDef in classDef['table']['direct'].items():
        passedParams = {}

        # JSONB Type
        if (refDef['type'] == 'NestedJSONB'):
            passedParams['type_'] = NestedMutable.as_mutable(JSONB)
            passedParams['default'] = text("'{}'::jsonb")
            passedParams['server_default'] = text("'{}'::jsonb")

        # JSONB Any Type
        elif (refDef['type'] == 'PlainJSONB'):
            passedParams['type_'] = JSONB
            passedParams['default'] = text("'{}'::jsonb")
            passedParams['server_default'] = text("'{}'::jsonb")

        # Other Types
        else:
            passedParams['type_'] = getattr(sa, refDef['type'])(refDef['parameter']) if ('parameter' in refDef) else getattr(sa, refDef['type'])

        # Defaults
        if ('default' in refDef):

            # Default Dictionary (Module)
            if (isinstance(refDef['default'], dict)):

                # Datetime Module
                if (refDef['default']['module'] == 'datetime'):
                    passedParams['default'] = getattr(datetime, refDef['default']['function'])

            # Plain Value
            else:
                passedParams['default'] = refDef['default']

        # Complete Other Definitions
        passedParams.update({k: v for k, v in refDef.items() if (k not in ['type', 'parameter', 'default'])})
        tableDefinitions[refName] = sa.Column(**passedParams)

    # Return Table Definitions
    return tableDefinitions


# FUNCTION: Generate Dynamic Table Definitions (With References)
@log()
def generateDynamicTableDefinitions(classDef):

    # Table Definitions Variable
    tableDefinitions = {}

    # ID REFERENCED PROPERTIES
    for refName, refDef in classDef['table']['idReference'].items():
        passedParams = {}
        passedParams['type_'] = sa.Integer
        passedParams.update({k: v for k, v in refDef.items() if (k not in ['foreignKey'])})
        tableDefinitions[refName] = sa.Column(generateForeignKeyObject(refDef['foreignKey']), **passedParams)

    # REFERENCED PROPERTIES
    for refName, refDef in classDef['table']['reference'].items():
        passedParams = {}
        if ('foreignKey' in refDef):
            passedParams['foreign_keys'] = underscore(refDef['foreignKey']['column']['object']) + '.c.' + refDef['foreignKey']['column']['attribute']
        if ('secondary' in refDef):
            passedParams['secondary'] = underscore(refDef['secondary'])
        if ('backPopulates' in refDef):
            passedParams['back_populates'] = refDef['backPopulates']
        if ('backRef' in refDef):
            passedParams['backref'] = refDef['backRef']
        if ('primaryJoin' in refDef):
            passedParams['primaryjoin'] = generateReferencedJoin(refDef['primaryJoin'])
        if ('secondaryJoin' in refDef):
            passedParams['secondaryjoin'] = generateReferencedJoin(refDef['secondaryJoin'])
        if ('postUpdate' in refDef):
            passedParams['post_update'] = refDef['postUpdate']
        passedParams.update({k: v for k, v in refDef.items() if (k not in ['relatedObject', 'foreignKey', 'secondary', 'backPopulates', 'backRef', 'primaryJoin', 'secondaryJoin', 'postUpdate'])})
        tableDefinitions[refName] = relationship(refDef['relatedObject'], **passedParams)

    # GENERATED HYBRID PROPERTIES
    for refName, refDef in classDef['generated']['hybrid'].items():

        # Property
        tableDefinitions[refName] = hybrid_property(mapGeneratedProperty(refDef))

        # Setter
        if ('setter' in refDef):
            tableDefinitions[refName] = tableDefinitions[refName].setter(mapGeneratedSetter(refDef))

    # GENERATED COLUMN PROPERTIES
    for refName, refDef in classDef['generated']['column'].items():
        tableDefinitions[refName] = column_property(mapGeneratedProperty(refDef)(**tableDefinitions))

    # Return Table Definitions
    return tableDefinitions


# FUNCTION: Generate Link Definitions
@log()
def generateLinkDefinitions(linkName, linkDef, base):
    columns = list(linkDef.keys())
    return sa.Table(underscore(linkName), base.metadata,
        sa.Column(columns[0], sa.Integer, generateForeignKeyObject(linkDef[columns[0]]['foreignKey']), primary_key=True),
        sa.Column(columns[1], sa.Integer, generateForeignKeyObject(linkDef[columns[1]]['foreignKey']), primary_key=True)
    )


# Generic Class Object
class Generic():

    # FUNCTION: Convert to Dictionary
    def to_dict(self): return {c.name: getattr(self, c.name) for c in self.__table__.columns}

    # FUNCTION: Iterate over Dictionary
    def __iter__(self): return self.to_dict().iteritems()

    # FUNCTION: Get Direct Property Names (No Id)
    @lru_cache
    def getDirectProperties(self): return [c.name for c in self.__table__.columns if (not c.name.endswith('_id'))]

    # FUNCTION: Get Direct Property Names (Id)
    @lru_cache
    def getDirectIdProperties(self): return [c.name for c in self.__table__.columns if c.name.endswith('_id')]

    # FUNCTION: Get All Direct Property Names
    @lru_cache
    def getAllDirectProperties(self): return [c.name for c in self.__table__.columns]

    # FUNCTION: Get Related Property Names
    @lru_cache
    def getRelatedProperties(self): return [i[0] for i in inspect(self.__class__).relationships.items()]

    # FUNCTION: Get All Property Names
    @lru_cache
    def getAllProperties(self): return (self.getDirectProperties() + self.getRelatedProperties())

    # FUNCTION: Get Attribute (if Existing)
    def getAttr(self, attr): return (getattr(self, attr) if (attr in self.getAllProperties()) else None)

    # FUNCTION: Set Attribute (if Existing)
    def setAttr(self, attr, val):
        if attr in self.getAllProperties():
            setattr(self, attr, val)
            return True
        return False

    # FUNCTION: Get All Properties
    def getAll(self): return {attr: getattr(self, attr) for attr in self.getAllProperties()}

    # FUNCTION: Get Public (Generic)
    def getPublic(self, meta, finites={}):
        className = self.__class__.__name__
        newFinites = deepcopy(finites)
        foundRights = [right for right in meta['rights'] if (right['apiAction']['name'] == 'Get') and (right['apiObject']['name'] == className)]
        rightLevel = (foundRights[0]['right'] if (foundRights) else None)
        if (not rightLevel):
            _logger.warning('No \'Get\' rights on ' + self.__class__.__name__ + ' - ' + logExecutor(meta))
            raise AttributeError()
        if (not newFinites):
            newFinites = {'handBrake': [className], 'finiteBreak': self.properties.finiteBreak}
        else:
            newFinites['handBrake'].append(className)
            if (len(newFinites['handBrake']) > 3):
                if (any(newFinites['handBrake'][-2:] == newFinites['handBrake'][:-2][i:i+2] for i in range(len(newFinites['handBrake']) - 3))):
                    _logger.warning('Endless iteration found: ' + str(newFinites['handBrake']))
                    raise AttributeError()
            newFinites['finiteBreak'] = [finite[1:] for finite in newFinites['finiteBreak'] if (len(finite) > 1)]
        currentFinites = [finite[0] for finite in newFinites['finiteBreak'] if (len(finite) == 1)]
        itemDict = {}
        attributes = list(set(getattr(self.properties.public, 'common') + getattr(self.properties.public, rightLevel)) - set(currentFinites))
        for attribute in attributes:
            itemDict[attribute] = getattr(self, attribute)
            if (hasattr(itemDict[attribute], 'id')):
                try:
                    itemDict[attribute] = itemDict[attribute].getPublic(meta, finites=newFinites)
                except:
                    del itemDict[attribute]
            elif (hasattr(itemDict[attribute], '_sa_adapter')):
                try:
                    itemDict[attribute] = [item.getPublic(meta, finites=newFinites) for item in itemDict[attribute]]
                except:
                    del itemDict[attribute]
            elif (isinstance(itemDict[attribute], time)):
                itemDict[attribute] = itemDict[attribute].isoformat()
            elif (isinstance(itemDict[attribute], datetime)):
                itemDict[attribute] = itemDict[attribute].isoformat()
            elif (isinstance(itemDict[attribute], date)):
                itemDict[attribute] = itemDict[attribute].isoformat()
        return itemDict

    # FUNCTION: Get Definition
    @lru_cache
    @log()
    def getDefinition(self):
        guiConfig = readJSONFile('/etc/neatly/base/gui/gui.json')
        return guiConfig['definitions']['Object'][self.__class__.__name__]


# Read Tables
definedTables = readTablesFile()
internalDefinedTables = readInternalTablesFile()
allKnownTables = addSyncDicts([definedTables, internalDefinedTables])


# Create Engine
sqlEngineConfig = readJSONFile('/etc/neatly/base/sqlEngine.json')
engine = create_engine(createDBPathConfig(sys.sharedConfig.db['connection']), **{**sqlEngineConfig['engine'], **{'json_serializer': engineEncoder, 'json_deserializer': engineDecoder}})
Base = declarative_base(bind=engine)


# Initialise Versioning Manager
initVersioningManager(Base)


# Define Table Links
for linkName, linkDef in definedTables['link'].items():
    globals().__setitem__(linkName, generateLinkDefinitions(linkName, linkDef, Base))
    versioningManager.auditTable(globals()[linkName])


# Define Table Classes (Static, to create classes)
for className, classDef in definedTables['class'].items():
    globals().__setitem__(className, type(className, (Base, Generic,), generateStaticTableDefinitions(classDef)))


# Define Internal Table Properties (Static, to create classes)
for className, classDef in internalDefinedTables['class'].items():
    globals().__setitem__(className, getattr(versioningManager, className.lower() + 'Cls'))
    tableDef = {**generateStaticTableDefinitions(classDef), **vars(Generic)}
    [setattr(globals()[className], k, v) for k,v in tableDef.items() if (k != '__dict__')]


# Define Table Classes (Dynamic, w/ Existing Classes)
for className, classDef in definedTables['class'].items():
    [setattr(globals()[className], k, v) for k,v in generateDynamicTableDefinitions(classDef).items()]


# Define Internal Table Properties (Dynamic, w/ Existing Classes)
for className, classDef in internalDefinedTables['class'].items():
    [setattr(globals()[className], k, v) for k,v in generateDynamicTableDefinitions(classDef).items()]


# Define Table Triggers (Before Commit)
for className, classDef in definedTables['class'].items():
    for trigger in classDef['trigger']:
        if (not trigger['event'].startswith('after_commit_')):
            if ('attribute' in trigger):
                sa.event.listen(getattr(get_class_by_table(Base, Base.metadata.tables[classDef['private']['__tablename__']]), trigger['attribute']), trigger['event'], mapTriggerFunction(trigger))
            else:
                sa.event.listen(get_class_by_table(Base, Base.metadata.tables[classDef['private']['__tablename__']]), trigger['event'], mapTriggerFunction(trigger))


# FUNCTION: Link After Commit Triggers
@log()
def linkAfterCommitTriggers(session):
    afterCommitTriggers = []
    for className, classDef in definedTables['class'].items():
        for trigger in classDef['trigger']:
            if (trigger['event'].startswith('after_commit_')):
                afterCommitTriggers.append((get_class_by_table(Base, Base.metadata.tables[classDef['private']['__tablename__']]), trigger['event'], mapTriggerFunction(trigger)))
    if (afterCommitTriggers):
        ModelChangeEvent(session, afterCommitTriggers)


# FUNCTION: Link Versioning
@log()
def linkVersioning(session):
    sys._versioningManager.linkSession(session)


# FUNCTION: Create Database Session
@log()
def createDBSession():

    # Create New Session Object
    engine = create_engine(createDBPathConfig(sys.sharedConfig.db['connection']), **{**sqlEngineConfig['engine'], **{'json_serializer': engineEncoder, 'json_deserializer': engineDecoder}})
    Session = scoped_session(sessionmaker(**{'bind': engine, **sqlEngineConfig['session']}))
    session = Session()

    # Link After Commit Triggers
    linkAfterCommitTriggers(session)

    # Return Session
    return session


# FUNCTION: Temporary Session Decorator
@log()
def inTempSession():
    def inTempSessionInternal(func):
        @wraps(func)
        def inTempSessionWrapper(*args, **kwargs):
            if ('session' in kwargs):
                result = func(*args, **kwargs)
            else:
                session = createDBSession()
                result = func(*args, **{**kwargs, 'session': session})
                session.close()
            return result
        return inTempSessionWrapper
    return inTempSessionInternal


# FUNCTION: Create Tables
@log()
def createTables():

    # Try
    try:

        # Log Attempt
        _logger.info('Creating tables')

        # CREATE: Session
        session = createDBSession()

        # ENABLE: Btree
        enableBtree()

        # CREATE: Mappers (Attempt and Retry)
        try: sa.orm.configure_mappers()
        except: sa.orm.configure_mappers()

        # CREATE: Transaction and Activity Tables in DB (Attempt)
        try:
            versioningManager.transactionCls.__table__.create(engine, checkfirst=True)
            versioningManager.activityCls.__table__.create(engine, checkfirst=True)

        # CREATE: Transaction and Activity Tables in DB (Retry, creation of audit_table)
        except:
            versioningManager.transactionCls.__table__.create(engine, checkfirst=True)
            versioningManager.activityCls.__table__.create(engine, checkfirst=True)

        # CREATE: Tables in DB
        Base.metadata.create_all(engine, checkfirst=True)

        # ENABLE: TimeScale
        enableTimeScale()

        # CLOSE: Session
        session.close()

        # Log Message
        _logger.info('Successfully created tables')

        # Return
        return True

    # Except
    except:

        # Log Error
        _logger.error('Failed to create tables')
        _logger.error(' '.join(str(traceback.format_exc()).split()))

        # Return
        return False


# FUNCTION: Btree Gist Extension (PostgreSQL Only)
@log()
def enableBtree():
    _logger.info('Enabling Btree Gist Extension on: ' + str(sys.sharedConfig.db['connection']['db']))
    [bTreeOut, bTreeStatus] = shHandler(handler=shPasswordHandler(str(sys.sharedConfig.db['connection']['password'])))(sys.executables.dbClient)('-U', str(sys.sharedConfig.db['connection']['userName']), str(sys.sharedConfig.db['connection']['db']), '-c', 'CREATE EXTENSION IF NOT EXISTS btree_gist CASCADE;')
    if (bTreeStatus): _logger.info('Enabled Btree Gist Extension')
    else: _logger.warning('Failed to enable Btree Gist Extension: ' + ' '.join(bTreeOut.split()))


# FUNCTION: TimeScale Extension & Create TimeScale HyperTables (PostgreSQL Only)
@log()
def enableTimeScale():
    _logger.info('Enabling TimeScale Extension on: ' + str(sys.sharedConfig.db['connection']['db']))
    [timeScaleOut, timeScaleStatus] = shHandler(handler=shPasswordHandler(str(sys.sharedConfig.db['connection']['password'])))(sys.executables.dbClient)('-U', str(sys.sharedConfig.db['connection']['userName']), str(sys.sharedConfig.db['connection']['db']), '-c', 'CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;')
    if (timeScaleStatus): _logger.info('Enabled TimeScale Extension')
    else: _logger.warning('Failed to enable TimeScale Extension: ' + ' '.join(timeScaleOut.split()))
    for className, classDef in definedTables['class'].items():
        if (classDef['properties']['timeSeries']):
            _logger.info('Creating Hypertable on table: ' + str(classDef['private']['__tablename__']))
            [hyperTableOut, hyperTableStatus] = shHandler(handler=shPasswordHandler(str(sys.sharedConfig.db['connection']['password'])))(sys.executables.dbClient)('-U', str(sys.sharedConfig.db['connection']['userName']), str(sys.sharedConfig.db['connection']['db']), '-c', 'SELECT CREATE_HYPERTABLE(\'"' + str(classDef['private']['__tablename__']) + '"\', \'' + str(cl['properties']['timeSeries']) + '\');')
            if (hyperTableStatus): _logger.info('Created Hypertable on table: ' + str(classDef['private']['__tablename__']))
            else: _logger.warning('Failed to create Hypertable on table: ' + str(classDef['private']['__tablename__']))


# FUNCTION: Alembic Migration - Prohibit Deletion Revisions
@log()
def prohibitDeletionRevisions(path):
    currentContent = readTextFile(path)
    currentContent = currentContent.split('\n')
    newContent = ''
    for i, line in enumerate(currentContent):
        if ('op.drop_table' not in line) and ('op.drop_column' not in line):
            newContent += line + '\n'
        else:
            _logger.debug('Dropping Alembic revision line: ' + str(line.lstrip()))
    currentContent = newContent.split('\n')
    newContent = ''
    for i, line in enumerate(currentContent):
        if ('commands auto generated by Alembic' in line) and (i < len(currentContent)-1) and ('end Alembic commands' in currentContent[i+1]):
            newContent += line + '\n'
            newContent += '    pass' + '\n'
        else:
            newContent += line + '\n'
    writeTextFile(path, newContent)


# FUNCTION: Alembic Migration - Prohibit Foreign Key Creation
@log()
def prohibitFKCreation(path):
    currentContent = readTextFile(path)
    currentContent = currentContent.split('\n')
    newContent = ''
    for i, line in enumerate(currentContent):
        if ('sa.ForeignKeyConstraint' not in line):
            newContent += line + '\n'
        else:
            _logger.debug('Dropping Alembic revision line: ' + str(line.lstrip()))
    writeTextFile(path, newContent)


# FUNCTION: Alembic Migration - Migrate Without FK
@log(False)
def migrateWithoutFK(config):

    # Suppress Output to stdout
    with suppress():

        # CREATE: Create Automatic Migration Script for DB
        revision = AlembicCommand.revision(config, '.'.join([sys.sharedConfig.db['connection']['ip'], sys.sharedConfig.db['connection']['type'], sys.sharedConfig.db['connection']['db']]), True, False, 'head', False, None, None, None, None, None)

    # Log Message
    _logger.info('Generated migration file for transition from tag ' + str(revision.down_revision) + ' to tag ' + str(revision.revision) + ' (' + str(revision.doc) + ')')

    # Prohibit Deletions Revisions
    prohibitDeletionRevisions(revision.path)

    # Prohibit Foreign Key Creation
    prohibitFKCreation(revision.path)

    # Perform Change Operations to DB (without FKs)
    _logger.info('Performing database migration (without FK) from tag ' + str(revision.down_revision) + ' to tag ' + str(revision.revision))
    AlembicCommand.upgrade(config, 'head')

    # Success
    return True


# FUNCTION: Alembic Migration - Migrate FK
@log(False)
def migrateFK(config):

    # Suppress Output to stdout
    with suppress():

        # CREATE: Create Automatic Migration Script for DB
        revision = AlembicCommand.revision(config, '.'.join([sys.sharedConfig.db['connection']['ip'], sys.sharedConfig.db['connection']['type'], sys.sharedConfig.db['connection']['db']]), True, False, 'head', False, None, None, None, None, None)

    # Log Message
    _logger.info('Generated migration file for transition from tag ' + str(revision.down_revision) + ' to tag ' + str(revision.revision) + ' (' + str(revision.doc) + ')')

    # Prohibit Deletions Revisions
    prohibitDeletionRevisions(revision.path)

    # Perform Change Operations to DB (FKs)
    _logger.info('Performing database FK migration from tag ' + str(revision.down_revision) + ' to tag ' + str(revision.revision))
    AlembicCommand.upgrade(config, 'head')

    # Success
    return True


# FUNCTION: Alembic Migration - Migrate Tables
@log(False)
def migrateTables():

    # Define Variables
    status = []

    # CONFIGURATION: Define Alembic Configuration
    config = AlembicConfig()
    config.set_main_option('script_location', 'migrations')
    config.set_main_option('sqlalchemy.url', createDBPathConfig(sys.sharedConfig.db['connection']))

    # MIGRATE: Tables
    status.append(migrateWithoutFK(config))
    status.append(migrateFK(config))
    status = all(status)

    # Log Message
    if (status): _logger.info('Migration of database finished successfully')
    else: _logger.error('Migration of database failed') # noCoverage

    # Return Status
    return status
