################################################################################
# Author:     Thomas D'haenens
# License:    GPL-3.0
# Link:       https://github.com/BENEATLY/neat-start-orig/
# Contact:    https://neatly.be/
################################################################################


# IMPORT: Standard Modules
import sys                                                                                      # System Lib
import json                                                                                     # JSON Lib
from sqlalchemy import create_engine, exc                                                       # Engine Creation Function
from alembic import context                                                                     # Alembic Context Lib
import warnings                                                                                 # Warnings Lib


# FUNCTION: Read JSON File (No Logging)
def readJSONFile(file):
    with open(file) as content:
        return json.load(content)


# CONFIGURATION: Determine Installation Location
locationConfig = readJSONFile('/etc/neatly/base/location.json')

# CONFIGURATION: Add Current Path to Default Python Paths
sys.path.append(locationConfig['lib'])


# IMPORT: Custom Modules
from basic import *                                                                             # Basic Lib
import tables                                                                                   # Tables Lib


# CONFIGURATION: Model MetaData
target_metadata = tables.Base.metadata


# FUNCTION: Run DB Migrations Online
def runMigrationsOnline():
    connectable = create_engine(createDBPathConfig(sys.sharedConfig.db['connection']))
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata, transaction_per_migration=True)
        with context.begin_transaction(): context.run_migrations()


# UPDATE: Execute DB Migration
with warnings.catch_warnings():
    warnings.simplefilter("ignore", category=exc.SAWarning)
    runMigrationsOnline()
