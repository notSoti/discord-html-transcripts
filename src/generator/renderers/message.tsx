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

  const isCrosspost = message.reference && message.reference.guildId !== message.guild?.id;
  const isForwarded = message.reference?.type === MessageReferenceType.Forward;
  const forwardedMessage = isForwarded ? getForwardedMessage(message, context.messages) : null;
  const rawForwardedSnapshot = isForwarded ? getRawForwardedSnapshot(message) : null;
  const forwardedSourceMessage = isForwarded ? (forwardedMessage ?? message) : null;
  const forwardedContent = forwardedMessage
    ? stripForwardedAuthorPrefix(forwardedMessage.content)
    : rawForwardedSnapshot?.content
      ? stripForwardedAuthorPrefix(rawForwardedSnapshot.content)
    : isForwarded
      ? stripForwardedAuthorPrefix(message.content)
      : message.content;
  const displayTimestamp = message.createdAt.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <discord-message
      id={`m-${message.id}`}
      timestamp={displayTimestamp}
      key={message.id}
      edited={message.editedAt !== null}
      server={isCrosspost ?? undefined}
      highlight={message.mentions.everyone}
      profile={message.author.id}
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
              <ForwardedMessageBody
                message={forwardedMessage}
                context={context}
                fallbackContent={forwardedContent}
              />
            </discord-quote>
          ) : rawForwardedSnapshot ? (
            <discord-quote>
              <RawForwardedMessageBody snapshot={rawForwardedSnapshot} fallbackContent={forwardedContent} />
            </discord-quote>
          ) : forwardedSourceMessage ? (
            <discord-quote>
              <ForwardedMessageBody
                message={forwardedSourceMessage}
                context={context}
                fallbackContent={forwardedContent}
              />
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
    if (inTranscript) return inTranscript;
  }

  return (message.messageSnapshots.first() ?? null) as MessageType | null;
}

function getRawForwardedSnapshot(message: MessageType): RawForwardedSnapshot | null {
  const rawMessage = message.toJSON() as {
    message_snapshots?: Array<{
      message?: {
        content?: string;
        attachments?: Array<{ url?: string; filename?: string }>;
        embeds?: Array<{ title?: string; description?: string; url?: string }>;
      };
    }>;
  };

  const snapshot = rawMessage.message_snapshots?.[0]?.message;
  if (!snapshot) return null;

  return {
    content: snapshot.content,
    attachments: Array.isArray(snapshot.attachments) ? snapshot.attachments : [],
    embeds: Array.isArray(snapshot.embeds) ? snapshot.embeds : [],
  };
}

async function ForwardedMessageBody({
  message,
  context,
  fallbackContent,
}: {
  message: MessageType;
  context: RenderMessageContext;
  fallbackContent: string;
}) {
  const hasPayload =
    Boolean(message.content || fallbackContent) ||
    message.attachments.size > 0 ||
    message.embeds.length > 0 ||
    message.components.length > 0 ||
    message.reactions.cache.size > 0;

  return (
    <>
      {message.content ? (
        <MessageContent
          content={stripForwardedAuthorPrefix(message.content) || fallbackContent}
          context={{ ...context, type: message.webhookId ? RenderType.WEBHOOK : RenderType.NORMAL }}
        />
      ) : fallbackContent ? (
        <MessageContent
          content={fallbackContent}
          context={{ ...context, type: message.webhookId ? RenderType.WEBHOOK : RenderType.NORMAL }}
        />
      ) : !hasPayload ? (
        <em style={{ color: '#949ba4' }}>Forwarded message content unavailable.</em>
      ) : null}

      <Attachments message={message} context={context} />

      {message.embeds.map((embed, id) => (
        <DiscordEmbed embed={embed} context={{ ...context, index: id, message }} key={id} />
      ))}

      {message.components.length > 0 && (
        <discord-attachments slot="components">
          {message.components.map((component, id) => (
            <ComponentRow key={id} id={id} component={component} context={context} />
          ))}
        </discord-attachments>
      )}

      {message.reactions.cache.size > 0 && (
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
    </>
  );
}

type RawForwardedSnapshot = {
  content?: string;
  attachments: Array<{ url?: string; filename?: string }>;
  embeds: Array<{ title?: string; description?: string; url?: string }>;
};

function RawForwardedMessageBody({ snapshot, fallbackContent }: { snapshot: RawForwardedSnapshot; fallbackContent: string }) {
  const normalizedContent = snapshot.content ? stripForwardedAuthorPrefix(snapshot.content) : fallbackContent;
  const hasAnyPayload = Boolean(normalizedContent) || snapshot.attachments.length > 0 || snapshot.embeds.length > 0;

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

      {!hasAnyPayload && <em style={{ color: '#949ba4' }}>Forwarded message content unavailable.</em>}
    </>
  );
}
