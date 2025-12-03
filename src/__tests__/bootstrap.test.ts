import { MovieAgent } from '../index';

describe('MovieAgent Bootstrap', () => {
  it('should load the MovieAgent class', () => {
    expect(MovieAgent).toBeDefined();
  });

  it('should create a MovieAgent instance', () => {
    const agent = new MovieAgent();
    expect(agent).toBeInstanceOf(MovieAgent);
  });

  it('should return the agent name', () => {
    const agent = new MovieAgent('TestAgent');
    expect(agent.getName()).toBe('TestAgent');
  });

  it('should return default name when none provided', () => {
    const agent = new MovieAgent();
    expect(agent.getName()).toBe('MovieAgent');
  });

  it('should return placeholder recommendations', async () => {
    const agent = new MovieAgent();
    const recommendations = await agent.getRecommendations();
    expect(recommendations).toEqual(['Coming soon...']);
  });
});
