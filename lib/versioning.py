################################################################################

# Contains code from the following sources:

#
# Source:     https://github.com/kvesteri/postgresql-audit
# License:    BSD 2-Clause "Simplified" License
# Hash:       43e99f4(565)
#

#
# Author:     Thomas D'haenens
# License:    GPL-3.0
# Link:       https://github.com/BENEATLY/neat-start-orig/
# Contact:    https://neatly.be/
#

################################################################################


# IMPORT: Standard Modules
import string                                                                                                           # String Lib
import warnings                                                                                                         # Warnings Lib
import os                                                                                                               # OS Lib
import ujson                                                                                                            # UJSON Lib
from contextlib import contextmanager                                                                                   # Context Lib
from functools import partial                                                                                           # Partial Lib
from weakref import WeakSet                                                                                             # WeakRef Lib
import sqlalchemy as sa                                                                                                 # SQLAlchemy Lib
from sqlalchemy import orm                                                                                              # SQLAlchemy ORM
from sqlalchemy.dialects.postgresql import array, ExcludeConstraint, INET, insert, JSONB                                # PostgreSQL Dialects
from sqlalchemy.dialects.postgresql.base import PGDialect                                                               # PostgreSQL Dialects
from sqlalchemy.ext.declarative import declared_attr                                                                    # Declared Attributes
from sqlalchemy.ext.hybrid import hybrid_property                                                                       # Hybrid Properties
from sqlalchemy_utils import get_class_by_table                                                                         # SQLAlchemy Utils
from datetime import datetime                                                                                           # Date Gen Lib
from flask import request, g                                                                                            # Flask Global Lib
from flask.globals import _app_ctx_stack, _request_ctx_stack                                                            # Flask Global Lib
from copy import copy, deepcopy                                                                                         # Copy Lib
from sqlalchemy.dialects.postgresql import JSONB                                                                        # JSONB Dialect
from sqlalchemy.ext.compiler import compiles                                                                            # SQLAlchemy Compiles
from sqlalchemy.sql import expression                                                                                   # SQLAlchemy Expression


##### UTILS #####

# FUNCTION: Read JSON File (No Logging)
def readJSONFile(file):
    with open(file, encoding='utf-8') as content:
        return ujson.load(content)


# FUNCTION: Read Text File (No Logging)
def readTextFile(file):
    with open(file, 'r') as content:
        return content.read()


# CONFIGURATION: Determine Installation Location
locationConfig = readJSONFile('/etc/neatly/base/location.json')


# CLASS: Statement Executor
class StatementExecutor(object):
    def __init__(self, stmt):
        self.stmt = stmt

    def __call__(self, target, bind, **kwargs):
        tx = bind.begin()
        bind.execute(self.stmt)
        tx.commit()


# FUNCTION: Render Template
def renderTemplate(templateName, schemaName=None):
    fileContents = readTextFile(locationConfig['lib'] + 'versioningTemplates/' + templateName).replace('%', '%%').replace('$$', '$$$$')
    template = string.Template(fileContents)
    context = dict(schema_name=schemaName)

    if schemaName is None:
        context['schema_prefix'] = ''
        context['revoke_cmd'] = ''
    else:
        context['schema_prefix'] = '{}.'.format(schemaName)
        context['revoke_cmd'] = ('REVOKE ALL ON {schema_prefix}activity FROM public;').format(**context)

    return template.substitute(**context)


# FUNCTION: Create Operators
def createOperators(target, bind, schemaName, **kwargs):
    operatorsTemplate = renderTemplate('operators.sql', schemaName)
    StatementExecutor(operatorsTemplate)(target, bind, **kwargs)


# FUNCTION: Create Audit Table
def createAuditTable(target, bind, schemaName, useStatementLevelTriggers, **kwargs):
    sql = ''
    if (useStatementLevelTriggers):
        sql += renderTemplate('createActivityStmtLevel.sql', schemaName)
        sql += renderTemplate('auditTableStmtLevel.sql', schemaName)
    else:
        sql += renderTemplate('createActivityRowLevel.sql', schemaName)
        sql += renderTemplate('auditTableRowLevel.sql', schemaName)
    StatementExecutor(sql)(target, bind, **kwargs)


