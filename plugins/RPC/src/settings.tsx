import { React, ReactNative } from "@vendetta/metro/common";
import { Forms } from "@vendetta/ui/components";
import { useProxy } from "@vendetta/storage";
import { storage } from "@vendetta/plugin";
import RPInstance from ".";
import { logger } from "@vendetta";

const { View, ScrollView, TouchableOpacity } = ReactNative;
const {
  FormText,
  FormInput,
  FormRow,
  FormSwitchRow,
  FormSection,
} = Forms;

const typedStorage = storage as typeof storage & {
  selected: string;
  selections: Record<string, Activity>;
  autoStart: boolean;
};

export default function Settings() {
  useProxy(typedStorage);

  if (!typedStorage.selections || typeof typedStorage.selections !== "object") {
    typedStorage.selections = {};
  }

  if (
    !typedStorage.selected ||
    typeof typedStorage.selected !== "string" ||
    !typedStorage.selections[typedStorage.selected]
  ) {
    typedStorage.selected = "default";
    typedStorage.selections.default ??= {
      name: "Reveg©",
      application_id: "1054951789318909972",
      flags: 0,
      type: 0,
      timestamps: {
        _enabled: false,
        start: Date.now(),
      },
      assets: {},
      buttons: [{}, {}],
    };
  }

  const settings = useProxy(
    typedStorage.selections[typedStorage.selected]
  ) as Activity;

  settings.assets ??= {};
  settings.timestamps ??= { _enabled: false };
  settings.buttons ??= [{}, {}];
  settings.buttons[0] ??= {};
  settings.buttons[1] ??= {};

  return (
    <ScrollView style={{ paddingBottom: 24 }}>
      <View style={{ padding: 16 }}>
        <FormText style={{ marginBottom: 12 }}>
          Configure your custom RPC below.
        </FormText>

        <FormSection title="General">
          <FormSwitchRow
            label="Auto Start"
            subLabel="Start the rich presence feature whenever Revenge gets launched"
            value={typedStorage.autoStart ?? false}
            onValueChange={(value) => {
              typedStorage.autoStart = value;
            }}
          />
        </FormSection>

        <TouchableOpacity
          style={{
            backgroundColor: "#5865F2",
            padding: 12,
            borderRadius: 8,
            alignItems: "center",
            marginBottom: 16,
          }}
          onPress={() => {
            logger.log("[RPC] Manual update");
            RPInstance.updatePresence().catch((e) =>
              logger.error("[RPC] Update failed:", e)
            );
          }}
        >
          <FormText style={{ color: "white" }}>Update Presence</FormText>
        </TouchableOpacity>

        <FormSection title="Basic">
          <FormInput
            title="Application Name"
            placeholder="Discord"
            value={settings.name}
            onChange={(value) => {
              settings.name = value;
            }}
          />

          <FormInput
            title="Application ID"
            placeholder="1054951789318909972"
            value={settings.application_id}
            onChange={(value) => {
              settings.application_id = value;
            }}
            keyboardType="numeric"
            helpText="Use the Application ID that owns the Rich Presence assets."
          />

          <FormInput
            title="Activity Type (0-5)"
            placeholder="0"
            value={String(settings.type ?? 0)}
            onChange={(value) => {
              settings.type = Number(value);
            }}
            keyboardType="numeric"
            helpText="Playing, Streaming, Listening, Watching, Custom, Competing"
          />

          <FormInput
            title="Details"
            placeholder="Competitive"
            value={settings.details}
            onChange={(value) => {
              settings.details = value;
            }}
          />

          <FormInput
            title="State"
            placeholder="Playing Solo"
            value={settings.state}
            onChange={(value) => {
              settings.state = value;
            }}
          />
        </FormSection>

        <FormSection title="Images">
          <FormInput
            title="Large Image"
            placeholder="asset_key or URL"
            value={settings.assets?.large_image}
            onChange={(value) => {
              settings.assets!.large_image = value;
            }}
          />

          <FormInput
            title="Large Image Text"
            placeholder="Displayed on hover"
            value={settings.assets?.large_text}
            disabled={!settings.assets?.large_image}
            onChange={(value) => {
              settings.assets!.large_text = value;
            }}
          />

          <FormInput
            title="Small Image"
            placeholder="asset_key or URL"
            value={settings.assets?.small_image}
            onChange={(value) => {
              settings.assets!.small_image = value;
            }}
          />

          <FormInput
            title="Small Image Text"
            placeholder="Displayed on hover"
            value={settings.assets?.small_text}
            disabled={!settings.assets?.small_image}
            onChange={(value) => {
              settings.assets!.small_text = value;
            }}
          />

          <FormText style={{ marginLeft: 16, marginTop: 4 }}>
            Use an uploaded asset key from this Application ID, or try a direct
            image URL.
          </FormText>

          <FormText
            style={{ marginLeft: 16, marginTop: 2, fontSize: 12, opacity: 0.7 }}
          >
            URLs are passed through unchanged; this plugin does not resize them.
          </FormText>
        </FormSection>

        <FormSection title="Timestamps">
          <FormSwitchRow
            label="Enable timestamps"
            value={settings.timestamps?._enabled ?? false}
            onValueChange={(value) => {
              settings.timestamps!._enabled = value;
            }}
          />

          <FormInput
            title="Start (ms)"
            placeholder="e.g. 1680000000000"
            value={String(settings.timestamps?.start ?? "")}
            disabled={!settings.timestamps?._enabled}
            onChange={(value) => {
              settings.timestamps!.start = Number(value);
            }}
            keyboardType="numeric"
          />

          <FormInput
            title="End (ms)"
            placeholder="optional"
            value={String(settings.timestamps?.end ?? "")}
            disabled={!settings.timestamps?._enabled}
            onChange={(value) => {
              settings.timestamps!.end = Number(value);
            }}
            keyboardType="numeric"
          />

          <FormRow
            label="Use current time"
            subLabel="Set now as start timestamp"
            disabled={!settings.timestamps?._enabled}
            trailing={FormRow.Arrow}
            onPress={() => {
              settings.timestamps!.start = Date.now();
            }}
          />
        </FormSection>

        <FormSection title="Buttons">
          <FormInput
            title="Button 1 Label"
            placeholder="Label"
            value={settings.buttons?.[0]?.label}
            onChange={(value) => {
              settings.buttons![0]!.label = value;
            }}
          />

          <FormInput
            title="Button 1 URL"
            placeholder="https://example.com"
            value={settings.buttons?.[0]?.url}
            disabled={!settings.buttons?.[0]?.label}
            onChange={(value) => {
              settings.buttons![0]!.url = value;
            }}
            helpText={
              settings.buttons?.[0]?.label && !settings.buttons?.[0]?.url ? (
                <ReactNative.Text style={{ color: "red" }}>
                  Required if button label is set
                </ReactNative.Text>
              ) : undefined
            }
          />

          <FormInput
            title="Button 2 Label"
            placeholder="Label"
            value={settings.buttons?.[1]?.label}
            onChange={(value) => {
              settings.buttons![1]!.label = value;
            }}
          />

          <FormInput
            title="Button 2 URL"
            placeholder="https://example.com"
            value={settings.buttons?.[1]?.url}
            disabled={!settings.buttons?.[1]?.label}
            onChange={(value) => {
              settings.buttons![1]!.url = value;
            }}
            helpText={
              settings.buttons?.[1]?.label && !settings.buttons?.[1]?.url ? (
                <ReactNative.Text style={{ color: "red" }}>
                  Required if button label is set
                </ReactNative.Text>
              ) : undefined
            }
          />
        </FormSection>
      </View>
    </ScrollView>
  );
}
