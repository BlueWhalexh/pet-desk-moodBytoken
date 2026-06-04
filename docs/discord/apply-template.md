# Build the Petdex Community Discord server

Copy this entire file and paste it as a single message in a Claude Code
session **after** you've started the discord-mcp container and added it
to Claude (`claude mcp add discord -t http http://localhost:8085/mcp`).
Claude will read `docs/discord/server-template.json` and execute the
discord-mcp tools to build everything.

---

You have access to the discord-mcp tool set. Read
`docs/discord/server-template.json` from the petdex repo and build the
server exactly as specified. Use the discord-mcp tools. Never invent
permissions or deviate from the JSON.

Steps, in order:

1. Confirm the bot is in the right guild. Call `get_server_info` and
   verify the guild matches the `DISCORD_GUILD_ID` env. If the bot is
   in a fresh empty guild named "Petdex Community", continue. If the
   guild has a different name, **stop and ask** before renaming.

2. Set the guild icon to `public/brand/discord-icon.png`. If the MCP
   doesn't expose an icon-set tool, skip and tell me to set it
   manually in Server Settings → Overview.

3. Create roles in the order listed under `roles`. Color, hoist,
   mentionable, and permissions must match. The "Petdex Bot" role
   exists already (Discord creates it on bot install). If so, just
   ensure its permissions match.

4. For each entry under `categories`:
   a. Create the category with the exact emoji + name.
   b. Create each child channel with the right type (text /
      announcement / voice).
   c. Apply the topic verbatim. If `slowmode` is set, configure it.
   d. If a channel is marked `lockedToBot: true`, deny @everyone
      `SendMessages` and grant `Petdex Bot` + `Petdex Team`
      `SendMessages` + `ManageMessages`.
   e. If a category has `private: true`, deny @everyone `ViewChannel`
      and grant `Petdex Team` + `Petdex Bot` `ViewChannel` +
      `SendMessages`.

5. Verify the result by calling `list_channels` and reporting back a
   tree view of categories → channels.

6. Tell me which `_followups` items I have to do by hand (Community
   enablement, AutoMod, etc.). Those need the Server Settings UI.

If any step fails because a tool doesn't exist or returns an error,
**stop and report**. Don't paper over with workarounds. I'd rather
fix the JSON than ship a half-built server.