# FUNCTION: Build Register Table Query
def buildRegisterTableQuery(schemaName, *args):
    if schemaName is None:
        func = sa.func.audit_table
    else:
        func = getattr(getattr(sa.func, schemaName), 'audit_table')
    return sa.select([func(*args)])


##### BASE #####

# DEFINITIONS: VARIABLES
cachedStatements = {}


# EXCEPTION: Improperly Configured
class ImproperlyConfigured(Exception):
    pass


# EXCEPTION: Class Not Versioned
class ClassNotVersioned(Exception):
    pass


# FUNCTION: Assign User
def assignUser(base, cls, userCls):
    if hasattr(cls, 'user_id'):
        return
    primaryKey = sa.inspect(userCls).primary_key[0]
    cls.user_id = sa.Column('user_id', primaryKey.type)
    cls.user = orm.relationship(userCls, primaryjoin=cls.user_id == (getattr(userCls, primaryKey.name)), foreign_keys=[cls.user_id])


# FUNCTION: Assign Plugin
def assignPlugin(base, cls, pluginCls):
    if hasattr(cls, 'plugin_id'):
        return
    primaryKey = sa.inspect(pluginCls).primary_key[0]
    cls.plugin_id = sa.Column('plugin_id', primaryKey.type)
    cls.plugin = orm.relationship(pluginCls, primaryjoin=cls.plugin_id == (getattr(pluginCls, primaryKey.name)), foreign_keys=[cls.plugin_id])


# FUNCTION: Convert Callables
def convertCallables(values):
    return {key: value() if callable(value) else value for key, value in values.items()}


# CLASS: Session Manager
class SessionManager(object):

    # FUNCTION: Initialise
    def __init__(self, transactionCls, logger=None, values=None):
        self.transactionCls = transactionCls
        self.logger = logger
        self.values = values or {}
        self._markedTransactions = set()
        self.listeners = ((orm.session.Session, 'before_flush', self.beforeFlush,),)

    # FUNCTION: Get Transaction Values
    def getTransactionValues(self):
        return self.values

    # FUNCTION: Set Transaction Values
    def setTransactionValues(self, values):
        self.values.update(values)

    # FUNCTION: Reset Transaction Values
    def resetTransactionValues(self):
        self.values = {}

    # FUNCTION: Set Activity Values
    def setActivityValues(self, session):
        dialect = session.bind.engine.dialect
        table = self.transactionCls.__table__

        # Check for Dialect
        if not isinstance(dialect, PGDialect):
            warnings.warn('"{0}" is not a PostgreSQL dialect. No versioning data will be saved.'.format(dialect.__class__), RuntimeWarning)
            return

        # Create Activity
        values = convertCallables(self.getTransactionValues())
        if values:
            values['nativeTransaction_id'] = sa.func.txid_current()
            stmt = (insert(table).values(**values).on_conflict_do_nothing(constraint='transaction_unique_native_tx_id').returning(table.c.id))
            transactionId = session.execute(stmt).scalar()
            self.logger.info('Issued transaction ' + str(transactionId))

    # FUNCTION: Modified Columns
    def modifiedColumns(self, obj):
        columns = set()
        mapper = sa.inspect(obj.__class__)
        for key, attr in sa.inspect(obj).attrs.items():
            if key in mapper.synonyms.keys():
                continue
            prop = getattr(obj.__class__, key).property
            if attr.history.has_changes():
                columns |= set(prop.columns if isinstance(prop, sa.orm.ColumnProperty) else [local for local, remote in prop.local_remote_pairs])
        return columns

    # FUNCTION: Is Modified
    def isModified(self, objOrSession):
        if hasattr(objOrSession, '__mapper__'):
            if not hasattr(objOrSession, '__versioned__'):
                raise ClassNotVersioned(objOrSession.__class__.__name__)
            excluded = objOrSession.__versioned__.get('exclude', [])
            return bool(set([column.name for column in self.modifiedColumns(objOrSession)]) - set(excluded))
        else:
            return any(self.isModified(entity) or entity in objOrSession.deleted for entity in objOrSession if hasattr(entity, '__versioned__'))

    # FUNCTION: Before Flush
    def beforeFlush(self, session, flushContext, instances):
        if session.transaction in self._markedTransactions:
            return
        if session.transaction:
            self.addEntryAndMarkTransaction(session)

    # FUNCTION: Add Entry and Mark Transaction
    def addEntryAndMarkTransaction(self, session):
        if self.isModified(session):
            self._markedTransactions.add(session.transaction)
            self.setActivityValues(session)

    # FUNCTION: Attach Listeners
    def attachListeners(self):
        for listener in self.listeners:
            sa.event.listen(*listener)

    # FUNCTION: Remove Listeners
    def removeListeners(self):
        for listener in self.listeners:
            sa.event.remove(*listener)

    def linkSession(self, session):
        self.listeners += ((session, 'before_flush', self.beforeFlush,),)
        self.attachListeners()


