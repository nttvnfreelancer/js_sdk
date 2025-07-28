import { ChildProcessWithoutNullStreams } from 'child_process';
import * as devServer from 'jest-dev-server';

interface SpawndChildProcess extends ChildProcessWithoutNullStreams {
  destroy: () => Promise<void>;
}

let spawned: SpawndChildProcess[] = [];

export const setupDevServer = async (): Promise<void> => {
  // Note: this command would be related to parameters of `yarn serve` in package.json
  spawned = await devServer.setup({
    command:
      'USE_LOCAL_SERVER=true ./node_modules/.bin/webpack-dev-server --mode development --config development.config.ts',
    port: 3111,
    launchTimeout: 30 * 1000,
    usedPortAction: 'ask',
  });
};

export const teardownDevServer = async (): Promise<void> => {
  await devServer.teardown(spawned);
};

export const debugEndpoint = process.env.DEBUG_DOMAIN;
