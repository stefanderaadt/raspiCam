import { ChildProcess, StdioOptions, spawn } from 'child_process';
import { Readable } from 'stream';
import { createLogger } from './logger';

const logger = createLogger('process');

/**
 * Helper function to transform a object to process arguments.
 */
const getSpawnArgs = (options: Record<string, unknown>): string[] =>
  Object.entries(options).reduce<string[]>((result, [key, value]) => {
    if (value !== undefined) {
      if (typeof value === 'boolean') {
        if (value === true) result.push(`--${key}`);
      }
      if (typeof value === 'string' || typeof value === 'number') {
        result.push(`--${key}`);
        result.push(value.toString());
      }
    }
    return result;
  }, []);

export interface SpawnProcess {
  start: (command: string, args: Record<string, unknown>) => Promise<void>;
  stop: () => void;
  running: () => boolean;
  output: () => Readable | null | undefined;
}

/**
 * Helper function to spawn the raspi processes
 */
export const spawnProcess = (options?: {
  stdioOptions?: StdioOptions;
  resolveOnData?: boolean;
}): SpawnProcess => {
  let process: ChildProcess | undefined;

  const streamReader = new Readable({
    read() {},
  });

  const stop = () => {
    logger.info('Stopping process');

    if (process) {
      streamReader.pause();
      process.unref();
      process.kill();
      process = undefined;
    }
  };

  const running = () => !!process;
  const output = () => streamReader;

  const start = (command: string, args: Record<string, unknown>): Promise<void> =>
    new Promise<void>((resolve, reject) => {
      const spawnArgs = getSpawnArgs(args);
      logger.log(command, spawnArgs.join(' '));

      process = spawn(command, spawnArgs, { stdio: options?.stdioOptions });
      if (options?.resolveOnData) {
        streamReader.once('data', () => resolve());
      }
      process.on('error', (e) => {
        logger.error('SpawnProcess', 'error on process', e, e.message);
        reject(e);
      });
      process.on('exit', () => resolve());
      process.stdout?.on('data', (data) => {
        streamReader.push(data);
      });
    });

  return { start, stop, running, output };
};
