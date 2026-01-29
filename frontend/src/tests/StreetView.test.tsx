import StreetView from '@/components/StreetView/StreetView';
import { describe, expect, it, beforeEach } from 'vitest';
import { render } from 'vitest-browser-react';
// @ts-ignore
import { initialize } from 'google-maps-vitest-mocks';

beforeEach(() => {
  initialize()
});

describe('GuessMarker tests', () => {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  it('Test render', async () => {
    const { getByLabelText, getByText } = await render(<StreetView className='test-map' zoom={0} panoramaProps={{
      options: {}
    }} apiKey={apiKey} center={{
      lat: 0,
      lng: 0
    }} />);
    await expect.element(getByText(/Loading.../)).toBeInTheDocument();
    await expect.element(getByLabelText(/Map/).nth(0)).toBeInTheDocument();
  });
});
