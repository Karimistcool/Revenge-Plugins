import { FluxDispatcher } from "@vendetta/metro/common";
import { findByProps } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import { logger } from "@vendetta";
import Settings from "./settings";
import { cloneAndFilter } from "./utils";

const assetManager = findByProps("getAssetIds");
const pluginStartSince = Date.now();
const SOCKET_ID = "RPC@Reveg";

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

function ensureStorage() {
  if (!typedStorage.selections || typeof typedStorage.selections !== "object") {
    typedStorage.selections = {};
  }

  typedStorage.selections.default ??= createDefaultSelection();

  if (
    typeof typedStorage.selected !== "string" ||
    !typedStorage.selections[typedStorage.selected]
  ) {
    typedStorage.selected = "default";
  }
}

ensureStorage();

async function resolveAsset(
  appId: string,
  rawKey?: string
): Promise<string | undefined> {
  const key = rawKey?.trim();
  if (!key) return undefined;

  // Keep direct URLs and Discord media references unchanged.
  if (/^https?:\/\//i.test(key) || key.startsWith("mp:")) {
    return key;
  }

  // Uploaded Discord asset keys are lowercase.
  const assetKey = key.toLowerCase();
  let ids: string[] = [];

  try {
    ids = assetManager?.getAssetIds?.(appId, [assetKey]) ?? [];
  } catch {
    // Try the asynchronous lookup below.
  }

  if (!ids.length) {
    try {
      const fetched = await assetManager?.fetchAssetIds?.(appId, [assetKey]);
      if (Array.isArray(fetched)) ids = fetched;
    } catch (e) {
      logger.error("[Rich Presence] Asset lookup failed:", e);
    }
  }

  if (!ids.length) {
    logger.warn("[Rich Presence] Asset key not found:", appId, assetKey);
    return undefined;
  }

  return ids[0];
}

async function sendRequest(
  activity: Activity | null
): Promise<Activity | null> {
  if (activity === null) {
    FluxDispatcher.dispatch({
      type: "LOCAL_ACTIVITY_UPDATE",
      activity: null,
      pid: 1608,
      socketId: SOCKET_ID,
    });

    logger.log("[Rich Presence] Cleared activity");
    return null;
  }

  logger.log("[Rich Presence] Preparing activity:", activity);

  const timestampEnabled = activity.timestamps?._enabled === true;
  activity = cloneAndFilter(activity);

  if (timestampEnabled) {
    activity.timestamps ??= {} as any;

    if (typeof activity.timestamps.start !== "number") {
      activity.timestamps.start = pluginStartSince;
    }

    if (
      typeof activity.timestamps.end !== "number" ||
      activity.timestamps.end === 0
    ) {
      delete activity.timestamps.end;
    }

    if (Object.keys(activity.timestamps).length === 0) {
      delete activity.timestamps;
    }
  } else {
    delete activity.timestamps;
  }

  if (activity.assets) {
    const appId = activity.application_id;

    const large = await resolveAsset(appId, activity.assets.large_image);
    const small = await resolveAsset(appId, activity.assets.small_image);

    if (large) {
      activity.assets.large_image = large;
    } else {
      delete activity.assets.large_image;
      delete activity.assets.large_text;
    }

    if (small) {
      activity.assets.small_image = small;
    } else {
      delete activity.assets.small_image;
      delete activity.assets.small_text;
    }

    if (Object.keys(activity.assets).length === 0) {
      delete activity.assets;
    }
  }

  if (activity.buttons?.length) {
    activity.buttons = activity.buttons.filter(
      (button) => button && button.label
    );

    if (activity.buttons.length) {
      Object.assign(activity, {
        metadata: {
          button_urls: activity.buttons.map((button) => button.url),
        },
        buttons: activity.buttons.map((button) => button.label),
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
    socketId: SOCKET_ID,
  });

  logger.log("[Rich Presence] Activity sent:", activity);
  return activity;
}

async function updatePresence(): Promise<Activity | null> {
  ensureStorage();

  const current = typedStorage.selections[typedStorage.selected];

  if (!current) {
    logger.error(
      "[Rich Presence] Invalid selected profile:",
      typedStorage.selected
    );
    return null;
  }

  return sendRequest(current);
}

export default {
  onLoad() {
    ensureStorage();

    if (typedStorage.autoStart) {
      logger.log("[Rich Presence] Auto-start enabled, applying presence");
      updatePresence().catch((e) =>
        logger.error("[Rich Presence] Send failed:", e)
      );
    }
  },

  onUnload() {
    sendRequest(null).catch((e) =>
      logger.error("[Rich Presence] Clear failed:", e)
    );
  },

  updatePresence,
  settings: Settings,
};
