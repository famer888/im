import { createHash, enumMsgType } from "@/utils/base";

export function createFifoConcurrencyQueue(concurrency = 3) {
  let active = 0;
  const waiting = [];
  return {
    acquire() {
      return new Promise((resolve) => {
        const grant = () => {
          active++;
          resolve(() => {
            active--;
            const next = waiting.shift();
            if (next) next();
          });
        };
        if (active < concurrency) {
          grant();
        } else {
          waiting.push(grant);
        }
      });
    },
  };
}

export function mediasCaptionSegmentLocalPath(chatType, info) {
  const fsPath = (info.local || "").replace(/\\/g, "/");
  const thumb = (info.localThumbUrl || "").replace(/\\/g, "/");
  const fs = info.fileSize != null ? info.fileSize : 0;
  if (chatType === enumMsgType.image) {
    return `image:${fsPath}||${thumb}||${fs}||0`;
  }
  if (chatType === enumMsgType.video) {
    return `video:${fsPath}*P${thumb}||0||${fs}||${info.width || 0}||${info.height || 0}`;
  }
  if (chatType === enumMsgType.gif) {
    return `gif:${fsPath}||${fsPath}`;
  }
  return "";
}

export function mediasCaptionSegmentRemotePath(chatType, up, info) {
  const url = up.url || up.text || "";
  const thumb = up.thumbUrl || url;
  const fs = up.fileSize != null ? up.fileSize : up.size || 0;
  if (chatType === enumMsgType.image) {
    return `image:${url}||${thumb}||${fs}||0`;
  }
  if (chatType === enumMsgType.video) {
    return `video:${url}*P${thumb}||${up.duration || 0}||${fs}||${info.width || 0}||${info.height || 0}`;
  }
  if (chatType === enumMsgType.gif) {
    return `gif:${url}||${url}`;
  }
  return "";
}

export function mediasCaptionEncodeSlot(chatType, up, info) {
  const url = up.url || up.text || "";
  const thumb = up.thumbUrl || url;
  const fs = up.fileSize != null ? up.fileSize : up.size || 0;
  if (chatType === enumMsgType.image) {
    return {
      kind: "image",
      url,
      thumbUrl: thumb,
      fileSize: fs,
      width: info.width || 0,
      height: info.height || 0,
      sizeType: 0,
    };
  }
  if (chatType === enumMsgType.video) {
    return {
      kind: "video",
      url,
      thumbUrl: up.thumbUrl || "",
      fileSize: fs,
      width: info.width || 0,
      height: info.height || 0,
      duration: up.duration || 0,
    };
  }
  if (chatType === enumMsgType.gif) {
    return {
      kind: "gif",
      url,
      thumbUrl: thumb,
      fileSize: fs,
      width: info.width || 0,
      height: info.height || 0,
    };
  }
  return null;
}

