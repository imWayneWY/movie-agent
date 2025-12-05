// src/__tests__/cli.test.ts
import { spawn } from 'child_process';
import path from 'path';

/**
 * Execute the CLI and capture output
 */
function runCLI(args: string[], env?: Record<string, string>): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const cliPath = path.resolve(__dirname, '../../bin/movie-agent');
    const proc = spawn('node', [cliPath, ...args], {
      env: { ...process.env, ...env },
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      resolve({
        stdout,
        stderr,
        exitCode: code || 0,
      });
    });
  });
}

describe('CLI', () => {
  describe('Help and Usage', () => {
    it('should display help when --help flag is used', async () => {
      const { stdout, exitCode } = await runCLI(['--help']);
      
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Usage: movie-agent');
      expect(stdout).toContain('--mood');
      expect(stdout).toContain('--platforms');
      expect(stdout).toContain('--genre');
      expect(stdout).toContain('--runtimeMax');
      expect(stdout).toContain('--runtimeMin');
      expect(stdout).toContain('--year');
      expect(stdout).toContain('--yearFrom');
      expect(stdout).toContain('--yearTo');
    });

    it('should display help when -h flag is used', async () => {
      const { stdout, exitCode } = await runCLI(['-h']);
      
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Usage: movie-agent');
    });

    it('should display help when no arguments are provided', async () => {
      const { stdout, exitCode } = await runCLI([], { TMDB_API_KEY: 'test-key' });
      
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Usage: movie-agent');
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown flags gracefully', async () => {
      const { stderr, exitCode } = await runCLI(['--unknown', 'value'], { TMDB_API_KEY: 'test-key' });
      
      expect(exitCode).toBe(1);
      expect(stderr).toContain('Unknown flag');
    });

    it('should display error message when TMDB_API_KEY is missing', async () => {
      const { stderr, exitCode } = await runCLI(['--mood', 'happy'], { TMDB_API_KEY: '' });

      expect(exitCode).toBe(1);
      expect(stderr).toContain('TMDb API key not found');
    });
  });

  describe('Output Format Validation', () => {
    // These tests validate the output structure when the CLI successfully runs
    // Note: These tests require a valid TMDB_API_KEY and make real API calls
    // Skip them if no API key is available
    const hasApiKey = !!process.env.TMDB_API_KEY;

    (hasApiKey ? it : it.skip)('should display movie titles in output', async () => {
      const { stdout, exitCode } = await runCLI(['--genre', 'Action', '--runtimeMax', '120']);
      
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Movie Recommendations');
      // Check for numbered list format
      expect(stdout).toMatch(/\d+\.\s+\*\*/);
    }, 30000);

    (hasApiKey ? it : it.skip)('should display streaming platforms in output', async () => {
      const { stdout, exitCode } = await runCLI(['--mood', 'happy']);
      
      expect(exitCode).toBe(0);
      expect(stdout).toContain('📺');
      expect(stdout).toMatch(/Available on:|No streaming availability/);
    }, 30000);

    (hasApiKey ? it : it.skip)('should include movie metadata (year, runtime)', async () => {
      const { stdout, exitCode } = await runCLI(['--genre', 'Comedy']);
      
      expect(exitCode).toBe(0);
      // Check for year in parentheses
      expect(stdout).toMatch(/\(\d{4}\)/);
      // Check for runtime
      expect(stdout).toMatch(/\d+ min/);
    }, 30000);

    (hasApiKey ? it : it.skip)('should include genres in output', async () => {
      const { stdout, exitCode } = await runCLI(['--mood', 'excited']);
      
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Genres:');
    }, 30000);

    (hasApiKey ? it : it.skip)('should include match reasons in output', async () => {
      const { stdout, exitCode } = await runCLI(['--mood', 'excited']);
      
      expect(exitCode).toBe(0);
      expect(stdout).toContain('✨ Why:');
    }, 30000);

    (hasApiKey ? it : it.skip)('should format output with visual separators', async () => {
      const { stdout, exitCode } = await runCLI(['--genre', 'Drama']);
      
      expect(exitCode).toBe(0);
      expect(stdout).toContain('🎬');
      expect(stdout).toContain('📺');
      expect(stdout).toMatch(/─+/); // Separator line
    }, 30000);

    (hasApiKey ? it : it.skip)('should successfully handle multiple filters', async () => {
      const { stdout, exitCode } = await runCLI([
        '--mood', 'excited',
        '--platforms', 'Netflix',
        '--runtimeMax', '150',
      ]);
      
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Movie Recommendations');
      expect(stdout).toContain('Available on');
    }, 30000);
  });

  describe('Argument Parsing', () => {
    it('should accept mood flag', async () => {
      const { stderr } = await runCLI(['--mood', 'excited'], { TMDB_API_KEY: '' });
      
      // If API key missing, it should fail at the API key check, not argument parsing
      expect(stderr).toContain('TMDb API key');
    });

    it('should accept platforms flag', async () => {
      const { stderr } = await runCLI(['--platforms', 'Netflix,Prime Video'], { TMDB_API_KEY: '' });
      
      expect(stderr).toContain('TMDb API key');
    });

    it('should accept genre flag', async () => {
      const { stderr } = await runCLI(['--genre', 'Action,Thriller'], { TMDB_API_KEY: '' });
      
      expect(stderr).toContain('TMDb API key');
    });

    it('should accept runtime flags', async () => {
      const { stderr } = await runCLI(['--runtimeMin', '90', '--runtimeMax', '150'], { TMDB_API_KEY: '' });
      
      expect(stderr).toContain('TMDb API key');
    });

    it('should accept year flags', async () => {
      const { stderr } = await runCLI(['--yearFrom', '2020', '--yearTo', '2023'], { TMDB_API_KEY: '' });
      
      expect(stderr).toContain('TMDb API key');
    });

    it('should accept single year flag', async () => {
      const { stderr } = await runCLI(['--year', '2023'], { TMDB_API_KEY: '' });
      
      expect(stderr).toContain('TMDb API key');
    });
  });
});
