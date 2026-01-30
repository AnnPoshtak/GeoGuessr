import factory
from .models import BaseModel, UserModel, UserStatsModel, db

class BaseFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        abstract = True
        sqlalchemy_session = db.session
        sqlalchemy_session_persistence = 'commit'

class UserFactory(BaseFactory):
    class Meta:
        model = UserModel

    username = factory.declarations.Sequence(lambda n: f'User {n}')
    stats = factory.RelatedFactory('app.factories.UserStatsFactory', 'user')


class UserStatsFactory(BaseFactory):
    class Meta:
        model = UserStatsModel

    total_score = 0
    user = factory.SubFactory(UserFactory)
    
