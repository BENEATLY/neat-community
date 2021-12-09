################################################################################
# Author:     Thomas D'haenens
# License:    GPL-3.0
# Link:       https://github.com/BENEATLY/neat-community/
# Contact:    https://neatly.be/
################################################################################


"""${message}

Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
Creation Date: ${create_date}

"""

# IMPORT: Standard Modules
from alembic import op
import sqlalchemy as sa
${imports if imports else ""}


# CONFIGURATION: Revision Identifiers
revision = ${repr(up_revision)}
down_revision = ${repr(down_revision)}
branch_labels = ${repr(branch_labels)}
depends_on = ${repr(depends_on)}


# FUNCTION: Upgrade
def upgrade():
    ${upgrades if upgrades else "pass"}
