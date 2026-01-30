import json
import pathlib

DATA_PATH = pathlib.Path(__file__).parent.resolve() / 'data'

with open(f'{DATA_PATH}/europe-locations.json') as f:
    EUROPE_LOCATIONS: list[dict] = json.loads(f.read())