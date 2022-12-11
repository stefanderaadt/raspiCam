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
  setMode: (mode: RaspiMode) => void;
  restartStream: () => Promise<void>;
  getStatus: () => RaspiControlStatus;
  getStream: () => internal.Readable | null | undefined;
}

/**
 * RaspiControl
 */
const raspiControl = (settingsHelper: SettingsHelper): RaspiControl => {
  const actionProcess = spawnProcess();
  const streamProcess = spawnProcess({
    stdioOptions: ['ignore', 'pipe', 'inherit'],
    resolveOnData: true,
  });
  const motionProcess = spawnProcess({
    stdioOptions: ['ignore', 'pipe', 'inherit'],
    resolveOnData: true,
  });

  const status: RaspiControlStatus = {
    mode: 'Photo',
  };

  const startStream = async () => {
    actionProcess.stop();
    streamProcess.stop();
    motionProcess.stop();

    const streamMode = modeHelper.Stream(settingsHelper);
    logger.info('starting', 'Stream', '...');

    await streamProcess.start(streamMode.command, streamMode.settings).catch((e: Error) => {
      logger.error('stream failed:', e.message);
      status.lastError = e.message;
    });

    const motionMode = modeHelper.Motion(settingsHelper);
    logger.info('starting', 'Motion detector', '...');

    await motionProcess.start(motionMode.command, motionMode.settings).catch((e: Error) => {
      logger.error('motion failed:', e.message);
      status.lastError = e.message;
    });
  };

  const getStream = () => streamProcess.output();

  const restartStream = async () => {
    if (streamProcess.running() || motionProcess.running()) {
      return startStream();
    }
  };

  const setMode = (mode: RaspiMode) => {
    if (actionProcess.running()) stop();
    status.mode = mode;
  };

  const getStatus = () => ({
    ...status,
    running: actionProcess.running(),
    streamRunning: streamProcess.running(),
    motionRunning: motionProcess.running(),
  });

  const start = () => {
    streamProcess.stop();
    actionProcess.stop();
    motionProcess.stop();

    status.running = true;
    const mode = modeHelper[status.mode](settingsHelper);
    logger.info('starting', status.mode, '...');

    actionProcess
      .start(mode.command, mode.settings)
      .then(() => startStream())
      .catch((e: Error) => {
        logger.error(status.mode, 'failed:', e.message);
        status.lastError = e.message;
      });
  };

  const stop = () => {
    logger.info('stop', status.mode, '...');
    actionProcess.stop();
  };

  startStream().catch(() => {
    // not needed
  });

  return { start, stop, getStatus, setMode, restartStream, getStream };
};

const modeHelper: {
  [key in RaspiMode | 'Stream' | 'Motion']: (settingsHelper: SettingsHelper) => {
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
      command: 'libcamera-vid',
      settings: {
        ...camera.convert(),
        ...preview.convert(),
        ...stream.convert(),
        profile: 'baseline',
        output: '-',
      },
    };
  },
  Motion: (settingsHelper: SettingsHelper) => {
    const { camera, preview, stream } = settingsHelper;

    return {
      command: 'libcamera-motion',
      settings: {
        ...camera.convert(),
        ...preview.convert(),
        ...stream.convert(),
        inline: true,
        circular: true,
        output: '-',
        'motion-output': 'motion',
        'lores-width': 128,
        'lores-height': 96,
        'post-process-file': './motion_detect.json',
      },
    };
  },
};

export default raspiControl;
