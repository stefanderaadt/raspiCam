import { abbreviateNumber, appendUnit } from '../helperFunctions';
import { enumSetting, numberSetting } from './helper';
import { Setting } from './types';

/**
 * Stream settings
 * https://www.raspberrypi.org/documentation/raspbian/applications/camera.md
 */
export const streamSettingDesc = {
  /**
   * Width of resulting video. This should be between 64 and 1920.
   */
  width: numberSetting('Width', 64, 1920, 1280, 1, appendUnit('px')),

  /**
   * Height of resulting video. This should be between 64 and 1080.
   */
  height: numberSetting('Height', 64, 1080, 720, 1, appendUnit('px')),

  /** At present, the minimum frame rate allowed is 2fps, and the maximum is 30fps. */
  framerate: numberSetting('Framerate', 2, 30, 25, 1, appendUnit('fps')),

  /**
   * JPEG quality
   */
  quality: numberSetting('JPEG quality', 0, 100, 50, 1),

  /**
   * Use bits per second, so 10Mbits/s would be -b 10000000.
   * For H264, 1080p30 a high quality bitrate would be 15Mbits/s or more.
   * Maximum bitrate is 25Mbits/s (-b 25000000), but much over 17Mbits/s
   * won't show noticeable improvement at 1080p30.
   */
  bitrate: numberSetting('Bitrate', 0, 25000000, 10000000, 1000000, abbreviateNumber('bits/s', 0)),

  /**
   * Intra-frame period (H.264 only)
   */
  intra: numberSetting('Intra-frame period', 1, 100, 60, 1),

  /** Specify H264 profile to use for encoding */
  profile: enumSetting('H264 Profile', ['baseline', 'main', 'high'], 'baseline'),

  /** Specifies the H264 encoder level to use for encoding. Options are 4, 4.1, and 4.2. */
  level: enumSetting('H264 level', ['4', '4.1', '4.2'], '4'),

  /**
   * Specifies the encoder codec to use.
   * H264 can encode up to 1080p, whereas MJPEG can encode upto the sensor size,
   * but at decreased framerates due to the higher processing and storage requirements.
   */
  codec: enumSetting('Codec', ['H264', 'MJPEG'], 'H264'), //'yuv420', 'libav'
};

export type StreamSettingDesc = typeof streamSettingDesc;
export type StreamSetting = Setting<StreamSettingDesc>;