# CLASS: Basic Versioning Manager
class BasicVersioningManager(object):
    _userCls = None
    _pluginCls = None
    _sessionManagerFactory = partial(SessionManager, values={})

    # FUNCTION: Initialise
    def __init__(self, userCls=None, pluginCls=None, sessionManagerFactory=None, schemaName=None, useStatementLevelTriggers=True):
        if userCls is not None:
            self._userCls = userCls
        if pluginCls is not None:
            self._pluginCls = pluginCls
        if sessionManagerFactory is not None:
            self._sessionManagerFactory = sessionManagerFactory
        self.values = {}
        self.listeners = ((orm.mapper, 'after_configured', self.afterConfigured),)
        self.schemaName = schemaName
        self.useStatementLevelTriggers = useStatementLevelTriggers

    # PROPERTY: User CLS
    @property
    def userCls(self):
        if isinstance(self._userCls, str):
            if not self.base:
                raise ImproperlyConfigured('This manager does not have declarative base set up yet. Call init method to set up this manager.')
            registry = self.base._decl_class_registry
            try:
                return registry[self._userCls]
            except KeyError:
                raise ImproperlyConfigured('Could not build relationship between Activity and %s. %s was not found in declarative class registry.' % (self._userCls, self._userCls))
        return self._userCls

    # PROPERTY: Plugin CLS
    @property
    def pluginCls(self):
        if isinstance(self._pluginCls, str):
            if not self.base:
                raise ImproperlyConfigured('This manager does not have declarative base set up yet. Call init method to set up this manager.')
            registry = self.base._decl_class_registry
            try:
                return registry[self._pluginCls]
            except KeyError:
                raise ImproperlyConfigured('Could not build relationship between Activity and %s. %s was not found in declarative class registry.' % (self._pluginCls, self._pluginCls))
        return self._pluginCls

    # FUNCTION: After Configured
    def afterConfigured(self):
        assignUser(self.base, self.transactionCls, self.userCls)
        assignPlugin(self.base, self.transactionCls, self.pluginCls)

    # FUNCTION: Activity Model Factory
    def activityModelFactory(self, base, transactionCls):
        class Activity(base):
            __table_args__ = {'schema': self.schemaName}
            __tablename__ = 'activity'

            id = sa.Column(sa.BigInteger, primary_key=True)
            tableName = sa.Column(sa.String(100))
            issuedAt = sa.Column(sa.DateTime, default=datetime.utcnow)
            verb = sa.Column(sa.String(20))
            originalData = sa.Column(JSONB, default={}, server_default='{}')
            changedData = sa.Column(JSONB, default={}, server_default='{}')

            # ATTRIBUTE: Transaction ID
            @declared_attr
            def transaction_id(cls):
                return sa.Column(sa.BigInteger, sa.ForeignKey(transactionCls.id))

            # ATTRIBUTE: Transaction
            @declared_attr
            def transaction(cls):
                return sa.orm.relationship(transactionCls, backref='activities')

            # HYBRID: Data
            @hybrid_property
            def data(self):
                data = self.originalData.copy() if self.originalData else {}
                if self.changedData:
                    data.update(self.changedData)
                return data

            # EXPRESSION: Data
            @data.expression
            def data(cls):
                return cls.originalData + cls.changedData

            # PROPERTY: Object
            @property
            def object(self):
                table = Base.metadata.tables[self.tableName]
                cls = get_class_by_table(Base, table, self.data)
                return cls(**self.data)

        return Activity

    # FUNCTION: Transaction Model Factory
    def transactionModelFactory(self, base):
        class Transaction(base):
            __tablename__ = 'transaction'

            id = sa.Column(sa.BigInteger, primary_key=True)
            nativeTransaction_id = sa.Column(sa.BigInteger)
            issuedAt = sa.Column(sa.DateTime, default=datetime.utcnow)
            clientAddress = sa.Column(INET)
            source = sa.Column(sa.String(100))
            description = sa.Column(sa.String(100))

            # FUNCTION: Table Arguments
            @declared_attr
            def __table_args__(cls):
                return (ExcludeConstraint((cls.nativeTransaction_id, '='), (sa.func.tsrange(cls.issuedAt - sa.text("INTERVAL '1 hour'"), cls.issuedAt,), '&&'), name='transaction_unique_native_tx_id'), {'schema': self.schemaName})

        return Transaction

    # FUNCTION: Attach Listeners
    def attachListeners(self):
        for listener in self.listeners:
            sa.event.listen(*listener)
        self.sessionManager.attachListeners()

    # FUNCTION: Remove Listeners
    def removeListeners(self):
        for listener in self.listeners:
            sa.event.remove(*listener)
        self.sessionManager.removeListeners()

    # FUNCTION: Set Transaction Values
    def setTransactionValues(self, values):
        self.sessionManager.setTransactionValues(values)

    # FUNCTION: Reset Transaction Values
    def resetTransactionValues(self):
        self.sessionManager.resetTransactionValues()

    # FUNCTION: Init
    def init(self, base, logger):
        self.base = base
        self.transactionCls = self.transactionModelFactory(base)
        self.activityCls = self.activityModelFactory(base, self.transactionCls)
        self.sessionManager = self._sessionManagerFactory(self.transactionCls, logger)
        self.attachListeners()

    # FUNCTION: Set Logger
    def setLogger(self, logger):
        self.sessionManager.logger = logger

    def linkSession(self, session):
        self.sessionManager.linkSession(session)


