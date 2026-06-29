import { describe, it, expect } from 'bun:test';
import { handleHealth } from '../src/routes/health.ts';

describe('Health API', () => {
  it('GET /health returns 200 OK and status ok', async () => {
    // Mocking the request
    const req = new Request('http://localhost/health');
    
    // Call the handler
    const response = await handleHealth(req as any);
    
    // Assertions
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      status: 'ok',
      service: 'shipwright-engineering'
    });
  });
});
