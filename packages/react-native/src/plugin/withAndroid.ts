// capture-es - bitdrift's ES SDK
// Copyright Bitdrift, Inc. All rights reserved.
//
// Use of this source code is governed by a source available license that can be found in the
// LICENSE file or at:
// https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt

import { withPlugins } from '@expo/config-plugins';
import { withAppBuildGradle, withSettingsGradle, withProjectBuildGradle } from '@expo/config-plugins';
import type { ConfigPlugin } from '@expo/config-plugins';
import PluginProps from './config';

const BITDRIFT_MAVEN_URL = 'https://dl.bitdrift.io/sdk/android-maven';
const BITDRIFT_REPO_INDICATOR = 'dl.bitdrift.io';
const CAPTURE_PLUGIN_VERSION = '0.19.1';

const hasBitdriftRepo = (contents: string): boolean => {
  return contents.includes(BITDRIFT_REPO_INDICATOR);
};

const bitdriftMavenRepo = (useRegex: boolean = false): string => {
  const contentFilter = useRegex
    ? `includeGroupByRegex "io\\.bitdrift.*"`
    : `includeGroup 'io.bitdrift'`;
  return `        maven {
            url '${BITDRIFT_MAVEN_URL}'
            content {
                ${contentFilter}
            }
        }`;
};

const pluginManagementRepositories = (): string => {
  return `    repositories {
        mavenLocal()
        mavenCentral()
        gradlePluginPortal()
${bitdriftMavenRepo(true)}
    }`;
};

const dependencyRepositories = (): string => {
  return `    repositories {
        mavenLocal()
        google()
        mavenCentral()
${bitdriftMavenRepo(true)}
    }`;
};

const withBitdriftAppBuildGradle: ConfigPlugin<PluginProps | void> = (
  config,
  props,
) => {
  return withAppBuildGradle(config, (config) => {
    if (hasBitdriftRepo(config.modResults.contents)) {
      return config;
    }

    if (props?.networkInstrumentation) {
      config.modResults.contents = `plugins {
    id 'io.bitdrift.capture-plugin' version '${CAPTURE_PLUGIN_VERSION}'
}

${config.modResults.contents}`;
    }

    config.modResults.contents += `

repositories {
${bitdriftMavenRepo(false)}
}
`;

    return config;
  });
};

const withBitdriftSettingsGradle: ConfigPlugin<PluginProps | void> = (
  config,
  _props,
) => {
  return withSettingsGradle(config, (config) => {
    if (hasBitdriftRepo(config.modResults.contents)) {
      return config;
    }

    if (config.modResults.contents.includes('pluginManagement {')) {
      config.modResults.contents = config.modResults.contents.replace(
        'pluginManagement {',
        `pluginManagement {
${pluginManagementRepositories()}
`,
      );
    }

    if (config.modResults.contents.includes('dependencyResolutionManagement {')) {
      if (!config.modResults.contents.includes('dependencyResolutionManagement {\n    repositories')) {
        config.modResults.contents = config.modResults.contents.replace(
          'dependencyResolutionManagement {',
          `dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.PREFER_SETTINGS)
${dependencyRepositories()}
`,
        );
      }
    } else {
      config.modResults.contents += `

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.PREFER_SETTINGS)
${dependencyRepositories()}
}
`;
    }

    return config;
  });
};

const withBitdriftProjectBuildGradle: ConfigPlugin<PluginProps | void> = (
  config,
  _props,
) => {
  return withProjectBuildGradle(config, (config) => {
    if (hasBitdriftRepo(config.modResults.contents)) {
      return config;
    }

    config.modResults.contents += `

allprojects {
${dependencyRepositories()}
}
`;

    return config;
  });
};

const withAndroid: ConfigPlugin<PluginProps | void> = (config, props) => {
  return withPlugins(config, [
    [withBitdriftAppBuildGradle, props],
    [withBitdriftSettingsGradle, props],
    [withBitdriftProjectBuildGradle, props],
  ]);
};

export default withAndroid;