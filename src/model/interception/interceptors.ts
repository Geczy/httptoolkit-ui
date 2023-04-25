import * as _ from "lodash";

import { ServerInterceptor } from "../../services/server-api";
import {
  versionSatisfies,
  DETAILED_CONFIG_RANGE,
  DOCKER_INTERCEPTION_RANGE,
  WEBRTC_GLOBALLY_ENABLED,
} from "../../services/service-versions";
import { IconProps, SourceIcons } from "../../icons";
import { AccountStore } from "../account/account-store";

import { InterceptorCustomUiConfig } from "../../components/intercept/intercept-option";
import { ManualInterceptCustomUi } from "../../components/intercept/config/manual-intercept-config";
import { ExistingTerminalCustomUi } from "../../components/intercept/config/existing-terminal-config";
import { ElectronCustomUi } from "../../components/intercept/config/electron-config";
import { AndroidDeviceCustomUi } from "../../components/intercept/config/android-device-config";
import { AndroidAdbCustomUi } from "../../components/intercept/config/android-adb-config";
import { ExistingBrowserCustomUi } from "../../components/intercept/config/existing-browser-config";
import { JvmCustomUi } from "../../components/intercept/config/jvm-config";
import { DockerAttachCustomUi } from "../../components/intercept/config/docker-attach-config";

interface InterceptorConfig {
  name: string;
  description: string[];
  iconProps: IconProps | Array<IconProps>;
  tags: string[];
  inProgress?: boolean;
  clientOnly?: true;
  checkRequirements?: (options: {
    interceptorVersion: string;
    accountStore: AccountStore;
    serverVersion?: string;
  }) => boolean;
  uiConfig?: InterceptorCustomUiConfig;
  getActivationOptions?: (options: {
    accountStore: AccountStore;
    serverVersion?: string;
  }) => unknown;
  notAvailableHelpUrl?: string;
}

export type Interceptor = Pick<
  ServerInterceptor,
  Exclude<keyof ServerInterceptor, "version">
> &
  InterceptorConfig & {
    version?: string;
    isSupported: boolean;
    activationOptions: unknown | undefined;
  };

const BROWSER_TAGS = ["browsers", "web", "pwa"];
const JVM_TAGS = ["jvm", "java", "scala", "kotlin", "clojure", "groovy"];
const MOBILE_TAGS = ["mobile", "phone", "app"];
const ANDROID_TAGS = [
  "samsung",
  "galaxy",
  "nokia",
  "lg",
  "android",
  "google",
  "motorola",
  ...JVM_TAGS,
];
const IOS_TAGS = ["apple", "ios", "iphone", "ipad"];
const DOCKER_TAGS = ["bridge", "services", "images"];
const TERMINAL_TAGS = [
  "command line",
  "cli",
  "docker",
  "bash",
  "cmd",
  "shell",
  "php",
  "ruby",
  "node",
  "js",
  ...JVM_TAGS,
];

const androidInterceptIconProps = _.assign(
  {
    style: { transform: "translateY(32px)" },
  },
  SourceIcons.Android
);

const recoloured = (icon: IconProps, color: string) => ({ ...icon, color });

export const MANUAL_INTERCEPT_ID = "manual-setup";

const getChromiumOptions = ({
  accountStore,
  serverVersion,
}: {
  accountStore: AccountStore;
  serverVersion?: string;
}) => ({
  webExtensionEnabled:
    accountStore.featureFlags.includes("webrtc") ||
    versionSatisfies(serverVersion || "", WEBRTC_GLOBALLY_ENABLED),
});

const INTERCEPT_OPTIONS: _.Dictionary<InterceptorConfig> = {
  electron: {
    name: "Electron Application",
    description: [
      "Launch an Electron application with all its traffic intercepted",
    ],
    iconProps: SourceIcons.Electron,
    uiConfig: ElectronCustomUi,
    checkRequirements: ({ interceptorVersion }) => {
      return versionSatisfies(interceptorVersion, "^1.0.1");
    },
    tags: ["electron", "desktop", "postman"],
  },
};

export function getInterceptOptions(
  serverInterceptorArray: ServerInterceptor[],
  accountStore: AccountStore,
  serverVersion?: string
) {
  const serverInterceptors = _.keyBy(serverInterceptorArray, "id");

  return _.mapValues(INTERCEPT_OPTIONS, (option, id) => {
    if (
      // If we need a server interceptor & it's not present
      (!option.clientOnly && !serverInterceptors[id]) ||
      // Or if we're missing other requirement (specific server version,
      // feature flags, etc)
      (option.checkRequirements &&
        !option.checkRequirements({
          interceptorVersion: (serverInterceptors[id] || {}).version,
          accountStore,
          serverVersion,
        }))
    ) {
      // The UI knows about this interceptor, but we can't use it for some reason.
      return _.assign({}, option, {
        id: id,
        isSupported: false,
        isActive: false,
        isActivable: false,
        activationOptions: undefined,
      });
    } else if (option.clientOnly) {
      // Some interceptors don't need server support at all, so as long as the requirements
      // are fulfilled, they're always supported & activable (e.g. manual setup guide).
      return _.assign({}, option, {
        id: id,
        isSupported: true,
        isActive: false,
        isActivable: true,
        activationOptions: option.getActivationOptions
          ? option.getActivationOptions({
              accountStore,
              serverVersion,
            })
          : undefined,
      });
    } else {
      // For everything else: the UI & server supports this, we let the server tell us
      // if it's activable/currently active.
      const serverInterceptor = serverInterceptors[id];

      return _.assign({}, option, serverInterceptor, {
        id,
        isSupported: true,
        activationOptions: option.getActivationOptions
          ? option.getActivationOptions({
              accountStore,
              serverVersion,
            })
          : undefined,
      });
    }
  });
}
