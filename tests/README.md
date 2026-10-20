# Tests and local preview

## Generate a mock transcript

Install dependencies once and run:

```sh
npm install
npm run preview:mock
```

This builds the current generator source, renders a fixture transcript without logging into Discord, and writes `tests/mock-transcript.html`. Open that HTML file in a browser to inspect changes. The transcript's Discord component library and fonts load from their configured CDNs.

The preview covers markdown, replies, embeds, attachments, reactions, stickers, thread previews, and supported message components. It is a visual preview only; buttons and selects do not interact with Discord.
