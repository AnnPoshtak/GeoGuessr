import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, renderHook } from 'vitest-browser-react';
// @ts-ignore
import { initialize } from 'google-maps-vitest-mocks';
import LocationSelectMap from '@/components/LocationSelectMap/LocationSelectMap';
import { QueryClient, QueryClientProvider, useMutation } from '@tanstack/react-query';
import type { MapLocation } from '@/types/MapLocation';
import type { GuessSubmitApiResponse } from '@/types/GuessSubmitApiResponse';

beforeEach(() => {
    initialize()
});

describe('LocationSelectMap tests', () => {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const testClient = new QueryClient();
    it('Test render', async () => {
        const { result } = await renderHook(() => useMutation(
            {
                mutationFn: async (_: MapLocation) => {
                    return {} as GuessSubmitApiResponse;
                },
                onSuccess: () => { },
                onError: () => { }
            }
            , testClient));
        const { getByLabelText, getByText } = await render(<QueryClientProvider client={testClient} >
            <LocationSelectMap moveNext={vi.fn()} submitGuessMutation={result.current} apiKey={apiKey} />
        </QueryClientProvider>
        );
        await expect.element(getByText(/Loading.../)).toBeInTheDocument();
        await expect.element(getByLabelText(/Map/)).toBeInTheDocument();
        await expect.element(getByText(/Submit guess!/)).toBeInTheDocument();
        await expect.element(getByText(/Submit guess!/)).toBeDisabled();
    });
});
