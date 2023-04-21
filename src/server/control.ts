import path from 'path';
import internal from 'stream';
import { getIsoDataTime } from '../shared/helperFunctions';
import { RaspiControlStatus, RaspiMode } from '../shared/settings/types';
import { createLogger } from './logger';
import { spawnProcess } from './process';
import { SettingsHelper } from './settings';
import { photosAbsPath } from './watcher';

const logger = createLogger('control');

export interface RaspiControl {
  start: () => void;
  stop: () => void;
  //setMode: (mode: RaspiMode) => void;
  restartStream: () => Promise<void>;
  getStatus: () => RaspiControlStatus;
  getStream: () => internal.Readable | null | undefined;
}

/**
 * RaspiControl
 */
const raspiControl = (settingsHelper: SettingsHelper): RaspiControl => {
  //const actionProcess = spawnProcess();
  const streamProcess = spawnProcess({
    stdioOptions: ['ignore', 'pipe', 'inherit'],
    resolveOnData: true,
  });

  const status: RaspiControlStatus = {
    mode: 'Photo',
  };

  const startStream = async () => {
    //actionProcess.stop();
    streamProcess.stop();

    const mode = modeHelper.Stream(settingsHelper);
    logger.info('starting', 'Stream', '...');

    await streamProcess.start(mode.command, mode.settings).catch((e: Error) => {
      logger.error('stream failed:', e.message);
      status.lastError = e.message;
    });
  };

  const getStream = () => {
    logger.info('getStream');
    return streamProcess.output();
  };

  const restartStream = async () => {
    logger.info('restartStream');
    if (streamProcess.running()) {
      return startStream();
    }
  };

  const getStatus = () => ({
    ...status,
    streamRunning: streamProcess.running(),
  });

  const start = () => {
    logger.info('start');
    streamProcess.stop();

    status.running = true;
  };

  const stop = () => {
    logger.info('stop', status.mode, '...');
  };

  startStream().catch((e) => {
    logger.error('error startstream', e, e.message);
  });

  return {
    start,
    stop,
    getStatus,
    restartStream,
    getStream,
  };
};

const modeHelper: {
  [key in RaspiMode | 'Stream']: (settingsHelper: SettingsHelper) => {
    settings: Record<string, unknown>;
    command: 'libcamera-still' | 'libcamera-vid' | 'libcamera-motion';
  };
} = {
  Photo: (settingsHelper: SettingsHelper) => {
    const { camera, preview, photo } = settingsHelper;
    const settings = {
      ...camera.convert(),
      ...preview.convert(),
      ...photo.convert(),
    };

    return {
      command: 'libcamera-still',
      settings: {
        ...settings,
        output: path.join(photosAbsPath, `${getIsoDataTime()}-%04d.${settings.encoding || 'jpg'}`),
      },
    };
  },
  Video: (settingsHelper: SettingsHelper) => {
    const { camera, preview, vid } = settingsHelper;
    const settings = {
      ...camera.convert(),
      ...preview.convert(),
      ...vid.convert(),
    };

    return {
      command: 'libcamera-vid',
      settings: {
        ...settings,
        output: path.join(photosAbsPath, `${getIsoDataTime()}.h264`),
      },
    };
  },
  Stream: (settingsHelper: SettingsHelper) => {
    const { camera, preview, stream } = settingsHelper;

    return {
      command: 'libcamera-motion',
      settings: {
        ...camera.convert(),
        ...preview.convert(),
        ...stream.convert(),
        profile: 'baseline',
        inline: true,
        circular: 40, // MegaBytes
        output: '-',
        'motion-output': 'motions/motion',
        'lores-width': 128,
        'lores-height': 96,
        'post-process-file': './motion_detect.json',
      },
    };
  },
};

export default raspiControl;
