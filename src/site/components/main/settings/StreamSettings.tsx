import React from 'react';
import { StreamSetting, StreamSettingDesc } from '../../../../shared/settings/stream';
import { EnumDropdownSetting } from './common/EnumDropdownSetting';
import { EnumSlider } from './common/EnumSlider';
import { restoreSettings, updateTypedField } from './common/helperFunctions';
import { NumberSetting } from './common/NumberSetting';
import { SettingsExpander } from './common/SettingsExpander';
import {
  SettingsHeader,
  SettingsHeaderText,
  SettingsRestoreButton,
  SettingsWrapper,
} from './common/Styled';

const videoResolutionPresets = [
  { name: '240p', width: 426, height: 240 },
  { name: '360p', width: 640, height: 360 },
  { name: '480p', width: 854, height: 480 },
  { name: '720p', width: 1280, height: 720 },
  { name: '1080p', width: 1920, height: 1080 },
];

export interface StreamSettingsProps {
  data: StreamSettingDesc;
  updateData: (data: StreamSetting) => void;
}

export const StreamSettings: React.FC<StreamSettingsProps> = ({ data, updateData }) => {
  const updateField = updateTypedField(updateData);

  return (
    <SettingsWrapper>
      <SettingsHeader fontSize="m">
        <SettingsHeaderText>Stream</SettingsHeaderText>
        <SettingsRestoreButton
          type="SettingsRestore"
          onClick={() => updateData(restoreSettings(data))}
        />
      </SettingsHeader>

      <SettingsExpander
        header={
          <EnumSlider
            name="Resolution"
            items={videoResolutionPresets}
            predicate={(x) => x.width === data.width.value && x.height === data.height.value}
            displayValue={(x) => x.name}
            update={(x) => updateData({ width: x.width, height: x.height })}
          />
        }
      >
        <NumberSetting {...data.width} update={updateField('width')} />
        <NumberSetting {...data.height} update={updateField('height')} />
        <NumberSetting {...data.framerate} update={updateField('framerate')} />
      </SettingsExpander>

      <SettingsExpander
        header={<EnumDropdownSetting {...data.codec} update={updateField('codec')} />}
      >
        {data.codec.value === 'H264' && (
          <React.Fragment>
            <NumberSetting {...data.bitrate} update={updateField('bitrate')} />
          </React.Fragment>
        )}
        {data.codec.value === 'MJPEG' && (
          <React.Fragment>
            <NumberSetting {...data.quality} update={updateField('quality')} />
          </React.Fragment>
        )}
      </SettingsExpander>
    </SettingsWrapper>
  );
};
