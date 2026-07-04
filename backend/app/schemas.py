from app import ma
from .models import UserModel, UserStatsModel
from marshmallow import fields, validate


class FlexibleDateTimeField(fields.Field):
    """DateTime field that handles both datetime objects and ISO strings"""
    def _serialize(self, value, attr, obj, **kwargs):
        if isinstance(value, str):
            return value  # Already serialized
        if value is None:
            return None
        return value.isoformat()


class DatetimeSchemaMixin():
    created_at = FlexibleDateTimeField(dump_only=True)
    updated_at = FlexibleDateTimeField(dump_only=True)


class UserStatsSchema(ma.SQLAlchemyAutoSchema, DatetimeSchemaMixin):
    """Schema for serializing UserStats model"""
    class Meta:
        model = UserStatsModel
        load_instance = True
        include_relationships = True
        
    id = fields.Int(dump_only=True)
    total_score = fields.Int(allow_none=False)
    user_id = fields.Int(dump_only=True)


class UserSchema(ma.SQLAlchemyAutoSchema, DatetimeSchemaMixin):
    """Schema for serializing User model"""
    class Meta:
        model = UserModel
        load_instance = True
        include_relationships = True
        
    id = fields.Int(dump_only=True)
    username = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    stats = fields.Nested(UserStatsSchema, dump_only=True)


class UserPublicSchema(ma.SQLAlchemyAutoSchema):
    """Schema for serializing User model (public profile - limited fields)"""
    class Meta:
        model = UserModel
        load_instance = True
        
    id = fields.Int(dump_only=True)
    username = fields.Str(dump_only=True)
    stats = fields.Nested(UserStatsSchema, dump_only=True)


class GuessSchema(ma.Schema):
    """Schema for player guesses (coordinates)"""
    lat = fields.Float(required=True)
    lng = fields.Float(required=True)


class PlayerGameDataSchema(ma.Schema):
    """Schema for player-specific game data from Redis"""
    id = fields.Int(required=True)
    team = fields.Str(required=True)
    guess = fields.Nested(GuessSchema, allow_none=True, dump_default=None)


class FullPlayerDataSchema(ma.Schema, DatetimeSchemaMixin):
    """Schema for full player data: database user info + game session info"""
    # Database user data
    id = fields.Int(dump_only=True)
    username = fields.Str(dump_only=True)
    stats = fields.Nested(UserStatsSchema, dump_only=True)
    
    # Game session data
    team = fields.Str(required=True)
    guess = fields.Nested(GuessSchema, allow_none=True, dump_default=None)
    is_connected = fields.Bool()


# Instance schemas for easy usage
user_schema = UserSchema()
users_schema = UserSchema(many=True)
user_public_schema = UserPublicSchema()
users_public_schema = UserPublicSchema(many=True)
stats_schema = UserStatsSchema()
stats_list_schema = UserStatsSchema(many=True)
guess_schema = GuessSchema()
player_game_data_schema = PlayerGameDataSchema()
player_game_data_list_schema = PlayerGameDataSchema(many=True)
full_player_data_schema = FullPlayerDataSchema()
full_player_data_list_schema = FullPlayerDataSchema(many=True)