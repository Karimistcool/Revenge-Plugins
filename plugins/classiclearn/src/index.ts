import { findByStoreName, findByProps } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { storage } from "@vendetta/plugin";
import { showToast } from "@vendetta/ui/toasts";
import { registerCommand } from "@vendetta/plugin"

const MessageActions = findByProps("sendMessage");
const messageUtil = findByProps(
  "sendBotMessage",
  "receiveMessage"
);

/**
This is iteration 5 of index.ts. Updates: Added onLoad functions to see if that's why it won't turn on.
took the messageactions stuff from kmio's Commands plugin. hope it works.
Goal: Make a plugin that'll send an ephemeral message either through Clyde or oneself.
**/
export const sendMessageCommand = {
  name: "sendMessage",
  displayName: "sendMessage",
  description: "iteration 5",
  displayDescription: "iteration 5",
  execute: async (args: any, ctx: any) => {
    try {
      const fixNonce = Date.now().toString();
      
      MessageActions.sendMessage(
        ctx.channel.id,
        { content: "Hello World!" },
        void 0,
        { nonce: fixNonce }
      );
      return null;
 catch (error) { 
    console.error("[SillyMessages] Error:", error);
    showToast("You fucked up. Check da logs", 3000)
    return null;
    }
  }
};

export default {
  onLoad() {
    try {
      console.log("[SillyStuff] Well, your plugin loaded. Does it work?");
      showToast("Well, your plugin loaded. Does it work?");
      registerCommand(sendMessageCommand);
    } catch (error) {
      console.log("[SillyStuff] Sumn blew up. Read this: ", error);
      showToast("Well, I tried loading, but something happened.");
    }
  },
  onUnload() {
    console.log("[SillyStuff] See ya!");
    showToast("Bye bye!")
    patches.forEach((p) => p());
  },
};
