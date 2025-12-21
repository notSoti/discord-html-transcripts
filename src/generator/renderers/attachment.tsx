import {
  DiscordImageAttachment,
  DiscordFileAttachment,
  DiscordAttachments,
  DiscordAudioAttachment,
} from '@skyra/discord-components-react';
import React from 'react';
import type { APIAttachment, APIMessage, Attachment as AttachmentType, Message } from 'discord.js';
import type { RenderMessageContext } from '..';
import { AttachmentTypes } from '../../types';
import { formatBytes } from '../../utils/utils';

/**
 * Renders all attachments for a message
 * @param message
 * @param context
 * @returns
 */
export async function Attachments(props: { message: Message; context: RenderMessageContext }) {
  if (props.message.attachments.size === 0) return <></>;

  return (
    <DiscordAttachments slot="attachments">
      {props.message.attachments.map((attachment, id) => (
        <Attachment attachment={attachment} message={props.message} context={props.context} key={id} />
      ))}
    </DiscordAttachments>
  );
}

/**
 * Renders one Discord Attachment
 * @param props - the attachment and rendering context
 */
export async function Attachment({
  attachment,
  context,
  message,
}: {
  attachment: AttachmentType;
  context: RenderMessageContext;
  message: Message;
}) {
  let url = attachment.url;
  const name = attachment.name;
  const attachmentType = getAttachmentType(attachment);
  const [bytes, bytesUnit] = formatBytes(attachment.size);

  // if the attachment is an image, download it to a data url
  switch (attachmentType) {
    case AttachmentTypes.Image:
    case AttachmentTypes.Video: {
      const width = attachment.width;
      const height = attachment.height;

      if (attachmentType === AttachmentTypes.Image) {
        const downloaded = await context.callbacks.resolveImageSrc(
          attachment.toJSON() as APIAttachment,
          message.toJSON() as APIMessage
        );

        if (downloaded !== null) {
          url = downloaded ?? url;
        }
      }

      return (
        <DiscordImageAttachment
          key={attachment.id}
          slot="attachment"
          url={url}
          alt={name ?? undefined}
          width={width ?? undefined}
          height={height ?? undefined}
        />
      );
    }

    case AttachmentTypes.Audio: {
      return <DiscordAudioAttachment key={attachment.id} href={url} bytes={bytes} bytesUnit={bytesUnit} />;
    }

    case AttachmentTypes.File: {
      return <DiscordFileAttachment key={attachment.id} href={url} bytes={bytes} bytesUnit={bytesUnit} />;
    }
  }
}

/**
 * Parses the attachment content type.
 * @param attachment Discord.js attachment object
 * @returns
 */
function getAttachmentType(attachment: AttachmentType): AttachmentTypes {
  switch (attachment.contentType?.split('/')?.[0]) {
    case 'audio':
      return AttachmentTypes.Audio;
    case 'image':
      return AttachmentTypes.Image;
    case 'video':
      return AttachmentTypes.Video;

    case undefined:
    default:
      return AttachmentTypes.File;
  }
}
