// One-shot: register slash commands with Discord. Run after editing
// commands.ts:
//   bun run register
//
// Guild-scoped registration shows up instantly; global rollout takes
// up to an hour. We use guild-scoped while iterating.

import { REST, Routes } from "discord.js";

import { commandData } from "./commands.js";

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token) throw new Error("DISCORD_TOKEN is not set");
if (!clientId) throw new Error("DISCORD_CLIENT_ID is not set");
if (!guildId) throw new Error("DISCORD_GUILD_ID is not set");

const rest = new REST({ version: "10" }).setToken(token);

console.log(
  `[register] uploading ${commandData.length} commands to guild ${guildId}…`,
);
const result = (await rest.put(
  Routes.applicationGuildCommands(clientId, guildId),
  { body: commandData },
)) as Array<{ name: string }>;
console.log(
  `[register] done. Registered: ${result.map((c) => c.name).join(", ")}`,
);