# CLASS: Versioning Manager
class VersioningManager(BasicVersioningManager):

    # FUNCTION: Initialise
    def __init__(self, userCls=None, pluginCls=None, sessionManagerFactory=None, schemaName=None, useStatementLevelTriggers=True):
        super().__init__(userCls=userCls, pluginCls=pluginCls, schemaName=schemaName, useStatementLevelTriggers=useStatementLevelTriggers, sessionManagerFactory=sessionManagerFactory)
        self.listeners = ((orm.mapper, 'instrument_class', self.instrumentVersionedClasses), (orm.mapper, 'after_configured', self.configureVersionedClasses),)
        self.tableListeners = self.getTableListeners()
        self.pendingClasses = WeakSet()

    # FUNCTION: Get Table Listeners
    def getTableListeners(self):
        listeners = {'transaction': []}
        listeners['activity'] = [
            ('after_create', sa.schema.DDL(renderTemplate('jsonbChangeKeyName.sql', self.schemaName))),
            ('after_create', partial(createAuditTable, schemaName=self.schemaName, useStatementLevelTriggers=self.useStatementLevelTriggers)),
            ('after_create', partial(createOperators, schemaName=self.schemaName))
        ]
        if self.schemaName is not None:
            listeners['transaction'] = [
                ('before_create', sa.schema.DDL(renderTemplate('createSchema.sql', self.schemaName))),
                ('after_drop', sa.schema.DDL(renderTemplate('dropSchema.sql', self.schemaName))),
            ]
        return listeners

    # FUNCTION: Audit Table
    def auditTable(self, table, excludeColumns=None):
        args = [table.name]
        if excludeColumns:
            for column in excludeColumns:
                if column not in table.c:
                    raise ImproperlyConfigured("Could not configure versioning. Table '{}'' does not have a column named '{}'.".format(table.name, column))
            args.append(array(excludeColumns))
        func = (sa.func.audit_table if (self.schemaName is None) else getattr(getattr(sa.func, self.schemaName), 'audit_table'))
        query = sa.select([func(*args)])
        if query not in cachedStatements:
            cachedStatements[query] = StatementExecutor(query)
        listener = (table, 'after_create', cachedStatements[query])
        if not sa.event.contains(*listener):
            sa.event.listen(*listener)

    # FUNCTION: Instrument Versioned Classes
    def instrumentVersionedClasses(self, mapper, cls):
        if hasattr(cls, '__versioned__') and cls not in self.pendingClasses:
            self.pendingClasses.add(cls)

    # FUNCTION: Configure Versioned Classes
    def configureVersionedClasses(self):
        for cls in self.pendingClasses:
            self.auditTable(cls.__table__, cls.__versioned__.get('exclude'))
        assignUser(self.base, self.transactionCls, self.userCls)
        assignPlugin(self.base, self.transactionCls, self.pluginCls)

    # FUNCTION: Attach Table Listeners
    def attachTableListeners(self):
        for values in self.tableListeners['transaction']:
            sa.event.listen(self.transactionCls.__table__, *values)
        for values in self.tableListeners['activity']:
            sa.event.listen(self.activityCls.__table__, *values)

    # FUNCTION: Remove Table Listeners
    def removeTableListeners(self):
        for values in self.tableListeners['transaction']:
            sa.event.remove(self.transactionCls.__table__, *values)
        for values in self.tableListeners['activity']:
            sa.event.remove(self.activityCls.__table__, *values)

    # FUNCTION: Attach Listeners
    def attachListeners(self):
        self.attachTableListeners()
        super().attachListeners()

    # FUNCTION: Remove Listeners
    def removeListeners(self):
        self.removeTableListeners()
        super().removeListeners()


