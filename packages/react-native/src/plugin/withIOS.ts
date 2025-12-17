// capture-es - bitdrift's ES SDK
// Copyright Bitdrift, Inc. All rights reserved.
//
// Use of this source code is governed by a source available license that can be found in the
// LICENSE file or at:
// https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt

import { withXcodeProject, XcodeProject } from '@expo/config-plugins';
import type { ConfigPlugin } from '@expo/config-plugins';
import PluginProps from './config';

const withBitdriftIOS: ConfigPlugin<PluginProps | void> = (config, _props) => {
  return withXcodeProject(config, (config) => {
    const xcodeProject: XcodeProject = config.modResults;

    const existingScript = xcodeProject.pbxItemByComment(
      'Copy Raw JS Bundle for Bitdrift',
      'PBXShellScriptBuildPhase',
    );

    if (existingScript) {
      return config;
    }

    const bundlePhase = xcodeProject.pbxItemByComment(
      'Bundle React Native code and images',
      'PBXShellScriptBuildPhase',
    );

    if (!bundlePhase) {
      return config;
    }

    const script = `if [ -f "$PROJECT_DIR/main.jsbundle" ]; then
  cp "$PROJECT_DIR/main.jsbundle" "$CONFIGURATION_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH/main.jsbundle.source"
fi
`;

    xcodeProject.addBuildPhase(
      [],
      'PBXShellScriptBuildPhase',
      'Copy Raw JS Bundle for Bitdrift',
      bundlePhase.uuid,
      {
        shellPath: '/bin/sh',
        shellScript: script,
      },
    );

    return config;
  });
};

export default withBitdriftIOS;
