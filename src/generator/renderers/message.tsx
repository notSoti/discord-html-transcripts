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
  const forwardedMessage = isForwarded ? getForwardedMessage(message) : null;
  const forwardedContent = forwardedMessage
    ? stripForwardedAuthorPrefix(forwardedMessage.content)
    : isForwarded
      ? stripForwardedAuthorPrefix(message.content)
      : message.content;

  return (
    <discord-message
      id={`m-${message.id}`}
      timestamp={message.createdAt}
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
              <ForwardedMessageBody message={forwardedMessage} context={context} fallbackContent={forwardedContent} />
            </discord-quote>
          ) : forwardedContent ? (
            <discord-quote>
              <MessageContent
                content={forwardedContent}
                context={{ ...context, type: message.webhookId ? RenderType.WEBHOOK : RenderType.NORMAL }}
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
      <Attachments message={message} context={context} />

      {/* message embeds */}
      {message.embeds.map((embed, id) => (
        <DiscordEmbed embed={embed} context={{ ...context, index: id, message }} key={id} />
      ))}

      {/* components */}
      {message.components.length > 0 && (
        <discord-attachments slot="components">
          {message.components.map((component, id) => (
            <ComponentRow key={id} id={id} component={component} context={context} />
          ))}
        </discord-attachments>
      )}

      {/* reactions */}
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

      {/* threads */}
      {message.hasThread && message.thread && (
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

function getForwardedMessage(message: MessageType) {
  const messageId = message.reference?.messageId;

  if (messageId && message.messageSnapshots.has(messageId)) {
    return (message.messageSnapshots.get(messageId) ?? null) as MessageType | null;
  }

  return (message.messageSnapshots.first() ?? null) as MessageType | null;
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
