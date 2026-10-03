import { FluxDispatcher } from "@vendetta/metro/common";
import { findByProps } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import { logger } from "@vendetta";
import Settings from "./settings";
import { cloneAndFilter } from "./utils";

const assetManager = findByProps("getAssetIds");
const pluginStartSince = Date.now();

const typedStorage = storage as typeof storage & {
  selected: string;
  selections: Record<string, Activity>;
  autoStart: boolean;
};

enum ActivityTypes {
  PLAYING = 0,
  STREAMING = 1,
  LISTENING = 2,
  WATCHING = 3,
  COMPETING = 5,
}

function createDefaultSelection(): Activity {
  return {
    name: "Reveg©",
    application_id: "1054951789318909972",
    flags: 0,
    type: ActivityTypes.PLAYING,
    timestamps: {
      _enabled: false,
      start: pluginStartSince,
    },
    assets: {},
    buttons: [{}, {}],
  };
}

if (!storage.selected || typeof storage.selected !== "string") {
  logger.log("[Rich Presence] Initializing default storage");
  storage.selected = "default";
  storage.selections = { default: createDefaultSelection() };
}

function processImageUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith("mp:external/")) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return url;
}

async function sendRequest(activity: Activity | null): Promise<Activity | null> {
  if (activity === null) {
    FluxDispatcher.dispatch({
      type: "LOCAL_ACTIVITY_UPDATE",
      activity: null,
      pid: 1608,
      socketId: "RPC@Reveg",
    });
    logger.log("[Rich Presence] Cleared activity");
    return null;
  }

  logger.log("[Rich Presence] Preparing activity:", activity);

  const timestampEnabled = activity.timestamps?._enabled;
  activity = cloneAndFilter(activity);

  if (timestampEnabled) {
    if (typeof activity.timestamps.start !== "number") {
      activity.timestamps.start = pluginStartSince;
    }
    if (typeof activity.timestamps.end !== "number" || activity.timestamps.end === 0) {
      delete activity.timestamps.end;
    }
    if (Object.keys(activity.timestamps).length === 0) {
      delete activity.timestamps;
    }
  } else {
    delete activity.timestamps;
  }

  if (activity.assets) {
    try {
      activity.assets.large_image = processImageUrl(activity.assets.large_image);
      activity.assets.small_image = processImageUrl(activity.assets.small_image);

      const isLargeExternal = activity.assets.large_image?.startsWith("http");
      const isSmallExternal = activity.assets.small_image?.startsWith("http");

      if (!isLargeExternal || !isSmallExternal) {
        const keys = [
          isLargeExternal ? null : activity.assets.large_image,
          isSmallExternal ? null : activity.assets.small_image,
        ].filter(Boolean);
        if (keys.length > 0) {
          const args = [activity.application_id, keys];
          let assetIds = assetManager.getAssetIds(...args);
          if (!assetIds.length) assetIds = await assetManager.fetchAssetIds(...args);
          if (!isLargeExternal && assetIds[0]) activity.assets.large_image = assetIds[0];
          if (!isSmallExternal && assetIds[1]) activity.assets.small_image = assetIds[1];
        }
      }
    } catch (e) {
      logger.error("[Rich Presence] Failed to resolve asset IDs:", e);
    }
  }

  if (activity.buttons?.length) {
    activity.buttons = activity.buttons.filter(x => x && x.label);
    if (activity.buttons.length) {
      Object.assign(activity, {
        metadata: { button_urls: activity.buttons.map(x => x.url) },
        buttons: activity.buttons.map(x => x.label),
      });
    } else {
      delete activity.buttons;
    }
  } else {
    delete activity.buttons;
  }

  FluxDispatcher.dispatch({
    type: "LOCAL_ACTIVITY_UPDATE",
    activity,
    pid: 1608,
    socketId: "RichPresence@Vendetta",
  });

  logger.log("[Rich Presence] Activity sent:", activity);
  return activity;
}

export default {
  onLoad() {
    const current = storage.selections?.[storage.selected];
    if (!current) {
      logger.logger.error("[Rich Presence] Invalid selected profile:", storage.selected);
      return;
    }

    if (typedStorage.autoStart) {
      logger.log("[Rich Presence] Auto-start enabled, applying presence");
      sendRequest(current).catch(e => logger.error("[Rich Presence] Send failed:", e));
    }
  },

  onUnload() {
    sendRequest(null);
  },

  settings: Settings,
};