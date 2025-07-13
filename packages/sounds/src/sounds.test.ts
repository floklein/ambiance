import sounds from "./sounds.json";

const BASE_URL = "https://sounds.tabletopaudio.com";

export async function pingAllSounds() {
  const soundEntries = Object.entries(sounds);
  const failedSoundIds = new Set<string>();

  await Promise.all(
    soundEntries.map(async ([soundId, sound]) => {
      const url = `${BASE_URL}/${sound.mp3}`;
      try {
        const response = await fetch(url, { method: "HEAD" });
        if (!response.ok) {
          console.error(
            `❌ ${soundId} (${sound.title}): ${response.status} ${response.statusText} - ${url}`,
          );
          failedSoundIds.add(soundId);
        }
      } catch (error) {
        console.error(
          `❌ ${soundId} (${sound.title}): ${error instanceof Error ? error.message : "Unknown error"} - ${url}`,
        );
        failedSoundIds.add(soundId);
      }
    }),
  );

  const updatedSounds = Object.fromEntries(
    Object.entries(sounds).map(([soundId, sound]) => [
      soundId,
      { ...sound, disabled: failedSoundIds.has(soundId) },
    ]),
  );

  Bun.write("./sounds.json", JSON.stringify(updatedSounds, null, 2));
}

pingAllSounds();
