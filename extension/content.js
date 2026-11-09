// Missed. — WhatsApp Web Content Script Bundle (Generated from extension/content.entry.js + @missed/engine via esbuild)
(() => {
  // packages/engine/src/adapters/WhatsAppAdapter.ts
  var WA_ANDROID_MSG_REGEX = /^(\d{1,4}[-/.][\d\w]+[-/.]\d{1,4}[,\s]+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)\s*[-–—]\s*([^:]+?):\s*([\s\S]*)$/;
  var WA_ANDROID_SYS_REGEX = /^(\d{1,4}[-/.][\d\w]+[-/.]\d{1,4}[,\s]+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)\s*[-–—]\s*([^:]+)$/;
  var WA_IOS_MSG_REGEX = /^\[((?:\d{1,4}[-/.][\d\w]+[-/.]\d{1,4}[,\s]+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)|(?:\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?[,\s]+\d{1,4}[-/.][\d\w]+[-/.]\d{1,4}))\]\s*([^:]+?):\s*([\s\S]*)$/;
  var WA_IOS_SYS_REGEX = /^\[((?:\d{1,4}[-/.][\d\w]+[-/.]\d{1,4}[,\s]+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)|(?:\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?[,\s]+\d{1,4}[-/.][\d\w]+[-/.]\d{1,4}))\]\s*([^:]+)$/;
  var MEDIA_OMITTED_REGEX = /<(?:media omitted|image omitted|video omitted|audio omitted|sticker omitted|document omitted)>|(?:image|video|audio|sticker|document|voice note|contact card|location)\s+omitted/i;
  var SYSTEM_PHRASES_REGEX = /(end-to-end encrypted|created group|added|removed|left|changed the subject|changed this group's icon|security code changed|disappearing messages|pinned a message)/i;
  function detectMediaType(text) {
    const lower = text.toLowerCase();
    if (lower.includes("image omitted")) return "image";
    if (lower.includes("video omitted")) return "video";
    if (lower.includes("audio omitted") || lower.includes("voice note")) return "audio";
    if (lower.includes("sticker omitted")) return "sticker";
    if (lower.includes("document omitted")) return "document";
    if (lower.includes("contact card omitted")) return "contact";
    if (lower.includes("location:")) return "location";
    if (MEDIA_OMITTED_REGEX.test(text)) return "other";
    return void 0;
  }
  function buildWhatsAppSourceRef(sender, text) {
    const digits = sender.replace(/\D/g, "");
    const snippet = encodeURIComponent(text.slice(0, 100));
    if (digits.length >= 7) {
      return {
        senderPhone: digits,
        sourceRef: `https://wa.me/${digits}?text=${snippet}`
      };
    }
    const nameEncoded = encodeURIComponent(sender);
    return {
      sourceRef: `https://wa.me/?text=${nameEncoded}%3A%20${snippet}`
    };
  }
  var WhatsAppAdapter = class {
    id = "whatsapp";
    platform = "whatsapp";
    displayName = "WhatsApp Export";
    supportedExtensions = [".txt"];
    detect(raw, meta) {
      const reasons = [];
      let score = 0;
      const fileName = meta?.fileName?.toLowerCase() || "";
      if (fileName.includes("_chat.txt") || fileName.includes("whatsapp chat")) {
        score += 0.3;
        reasons.push('Filename matches WhatsApp export convention ("_chat.txt" or "WhatsApp Chat")');
      }
      const lines = raw.split(/\r?\n/).slice(0, 30);
      let matchedLines = 0;
      let hasEncryptedHeader = false;
      let hasMediaOmitted = false;
      let hasPhoneSender = false;
      for (const line of lines) {
        if (SYSTEM_PHRASES_REGEX.test(line)) {
          hasEncryptedHeader = true;
        }
        if (MEDIA_OMITTED_REGEX.test(line)) {
          hasMediaOmitted = true;
        }
        if (WA_ANDROID_MSG_REGEX.test(line) || WA_IOS_MSG_REGEX.test(line)) {
          matchedLines++;
          if (/\+\d{1,3}[\s-]?\(?\d{1,4}\)?/.test(line)) {
            hasPhoneSender = true;
          }
        }
      }
      if (matchedLines >= 2) {
        score += 0.85;
        reasons.push(`Found ${matchedLines} lines matching WhatsApp timestamp & sender patterns`);
      } else if (matchedLines === 1) {
        score += 0.5;
        reasons.push("Found WhatsApp message pattern match");
      }
      if (hasEncryptedHeader) {
        score += 0.1;
        reasons.push("Contains WhatsApp security or system notice phrase");
      }
      if (hasMediaOmitted) {
        score += 0.05;
        reasons.push("Contains WhatsApp media omitted marker");
      }
      if (hasPhoneSender) {
        score += 0.05;
        reasons.push("Contains international phone number sender");
      }
      const confidence = Math.min(1, Math.max(0, score));
      return {
        format: "whatsapp",
        confidence,
        formatLabel: "WhatsApp Export (.txt)",
        reasons
      };
    }
    parse(raw, meta) {
      const trimmed = raw.trim();
      if (!trimmed) {
        return {
          success: false,
          messages: [],
          format: "whatsapp",
          formatLabel: "WhatsApp Export",
          error: "Failed to parse WhatsApp export: the provided file content is empty."
        };
      }
      const lines = raw.split(/\r?\n/);
      const messages = [];
      let currentMsg = null;
      let counter = 1;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineTrimmed = line.trim();
        if (!lineTrimmed && !currentMsg) continue;
        const androidMatch = line.match(WA_ANDROID_MSG_REGEX);
        if (androidMatch) {
          if (currentMsg) messages.push(currentMsg);
          const timestamp = androidMatch[1].trim();
          const sender = androidMatch[2].trim();
          const text = androidMatch[3].trim();
          const mediaType = detectMediaType(text);
          const { sourceRef, senderPhone } = buildWhatsAppSourceRef(sender, text);
          currentMsg = {
            id: `wa-${counter++}`,
            timestamp,
            sender,
            text,
            raw: line,
            lineIndex: i,
            sourceRef,
            senderPhone,
            mediaType
          };
          continue;
        }
        const iosMatch = line.match(WA_IOS_MSG_REGEX);
        if (iosMatch) {
          if (currentMsg) messages.push(currentMsg);
          const timestamp = iosMatch[1].trim();
          const sender = iosMatch[2].trim();
          const text = iosMatch[3].trim();
          const mediaType = detectMediaType(text);
          const { sourceRef, senderPhone } = buildWhatsAppSourceRef(sender, text);
          currentMsg = {
            id: `wa-${counter++}`,
            timestamp,
            sender,
            text,
            raw: line,
            lineIndex: i,
            sourceRef,
            senderPhone,
            mediaType
          };
          continue;
        }
        const androidSysMatch = line.match(WA_ANDROID_SYS_REGEX);
        if (androidSysMatch && SYSTEM_PHRASES_REGEX.test(androidSysMatch[2])) {
          if (currentMsg) messages.push(currentMsg);
          currentMsg = {
            id: `wa-${counter++}`,
            timestamp: androidSysMatch[1].trim(),
            sender: "System",
            text: androidSysMatch[2].trim(),
            raw: line,
            lineIndex: i,
            isSystem: true
          };
          continue;
        }
        const iosSysMatch = line.match(WA_IOS_SYS_REGEX);
        if (iosSysMatch && SYSTEM_PHRASES_REGEX.test(iosSysMatch[2])) {
          if (currentMsg) messages.push(currentMsg);
          currentMsg = {
            id: `wa-${counter++}`,
            timestamp: iosSysMatch[1].trim(),
            sender: "System",
            text: iosSysMatch[2].trim(),
            raw: line,
            lineIndex: i,
            isSystem: true
          };
          continue;
        }
        if (currentMsg) {
          currentMsg.text += `
${line}`;
          currentMsg.raw += `
${line}`;
          if (!currentMsg.mediaType) {
            currentMsg.mediaType = detectMediaType(line);
          }
        }
      }
      if (currentMsg) {
        messages.push(currentMsg);
      }
      if (messages.length === 0) {
        return {
          success: false,
          messages: [],
          format: "whatsapp",
          formatLabel: "WhatsApp Export",
          error: 'Failed to parse WhatsApp export: No valid messages found. Expected timestamped lines such as "DD/MM/YY, HH:MM - Sender: text" or "[DD/MM/YY, HH:MM:SS] Sender: text".'
        };
      }
      const participants = Array.from(
        new Set(
          messages.filter((m) => !m.isSystem && m.sender !== "System").map((m) => m.sender)
        )
      );
      const firstTs = messages.find((m) => m.timestamp)?.timestamp;
      const lastTs = [...messages].reverse().find((m) => m.timestamp)?.timestamp;
      const conversation = {
        title: meta?.fileName ? meta.fileName.replace(/\.txt$/i, "") : "WhatsApp Chat",
        platform: "whatsapp",
        formatLabel: "WhatsApp Export (.txt)",
        messages,
        participants,
        dateRange: {
          start: firstTs,
          end: lastTs
        },
        totalMessages: messages.length,
        metadata: {
          hasSystemNotices: messages.some((m) => m.isSystem),
          hasMediaOmitted: messages.some((m) => Boolean(m.mediaType))
        }
      };
      return {
        success: true,
        conversation,
        messages,
        format: "whatsapp",
        formatLabel: "WhatsApp Export (.txt)"
      };
    }
  };

  // packages/engine/src/adapters/TelegramAdapter.ts
  function flattenTelegramText(text) {
    if (typeof text === "string") return text;
    if (Array.isArray(text)) {
      return text.map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          return String(part.text);
        }
        return "";
      }).join("");
    }
    return "";
  }
  var TelegramAdapter = class {
    id = "telegram";
    platform = "telegram";
    displayName = "Telegram Desktop Export";
    supportedExtensions = [".json"];
    detect(raw, _meta) {
      const reasons = [];
      const trimmed = raw.trim();
      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        try {
          const parsed = JSON.parse(trimmed);
          const validChatTypes = [
            "saved_messages",
            "personal_chat",
            "private_group",
            "public_supergroup",
            "private_supergroup",
            "public_channel",
            "private_channel"
          ];
          const hasTelegramType = typeof parsed.type === "string" && validChatTypes.includes(parsed.type);
          if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
            const sample = parsed.messages.slice(0, 5);
            const hasTgFields = sample.some(
              (m) => "date_unixtime" in m || "from_id" in m || "reply_to_message_id" in m || m.type === "service"
            );
            if (hasTelegramType || hasTgFields) {
              reasons.push("Contains Telegram Desktop export schema (type, messages with date_unixtime/from_id)");
              return {
                format: "telegram",
                confidence: 0.99,
                formatLabel: "Telegram Desktop Export (.json)",
                reasons
              };
            }
          }
        } catch {
        }
      }
      return {
        format: "telegram",
        confidence: 0,
        formatLabel: "Telegram Desktop Export",
        reasons: ["No Telegram markers found"]
      };
    }
    parse(raw, meta) {
      const trimmed = raw.trim();
      if (!trimmed) {
        return {
          success: false,
          messages: [],
          format: "telegram",
          formatLabel: "Telegram Desktop Export",
          error: "Failed to parse Telegram export: the JSON file is empty."
        };
      }
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (err) {
        return {
          success: false,
          messages: [],
          format: "telegram",
          formatLabel: "Telegram Desktop Export",
          error: `Failed to parse Telegram JSON export: Malformed JSON syntax (${err.message}).`
        };
      }
      if (!Array.isArray(parsed.messages) || parsed.messages.length === 0) {
        return {
          success: false,
          messages: [],
          format: "telegram",
          formatLabel: "Telegram Desktop Export",
          error: 'Failed to parse Telegram JSON export: Missing or empty "messages" array.'
        };
      }
      const messageTextMap = /* @__PURE__ */ new Map();
      for (const item of parsed.messages) {
        const text = flattenTelegramText(item.text).trim();
        if (text) {
          messageTextMap.set(String(item.id), text);
        }
      }
      const messages = [];
      let counter = 1;
      for (let i = 0; i < parsed.messages.length; i++) {
        const item = parsed.messages[i];
        const isService = item.type === "service";
        const sender = isService ? item.actor || "System" : item.from || "Unknown";
        let text = flattenTelegramText(item.text).trim();
        if (isService && !text && item.action) {
          text = `[Service: ${item.action}]`;
        }
        let mediaType;
        if (item.photo) {
          mediaType = "image";
          if (!text) text = "[Photo attachment]";
        } else if (item.media_type === "video_file" || item.media_type === "animation") {
          mediaType = "video";
          if (!text) text = "[Video attachment]";
        } else if (item.media_type === "audio_file" || item.media_type === "voice_message") {
          mediaType = "audio";
          if (!text) text = "[Voice message]";
        } else if (item.media_type === "sticker") {
          mediaType = "sticker";
          if (!text) text = "[Sticker]";
        } else if (item.file) {
          mediaType = "document";
          if (!text) text = "[File attachment]";
        }
        if (!text) {
          continue;
        }
        let timestamp = item.date;
        if (item.date_unixtime) {
          const unixSec = typeof item.date_unixtime === "number" ? item.date_unixtime : parseInt(item.date_unixtime, 10);
          if (!isNaN(unixSec)) {
            timestamp = new Date(unixSec * 1e3).toISOString().replace("T", " ").substring(0, 19);
          }
        }
        const sourceRef = `ref:tg:${item.id}`;
        let replyToMessageId;
        let replyToSnippet;
        if (item.reply_to_message_id) {
          replyToMessageId = String(item.reply_to_message_id);
          const originalText = messageTextMap.get(replyToMessageId);
          if (originalText) {
            replyToSnippet = originalText.slice(0, 100);
          }
        }
        messages.push({
          id: `tg-${item.id ?? counter++}`,
          sender,
          timestamp,
          text,
          raw: JSON.stringify(item),
          lineIndex: i,
          sourceRef,
          replyToMessageId,
          replyToSnippet,
          mediaType,
          isSystem: isService
        });
      }
      if (messages.length === 0) {
        return {
          success: false,
          messages: [],
          format: "telegram",
          formatLabel: "Telegram Desktop Export",
          error: "Failed to parse Telegram JSON export: No valid messages found."
        };
      }
      const participants = Array.from(
        new Set(
          messages.filter((m) => !m.isSystem && m.sender !== "System").map((m) => m.sender)
        )
      );
      const title = parsed.name || meta?.fileName?.replace(/\.json$/i, "") || "Telegram Chat";
      const conversation = {
        title,
        platform: "telegram",
        formatLabel: "Telegram Desktop Export (.json)",
        messages,
        participants,
        dateRange: {
          start: messages[0]?.timestamp,
          end: messages[messages.length - 1]?.timestamp
        },
        totalMessages: messages.length,
        metadata: {
          chatId: parsed.id,
          chatType: parsed.type
        }
      };
      return {
        success: true,
        conversation,
        messages,
        format: "telegram",
        formatLabel: "Telegram Desktop Export (.json)"
      };
    }
  };

  // packages/engine/src/adapters/FacebookMessengerAdapter.ts
  function decodeMetaMojibake(str) {
    if (!str) return "";
    try {
      const g = globalThis;
      if (typeof g.Buffer !== "undefined") {
        return g.Buffer.from(str, "latin1").toString("utf8");
      }
      if (typeof g.TextDecoder !== "undefined") {
        const bytes = new Uint8Array([...str].map((char) => char.charCodeAt(0) & 255));
        return new g.TextDecoder("utf-8").decode(bytes);
      }
      return str;
    } catch {
      return str;
    }
  }
  var FacebookMessengerAdapter = class {
    id = "facebook_messenger";
    platform = "facebook_messenger";
    displayName = "Facebook Messenger Export";
    supportedExtensions = [".json", ".html", ".htm"];
    detect(raw, meta) {
      const reasons = [];
      let score = 0;
      const lowerName = meta?.fileName?.toLowerCase() || "";
      if (lowerName.endsWith(".html") || lowerName.endsWith(".htm") || raw.includes("<!DOCTYPE html")) {
        if (raw.includes("_3-96 _2pio") || raw.includes("_3-96 _2let") || raw.includes("_3-94 _2lem")) {
          score = 0.98;
          reasons.push("HTML structure contains standard Facebook Messenger CSS export classes (_3-96, _2pio, _2let)");
          return {
            format: "facebook_messenger",
            confidence: score,
            formatLabel: "Facebook Messenger HTML Dump",
            reasons
          };
        }
      }
      const trimmed = raw.trim();
      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
            const first = parsed.messages[0];
            if (first && "sender_name" in first && "timestamp_ms" in first) {
              score = 0.99;
              reasons.push('JSON contains Meta export fields "messages[].sender_name" and "messages[].timestamp_ms"');
              if (Array.isArray(parsed.participants)) {
                reasons.push('JSON contains Meta "participants" array');
              }
              return {
                format: "facebook_messenger",
                confidence: score,
                formatLabel: "Facebook Messenger JSON Export",
                reasons
              };
            }
          }
        } catch {
        }
      }
      return {
        format: "facebook_messenger",
        confidence: 0,
        formatLabel: "Facebook Messenger Export",
        reasons: ["No Facebook Messenger markers found"]
      };
    }
    parse(raw, meta) {
      const trimmed = raw.trim();
      if (!trimmed) {
        return {
          success: false,
          messages: [],
          format: "facebook_messenger",
          formatLabel: "Facebook Messenger Export",
          error: "Failed to parse Facebook Messenger export: file is empty."
        };
      }
      if (trimmed.startsWith("<") || meta?.fileName && /\.html?$/i.test(meta.fileName)) {
        return this.parseHtml(raw, meta);
      }
      return this.parseJson(raw, meta);
    }
    parseJson(raw, meta) {
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (err) {
        return {
          success: false,
          messages: [],
          format: "facebook_messenger",
          formatLabel: "Facebook Messenger JSON Export",
          error: `Failed to parse Facebook Messenger JSON export: Malformed JSON syntax (${err.message}).`
        };
      }
      if (!Array.isArray(parsed.messages) || parsed.messages.length === 0) {
        return {
          success: false,
          messages: [],
          format: "facebook_messenger",
          formatLabel: "Facebook Messenger JSON Export",
          error: 'Failed to parse Facebook Messenger JSON export: Missing or empty "messages" array.'
        };
      }
      const sortedRaw = [...parsed.messages].sort(
        (a, b) => (a.timestamp_ms || 0) - (b.timestamp_ms || 0)
      );
      const messages = [];
      let counter = 1;
      for (let i = 0; i < sortedRaw.length; i++) {
        const item = sortedRaw[i];
        const sender = decodeMetaMojibake(item.sender_name) || "Unknown";
        let text = decodeMetaMojibake(item.content);
        let mediaType;
        if (item.photos && item.photos.length > 0) {
          mediaType = "image";
          if (!text) text = `[Image attachment]`;
        } else if (item.videos && item.videos.length > 0) {
          mediaType = "video";
          if (!text) text = `[Video attachment]`;
        } else if (item.audio_files && item.audio_files.length > 0) {
          mediaType = "audio";
          if (!text) text = `[Audio attachment]`;
        } else if (item.files && item.files.length > 0) {
          mediaType = "document";
          if (!text) text = `[File attachment]`;
        } else if (item.sticker) {
          mediaType = "sticker";
          if (!text) text = `[Sticker]`;
        }
        if (!text) {
          continue;
        }
        const ts = item.timestamp_ms ? new Date(item.timestamp_ms).toISOString().replace("T", " ").substring(0, 19) : void 0;
        const sourceRef = item.timestamp_ms ? `ref:fb:${item.timestamp_ms}` : `ref:fb:idx-${counter}`;
        let replyToSnippet;
        if (item.reply_to?.content) {
          replyToSnippet = decodeMetaMojibake(item.reply_to.content);
        }
        messages.push({
          id: `fb-${counter++}`,
          sender,
          timestamp: ts,
          text,
          raw: JSON.stringify(item),
          lineIndex: i,
          sourceRef,
          replyToSnippet,
          mediaType
        });
      }
      if (messages.length === 0) {
        return {
          success: false,
          messages: [],
          format: "facebook_messenger",
          formatLabel: "Facebook Messenger JSON Export",
          error: "Failed to parse Facebook Messenger JSON export: Could not extract any readable message text."
        };
      }
      const title = decodeMetaMojibake(parsed.title) || meta?.fileName?.replace(/\.json$/i, "") || "Messenger Conversation";
      const participants = parsed.participants ? parsed.participants.map((p) => decodeMetaMojibake(p.name)).filter(Boolean) : Array.from(new Set(messages.map((m) => m.sender)));
      const conversation = {
        title,
        platform: "facebook_messenger",
        formatLabel: "Facebook Messenger JSON Export",
        messages,
        participants,
        dateRange: {
          start: messages[0]?.timestamp,
          end: messages[messages.length - 1]?.timestamp
        },
        totalMessages: messages.length
      };
      return {
        success: true,
        conversation,
        messages,
        format: "facebook_messenger",
        formatLabel: "Facebook Messenger JSON Export"
      };
    }
    parseHtml(raw, meta) {
      const messageBlockRegex = /<div class="[^"]*_3-96 _2pio[^"]*">([^<]+)<\/div>[\s\S]*?<div class="[^"]*_3-96 _2let[^"]*">([\s\S]*?)<\/div>[\s\S]*?<div class="[^"]*_3-94 _2lem[^"]*">([^<]+)<\/div>/g;
      const messages = [];
      let counter = 1;
      let match;
      while ((match = messageBlockRegex.exec(raw)) !== null) {
        const sender = match[1].trim();
        const rawText = match[2].replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').trim();
        const timestamp = match[3].trim();
        if (!rawText) continue;
        messages.push({
          id: `fb-html-${counter++}`,
          sender,
          timestamp,
          text: rawText,
          raw: match[0],
          lineIndex: counter - 1,
          sourceRef: `ref:fb:html-${counter - 1}`
        });
      }
      if (messages.length === 0) {
        return {
          success: false,
          messages: [],
          format: "facebook_messenger",
          formatLabel: "Facebook Messenger HTML Dump",
          error: "Failed to parse Facebook Messenger HTML dump: Could not locate messages matching Meta HTML classes."
        };
      }
      const participants = Array.from(new Set(messages.map((m) => m.sender)));
      const conversation = {
        title: meta?.fileName?.replace(/\.html?$/i, "") || "Messenger Conversation",
        platform: "facebook_messenger",
        formatLabel: "Facebook Messenger HTML Dump",
        messages,
        participants,
        dateRange: {
          start: messages[0]?.timestamp,
          end: messages[messages.length - 1]?.timestamp
        },
        totalMessages: messages.length
      };
      return {
        success: true,
        conversation,
        messages,
        format: "facebook_messenger",
        formatLabel: "Facebook Messenger HTML Dump"
      };
    }
  };

  // packages/engine/src/adapters/SlackJsonAdapter.ts
  var SlackJsonAdapter = class {
    id = "slack";
    platform = "slack";
    displayName = "Slack JSON Export";
    supportedExtensions = [".json"];
    detect(raw, _meta) {
      const reasons = [];
      const trimmed = raw.trim();
      if (trimmed.startsWith("[") && trimmed.endsWith("]") || trimmed.startsWith("{") && trimmed.endsWith("}")) {
        try {
          const parsed = JSON.parse(trimmed);
          const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.messages) ? parsed.messages : null;
          if (list && list.length > 0) {
            const sample = list.slice(0, 5);
            const hasSlackTs = sample.some(
              (m) => typeof m === "object" && m !== null && "ts" in m && /^\d+\.\d+$/.test(String(m.ts))
            );
            const hasSlackFields = sample.some(
              (m) => typeof m === "object" && m !== null && ("client_msg_id" in m || "user_profile" in m || "thread_ts" in m)
            );
            if (hasSlackTs) {
              reasons.push('Contains Slack microsecond epoch timestamp signature ("ts": "17... . ...")');
              if (hasSlackFields) {
                reasons.push('Contains Slack message structure ("client_msg_id", "user_profile", or "thread_ts")');
              }
              return {
                format: "slack",
                confidence: hasSlackFields ? 0.98 : 0.85,
                formatLabel: "Slack JSON Export",
                reasons
              };
            }
          }
        } catch {
        }
      }
      return {
        format: "slack",
        confidence: 0,
        formatLabel: "Slack JSON Export",
        reasons: ["No Slack JSON markers found"]
      };
    }
    parse(raw, meta) {
      const trimmed = raw.trim();
      if (!trimmed) {
        return {
          success: false,
          messages: [],
          format: "slack",
          formatLabel: "Slack JSON Export",
          error: "Failed to parse Slack JSON export: file is empty."
        };
      }
      let parsed;
      try {
        parsed = JSON.parse(trimmed);
      } catch (err) {
        return {
          success: false,
          messages: [],
          format: "slack",
          formatLabel: "Slack JSON Export",
          error: `Failed to parse Slack JSON export: Malformed JSON (${err.message}).`
        };
      }
      let rawList = [];
      if (Array.isArray(parsed)) {
        rawList = parsed;
      } else if (typeof parsed === "object" && parsed !== null && Array.isArray(parsed.messages)) {
        rawList = parsed.messages;
      } else {
        return {
          success: false,
          messages: [],
          format: "slack",
          formatLabel: "Slack JSON Export",
          error: 'Failed to parse Slack JSON export: Expected an array of messages or an object with a "messages" array.'
        };
      }
      const messages = [];
      let counter = 1;
      for (let i = 0; i < rawList.length; i++) {
        const item = rawList[i];
        if (!item || typeof item !== "object") continue;
        const sender = item.user_profile?.real_name || item.user_profile?.display_name || item.user_profile?.name || item.user || "Unknown";
        const text = (item.text || "").trim();
        if (!text) continue;
        let timestamp;
        if (item.ts) {
          const num = parseFloat(item.ts);
          if (!isNaN(num)) {
            timestamp = new Date(num * 1e3).toISOString().replace("T", " ").substring(0, 19);
          }
        }
        const sourceRef = item.ts ? `ref:slack:${item.ts}` : `ref:slack:${counter}`;
        messages.push({
          id: item.client_msg_id || (item.ts ? `slack-${item.ts}` : `slack-${counter++}`),
          sender,
          timestamp,
          text,
          raw: JSON.stringify(item),
          lineIndex: i,
          sourceRef,
          replyToMessageId: item.thread_ts && item.thread_ts !== item.ts ? `slack-${item.thread_ts}` : void 0
        });
      }
      if (messages.length === 0) {
        return {
          success: false,
          messages: [],
          format: "slack",
          formatLabel: "Slack JSON Export",
          error: "Failed to parse Slack JSON export: No valid messages extracted."
        };
      }
      const participants = Array.from(new Set(messages.map((m) => m.sender)));
      const conversation = {
        title: meta?.fileName?.replace(/\.json$/i, "") || "Slack Export",
        platform: "slack",
        formatLabel: "Slack JSON Export",
        messages,
        participants,
        dateRange: {
          start: messages[0]?.timestamp,
          end: messages[messages.length - 1]?.timestamp
        },
        totalMessages: messages.length
      };
      return {
        success: true,
        conversation,
        messages,
        format: "slack",
        formatLabel: "Slack JSON Export"
      };
    }
  };

  // packages/engine/src/adapters/StandardChatAdapter.ts
  var BRACKETED_REGEX = /^\[([^\]]+)\]\s*([^:]+):\s*(.*)$/;
  var SIMPLE_COLON_REGEX = /^([A-Za-z0-9_][A-Za-z0-9_\s.()'-]{0,35}):\s+(.*)$/;
  var StandardChatAdapter = class {
    id = "standard_chat";
    platform = "standard_txt";
    displayName = "Standard Chat Format";
    supportedExtensions = [".txt", ".log", ".csv", ".json"];
    detect(raw, _meta) {
      const reasons = [];
      const trimmed = raw.trim();
      if (trimmed.startsWith("[") && trimmed.endsWith("]") || trimmed.startsWith("{") && trimmed.endsWith("}")) {
        try {
          const parsed = JSON.parse(trimmed);
          const list = Array.isArray(parsed) ? parsed : parsed.messages;
          if (Array.isArray(list) && list.length > 0) {
            const sample = list[0];
            if (sample && (sample.sender || sample.text || sample.message)) {
              reasons.push("Contains generic JSON message list");
              return {
                format: "standard_json",
                confidence: 0.75,
                formatLabel: "Standard JSON Chat",
                reasons
              };
            }
          }
        } catch {
        }
      }
      const lines = raw.split(/\r?\n/).slice(0, 20);
      let bracketedMatches = 0;
      let colonMatches = 0;
      for (const line of lines) {
        if (BRACKETED_REGEX.test(line)) {
          bracketedMatches++;
        } else if (SIMPLE_COLON_REGEX.test(line)) {
          colonMatches++;
        }
      }
      if (bracketedMatches >= 2) {
        reasons.push(`Found ${bracketedMatches} lines matching [timestamp] Sender: text`);
        return {
          format: "standard_txt",
          confidence: 0.7,
          formatLabel: "Standard Bracketed Text Export",
          reasons
        };
      }
      if (colonMatches >= 2) {
        reasons.push(`Found ${colonMatches} lines matching "Sender: text" format`);
        return {
          format: "standard_txt",
          confidence: 0.6,
          formatLabel: "Standard Plaintext Transcript",
          reasons
        };
      }
      return {
        format: "unknown",
        confidence: 0.1,
        formatLabel: "Unrecognized Text/JSON",
        reasons: ["No standard patterns strongly matched"]
      };
    }
    parse(raw, meta) {
      const trimmed = raw.trim();
      if (!trimmed) {
        return {
          success: false,
          messages: [],
          format: "standard_txt",
          formatLabel: "Standard Chat Format",
          error: "Failed to parse chat export: Provided file is empty."
        };
      }
      if (trimmed.startsWith("[") && trimmed.endsWith("]") || trimmed.startsWith("{") && trimmed.endsWith("}")) {
        return this.parseJson(raw, meta);
      }
      return this.parseTxt(raw, meta);
    }
    parseJson(raw, meta) {
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (err) {
        return {
          success: false,
          messages: [],
          format: "standard_json",
          formatLabel: "Standard JSON Chat",
          error: `Failed to parse JSON chat: Malformed JSON (${err.message}).`
        };
      }
      let rawList = [];
      if (Array.isArray(parsed)) {
        rawList = parsed;
      } else if (typeof parsed === "object" && parsed !== null && Array.isArray(parsed.messages)) {
        rawList = parsed.messages;
      } else {
        return {
          success: false,
          messages: [],
          format: "standard_json",
          formatLabel: "Standard JSON Chat",
          error: 'Invalid JSON format: Expected array of messages or object with "messages" array.'
        };
      }
      const messages = [];
      for (let i = 0; i < rawList.length; i++) {
        const item = rawList[i];
        if (!item || typeof item !== "object") continue;
        const sender = String(item.sender || item.author || item.user || "Unknown");
        const text = String(item.text || item.message || item.content || "").trim();
        if (!text) continue;
        const id = item.id ? String(item.id) : `msg-${i + 1}`;
        const ts = item.timestamp || item.time || item.date;
        const timestamp = ts ? String(ts) : void 0;
        const sourceRef = `ref:msg:${id}`;
        messages.push({
          id,
          sender,
          timestamp,
          text,
          raw: JSON.stringify(item),
          lineIndex: i,
          sourceRef
        });
      }
      if (messages.length === 0) {
        return {
          success: false,
          messages: [],
          format: "standard_json",
          formatLabel: "Standard JSON Chat",
          error: "Could not extract valid messages from JSON chat."
        };
      }
      const participants = Array.from(new Set(messages.map((m) => m.sender)));
      const conversation = {
        title: meta?.fileName?.replace(/\.json$/i, "") || "JSON Conversation",
        platform: "standard_json",
        formatLabel: "Standard JSON Chat",
        messages,
        participants,
        dateRange: {
          start: messages[0]?.timestamp,
          end: messages[messages.length - 1]?.timestamp
        },
        totalMessages: messages.length
      };
      return {
        success: true,
        conversation,
        messages,
        format: "standard_json",
        formatLabel: "Standard JSON Chat"
      };
    }
    parseTxt(raw, meta) {
      const lines = raw.split(/\r?\n/);
      const messages = [];
      let currentMessage = null;
      let msgCounter = 1;
      let matchedRealMessage = false;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineTrimmed = line.trim();
        const bracketMatch = line.match(BRACKETED_REGEX);
        if (bracketMatch) {
          if (currentMessage) messages.push(currentMessage);
          matchedRealMessage = true;
          const id = `txt-${msgCounter++}`;
          currentMessage = {
            id,
            timestamp: bracketMatch[1].trim(),
            sender: bracketMatch[2].trim(),
            text: bracketMatch[3].trim(),
            raw: line,
            lineIndex: i,
            sourceRef: `ref:msg:${id}`
          };
          continue;
        }
        const colonMatch = line.match(SIMPLE_COLON_REGEX);
        if (colonMatch && !colonMatch[1].toLowerCase().startsWith("http") && colonMatch[2].trim().length > 0) {
          if (currentMessage) messages.push(currentMessage);
          matchedRealMessage = true;
          const id = `txt-${msgCounter++}`;
          currentMessage = {
            id,
            sender: colonMatch[1].trim(),
            text: colonMatch[2].trim(),
            raw: line,
            lineIndex: i,
            sourceRef: `ref:msg:${id}`
          };
          continue;
        }
        if (currentMessage && lineTrimmed) {
          currentMessage.text += `
${lineTrimmed}`;
          currentMessage.raw += `
${line}`;
        } else if (!currentMessage && lineTrimmed) {
          const id = `txt-${msgCounter++}`;
          currentMessage = {
            id,
            sender: "Unknown Speaker",
            text: lineTrimmed,
            raw: line,
            lineIndex: i,
            sourceRef: `ref:msg:${id}`
          };
        }
      }
      if (currentMessage && currentMessage.text.trim()) {
        messages.push(currentMessage);
      }
      if (messages.length === 0 || !matchedRealMessage) {
        return {
          success: false,
          messages: [],
          format: "standard_txt",
          formatLabel: "Standard Text Format",
          error: 'Failed to parse text chat: No lines matched valid conversation formats (e.g. "[timestamp] Sender: message" or "Sender: message").'
        };
      }
      const participants = Array.from(new Set(messages.map((m) => m.sender)));
      const conversation = {
        title: meta?.fileName?.replace(/\.txt$/i, "") || "Chat Transcript",
        platform: "standard_txt",
        formatLabel: "Standard Text Transcript",
        messages,
        participants,
        dateRange: {
          start: messages[0]?.timestamp,
          end: messages[messages.length - 1]?.timestamp
        },
        totalMessages: messages.length
      };
      return {
        success: true,
        conversation,
        messages,
        format: "standard_txt",
        formatLabel: "Standard Text Transcript"
      };
    }
  };

  // packages/engine/src/adapters/WhatsAppWebDomAdapter.ts
  function stableStringHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36).slice(0, 8);
  }
  function normalizeWhatsAppWebBubbles(bubbles, chatTitle = "WhatsApp Web Chat") {
    const messages = [];
    let counter = 1;
    for (let i = 0; i < bubbles.length; i++) {
      const b = bubbles[i];
      const text = (b.text || "").trim();
      if (!text && !b.mediaType && !b.isSystem && !b.isMediaOmitted) {
        continue;
      }
      const sender = b.isSystem ? "System" : b.isOutgoing ? "You" : b.sender || chatTitle;
      const finalText = text || (b.mediaType === "audio" ? "<Voice note omitted>" : b.mediaType === "image" ? "<Media omitted>" : b.mediaType === "video" ? "<Video omitted>" : b.mediaType === "document" ? "<Document omitted>" : b.mediaType === "sticker" ? "<Sticker omitted>" : b.isDeleted ? "This message was deleted" : "<Media omitted>");
      const detectedMedia = b.mediaType || detectMediaType(finalText);
      const stableId = b.id || `wa-dom-${counter}-${stableStringHash(sender + ":" + (b.timestamp || "") + ":" + finalText)}`;
      const { sourceRef, senderPhone } = buildWhatsAppSourceRef(sender, finalText);
      const rawLine = b.timestamp ? `[${b.timestamp}] ${sender}: ${finalText}` : `${sender}: ${finalText}`;
      messages.push({
        id: stableId,
        sender,
        timestamp: b.timestamp,
        text: finalText,
        raw: b.prePlainText ? `${b.prePlainText} ${finalText}` : rawLine,
        lineIndex: counter - 1,
        sourceRef,
        senderPhone,
        mediaType: detectedMedia,
        isSystem: b.isSystem
      });
      counter++;
    }
    const participants = Array.from(
      new Set(
        messages.filter((m) => !m.isSystem && m.sender !== "System" && m.sender !== "You").map((m) => m.sender)
      )
    );
    const firstTs = messages.find((m) => m.timestamp)?.timestamp;
    const lastTs = [...messages].reverse().find((m) => m.timestamp)?.timestamp;
    return {
      title: chatTitle,
      platform: "whatsapp",
      formatLabel: "WhatsApp Web Live",
      messages,
      participants,
      dateRange: {
        start: firstTs,
        end: lastTs
      },
      totalMessages: messages.length,
      metadata: {
        extractedFrom: "whatsapp_web_dom",
        hasSystemNotices: messages.some((m) => m.isSystem),
        hasMediaOmitted: messages.some((m) => Boolean(m.mediaType))
      }
    };
  }
  function extractWhatsAppWebChatFromDom(root, options) {
    if (!root || typeof root.querySelector !== "function") {
      return {
        success: false,
        code: "NO_ACTIVE_CHAT",
        error: "Invalid DOM root provided for WhatsApp Web extraction.",
        messages: []
      };
    }
    const isQrScreen = root.querySelector(
      'canvas[aria-label="Scan me!"], [data-ref], [data-testid="qrcode"], ._ak96, div[data-testid="intro-title"]'
    );
    if (isQrScreen && !root.querySelector("header")) {
      return {
        success: false,
        code: "NOT_LOGGED_IN",
        error: "WhatsApp Web is not logged in. Please scan the QR code to log in first.",
        messages: []
      };
    }
    const header = root.querySelector(
      'header, [data-testid="conversation-info-header"], #main header, div[role="region"] header'
    );
    let chatTitle = void 0;
    if (header) {
      const titleEl = header.querySelector(
        'span[title], div[role="button"] span[dir="auto"], span[dir="auto"], ._ak8q'
      );
      chatTitle = titleEl?.getAttribute("title") || titleEl?.textContent?.trim();
    }
    if (!chatTitle) {
      chatTitle = options?.defaultTitle;
    }
    if (!chatTitle) {
      return {
        success: false,
        code: "NO_ACTIVE_CHAT",
        error: "No active chat open. Please click on a conversation in WhatsApp Web.",
        messages: []
      };
    }
    const rawBubbles = [];
    const bubbleNodes = root.querySelectorAll(
      '[data-testid="msg-container"], div.message-in, div.message-out, div[data-id], div[role="row"]'
    );
    let domIndex = 0;
    bubbleNodes.forEach((node) => {
      if (node.closest && node.parentElement?.closest('[data-testid="msg-container"]')) {
        return;
      }
      const dataId = node.getAttribute?.("data-id") || node.querySelector?.("[data-id]")?.getAttribute?.("data-id");
      const prePlainEl = node.getAttribute?.("data-pre-plain-text") ? node : node.querySelector?.("[data-pre-plain-text]");
      const prePlainText = prePlainEl?.getAttribute?.("data-pre-plain-text") || "";
      let extractedSender = void 0;
      let extractedTime = void 0;
      if (prePlainText) {
        const match = prePlainText.match(/^\[([^\]]+)\]\s*([^:]+):\s*$/);
        if (match) {
          extractedTime = match[1].trim();
          extractedSender = match[2].trim();
        }
      }
      const isOutgoing = Boolean(
        node.classList?.contains?.("message-out") || dataId && dataId.startsWith("true_") || node.querySelector?.('[data-icon="msg-dblcheck"], [data-icon="msg-check"], [data-icon="msg-time"]')
      );
      if (!extractedSender && !isOutgoing) {
        const authorEl = node.querySelector?.(
          '[data-testid="author"], ._ak8q, span[dir="auto"][color], span[role="button"]'
        );
        if (authorEl && authorEl.textContent?.trim()) {
          extractedSender = authorEl.textContent.trim();
        }
      }
      if (!extractedTime) {
        const metaEl = node.querySelector?.(
          '[data-testid="msg-meta"] span, span._ak8i, time, [data-testid="msg-time"]'
        );
        if (metaEl && metaEl.textContent?.trim()) {
          extractedTime = metaEl.textContent.trim();
        }
      }
      const textEl = node.querySelector?.(
        '.selectable-text, span._ao3e, [data-testid="selectable-text"], span[dir="ltr"]'
      );
      let text = textEl?.textContent?.trim() || "";
      let mediaType = void 0;
      let isMediaOmitted = false;
      if (node.querySelector?.(
        '[data-testid="audio-play"], [data-icon="audio-file"], audio, [data-icon="ptt-play"]'
      )) {
        mediaType = "audio";
        isMediaOmitted = true;
      } else if (node.querySelector?.('[data-testid="image-thumb"], img[src*="blob:"], [data-icon="image"]')) {
        mediaType = "image";
        if (!text) isMediaOmitted = true;
      } else if (node.querySelector?.('[data-testid="video-thumb"], video, [data-icon="video"]')) {
        mediaType = "video";
        if (!text) isMediaOmitted = true;
      } else if (node.querySelector?.('[data-testid="document-thumb"], [data-icon="document"]')) {
        mediaType = "document";
        if (!text) isMediaOmitted = true;
      } else if (node.querySelector?.('[data-testid="sticker-thumb"], [data-icon="sticker"]')) {
        mediaType = "sticker";
        if (!text) isMediaOmitted = true;
      }
      const isDeleted = Boolean(
        node.querySelector?.('[data-icon="recalled"], span.recalled') || text.toLowerCase().includes("this message was deleted")
      );
      const isSystem = Boolean(
        node.querySelector?.('[data-testid="system-message"], .system-message') || node.classList?.contains?.("system-message")
      );
      if (text || mediaType || isDeleted || isSystem) {
        rawBubbles.push({
          id: dataId,
          sender: extractedSender,
          text,
          timestamp: extractedTime,
          prePlainText: prePlainText || void 0,
          isOutgoing,
          mediaType,
          isMediaOmitted,
          isDeleted,
          isSystem,
          domOrder: ++domIndex
        });
      }
    });
    if (rawBubbles.length === 0) {
      return {
        success: false,
        code: "NO_MESSAGES",
        error: `No readable messages found in chat "${chatTitle}".`,
        chatTitle,
        messages: [],
        totalRawBubbles: 0
      };
    }
    const normalized = normalizeWhatsAppWebBubbles(rawBubbles, chatTitle);
    return {
      success: true,
      code: "SUCCESS",
      chatTitle,
      conversation: normalized,
      messages: normalized.messages,
      totalRawBubbles: rawBubbles.length
    };
  }
  function parseWhatsAppWebHtml(html, options) {
    if (/canvas[^>]*aria-label="Scan me!"|data-testid="qrcode"|data-testid="intro-title"/i.test(html) && !/<header/i.test(html)) {
      return {
        success: false,
        code: "NOT_LOGGED_IN",
        error: "WhatsApp Web is not logged in. Please scan the QR code to log in first.",
        messages: []
      };
    }
    let chatTitle = options?.defaultTitle;
    const headerMatch = html.match(/<header[\s\S]*?<\/header>/i);
    if (headerMatch) {
      const titleMatch = headerMatch[0].match(/title="([^"]+)"/i) || headerMatch[0].match(/<span[^>]*dir="auto"[^>]*>([\s\S]*?)<\/span>/i);
      if (titleMatch) {
        chatTitle = titleMatch[1].replace(/<[^>]+>/g, "").trim();
      }
    }
    if (!chatTitle) {
      chatTitle = "WhatsApp Web Chat";
    }
    const rawBubbles = [];
    let domIndex = 0;
    const bubbleRegex = /<div[^>]*?(?:data-id="([^"]+)"|data-testid="msg-container"|class="[^"]*?(?:message-in|message-out)[^"]*?")[^>]*?>([\s\S]*?)(?=<div[^>]*?(?:data-id="|data-testid="msg-container"|class="[^"]*?(?:message-in|message-out))|$)/gi;
    let match;
    while ((match = bubbleRegex.exec(html)) !== null) {
      const bubbleHtml = match[0];
      const dataId = match[1] || bubbleHtml.match(/data-id="([^"]+)"/i)?.[1];
      const isOutgoing = /class="[^"]*message-out[^"]*"/i.test(bubbleHtml) || dataId && dataId.startsWith("true_") || /data-icon="msg-dblcheck"|data-icon="msg-check"/i.test(bubbleHtml);
      const prePlainMatch = bubbleHtml.match(/data-pre-plain-text="([^"]+)"/i);
      let extractedSender;
      let extractedTime;
      if (prePlainMatch) {
        const headerMatch2 = prePlainMatch[1].match(/^\[([^\]]+)\]\s*([^:]+):\s*$/);
        if (headerMatch2) {
          extractedTime = headerMatch2[1].trim();
          extractedSender = headerMatch2[2].trim();
        }
      }
      if (!extractedSender && !isOutgoing) {
        const authorMatch = bubbleHtml.match(
          /<span[^>]*?(?:data-testid="author"|class="[^"]*_ak8q[^"]*")[^>]*?>([\s\S]*?)<\/span>/i
        );
        if (authorMatch) {
          extractedSender = authorMatch[1].replace(/<[^>]+>/g, "").trim();
        }
      }
      if (!extractedTime) {
        const timeMatch = bubbleHtml.match(
          /<span[^>]*?(?:data-testid="msg-meta"|class="[^"]*_ak8i[^"]*"|data-testid="msg-time")[^>]*?>([\s\S]*?)<\/span>/i
        );
        if (timeMatch) {
          extractedTime = timeMatch[1].replace(/<[^>]+>/g, "").trim();
        }
      }
      const textMatch = bubbleHtml.match(
        /<span[^>]*?(?:selectable-text|_ao3e|dir="ltr")[^>]*?>([\s\S]*?)<\/span>/i
      );
      let text = textMatch ? textMatch[1].replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').trim() : "";
      let mediaType;
      let isMediaOmitted = false;
      if (/data-testid="audio-play"|data-icon="audio-file"|<audio/i.test(bubbleHtml)) {
        mediaType = "audio";
        isMediaOmitted = true;
      } else if (/data-testid="image-thumb"|data-icon="image"/i.test(bubbleHtml)) {
        mediaType = "image";
        if (!text) isMediaOmitted = true;
      } else if (/data-testid="video-thumb"|data-icon="video"/i.test(bubbleHtml)) {
        mediaType = "video";
        if (!text) isMediaOmitted = true;
      } else if (/data-testid="document-thumb"|data-icon="document"/i.test(bubbleHtml)) {
        mediaType = "document";
        if (!text) isMediaOmitted = true;
      } else if (/data-testid="sticker-thumb"|data-icon="sticker"/i.test(bubbleHtml)) {
        mediaType = "sticker";
        if (!text) isMediaOmitted = true;
      }
      const isDeleted = /data-icon="recalled"|this message was deleted/i.test(bubbleHtml);
      const isSystem = /data-testid="system-message"|class="[^"]*system-message[^"]*"/i.test(
        bubbleHtml
      );
      if (text || mediaType || isDeleted || isSystem) {
        rawBubbles.push({
          id: dataId,
          sender: extractedSender,
          text,
          timestamp: extractedTime,
          prePlainText: prePlainMatch ? prePlainMatch[1] : void 0,
          isOutgoing,
          mediaType,
          isMediaOmitted,
          isDeleted,
          isSystem,
          domOrder: ++domIndex
        });
      }
    }
    if (rawBubbles.length === 0) {
      return {
        success: false,
        code: "NO_MESSAGES",
        error: `No readable messages found in chat HTML "${chatTitle}".`,
        chatTitle,
        messages: [],
        totalRawBubbles: 0
      };
    }
    const normalized = normalizeWhatsAppWebBubbles(rawBubbles, chatTitle);
    return {
      success: true,
      code: "SUCCESS",
      chatTitle,
      conversation: normalized,
      messages: normalized.messages,
      totalRawBubbles: rawBubbles.length
    };
  }
  var WhatsAppWebDomAdapter = class {
    id = "whatsapp_web_dom";
    platform = "whatsapp";
    displayName = "WhatsApp Web Live Export";
    supportedExtensions = [".html", ".htm"];
    detect(raw, meta) {
      const reasons = [];
      let score = 0;
      const fileName = meta?.fileName?.toLowerCase() || "";
      if (fileName.includes("whatsapp") && (fileName.endsWith(".html") || fileName.endsWith(".htm"))) {
        score += 0.3;
        reasons.push("File name and extension indicate WhatsApp Web HTML snapshot");
      }
      if (/data-testid="msg-container"/i.test(raw)) {
        score += 0.4;
        reasons.push("Contains WhatsApp Web msg-container test identifiers");
      }
      if (/data-pre-plain-text="/i.test(raw)) {
        score += 0.4;
        reasons.push("Contains WhatsApp Web data-pre-plain-text message timestamps");
      }
      if (/data-id="(?:true|false)_[^"]+@c\.us/i.test(raw)) {
        score += 0.3;
        reasons.push("Contains WhatsApp Web internal message data-id tokens");
      }
      const confidence = Math.min(1, Math.max(0, score));
      return {
        format: "whatsapp",
        confidence,
        formatLabel: "WhatsApp Web Live Export",
        reasons
      };
    }
    parse(raw, meta) {
      const res = parseWhatsAppWebHtml(raw, { defaultTitle: meta?.fileName?.replace(/\.html?$/i, "") });
      if (!res.success || res.messages.length === 0) {
        return {
          success: false,
          messages: [],
          format: "whatsapp",
          formatLabel: "WhatsApp Web Live Export",
          error: res.error || "Failed to extract WhatsApp Web DOM snapshot."
        };
      }
      return {
        success: true,
        conversation: res.conversation,
        messages: res.messages,
        format: "whatsapp",
        formatLabel: "WhatsApp Web Live Export"
      };
    }
  };

  // packages/engine/src/adapters/registry.ts
  var AdapterRegistry = class {
    adapters = [];
    constructor() {
      this.register(new WhatsAppAdapter());
      this.register(new WhatsAppWebDomAdapter());
      this.register(new TelegramAdapter());
      this.register(new FacebookMessengerAdapter());
      this.register(new SlackJsonAdapter());
      this.register(new StandardChatAdapter());
    }
    register(adapter) {
      const idx = this.adapters.findIndex((a) => a.id === adapter.id);
      if (idx >= 0) {
        this.adapters[idx] = adapter;
      } else {
        this.adapters.push(adapter);
      }
    }
    getAdapter(format) {
      return this.adapters.find((a) => a.platform === format);
    }
    getAdapterById(id) {
      return this.adapters.find((a) => a.id === id);
    }
    getAllAdapters() {
      return [...this.adapters];
    }
    detect(raw, meta) {
      let bestResult = {
        format: "unknown",
        confidence: 0,
        formatLabel: "Unrecognized Format",
        reasons: ["No platform adapter matched the input file."]
      };
      for (const adapter of this.adapters) {
        const result = adapter.detect(raw, meta);
        if (result.confidence > bestResult.confidence) {
          bestResult = result;
        }
      }
      return bestResult;
    }
    parse(raw, meta, forceFormat) {
      const trimmed = raw.trim();
      if (!trimmed) {
        return {
          success: false,
          messages: [],
          format: "unknown",
          formatLabel: "Unknown",
          error: "The uploaded file is empty."
        };
      }
      if (forceFormat) {
        const adapter = this.getAdapter(forceFormat);
        if (adapter) {
          return adapter.parse(raw, meta);
        }
      }
      const detection = this.detect(raw, meta);
      if (detection.confidence >= 0.35) {
        const matchedAdapter = this.adapters.find((a) => a.detect(raw, meta).confidence === detection.confidence) || this.getAdapter(detection.format);
        if (matchedAdapter) {
          const result = matchedAdapter.parse(raw, meta);
          if (result.success) {
            return result;
          }
          return {
            ...result,
            error: result.error || `Failed to parse detected ${detection.formatLabel}. Please check file structure.`
          };
        }
      }
      const standardAdapter = this.adapters.find((a) => a instanceof StandardChatAdapter) || new StandardChatAdapter();
      const fallbackResult = standardAdapter.parse(raw, meta);
      if (fallbackResult.success) {
        return fallbackResult;
      }
      const detectedLabel = detection.confidence > 0 ? `${detection.formatLabel} (confidence ${(detection.confidence * 100).toFixed(0)}%)` : "Unknown";
      const reasonText = detection.reasons.length > 0 ? ` (${detection.reasons.join(", ")})` : "";
      return {
        success: false,
        messages: [],
        format: detection.format,
        formatLabel: detection.formatLabel,
        error: `Unsupported or corrupted format: Detected ${detectedLabel}${reasonText}. Unable to extract conversation messages. Please ensure you uploaded a valid WhatsApp (.txt), Telegram Desktop (.json), Facebook Messenger (.json/.html), or Slack (.json) export.`
      };
    }
  };
  var defaultRegistry = new AdapterRegistry();

  // packages/engine/src/parsers/index.ts
  var MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

  // extension/content.entry.js
  console.log("[Missed.] Content script companion initialized on WhatsApp Web.");
  var cachedExtraction = null;
  var debounceTimer = null;
  var observer = null;
  function refreshCurrentChat() {
    try {
      const result = extractWhatsAppWebChatFromDom(document);
      if (result.success) {
        cachedExtraction = result;
      }
      return result;
    } catch (err) {
      console.error("[Missed.] DOM extraction error:", err);
      return {
        success: false,
        code: "EXTRACTION_ERROR",
        error: `Failed to extract WhatsApp Web DOM: ${err.message}`,
        messages: []
      };
    }
  }
  function setupChatObserver() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    const targetNode = document.querySelector(
      '#main, [data-testid="conversation-panel-messages"], div[role="region"], div[role="application"]'
    ) || document.body;
    if (!targetNode) return;
    observer = new MutationObserver(() => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        refreshCurrentChat();
      }, 250);
    });
    observer.observe(targetNode, {
      childList: true,
      subtree: true,
      attributes: false
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setupChatObserver();
      refreshCurrentChat();
    });
  } else {
    setupChatObserver();
    refreshCurrentChat();
  }
  function highlightMessageInWhatsApp(snippet) {
    if (!snippet) return;
    const cleanSnippet = snippet.slice(0, 40).toLowerCase();
    const textNodes = document.querySelectorAll(
      '.selectable-text, [data-pre-plain-text], [data-testid="msg-container"]'
    );
    for (const node of textNodes) {
      if (node.textContent && node.textContent.toLowerCase().includes(cleanSnippet)) {
        node.scrollIntoView({ behavior: "smooth", block: "center" });
        const targetEl = node.closest('[data-testid="msg-container"]') || node;
        const originalOutline = targetEl.style.outline;
        const originalBg = targetEl.style.backgroundColor;
        const originalTransition = targetEl.style.transition;
        targetEl.style.transition = "all 0.3s ease";
        targetEl.style.outline = "2px solid #ff521b";
        targetEl.style.backgroundColor = "rgba(255, 82, 27, 0.12)";
        setTimeout(() => {
          targetEl.style.outline = originalOutline;
          targetEl.style.backgroundColor = originalBg;
          targetEl.style.transition = originalTransition;
        }, 2500);
        break;
      }
    }
  }
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request?.type === "SCRAPE_WHATSAPP_CHAT") {
      setupChatObserver();
      const result = refreshCurrentChat();
      sendResponse(result);
    } else if (request?.type === "HIGHLIGHT_SOURCE_MESSAGE") {
      highlightMessageInWhatsApp(request.snippet);
      sendResponse({ success: true });
    }
    return true;
  });
})();
