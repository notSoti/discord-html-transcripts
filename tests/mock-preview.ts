import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ButtonStyle, ChannelType, Collection, ComponentType, MessageFlags, type Channel, type Message } from 'discord.js';
import { ExportReturnType, generateFromMessages } from '../src';

const guildId = '100000000000000001';
const channelId = '100000000000000002';
const userId = '100000000000000003';
const staffId = '100000000000000004';
const roleId = '100000000000000005';
const mediaUrl = 'https://placehold.co/640x360/png?text=Transcript+Preview';

const guild = { id: guildId, name: 'Example Community', iconURL: () => null };
const channel = {
  id: channelId,
  name: 'modmail-example',
  topic: 'A mock support conversation showing transcript formatting.',
  type: ChannelType.GuildText,
  guild,
  client: {},
  isDMBased: () => false,
  isThread: () => false,
  isVoiceBased: () => false,
} as unknown as Channel;

const user = {
  id: userId,
  username: 'alex_example',
  displayName: 'Alex Example',
  bot: false,
  avatarURL: () => 'https://cdn.discordapp.com/embed/avatars/0.png',
  displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/0.png',
  flags: { has: () => false },
};
const staff = {
  id: staffId,
  username: 'sam_staff',
  displayName: 'Sam Staff',
  bot: false,
  avatarURL: () => 'https://cdn.discordapp.com/embed/avatars/1.png',
  displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/1.png',
  flags: { has: () => false },
};