export async function handleMsgType17Send(ctx) {
  const {
    item,
    editInfo,
    type,
    id,
    values,
    customMsgId,
    sendTime,
    deleteSeconds,
    loginInfo,
    links,
    info,
    sendMsgList,
    eventFile,
    eventBase,
    progress,
  } = ctx;

  if (item.type !== "mediasCaption") {
    return { handled: false, sendTime };
  }

  if (editInfo) {
    return { handled: true, shouldContinue: true, sendTime: sendTime + 1 };
  }
  if (type !== "channel") {
    return { handled: true, shouldBreak: true, sendTime };
  }

  const files = item.files || [];
  const caption = (values && values.caption) || "";
  if (files.length < 2) {
    return { handled: true, shouldBreak: true, sendTime };
  }

  const preparedSlots = [];
  for (const f of files) {
    const got = await eventFile.fnFileInfosGet({ file: f, id, type });
    if (!got) {
      return { handled: true, shouldBreak: true, sendTime };
    }
    preparedSlots.push({
      file: f,
      fileThumb: got.fileThumb,
      info: got.info,
    });
  }

  const localSegments = preparedSlots
    .map((p) => mediasCaptionSegmentLocalPath(p.info.chatType, p.info))
    .filter(Boolean);
  let previewContent = localSegments.join("|||");
  if (caption) {
    previewContent += "##caption##" + caption;
  }

  const slotLocalFields = {};
  preparedSlots.forEach((p, i) => {
    slotLocalFields[`local_${i}`] = p.info.local;
    if (p.info.localThumbUrl) {
      slotLocalFields[`thumb_${i}`] = p.info.localThumbUrl;
    }
  });

  const dataDbMedias = {
    ...values,
    MsgID: customMsgId,
    sendTime: sendTime.toString(),
    readStatus: -1,
    ToUserID: null,
    UserID: loginInfo.id,
    groupId: null,
    sendUid: loginInfo.id,
    customMsgId,
    deleteSeconds,
    atUsers: values.atUsers,
    mute: info.mute,
    channelId: id,
    links,
    chatType: enumMsgType.mediasCaption,
    msgType: enumMsgType.mediasCaption,
    content: previewContent,
    caption,
    ...slotLocalFields,
  };

  eventBase.fnCommunicationSendMsg({
    operator: "msgNew",
    data: {
      ...values,
      id,
      type,
      time: sendTime,
      sendTime,
      isSelf: true,
      readStatus: -1,
      customMsgId,
      deleteSeconds,
      mute: info.mute,
      links,
      chatType: enumMsgType.mediasCaption,
      msgType: enumMsgType.mediasCaption,
      content: previewContent,
      caption,
      ...slotLocalFields,
    },
  });

  eventBase.fnCommunicationSendMsg({
    operator: "chatMsgListToBottom",
    data: { id, type },
  });

  const uploadQueue = createFifoConcurrencyQueue(3);
  const uploadResults = new Array(preparedSlots.length);
  const sharedMediasCaptionFileKey = createHash(16, 10);

  await Promise.all(
    preparedSlots.map((slot, idx) =>
      (async () => {
        const release = await uploadQueue.acquire();
        try {
          const ct = slot.info.chatType;
          progress.init({
            chatType: ct,
            customMsgId,
            mediaSlotIndex: idx,
          });
          const up = await eventFile.fnFileUploadInfoGet({
            id,
            type,
            file: slot.file,
            fileThumb: slot.fileThumb,
            sharedFileKey: sharedMediasCaptionFileKey,
            params: {
              chatType: ct,
              width: slot.info.width,
              height: slot.info.height,
              taskId: `${ct}-${customMsgId}-${idx}`,
            },
          });
          uploadResults[idx] = up;
          progress.complete({
            chatType: ct,
            customMsgId,
            mediaSlotIndex: idx,
          });
        } finally {
          release();
        }
      })()
    )
  );

  if (uploadResults.some((u) => !u)) {
    return { handled: true, shouldBreak: true, sendTime };
  }

  const remoteSegments = preparedSlots.map((p, i) =>
    mediasCaptionSegmentRemotePath(p.info.chatType, uploadResults[i], p.info)
  );
  let finalContent = remoteSegments.join("|||");
  if (caption) {
    finalContent += "##caption##" + caption;
  }

  const mediasCaptionSlots = preparedSlots
    .map((p, i) => mediasCaptionEncodeSlot(p.info.chatType, uploadResults[i], p.info))
    .filter(Boolean);

  const firstUp = uploadResults[0];
  const saveFileInfo = {
    content: finalContent,
    caption,
    channelAttachmentKey: firstUp.channelAttachmentKey,
    text: caption || firstUp.url || firstUp.text,
    url: firstUp.url || firstUp.text,
    fileKey: firstUp.fileKey,
    percent: 100 + Number(Math.random().toFixed(6)),
  };

  eventBase.fnCommunicationSendMsg({
    operator: "msgListPropertyUpdate",
    data: {
      id,
      type,
      list: [
        {
          customMsgId,
          updated: saveFileInfo,
        },
      ],
    },
  });

  eventBase.fnMsgAddToDB({ ...dataDbMedias, ...saveFileInfo }, null);

  sendMsgList.push({
    params: {
      ...values,
      sendTime,
      sendUser: {
        nickName: loginInfo.name,
        pic: loginInfo.icon,
        uid: loginInfo.id,
      },
      links,
      chatType: enumMsgType.mediasCaption,
      msgType: enumMsgType.mediasCaption,
      text: caption || firstUp.url || firstUp.text || " ",
      mediasCaptionCaption: caption,
      mediasCaptionSlots,
      channelId: id,
      atUids: values.atUids,
      atUsers: values.atUsers || [],
    },
    isFile: false,
    customMsgId,
    fileInfos: {
      channelAttachmentKey: firstUp.channelAttachmentKey,
      text: caption || firstUp.url || firstUp.text,
      url: firstUp.url || firstUp.text,
      fileKey: firstUp.fileKey,
    },
    sendTime,
  });

  return { handled: true, shouldContinue: true, sendTime: sendTime + 1 };
}
