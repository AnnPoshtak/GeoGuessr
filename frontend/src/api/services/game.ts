import client from '../client';
import type { StreetViewLocationFromApi } from '@/interfaces/StreetViewLocationFromApi';
import type { MapLocation } from '@/interfaces/MapLocation';
import type { GuessSubmitApiResponse } from '@/interfaces/GuessSubmitApiResponse';

export const getRandomLocation = async () => {
  const { data } = await client.get<StreetViewLocationFromApi>('/single-player/random_location/');
  return data;
};

export const submitGuess = async (location: MapLocation) => {
  const body = {
      lat: location.lat,
      lng: location.lng,
    };
  const { data } = await client.post<GuessSubmitApiResponse>('/single-player/submit_location/', body);
  return data;
};
