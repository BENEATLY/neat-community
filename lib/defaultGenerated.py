################################################################################
# Author:     Thomas D'haenens
# License:    GPL-3.0
# Link:       https://github.com/BENEATLY/neat-start-orig/
# Contact:    https://neatly.be/
################################################################################


# IMPORT: Standard Modules
from sqlalchemy import select, func, or_, and_                                                                  # SQLAlchemy Lib
from sqlalchemy.orm import aliased                                                                              # SQLAlchemy ORM

# IMPORT: Custom Modules
from basic import selfDecorator, g, wraps, log, contextAvailable, generateGetAllRights, getAllClassNames        # Basic Lib
import tables                                                                                                   # Tables Lib


# FUNCTION: Temporary Session Decorator
@log()
def inTempSession():
    def inTempSessionInternal(func):
        @wraps(func)
        def inTempSessionWrapper(*args):
            session = tables.createDBSession()
            result = func(*args, session)
            session.close()
            return result
        return inTempSessionWrapper
    return inTempSessionInternal


# FUNCTION: Plugin Option Value (Hybrid Property)
@log()
@inTempSession()
def pluginOptionValue(self, session):

    # Linked to Object
    objName = self.objectName
    if (objName):

        # Known in Tables
        tableObject = getattr(tables, objName, None)
        if (tableObject):

            # Get Raw Value
            rawValue = self.rawValue

            # Is List
            if (isinstance(rawValue, list)):
                objs = session.query(tableObject).filter(tableObject.id.in_(rawValue)).all()
                return [obj.getPublic(({'user': g.user, 'rights': g.rights} if (contextAvailable()) else {'internal': True, 'rights': generateGetAllRights(getAllClassNames(tables))})) for obj in objs]

            # Is Id
            elif (isinstance(rawValue, int)):
                obj = session.query(tableObject).filter_by(id=rawValue).first()
                if (obj): return obj.getPublic(({'user': g.user, 'rights': g.rights} if (contextAvailable()) else {'internal': True, 'rights': generateGetAllRights(getAllClassNames(tables))}))

        # Not Known in Tables or No Valid Value
        return None

    # All Other Cases
    return self.rawValue


# FUNCTION: Plugin Option Value Setter (Hybrid Property)
def pluginOptionValueSetter(self, value):
    setattr(self, 'rawValue', value)



# FUNCTION: Column Property (Example)
# @selfDecorator
# def columnPropertyExample(self):
#    return select([func.count(tables.User.id)]).where(tables.User.team_id==self.id).correlate_except(tables.User)
