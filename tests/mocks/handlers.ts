import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('https://example.com/api/test', () => {
    return HttpResponse.json({ message: 'Mocked response' });
  }),
];
