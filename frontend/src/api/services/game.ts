import client from '../client';
import type { StreetViewLocationFromApi } from '@/interfaces/StreetViewLocationFromApi';
import type { MapLocation } from '@/interfaces/MapLocation';
import type { GuessSubmitApiResponse } from '@/interfaces/GuessSubmitApiResponse';

export const getRandomLocation = async () => {
  const { data } = await client.get<StreetViewLocationFromApi>('/game/random_location/');
  return data;
};

export const submitGuess = async (location: MapLocation) => {
  const body = {
    guess: {
      lat: location.lat,
      lng: location.lng,
    },
  };
  const { data } = await client.post<GuessSubmitApiResponse>('/game/submit_location/', body);
  return data;
};