##### NEATLY APP #####

# FUNCTION: Context Available
def contextAvailable():
    return (_app_ctx_stack.top is not None and _request_ctx_stack.top is not None)

# FUNCTION: Detect Transaction Parameters
def detectTransactionParams(execParameter):
    transactionParams = {}

    # Client Address
    transactionParams['clientAddress'] = ((request.remote_addr or None) if contextAvailable() else None)

    # User ID
    transactionParams['user_id'] = (execParameter['user'].id if ('user' in execParameter) else None)

    # Plugin ID
    transactionParams['plugin_id'] = (execParameter['plugin'].id if ('plugin' in execParameter) else None)

    # Source
    transactionParams['source'] = (execParameter['source'] if ('source' in execParameter) else None)

    # Description
    transactionParams['description'] = (execParameter['description'] if ('description' in execParameter) else None)

    return transactionParams

# EXPORT: Versioning Manager
versioningManager = VersioningManager(userCls="User", pluginCls="Plugin", sessionManagerFactory=SessionManager)


##### EXPRESSIONS #####

# CLASS: JSONB Change Key Name
class jsonbChangeKeyName(expression.FunctionElement):
    type = JSONB()
    name = 'jsonb_change_key_name'


# FUNCTION: Compile JSONB Change Key Name
@compiles(jsonbChangeKeyName)
def compileJSONBChangeKeyName(element, compiler, **kw):
    arg1, arg2, arg3 = list(element.clauses)
    arg1.type = JSONB()
    return 'jsonb_change_key_name({0}, {1}, {2})'.format(compiler.process(arg1), compiler.process(arg2), compiler.process(arg3))