// Only fields retained by Dave's sanitizeMessageData filter are included here.
// Other properties in createMockMessage are discord.js-derived values consumed by renderers.
const fixtureData = [
  {
    id: '100000000000000011',
    channel_id: channelId,
    guild_id: guildId,
    author: { id: userId, username: 'alex_example', avatar: null, bot: false },
    timestamp: '2026-10-20T10:00:00.000Z',
    edited_timestamp: null,
    content:
      'Hi! I have a question about my account.\n\n**Bold**, *italic*, __underlined__, ~~struck through~~, and ||spoiler|| text.\n' +
      'Inline code: `npm run preview:mock`\n```js\nconst preview = true;\n```\n' +
      '> A quoted line, plus a [link](https://discord.com).\n' +
      'Timestamps: <t:1792490400:t> · <t:1792490400:F> · <t:1792490400:R>.\n' +
      'A mention: <@100000000000000004> · <@&100000000000000005> · <#100000000000000002>',
    mention_everyone: false,
    flags: 0,
    attachments: [],
    embeds: [],
    components: [],
    reactions: [],
    sticker_items: [],
  },
  {
    id: '100000000000000012',
    channel_id: channelId,
    guild_id: guildId,
    author: { id: staffId, username: 'sam_staff', avatar: null, bot: false },
    timestamp: '2026-10-20T10:01:00.000Z',
    edited_timestamp: null,
    content: 'Thanks for reaching out! I can help with that. **What happens when you try to sign in?**',
    message_reference: { message_id: '100000000000000011', channel_id: channelId, guild_id: guildId, type: 0 },
    mention_everyone: false,
    flags: 0,
    attachments: [],
    embeds: [],
    components: [],
    reactions: [],
    sticker_items: [],
  },
  {
    id: '100000000000000013',
    channel_id: channelId,
    guild_id: guildId,
    author: { id: userId, username: 'alex_example', avatar: null, bot: false },
    timestamp: '2026-10-20T10:02:00.000Z',
    edited_timestamp: '2026-10-20T10:02:30.000Z',
    content: 'Here is a screenshot of the error I see.',
    mention_everyone: false,
    flags: 0,
    attachments: [
      {
        id: '100000000000000021',
        filename: 'sign-in-error.png',
        url: mediaUrl,
        proxy_url: mediaUrl,
        size: 24576,
        content_type: 'image/png',
      },
      {
        id: '100000000000000022',
        filename: 'debug-log.txt',
        url: 'https://example.com/debug-log.txt',
        proxy_url: 'https://example.com/debug-log.txt',
        size: 1024,
        content_type: 'text/plain',
      },
      {
        id: '100000000000000023',
        filename: 'voice-note.ogg',
        url: 'https://example.com/voice-note.ogg',
        proxy_url: 'https://example.com/voice-note.ogg',
        size: 8192,
        content_type: 'audio/ogg',
      },
      {
        id: '100000000000000024',
        filename: 'screen-recording.mp4',
        url: 'https://example.com/screen-recording.mp4',
        proxy_url: 'https://example.com/screen-recording.mp4',
        size: 32768,
        content_type: 'video/mp4',
      },
    ],
    embeds: [
      {
        title: 'Troubleshooting guide',
        description: 'Try the following steps:\n- Check your email address\n- Reset your password',
        url: 'https://example.com/help/sign-in',
        color: 5793266,
        author: { name: 'Example Help Center', url: 'https://example.com/help' },
        fields: [
          { name: 'Status', value: 'Investigating', inline: true },
          { name: 'Updated', value: 'Just now', inline: true },
          { name: 'Next step', value: 'We will follow up here.', inline: false },
        ],
        image: { url: mediaUrl, proxy_url: mediaUrl },
        thumbnail: { url: mediaUrl, proxy_url: mediaUrl },
        footer: { text: 'Example Help Center' },
      },
    ],
    components: [],
    reactions: [
      { count: 2, me: false, emoji: { id: null, name: '👀', animated: false } },
      { count: 1, me: false, emoji: { id: null, name: '✅', animated: false } },
    ],
    sticker_items: [{ id: '100000000000000031', name: 'Helpful wave', format_type: 1 }],
  },
  {
    id: '100000000000000014',
    channel_id: channelId,
    guild_id: guildId,
    author: { id: staffId, username: 'sam_staff', avatar: null, bot: false },
    timestamp: '2026-10-20T10:03:00.000Z',
    edited_timestamp: null,
    content: 'Here are a few UI examples from the same component renderer:',
    mention_everyone: false,
    flags: 0,
    attachments: [],
    embeds: [],
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          { type: ComponentType.Button, style: ButtonStyle.Primary, label: 'Primary', custom_id: 'preview_primary' },
          { type: ComponentType.Button, style: ButtonStyle.Secondary, label: 'Secondary', custom_id: 'preview_secondary' },
          { type: ComponentType.Button, style: ButtonStyle.Success, label: 'Success', custom_id: 'preview_success' },
          { type: ComponentType.Button, style: ButtonStyle.Danger, label: 'Danger', custom_id: 'preview_danger' },
          { type: ComponentType.Button, style: ButtonStyle.Link, label: 'Discord', url: 'https://discord.com' },
        ],
      },
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.StringSelect,
            custom_id: 'preview_select',
            placeholder: 'Choose an example',
            min_values: 1,
            max_values: 1,
            options: [
              { label: 'First option', value: 'first', description: 'An example option', default: false },
              { label: 'Second option', value: 'second', description: 'Another example option', default: false },
            ],
          },
        ],
      },
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.UserSelect,
            custom_id: 'preview_user_select',
            placeholder: 'Select a user',
            min_values: 1,
            max_values: 1,
          },
        ],
      },
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.RoleSelect,
            custom_id: 'preview_role_select',
            placeholder: 'Select a role',
            min_values: 1,
            max_values: 1,
          },
        ],
      },
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.MentionableSelect,
            custom_id: 'preview_mentionable_select',
            placeholder: 'Select a user or role',
            min_values: 1,
            max_values: 1,
          },
        ],
      },
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.ChannelSelect,
            custom_id: 'preview_channel_select',
            placeholder: 'Select a channel',
            min_values: 1,
            max_values: 1,
          },
        ],
      },
      {
        type: ComponentType.Container,
        accent_color: 5793266,
        components: [
          {
            type: ComponentType.TextDisplay,
            content:
              '### Components V2\nText display with **Discord markdown**.\n\n' +
              'Mentions: <@100000000000000004>, <@&100000000000000005>, <#100000000000000002>\n' +
              'Timestamps: <t:1792490400:f> · <t:1792490400:R>',
          },
          {
            type: ComponentType.Section,
            components: [{ type: ComponentType.TextDisplay, content: 'Section with a button accessory.' }],
            accessory: { type: ComponentType.Button, style: ButtonStyle.Primary, label: 'Open', custom_id: 'preview_section' },
          },
          {
            type: ComponentType.Section,
            components: [{ type: ComponentType.TextDisplay, content: 'Section with an image thumbnail.' }],
            accessory: { type: ComponentType.Thumbnail, media: { url: mediaUrl } },
          },
          { type: ComponentType.Separator, divider: true, spacing: 2 },
          { type: ComponentType.File, file: { url: 'https://example.com/attached-guide.pdf' }, spoiler: false },
          {
            type: ComponentType.MediaGallery,
            items: [
              { media: { url: mediaUrl }, description: 'Preview image' },
              { media: { url: 'https://placehold.co/640x360/png?text=Gallery+Item' }, description: 'Gallery item' },
            ],
          },
        ],
      },
    ],
    reactions: [],
    sticker_items: [],
  },
  {
    id: '100000000000000015',
    channel_id: channelId,
    guild_id: guildId,
    author: { id: userId, username: 'alex_example', avatar: null, bot: false },
    timestamp: '2026-10-20T10:04:00.000Z',
    edited_timestamp: null,
    content: 'That fixed it, thank you!',
    mention_everyone: false,
    flags: MessageFlags.HasThread,
    attachments: [],
    embeds: [],
    components: [],
    reactions: [],
    sticker_items: [],
  },
];

