import { findByProps } from "@vendetta/metro";
import { showToast } from "@vendetta/ui/toasts";
import { registerCommand } from "@vendetta/commands"

const MessageActions = findByProps("sendMessage");
const patches: (() => void)[] = [];

const messageUtil = findByProps(
  "sendBotMessage",
  "receiveMessage"
);

/**
This is iteration 6 of index.ts. Updates: Fixed some major issues with the code. Hopefully Github Deployment can finally read this.
Mini Update: Added Application stuff to hopefully register it as a proper command.
took the messageactions stuff from kmio's Commands plugin. hope it works.
Goal: Make a plugin that'll send an ephemeral message either through Clyde or oneself.
**/

const sendMessageCommand = {
  name: "sendMessage",
  displayName: "sendMessage",
  description: "iteration 6",
  displayDescription: "iteration 6",
  applicationId: "-1",
  inputType: 1,
  type: 1,
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
    } catch (error) { 
    console.error("[SillyMessages] Error:", error);
    showToast("You fucked up. Check da logs", 3000);
    return null;
    }
  }
}

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
    showToast("Bye bye!");
    patches.forEach((patch) => patch());
  },
};
