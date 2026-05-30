import { MessageReferenceType, type Message as MessageType } from 'discord.js';
import type { RenderMessageContext } from '..';
import { parseDiscordEmoji } from '../../utils/utils';
import { Attachments } from './attachment';
import ComponentRow from './components';
import MessageContent, { RenderType } from './content';
import { DiscordEmbed } from './embed';
import MessageReply from './reply';
import DiscordSystemMessage from './systemMessage';


export default async function DiscordMessage({
  message,
  context,
}: {
  message: MessageType;
  context: RenderMessageContext;
}) {
  if (message.system) return <DiscordSystemMessage message={message} />;

  const renderContext = context as RenderMessageContext & {
    _internal?: {
      renderForwardedSource?: boolean;
    };
  };

  const renderForwardedSource = renderContext._internal?.renderForwardedSource === true;
  const isCrosspost = message.reference && message.reference.guildId !== message.guild?.id;
  const isForwarded = !renderForwardedSource && message.reference?.type === MessageReferenceType.Forward;
  const forwardedMessage = isForwarded ? getForwardedMessage(message, context.messages) : null;
  const rawForwardedSnapshot = isForwarded ? getRawForwardedSnapshot(message) : null;

  const forwardedContent = rawForwardedSnapshot?.content
    ? stripForwardedAuthorPrefix(rawForwardedSnapshot.content)
    : forwardedMessage
      ? stripForwardedAuthorPrefix(forwardedMessage.content)
      : isForwarded
        ? stripForwardedAuthorPrefix(message.content)
        : message.content;
  const displayTimestamp = message.createdAt.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const profileId = message.author?.id ?? undefined;

  return (
    <discord-message
      id={`m-${message.id}`}
      timestamp={displayTimestamp}
      key={message.id}
      edited={message.editedAt !== null}
      server={isCrosspost ?? undefined}
      highlight={message.mentions.everyone}
      profile={profileId}
    >
      {/* reply */}
      {!isForwarded && <MessageReply message={message} context={context} />}

      {/* slash command */}
      {message.interaction && (
        <discord-command
          slot="reply"
          profile={message.interaction.user.id}
          command={'/' + message.interaction.commandName}
        />
      )}

      {/* message content */}
      {isForwarded && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div
            style={{
              color: '#949ba4',
              fontSize: '12px',
              lineHeight: 1.2,
            }}
          >
            ╭➤ Forwarded
          </div>

          {forwardedMessage ? (
            <discord-quote>
              <DiscordMessage
                message={forwardedMessage}
                context={
                  {
                    ...renderContext,
                    _internal: {
                      ...(renderContext._internal ?? {}),
                      renderForwardedSource: true,
                    },
                  } as RenderMessageContext
                }
              />
            </discord-quote>
          ) : rawForwardedSnapshot ? (
            <discord-quote>
              <RawForwardedMessageBody snapshot={rawForwardedSnapshot} fallbackContent={forwardedContent} context={context} />
            </discord-quote>
          ) : null}
        </div>
      )}

      {!isForwarded && message.content && (
        <MessageContent
          content={message.content}
          context={{ ...context, type: message.webhookId ? RenderType.WEBHOOK : RenderType.NORMAL }}
        />
      )}

      {/* stickers */}
      {!isForwarded && message.stickers.size > 0 && <Stickers stickers={message.stickers} />}

      {/* attachments */}
      {!isForwarded && <Attachments message={message} context={context} />}

      {/* message embeds */}
      {!isForwarded && message.embeds.map((embed, id) => (
        <DiscordEmbed embed={embed} context={{ ...context, index: id, message }} key={id} />
      ))}

      {/* components */}
      {!isForwarded && message.components.length > 0 && (
        <discord-attachments slot="components">
          {message.components.map((component, id) => (
            <ComponentRow key={id} id={id} component={component} context={context} />
          ))}
        </discord-attachments>
      )}

      {/* reactions */}
      {!isForwarded && message.reactions.cache.size > 0 && (
        <discord-reactions slot="reactions">
          {message.reactions.cache.map((reaction, id) => (
            <discord-reaction
              key={`${message.id}r${id}`}
              name={reaction.emoji.name!}
              emoji={parseDiscordEmoji(reaction.emoji)}
              count={reaction.count}
            />
          ))}
        </discord-reactions>
      )}

      {/* threads */}
      {!isForwarded && message.hasThread && message.thread && (
        <discord-thread
          slot="thread"
          name={message.thread.name}
          cta={
            message.thread.messageCount
              ? `${message.thread.messageCount} Message${message.thread.messageCount > 1 ? 's' : ''}`
              : 'View Thread'
          }
        >
          {message.thread.lastMessage ? (
            <discord-thread-message profile={message.thread.lastMessage.author.id}>
              <MessageContent
                content={
                  message.thread.lastMessage.content.length > 128
                    ? message.thread.lastMessage.content.substring(0, 125) + '...'
                    : message.thread.lastMessage.content
                }
                context={{ ...context, type: RenderType.REPLY }}
              />
            </discord-thread-message>
          ) : (
            `Thread messages not saved.`
          )}
        </discord-thread>
      )}
    </discord-message>
  );
}

function stripForwardedAuthorPrefix(content: string) {
  return content.replace(/^\s*\*\*[^*]+\*\*:\s*/, '');
}