function createMockMessage(data: (typeof fixtureData)[number]) {
  const author = data.author.id === userId ? user : staff;
  const attachments = new Collection(
    data.attachments.map((attachment) => [
      attachment.id,
      {
        ...attachment,
        name: attachment.filename,
        contentType: attachment.content_type,
        proxyURL: attachment.proxy_url,
        toJSON: () => attachment,
      }],
    ),
  );
  const stickers = new Collection(data.sticker_items.map((sticker) => [sticker.id, { ...sticker, url: mediaUrl }]));
  const reactions = new Collection(
    data.reactions.map((reaction, index) => [String(index), { ...reaction, emoji: { ...reaction.emoji, id: null } }]),
  );

  return {
    id: data.id,
    author,
    guild,
    channel,
    createdAt: new Date(data.timestamp),
    editedAt: data.edited_timestamp ? new Date(data.edited_timestamp) : null,
    content: data.content,
    mentions: { everyone: data.mention_everyone },
    reference: data.message_reference
      ? {
          messageId: data.message_reference.message_id,
          channelId: data.message_reference.channel_id,
          guildId: data.message_reference.guild_id,
          type: data.message_reference.type,
        }
      : null,
    attachments,
    embeds: data.embeds,
    components: data.components,
    stickers,
    reactions: { cache: reactions },
    interaction: null,
    hasThread: Boolean(data.flags & MessageFlags.HasThread),
    thread: data.flags & MessageFlags.HasThread
      ? {
          name: 'Follow-up discussion',
          messageCount: 2,
          lastMessage: { author: staff, content: 'Glad that worked!' },
        }
      : null,
    messageSnapshots: new Collection(),
    toJSON: () => ({ ...data }),
  } as unknown as Message;
}

async function main() {
  const html = await generateFromMessages(fixtureData.map(createMockMessage), channel, {
    returnType: ExportReturnType.String,
    favicon: 'https://cdn.discordapp.com/embed/avatars/0.png',
    poweredBy: false,
    footerText: 'Mock transcript · {number} message{s}.',
    callbacks: {
      resolveChannel: async (id) => (id === channelId ? channel : null),
      resolveUser: async (id) => (id === staffId ? staff as never : id === userId ? user as never : null),
      resolveRole: async (id) =>
        id === roleId ? ({ id: roleId, name: 'Support Team', hexColor: '#5865f2' } as never) : null,
      resolveImageSrc: async (attachment) => attachment.url,
    },
  });

  const outputPath = resolve(process.cwd(), 'tests/mock-transcript.html');
  writeFileSync(outputPath, html);
  console.log(`Mock transcript generated: ${outputPath}`);
}

void main();
