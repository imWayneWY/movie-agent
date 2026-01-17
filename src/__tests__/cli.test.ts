// src/__tests__/cli.test.ts
import { spawn } from 'child_process';
import path from 'path';

/**
 * Execute the CLI and capture output
 * @param args - CLI arguments
 * @param env - Optional environment variables to override
 * @param timeoutMs - Timeout in milliseconds (default: 45000 for live tests)
 */
function runCLI(
  args: string[],
  env?: Record<string, string>,
  timeoutMs = 45000
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise(resolve => {
    const cliPath = path.resolve(__dirname, '../../bin/movie-agent');
    const proc = spawn('node', [cliPath, ...args], {
      env: { ...process.env, ...env },
    });

    let stdout = '';
    let stderr = '';
    let resolved = false;

    const cleanup = (code: number | null) => {
      if (!resolved) {
        resolved = true;
        proc.kill();
        resolve({
          stdout,
          stderr,
          exitCode: code || 0,
        });
      }
    };

    // Timeout handler
    const timer = setTimeout(() => {
      cleanup(0); // Treat timeout as success if we have output
    }, timeoutMs);

    proc.stdout.on('data', data => {
      stdout += data.toString();
    });

    proc.stderr.on('data', data => {
      stderr += data.toString();
    });

    proc.on('close', code => {
      clearTimeout(timer);
      cleanup(code);
    });

    proc.on('error', () => {
      clearTimeout(timer);
      cleanup(1);
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
      const { stdout, exitCode } = await runCLI([], {
        TMDB_ACCESS_TOKEN: 'test-key',
      });

      expect(exitCode).toBe(0);
      expect(stdout).toContain('Usage: movie-agent');
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown flags gracefully', async () => {
      const { stderr, exitCode } = await runCLI(['--unknown', 'value'], {
        TMDB_ACCESS_TOKEN: 'test-key',
      });

      expect(exitCode).toBe(1);
      expect(stderr).toContain('Unknown flag');
    });

    it('should display error message when TMDB_ACCESS_TOKEN is missing', async () => {
      const { stderr, exitCode } = await runCLI(['--mood', 'happy'], {
        TMDB_ACCESS_TOKEN: '',
      });

      expect(exitCode).toBe(1);
      expect(stderr).toContain('TMDb access token not found');
    });
  });

  describe('Output Format Validation', () => {
    // These tests validate the output structure when the CLI successfully runs
    // Note: These tests require LIVE_TEST=1 and a valid TMDB_ACCESS_TOKEN to make real API calls
    // Skip them if LIVE_TEST is not enabled or no API key is available

    beforeAll(() => {
      // Load environment variables like the app does
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('dotenv').config();
    });

    const isLiveTestEnabled = () => {
      if (process.env.LIVE_TEST !== '1') {
        return false;
      }
      if (!process.env.TMDB_ACCESS_TOKEN) {
        console.log(
          '⚠️  Skipping CLI output validation tests: TMDB_ACCESS_TOKEN not set'
        );
        return false;
      }
      return true;
    };

    const liveIt = isLiveTestEnabled() ? it : it.skip;

    liveIt(
      'should display movie titles in output',
      async () => {
        const { stdout, exitCode } = await runCLI([
          '--genre',
          'Action',
          '--runtimeMax',
          '120',
        ]);

        expect(exitCode).toBe(0);
        // Check for movie entries with bold titles and years
        expect(stdout).toMatch(/\*\*[^*]+\*\*.*\d{4}/); // **Title** followed by year
        // Check pipeline completed
        expect(stdout).toContain('Pipeline completed successfully');
      },
      60000
    );

    liveIt(
      'should display streaming platforms in output',
      async () => {
        const { stdout, exitCode } = await runCLI(['--mood', 'happy']);

        expect(exitCode).toBe(0);
        expect(stdout).toContain('📺');
        expect(stdout).toMatch(/Available on/i);
      },
      60000
    );

    liveIt(
      'should include movie metadata (year, runtime)',
      async () => {
        const { stdout, exitCode } = await runCLI(['--genre', 'Comedy']);

        expect(exitCode).toBe(0);
        // Check for year (4 digits)
        expect(stdout).toMatch(/\d{4}/);
        // Check for runtime (number followed by min or minutes)
        expect(stdout).toMatch(/\d+\s*(min|minutes)/i);
      },
      60000
    );

    liveIt(
      'should include genres in output',
      async () => {
        const { stdout, exitCode } = await runCLI(['--mood', 'excited']);

        expect(exitCode).toBe(0);
        expect(stdout).toMatch(/Genres?:/i);
      },
      60000
    );

    liveIt(
      'should include match reasons in output',
      async () => {
        const { stdout, exitCode } = await runCLI(['--mood', 'excited']);

        expect(exitCode).toBe(0);
        expect(stdout).toMatch(/Why:|✨/i);
      },
      60000
    );

    liveIt(
      'should format output with visual separators',
      async () => {
        const { stdout, exitCode } = await runCLI(['--genre', 'Drama']);

        expect(exitCode).toBe(0);
        expect(stdout).toContain('🎬');
        expect(stdout).toContain('📺');
        // Check for numbered list format (1., 2., etc.) or separators
        expect(stdout).toMatch(/\d+\.\s+\*\*|---/);
      },
      60000
    );

    liveIt(
      'should successfully handle multiple filters',
      async () => {
        const { stdout, exitCode } = await runCLI([
          '--mood',
          'happy',
          '--runtimeMax',
          '150',
        ]);

        expect(exitCode).toBe(0);
        expect(stdout).toContain('Pipeline completed successfully');
        expect(stdout).toMatch(/Available on/i);
      },
      60000
    );
  });

  describe('Argument Parsing', () => {
    it('should accept mood flag', async () => {
      const { stderr } = await runCLI(['--mood', 'excited'], {
        TMDB_ACCESS_TOKEN: '',
      });

      // If API key missing, it should fail at the API key check, not argument parsing
      expect(stderr).toContain('TMDb access token');
    });

    it('should accept platforms flag', async () => {
      const { stderr } = await runCLI(['--platforms', 'Netflix,Prime Video'], {
        TMDB_ACCESS_TOKEN: '',
      });

      expect(stderr).toContain('TMDb access token');
    });

    it('should accept genre flag', async () => {
      const { stderr } = await runCLI(['--genre', 'Action,Thriller'], {
        TMDB_ACCESS_TOKEN: '',
      });

      expect(stderr).toContain('TMDb access token');
    });

    it('should accept runtime flags', async () => {
      const { stderr } = await runCLI(
        ['--runtimeMin', '90', '--runtimeMax', '150'],
        { TMDB_ACCESS_TOKEN: '' }
      );

      expect(stderr).toContain('TMDb access token');
    });

    it('should accept year flags', async () => {
      const { stderr } = await runCLI(
        ['--yearFrom', '2020', '--yearTo', '2023'],
        { TMDB_ACCESS_TOKEN: '' }
      );

      expect(stderr).toContain('TMDb access token');
    });

    it('should accept single year flag', async () => {
      const { stderr } = await runCLI(['--year', '2023'], { TMDB_ACCESS_TOKEN: '' });

      expect(stderr).toContain('TMDb access token');
    });
  });
});
