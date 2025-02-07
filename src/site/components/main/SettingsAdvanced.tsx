import * as React from 'react';
import styled, { DefaultTheme } from 'styled-components';
import { isDefined } from '../../../shared/helperFunctions';
import { CameraSetting, CameraSettingDesc } from '../../../shared/settings/camera';
//import { PhotoSetting, PhotoSettingDesc } from '../../../shared/settings/photo';
import { PreviewSetting, PreviewSettingDesc } from '../../../shared/settings/preview';
import { StreamSetting, StreamSettingDesc } from '../../../shared/settings/stream';
//import { VidSetting, VidSettingDesc } from '../../../shared/settings/vid';
import { ActiveSetting, Filler } from './Camera';
import { ApplicationSettings } from './settings/ApplicationSettings';
import { CameraSettings } from './settings/CameraSettings';
//import { PhotoSettings } from './settings/PhotoSettings';
import { PreviewSettings } from './settings/PreviewSettings';
import { StreamSettings } from './settings/StreamSettings';
//import { VideoSettings } from './settings/VideoSettings';

//#region styled

const SettingsPane = styled.div`
  flex: 1;
  display: flex;
  flex-direction: row;
`;

interface ContainerProps {
  show: boolean;
}

const SettingsContainer = styled.div<ContainerProps>`
  flex: ${(p) => (p.show ? '0.2 1 400px' : 0)};
  flex-direction: column;
  display: flex;
  overflow-y: scroll;
  backdrop-filter: blur(5px);
  background-color: ${(p) => p.theme.LayerBackground};
  color: ${(p) => p.theme.Foreground};
  transition: flex 0.2s;
  pointer-events: all;
`;

//#endregion

export interface SettingsProps {
  activeSetting: ActiveSetting;
  camera: CameraSettingDesc;
  stream: StreamSettingDesc;
  preview: PreviewSettingDesc;

  activateSetting: (setting: ActiveSetting) => void;
  updateCamera: (data: CameraSetting) => void;
  updateStream: (data: StreamSetting) => void;
  updatePreview: (data: PreviewSetting) => void;
  setTheme: (theme: DefaultTheme) => void;
}

export const SettingsAdvanced: React.FC<SettingsProps> = ({
  camera,
  stream,
  preview,
  activeSetting,
  activateSetting,
  updateCamera,
  updateStream,
  updatePreview,
  setTheme,
}) => (
  <SettingsPane>
    <SettingsContainer show={activeSetting === 'Settings'}>
      <CameraSettings data={camera} updateData={updateCamera} />
      <StreamSettings data={stream} updateData={updateStream} />
      <PreviewSettings data={preview} updateData={updatePreview} />
      <ApplicationSettings setTheme={setTheme} />
    </SettingsContainer>

    <Filler enableClick={isDefined(activeSetting)} onClick={() => activateSetting(undefined)} />
  </SettingsPane>
);