##### MIGRATIONS #####

# FUNCTION: Get Activity Table
def getActivityTable(schema=None):
    return sa.Table(
        'activity',
        sa.MetaData(),
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('tableName', sa.String),
        sa.Column('verb', sa.String),
        sa.Column('originalData', JSONB),
        sa.Column('changedData', JSONB),
        schema=schema,
    )


# FUNCTION: Initialise Activity Table Triggers
def init_activity_table_triggers(conn, schemaName=None, useStatementLevelTriggers=True):

    # Create Functions
    conn.execute(renderTemplate('jsonbChangeKeyName.sql', schemaName))
    createAuditTable(None, conn, schemaName, useStatementLevelTriggers)
    createOperators(None, conn, schemaName)

    # Create Schema
    if schemaName:
        conn.execute(renderTemplate('createSchema.sql', schemaName))


# FUNCTION: Rollback Create Transaction
def rollback_create_transaction(conn, schemaName=None):
    if schemaName:
        conn.execute(renderTemplate('dropSchema.sql', schemaName))


# FUNCTION: Initialise Before Create Transaction
def init_before_create_transaction(conn, schemaName=None):
    if schemaName:
        conn.execute(renderTemplate('createSchema.sql', schemaName))


# FUNCTION: Register Table
def register_table(conn, tableName, excludeColumns, schemaName=None):
    sql = buildRegisterTableQuery(schemaName, tableName, excludeColumns)
    conn.execute(sql)


# FUNCTION: Alter Column
def alter_column(conn, table, columnName, func, schema=None):
    activityTable = getActivityTable(schema=schema)
    query = (activityTable.update()
        .values(
            originalData=(activityTable.c.originalData + sa.cast(sa.func.json_build_object(columnName, func(activityTable.c.originalData[columnName], activityTable)), JSONB)),
            changedData=(activityTable.c.changedData + sa.cast(sa.func.json_build_object(columnName, func(activityTable.c.changedData[columnName], activityTable)), JSONB))
        ).where(activityTable.c.tableName == table)
    )
    return conn.execute(query)


# FUNCTION: Change Column Name
def change_column_name(conn, table, oldColumnName, newColumnName, schema=None):
    activityTable = getActivityTable(schema=schema)
    query = (activityTable.update()
        .values(
            originalData=jsonbChangeKeyName(activityTable.c.originalData, oldColumnName, newColumnName),
            changedData=jsonbChangeKeyName(activityTable.c.changedData, oldColumnName, newColumnName)
        ).where(activityTable.c.tableName == table)
    )
    return conn.execute(query)


# FUNCTION: Add Column
def add_column(conn, table, columnName, defaultValue=None, schema=None):
    activityTable = getActivityTable(schema=schema)
    data = {columnName: defaultValue}
    query = (activityTable.update()
        .values(
            originalData=sa.case([(sa.cast(activityTable.c.originalData, sa.Text) != '{}', activityTable.c.originalData + data),], else_=sa.cast({}, JSONB)),
            changedData=sa.case([(sa.and_(sa.cast(activityTable.c.changedData, sa.Text) != '{}', activityTable.c.verb != 'update'), activityTable.c.changedData + data)], else_=activityTable.c.changedData),
        ).where(activityTable.c.tableName == table)
    )
    return conn.execute(query)


# FUNCTION: Remove Column
def remove_column(conn, table, columnName, schema=None):
    activityTable = getActivityTable(schema=schema)
    remove = sa.cast(columnName, sa.Text)
    query = (activityTable.update()
        .values(originalData=activityTable.c.originalData - remove, changedData=activityTable.c.changedData - remove,)
        .where(activityTable.c.tableName == table)
    )
    return conn.execute(query)


# FUNCTION: Rename Column
def rename_table(conn, oldTableName, newTableName, schema=None):
    activityTable = getActivityTable(schema=schema)
    query = (activityTable.update().values(tableName=newTableName).where(activityTable.c.tableName == oldTableName))
    return conn.execute(query)
