import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render } from 'vitest-browser-react';
// @ts-ignore
import { initialize } from 'google-maps-vitest-mocks';
import LocationSelectMap from '@/components/LocationSelectMap/LocationSelectMap';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GameContextProvider } from '@/context/GameContext';

beforeEach(() => {
    initialize()
});

describe('LocationSelectMap tests', () => {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const testClient = new QueryClient();
    it('Test render', async () => {
        const { getByLabelText, getByText } = await render(<QueryClientProvider client={testClient} >
            <GameContextProvider>
                <LocationSelectMap submitGuess={vi.fn()} moveNext={vi.fn()} apiKey={apiKey} />
            </GameContextProvider>
        </QueryClientProvider>
        );
        await expect.element(getByText(/Loading.../)).toBeInTheDocument();
        await expect.element(getByLabelText(/Map/)).toBeInTheDocument();
        await expect.element(getByText(/Submit guess!/)).toBeInTheDocument();
    });
});