function getForwardedMessage(message: MessageType, transcriptMessages: MessageType[]) {
  const messageId = message.reference?.messageId;

  if (messageId && message.messageSnapshots.has(messageId)) {
    return (message.messageSnapshots.get(messageId) ?? null) as MessageType | null;
  }

  if (messageId) {
    const inTranscript = transcriptMessages.find((transcriptMessage) => transcriptMessage.id === messageId);
    if (inTranscript) {
      return inTranscript;
    }
  }

  return (message.messageSnapshots.first() ?? null) as MessageType | null;
}

function getRawForwardedSnapshot(message: MessageType): RawForwardedSnapshot | null {
  const rawMessage = message.toJSON() as {
    messageSnapshots?: Array<{
      message?: RawForwardedSnapshot;
    }>;
    message_snapshots?: Array<{
      message?: RawForwardedSnapshot;
    }>;
  };

  const snapshots = rawMessage.messageSnapshots ?? rawMessage.message_snapshots;
  const snapshot = (snapshots?.[0]?.message ?? snapshots?.[0]) as RawForwardedSnapshot | undefined;
  if (!snapshot) {
    return null;
  }

  return {
    content: typeof snapshot.content === 'string' ? snapshot.content : undefined,
    attachments: Array.isArray(snapshot.attachments) ? snapshot.attachments : [],
    embeds: Array.isArray(snapshot.embeds) ? snapshot.embeds : [],
    components: Array.isArray(snapshot.components) ? snapshot.components : [],
    stickers: Array.isArray(snapshot.stickers) ? snapshot.stickers : [],
    stickerItems: Array.isArray((snapshot as { sticker_items?: Array<RawStickerData> }).sticker_items)
      ? (snapshot as { sticker_items: Array<RawStickerData> }).sticker_items
      : [],
  };
}

type RawForwardedSnapshot = {
  content?: string;
  attachments: Array<{ url?: string; filename?: string }>;
  embeds: Array<{ title?: string; description?: string; url?: string }>;
  components: Array<unknown>;
  stickers: Array<RawStickerData>;
  stickerItems: Array<RawStickerData>;
  sticker_items?: Array<RawStickerData>;
};

function RawForwardedMessageBody({
  snapshot,
  fallbackContent,
  context,
}: {
  snapshot: RawForwardedSnapshot;
  fallbackContent: string;
  context: RenderMessageContext;
}) {
  const normalizedContent = snapshot.content ? stripForwardedAuthorPrefix(snapshot.content) : fallbackContent;
  const hasAnyPayload =
    Boolean(normalizedContent) ||
    snapshot.attachments.length > 0 ||
    snapshot.embeds.length > 0 ||
    snapshot.components.length > 0 ||
    snapshot.stickers.length > 0 ||
    snapshot.stickerItems.length > 0;

  return (
    <>
      {normalizedContent ? <span>{normalizedContent}</span> : null}

      {snapshot.attachments.map((attachment, id) => (
        <div key={`forwarded-attachment-${id}`}>
          <a href={attachment.url} target="_blank" rel="noreferrer">
            {attachment.filename || attachment.url || 'Attachment'}
          </a>
        </div>
      ))}

      {snapshot.embeds.map((embed, id) => (
        <div key={`forwarded-embed-${id}`} style={{ color: '#b5bac1' }}>
          {embed.title ? <strong>{embed.title}</strong> : null}
          {embed.description ? <div>{embed.description}</div> : null}
          {embed.url ? (
            <a href={embed.url} target="_blank" rel="noreferrer">
              {embed.url}
            </a>
          ) : null}
        </div>
      ))}

      {snapshot.components.map((component, id) => (
        <ComponentRow key={`forwarded-component-${id}`} id={id} component={component as never} context={context} />
      ))}

      <RawStickers stickers={[...snapshot.stickers, ...snapshot.stickerItems]} />

      {!hasAnyPayload && <em style={{ color: '#949ba4' }}>Forwarded message content unavailable.</em>}
    </>
  );
}

function Stickers({ stickers }: { stickers: MessageType['stickers'] }) {
  if (stickers.size === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
      {Array.from(stickers.values()).map((sticker) => (
        <div key={sticker.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <img
            src={sticker.url}
            alt={sticker.name}
            style={{ maxWidth: '160px', width: '100%', height: 'auto', borderRadius: '8px' }}
          />
          <div style={{ color: '#b5bac1', fontSize: '12px' }}>{sticker.name}</div>
        </div>
      ))}
    </div>
  );
}

function RawStickers({ stickers }: { stickers: RawStickerData[] }) {
  const visibleStickers = stickers.filter((sticker) => sticker && (sticker.name || sticker.url));
  if (visibleStickers.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
      {visibleStickers.map((sticker, id) => (
        <div key={`raw-sticker-${id}`} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {'url' in sticker && sticker.url ? (
            <img
              src={sticker.url}
              alt={sticker.name ?? 'Sticker'}
              style={{ maxWidth: '160px', width: '100%', height: 'auto', borderRadius: '8px' }}
            />
          ) : null}
          <div style={{ color: '#b5bac1', fontSize: '12px' }}>{sticker.name ?? 'Unnamed sticker'}</div>
        </div>
      ))}
    </div>
  );
}

type RawStickerData = {
  id?: string;
  name?: string;
  url?: string;
};
