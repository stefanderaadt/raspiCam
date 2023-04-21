import express from 'express';
import path from 'path';
//import { isDefined } from '../shared/helperFunctions';
import {
  //RaspiGallery,
  //RaspiControlStatus,
  RaspiStatus,
  //raspiModes,
  GenericSettingDesc,
  Setting,
} from '../shared/settings/types';
import { RaspiControl } from './control';
import { createLogger } from './logger';
import { SettingsBase, SettingsHelper } from './settings';
//import { splitJpeg } from './splitJpeg';
import { FileWatcher } from './watcher';

type SettingRequest = express.Request<undefined, undefined, Setting<GenericSettingDesc>>;

const logger = createLogger('server');

/**
 * Initialize the express server
 */
const server = (
  control: RaspiControl,
  settingsHelper: SettingsHelper,
  fileWatcher: FileWatcher,
): express.Express => {
  const app = express();

  // Serve the static content from public
  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/photos', express.static(fileWatcher.getPath()));
  app.use(express.json());

  const getSettings = (x: SettingsBase) => (_: express.Request, res: express.Response) =>
    res.send(x.read());

  const applyAndRestart = (x: SettingsBase) => (req: SettingRequest, res: express.Response) => {
    const applied = x.apply(req.body);
    const sendSettings = () => res.status(200).send(x.read());
    if (applied) {
      control.restartStream().then(sendSettings).catch(sendSettings);
    } else {
      sendSettings();
    }
  };

  const getStatus = (): RaspiStatus => ({
    ...control.getStatus(),
    latestFile: fileWatcher.getLatestFile(),
  });

  app.get('/api/camera', getSettings(settingsHelper.camera));
  app.post('/api/camera', applyAndRestart(settingsHelper.camera));

  app.get('/api/preview', getSettings(settingsHelper.preview));
  app.post('/api/preview', applyAndRestart(settingsHelper.preview));

  app.get('/api/stream', getSettings(settingsHelper.stream));
  app.post('/api/stream', applyAndRestart(settingsHelper.stream));

  app.get('/api/control', (_, res) => {
    res.send(getStatus());
  });

  app.get('/api/stream/live', (_, res) => {
    const liveStream = control.getStream();

    if (liveStream) {
      res.writeHead(200, { 'Content-Type': 'video/mp4' });

      res.on('close', () => {
        logger.info('close live stream');
        res.destroy();
      });

      liveStream.pipe(res, { end: false }).on('error', (e) => {
        logger.error('pipe error', e, e.message, e.stack);
        control.stop();
      });

      liveStream.on('error', (e) => {
        logger.error('liveStream error', e, e.message, e.stack);
      });
    } else {
      res.status(503).send('Camera restarting or in use');
    }
  });

  // All other requests to index html
  app.get('*', (_, res) => res.sendFile(path.resolve(__dirname, 'public', 'index.html')));

  return app;
};

export default server;
