// Missed. — Extension Side Panel Bundle (Generated from extension/sidepanel.entry.js + @missed/engine via esbuild)
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
  function serializeWhatsAppMessagesToText(messages) {
    return messages.map((m) => {
      let ts = (m.timestamp || "").trim();
      if (!ts) {
        ts = "10/09/2026, 09:14:00 AM";
      } else if (/^\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?$/.test(ts)) {
        ts = `10/09/2026, ${ts}`;
      } else {
        const timeDateMatch = ts.match(/^(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)[,\s]+(\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4})/);
        if (timeDateMatch) {
          ts = `${timeDateMatch[2]}, ${timeDateMatch[1]}`;
        }
      }
      const sender = m.sender || "Unknown";
      return `[${ts}] ${sender}: ${m.text}`;
    }).join("\n");
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

  // packages/engine/src/heuristics/detectors.ts
  var URGENT_REGEX = /\b(critical|urgent|blocker|p0|outage|incident|emergency|fatal|fatal error|500 internal server error|asap)\b/i;
  function detectUrgency(msg) {
    const match = msg.text.match(URGENT_REGEX);
    if (!match) return null;
    const keyword = match[1].toUpperCase();
    return {
      id: `finding-urg-${msg.id}`,
      sourceMessageId: msg.id,
      sourceRef: msg.sourceRef,
      category: "urgent",
      urgency: "high",
      title: `${keyword} Issue Reported`,
      snippet: msg.text,
      sender: msg.sender,
      timestamp: msg.timestamp,
      relevanceScore: 95,
      analyzer: "deterministic"
    };
  }
  var DECISION_REGEX = /\b(decision\s*:|we agreed|agreed to|we approved|approved\b|let'?s proceed with|let'?s go with|final call\s*:|we will delay|we will postpone|we will roll back|consensus\s*:)/i;
  function detectDecision(msg) {
    const match = msg.text.match(DECISION_REGEX);
    if (!match) return null;
    return {
      id: `finding-dec-${msg.id}`,
      sourceMessageId: msg.id,
      sourceRef: msg.sourceRef,
      category: "decision",
      urgency: "high",
      title: "Key Decision Reached",
      snippet: msg.text,
      sender: msg.sender,
      timestamp: msg.timestamp,
      relevanceScore: 85,
      analyzer: "deterministic"
    };
  }
  var DEADLINE_REGEX = /\b(deadline\s*(?:for|is)?|before\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)|by\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)|by\s+eod|before\s+eod|due\s+(?:on|by)|until\s+\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i;
  var EXTRACT_DUE_REGEX = /(?:by|before|until|deadline(?:\s+is)?|\bis\b|\bdue\b|\bat\b)\s+([0-9]{1,2}(?::[0-9]{2})?\s*(?:am|pm)|eod|tomorrow|friday|monday|today)/i;
  function detectDeadline(msg) {
    const match = msg.text.match(DEADLINE_REGEX);
    if (!match) return null;
    const dueMatch = msg.text.match(EXTRACT_DUE_REGEX);
    const dueDate = dueMatch ? dueMatch[1].toUpperCase() : void 0;
    return {
      id: `finding-dl-${msg.id}`,
      sourceMessageId: msg.id,
      sourceRef: msg.sourceRef,
      category: "deadline",
      urgency: "high",
      title: dueDate ? `Deadline: ${dueDate}` : "Target Deadline Identified",
      snippet: msg.text,
      sender: msg.sender,
      timestamp: msg.timestamp,
      dueDate,
      relevanceScore: 80,
      analyzer: "deterministic"
    };
  }
  var ACTION_REGEX = /\b(action\s*item(?:\s*(?:for|:))?|todo\s*:|please\s+(?:deploy|check|verify|run|fix|investigate|prepare|post|restart|update|halt)|i\s*will\s+(?:deploy|check|verify|run|fix|investigate|prepare|post|restart|update|look|increase)|i'?ll\s+(?:deploy|check|verify|run|fix|investigate|prepare|post|restart|update|handle)|assigned\s+to|assigning\s+to|need\s+someone\s+to)\b/i;
  var ASSIGNEE_NAME_REGEX = /(?:action\s*item\s*for|action\s*item\s*:?\s*@?|@)\s*([A-Za-z0-9_]+(?:\s+[A-Za-z0-9_]+)?)/i;
  function detectActionItem(msg) {
    const match = msg.text.match(ACTION_REGEX);
    if (!match) return null;
    let assignee;
    if (/\bi\s*will\b|\bi'?ll\b/i.test(msg.text)) {
      assignee = msg.sender;
    } else {
      const assigneeMatch = msg.text.match(ASSIGNEE_NAME_REGEX);
      if (assigneeMatch && assigneeMatch[1]) {
        assignee = assigneeMatch[1].trim();
      }
    }
    const hasUrgencyOrDeadline = URGENT_REGEX.test(msg.text) || DEADLINE_REGEX.test(msg.text);
    return {
      id: `finding-act-${msg.id}`,
      sourceMessageId: msg.id,
      sourceRef: msg.sourceRef,
      category: "action_item",
      urgency: hasUrgencyOrDeadline ? "high" : "medium",
      title: assignee ? `Task assigned to ${assignee}` : "Action Item Identified",
      snippet: msg.text,
      sender: msg.sender,
      timestamp: msg.timestamp,
      assignee,
      relevanceScore: 75,
      analyzer: "deterministic"
    };
  }
  var MENTION_REGEX = /@([A-Za-z0-9_]+(?:\s+[A-Za-z0-9_]+)?)/;
  function detectMention(msg) {
    const match = msg.text.match(MENTION_REGEX);
    if (!match) return null;
    const target = match[1].trim();
    const isQuestion = msg.text.includes("?");
    return {
      id: `finding-men-${msg.id}`,
      sourceMessageId: msg.id,
      sourceRef: msg.sourceRef,
      category: "mention",
      urgency: isQuestion ? "medium" : "low",
      title: isQuestion ? `Direct question to @${target}` : `Direct mention of @${target}`,
      snippet: msg.text,
      sender: msg.sender,
      timestamp: msg.timestamp,
      assignee: target,
      relevanceScore: 65,
      analyzer: "deterministic"
    };
  }

  // packages/engine/src/heuristics/recapGenerator.ts
  var STOP_WORDS = /* @__PURE__ */ new Set([
    "the",
    "be",
    "to",
    "of",
    "and",
    "a",
    "in",
    "that",
    "have",
    "i",
    "it",
    "for",
    "not",
    "on",
    "with",
    "he",
    "as",
    "you",
    "do",
    "at",
    "this",
    "but",
    "his",
    "by",
    "from",
    "they",
    "we",
    "say",
    "her",
    "she",
    "or",
    "an",
    "will",
    "my",
    "one",
    "all",
    "would",
    "there",
    "their",
    "what",
    "so",
    "up",
    "out",
    "if",
    "about",
    "who",
    "get",
    "which",
    "go",
    "me",
    "when",
    "make",
    "can",
    "like",
    "time",
    "no",
    "just",
    "him",
    "know",
    "take",
    "people",
    "into",
    "year",
    "your",
    "good",
    "some",
    "could",
    "them",
    "see",
    "other",
    "than",
    "then",
    "now",
    "look",
    "only",
    "come",
    "its",
    "over",
    "think",
    "also",
    "back",
    "after",
    "use",
    "two",
    "how",
    "our",
    "work",
    "first",
    "well",
    "way",
    "even",
    "new",
    "want",
    "because",
    "any",
    "these",
    "give",
    "day",
    "most",
    "us",
    "is",
    "are",
    "was",
    "were",
    "am",
    "been",
    "has",
    "had",
    "doing",
    "does",
    "did",
    "please",
    "team",
    "everyone",
    "hello",
    "morning",
    "again",
    "still",
    "right"
  ]);
  function generateRecap(messages, findings) {
    const totalMessages = messages.length;
    if (totalMessages === 0) {
      return {
        totalMessages: 0,
        participantCount: 0,
        participants: [],
        topTopics: [],
        summaryBullets: ["No messages available to summarize."]
      };
    }
    const participantSet = /* @__PURE__ */ new Set();
    messages.forEach((m) => {
      if (m.sender && m.sender !== "Unknown") {
        participantSet.add(m.sender);
      }
    });
    const participants = Array.from(participantSet);
    const participantCount = participants.length;
    const timestamps = messages.map((m) => m.timestamp).filter((ts) => Boolean(ts));
    const startTime = timestamps.length > 0 ? timestamps[0] : void 0;
    const endTime = timestamps.length > 0 ? timestamps[timestamps.length - 1] : void 0;
    const wordCounts = /* @__PURE__ */ new Map();
    messages.forEach((msg) => {
      const words = msg.text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/);
      words.forEach((w) => {
        if (w.length >= 4 && !STOP_WORDS.has(w) && !/^\d+$/.test(w)) {
          wordCounts.set(w, (wordCounts.get(w) || 0) + 1);
        }
      });
    });
    const topTopics = Array.from(wordCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));
    const summaryBullets = [];
    const timeStr = startTime && endTime ? ` from ${startTime.split(" ")[1] || startTime} to ${endTime.split(" ")[1] || endTime}` : "";
    summaryBullets.push(
      `Conversation contains ${totalMessages} messages across ${participantCount} participants${timeStr}.`
    );
    const urgentFindings = findings.filter((f) => f.category === "urgent");
    if (urgentFindings.length > 0) {
      summaryBullets.push(
        `⚠️ Identified ${urgentFindings.length} critical alert/blocker${urgentFindings.length > 1 ? "s" : ""} requiring immediate attention.`
      );
    } else {
      summaryBullets.push("✓ No critical blockers or P0 system alerts were raised.");
    }
    const decisionFindings = findings.filter((f) => f.category === "decision");
    if (decisionFindings.length > 0) {
      summaryBullets.push(
        `🎯 ${decisionFindings.length} formal decision${decisionFindings.length > 1 ? "s" : ""} reached (e.g., "${decisionFindings[0].snippet.slice(0, 75)}...").`
      );
    }
    const actionFindings = findings.filter((f) => f.category === "action_item");
    const deadlineFindings = findings.filter((f) => f.category === "deadline");
    if (actionFindings.length > 0 || deadlineFindings.length > 0) {
      summaryBullets.push(
        `📌 ${actionFindings.length} actionable task${actionFindings.length > 1 ? "s" : ""} and ${deadlineFindings.length} targeted deadline${deadlineFindings.length > 1 ? "s" : ""} assigned.`
      );
    }
    return {
      totalMessages,
      participantCount,
      participants,
      startTime,
      endTime,
      topTopics,
      summaryBullets
    };
  }

  // packages/engine/src/heuristics/analyzer.ts
  function analyzeConversation(messages) {
    const findings = [];
    for (const msg of messages) {
      const urgency = detectUrgency(msg);
      if (urgency) findings.push({ analyzer: "deterministic", ...urgency });
      const decision = detectDecision(msg);
      if (decision) findings.push({ analyzer: "deterministic", ...decision });
      const deadline = detectDeadline(msg);
      if (deadline) findings.push({ analyzer: "deterministic", ...deadline });
      const actionItem = detectActionItem(msg);
      if (actionItem) findings.push({ analyzer: "deterministic", ...actionItem });
      const mention = detectMention(msg);
      if (mention) findings.push({ analyzer: "deterministic", ...mention });
    }
    const priorityWeight = {
      high: 300,
      medium: 200,
      low: 100
    };
    findings.sort((a, b) => {
      const scoreA = priorityWeight[a.urgency] + a.relevanceScore;
      const scoreB = priorityWeight[b.urgency] + b.relevanceScore;
      return scoreB - scoreA;
    });
    const stats = {
      urgentCount: findings.filter((f) => f.category === "urgent").length,
      actionItemCount: findings.filter((f) => f.category === "action_item").length,
      decisionCount: findings.filter((f) => f.category === "decision").length,
      deadlinesCount: findings.filter((f) => f.category === "deadline").length,
      mentionsCount: findings.filter((f) => f.category === "mention").length
    };
    const recap = generateRecap(messages, findings);
    return {
      recap,
      findings,
      stats
    };
  }

  // packages/engine/src/sampleConversation.ts
  var SAMPLE_MESSAGES = [
    {
      id: "sample-01",
      sender: "Maya Lin",
      timestamp: "2026-10-09 09:15:22",
      text: "Good morning team. Starting the payment gateway migration cutover now.",
      raw: "[2026-10-09 09:15:22] Maya Lin: Good morning team. Starting the payment gateway migration cutover now.",
      lineIndex: 0
    },
    {
      id: "sample-02",
      sender: "Leo Chen",
      timestamp: "2026-10-09 09:17:40",
      text: "Infrastructure standby is green. Database replicas are synchronized.",
      raw: "[2026-10-09 09:17:40] Leo Chen: Infrastructure standby is green. Database replicas are synchronized.",
      lineIndex: 1
    },
    {
      id: "sample-03",
      sender: "Maya Lin",
      timestamp: "2026-10-09 09:21:05",
      text: "CRITICAL: The staging payment gateway webhook is returning 500 Internal Server Error on card authorisations!",
      raw: "[2026-10-09 09:21:05] Maya Lin: CRITICAL: The staging payment gateway webhook is returning 500 Internal Server Error on card authorisations!",
      lineIndex: 2
    },
    {
      id: "sample-04",
      sender: "Priya Sharma",
      timestamp: "2026-10-09 09:22:18",
      text: "Is production affected yet? We have 1,400 active shoppers right now.",
      raw: "[2026-10-09 09:22:18] Priya Sharma: Is production affected yet? We have 1,400 active shoppers right now.",
      lineIndex: 3
    },
    {
      id: "sample-05",
      sender: "Leo Chen",
      timestamp: "2026-10-09 09:23:45",
      text: "Production traffic is still routing to legacy gateway v1. Staging cutover is isolated.",
      raw: "[2026-10-09 09:23:45] Leo Chen: Production traffic is still routing to legacy gateway v1. Staging cutover is isolated.",
      lineIndex: 4
    },
    {
      id: "sample-06",
      sender: "Maya Lin",
      timestamp: "2026-10-09 09:25:10",
      text: "BLOCKER: Redis connection pool is exhausted on node-3 due to unclosed socket connections in the new SDK.",
      raw: "[2026-10-09 09:25:10] Maya Lin: BLOCKER: Redis connection pool is exhausted on node-3 due to unclosed socket connections in the new SDK.",
      lineIndex: 5
    },
    {
      id: "sample-07",
      sender: "Leo Chen",
      timestamp: "2026-10-09 09:26:30",
      text: "@Maya Lin I am increasing the connection pool limit to 500 and restarting the proxy workers immediately.",
      raw: "[2026-10-09 09:26:30] Leo Chen: @Maya Lin I am increasing the connection pool limit to 500 and restarting the proxy workers immediately.",
      lineIndex: 6
    },
    {
      id: "sample-08",
      sender: "Priya Sharma",
      timestamp: "2026-10-09 09:29:15",
      text: "Can we proceed with today's 10:00 AM launch or do we need to postpone?",
      raw: "[2026-10-09 09:29:15] Priya Sharma: Can we proceed with today's 10:00 AM launch or do we need to postpone?",
      lineIndex: 7
    },
    {
      id: "sample-09",
      sender: "Maya Lin",
      timestamp: "2026-10-09 09:31:00",
      text: "Decision: We approved delaying the production cutover to 3:00 PM today until the SDK socket leak is patched.",
      raw: "[2026-10-09 09:31:00] Maya Lin: Decision: We approved delaying the production cutover to 3:00 PM today until the SDK socket leak is patched.",
      lineIndex: 8
    },
    {
      id: "sample-10",
      sender: "Priya Sharma",
      timestamp: "2026-10-09 09:32:45",
      text: "Agreed. I will post an update to the customer executive dashboard before 10:00 AM.",
      raw: "[2026-10-09 09:32:45] Priya Sharma: Agreed. I will post an update to the customer executive dashboard before 10:00 AM.",
      lineIndex: 9
    },
    {
      id: "sample-11",
      sender: "Alex Rivera",
      timestamp: "2026-10-09 09:35:12",
      text: "Frontend checkout modal is currently displaying a generic error message. I will push a user-friendly retry banner.",
      raw: "[2026-10-09 09:35:12] Alex Rivera: Frontend checkout modal is currently displaying a generic error message. I will push a user-friendly retry banner.",
      lineIndex: 10
    },
    {
      id: "sample-12",
      sender: "Maya Lin",
      timestamp: "2026-10-09 09:37:04",
      text: "Action item: @Alex Rivera please deploy the banner fix to staging by 10:30 AM.",
      raw: "[2026-10-09 09:37:04] Maya Lin: Action item: @Alex Rivera please deploy the banner fix to staging by 10:30 AM.",
      lineIndex: 11
    },
    {
      id: "sample-13",
      sender: "Sam Thorne",
      timestamp: "2026-10-09 09:39:50",
      text: "QA is ready. Action item for Sam: Run full automated checkout regression suite once Leo restarts the workers.",
      raw: "[2026-10-09 09:39:50] Sam Thorne: QA is ready. Action item for Sam: Run full automated checkout regression suite once Leo restarts the workers.",
      lineIndex: 12
    },
    {
      id: "sample-14",
      sender: "Leo Chen",
      timestamp: "2026-10-09 09:42:15",
      text: "Redis workers restarted. Memory usage stable at 38%. Socket leak is mitigated by the new connection pool timeout.",
      raw: "[2026-10-09 09:42:15] Leo Chen: Redis workers restarted. Memory usage stable at 38%. Socket leak is mitigated by the new connection pool timeout.",
      lineIndex: 13
    },
    {
      id: "sample-15",
      sender: "Sam Thorne",
      timestamp: "2026-10-09 09:44:00",
      text: "Beginning test execution now. Deadline for smoke test sign-off is 11:15 AM.",
      raw: "[2026-10-09 09:44:00] Sam Thorne: Beginning test execution now. Deadline for smoke test sign-off is 11:15 AM.",
      lineIndex: 14
    },
    {
      id: "sample-16",
      sender: "Maya Lin",
      timestamp: "2026-10-09 09:47:20",
      text: "Decision: Staging traffic will remain on v2 SDK for soak testing until 2:00 PM.",
      raw: "[2026-10-09 09:47:20] Maya Lin: Decision: Staging traffic will remain on v2 SDK for soak testing until 2:00 PM.",
      lineIndex: 15
    },
    {
      id: "sample-17",
      sender: "Priya Sharma",
      timestamp: "2026-10-09 09:50:35",
      text: "@Leo Chen can you confirm our rollback runbook is verified in case we encounter issues at 3:00 PM?",
      raw: "[2026-10-09 09:50:35] Priya Sharma: @Leo Chen can you confirm our rollback runbook is verified in case we encounter issues at 3:00 PM?",
      lineIndex: 16
    },
    {
      id: "sample-18",
      sender: "Leo Chen",
      timestamp: "2026-10-09 09:52:10",
      text: "Yes, rollback script is tested. Action item: Leo to prepare automated rollback trigger before 1:00 PM.",
      raw: "[2026-10-09 09:52:10] Leo Chen: Yes, rollback script is tested. Action item: Leo to prepare automated rollback trigger before 1:00 PM.",
      lineIndex: 17
    },
    {
      id: "sample-19",
      sender: "Alex Rivera",
      timestamp: "2026-10-09 09:55:00",
      text: "Banner deployed to staging. @Sam Thorne please include the banner in your validation pass.",
      raw: "[2026-10-09 09:55:00] Alex Rivera: Banner deployed to staging. @Sam Thorne please include the banner in your validation pass.",
      lineIndex: 18
    },
    {
      id: "sample-20",
      sender: "Maya Lin",
      timestamp: "2026-10-09 09:58:30",
      text: "Excellent work under pressure everyone. Sync again at 1:30 PM for final go/no-go decision.",
      raw: "[2026-10-09 09:58:30] Maya Lin: Excellent work under pressure everyone. Sync again at 1:30 PM for final go/no-go decision.",
      lineIndex: 19
    }
  ];

  // extension/sidepanel.entry.js
  var API_BASE_URL = "http://localhost:3001/api";
  var currentMessages = SAMPLE_MESSAGES;
  var currentChatTitle = "Payment Gateway Incident (Sample)";
  var isSampleMode = true;
  var completedTasks = /* @__PURE__ */ new Set();
  var activeTab = "overview";
  var activeAnalysis = analyzeConversation(currentMessages);
  var currentSessionToken = null;
  var convTitleEl = document.getElementById("convTitle");
  var msgCountEl = document.getElementById("msgCount");
  var convSourceEl = document.getElementById("convSource");
  var urgentCountEl = document.getElementById("urgentCount");
  var tasksCountEl = document.getElementById("tasksCount");
  var decisionsCountEl = document.getElementById("decisionsCount");
  var tabTaskCountEl = document.getElementById("tabTaskCount");
  var tabImportantCountEl = document.getElementById("tabImportantCount");
  var noticeBanner = document.getElementById("noticeBanner");
  var catchMeUpBtn = document.getElementById("catchMeUpBtn");
  var catchBtnText = document.getElementById("catchBtnText");
  var saveWorkspaceBtn = document.getElementById("saveWorkspaceBtn");
  var sessionStatusEl = document.getElementById("sessionStatus");
  var sampleBtn = document.getElementById("sampleBtn");
  var refreshBtn = document.getElementById("refreshBtn");
  var copySummaryBtn = document.getElementById("copySummaryBtn");
  function showNotice(text, type = "error") {
    noticeBanner.textContent = text;
    noticeBanner.className = `notice-banner ${type}`;
  }
  function clearNotice() {
    noticeBanner.className = "notice-banner hidden";
    noticeBanner.textContent = "";
  }
  async function refreshSessionToken() {
    currentSessionToken = null;
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      try {
        const stored = await chrome.storage.local.get(["missed_auth_token"]);
        if (stored?.missed_auth_token) {
          currentSessionToken = stored.missed_auth_token;
        }
      } catch {
      }
    }
    if (!currentSessionToken && typeof chrome !== "undefined" && chrome.tabs && chrome.scripting) {
      try {
        const tabs = await chrome.tabs.query({
          url: ["http://localhost:5173/*", "http://127.0.0.1:5173/*"]
        });
        if (tabs.length > 0 && tabs[0].id) {
          const results = await chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => localStorage.getItem("missed_auth_token")
          });
          const token = results?.[0]?.result;
          if (token) {
            currentSessionToken = token;
            if (chrome.storage?.local) {
              await chrome.storage.local.set({ missed_auth_token: token });
            }
          }
        }
      } catch {
      }
    }
    if (sessionStatusEl) {
      if (currentSessionToken) {
        sessionStatusEl.textContent = "● Workspace Connected";
        sessionStatusEl.className = "session-pill connected";
        sessionStatusEl.title = "Authenticated session shared with Missed. web workspace";
      } else {
        sessionStatusEl.textContent = "○ Workspace Not Linked";
        sessionStatusEl.className = "session-pill idle";
        sessionStatusEl.title = "Open and log into Missed. at localhost:5173 to enable saving";
      }
    }
    return currentSessionToken;
  }
  function renderUI() {
    convTitleEl.textContent = currentChatTitle;
    msgCountEl.textContent = `${currentMessages.length} messages indexed`;
    convSourceEl.textContent = isSampleMode ? "Sample Demo" : "WhatsApp Web Live";
    urgentCountEl.textContent = activeAnalysis.stats.urgentCount;
    tasksCountEl.textContent = activeAnalysis.stats.actionItemCount - completedTasks.size;
    decisionsCountEl.textContent = activeAnalysis.stats.decisionCount;
    tabTaskCountEl.textContent = activeAnalysis.stats.actionItemCount;
    tabImportantCountEl.textContent = activeAnalysis.stats.urgentCount + activeAnalysis.stats.decisionCount;
    const recapBulletsEl = document.getElementById("recapBullets");
    recapBulletsEl.innerHTML = activeAnalysis.recap.summaryBullets.map((b) => `<li>• ${b}</li>`).join("");
    const overviewUrgentEl = document.getElementById("overviewUrgent");
    const urgentItems = activeAnalysis.findings.filter((f) => f.category === "urgent");
    if (urgentItems.length === 0) {
      overviewUrgentEl.innerHTML = '<div style="color:#8a8780;font-size:11px;padding:6px 0;">No urgent issues detected.</div>';
    } else {
      overviewUrgentEl.innerHTML = urgentItems.slice(0, 3).map(renderFindingCard).join("");
    }
    const overviewDecisionsEl = document.getElementById("overviewDecisions");
    const decisionItems = activeAnalysis.findings.filter(
      (f) => f.category === "decision" || f.category === "deadline"
    );
    if (decisionItems.length === 0) {
      overviewDecisionsEl.innerHTML = '<div style="color:#8a8780;font-size:11px;padding:6px 0;">No decisions or deadlines detected.</div>';
    } else {
      overviewDecisionsEl.innerHTML = decisionItems.slice(0, 3).map(renderFindingCard).join("");
    }
    const overviewTasksEl = document.getElementById("overviewTasks");
    const taskItems = activeAnalysis.findings.filter((f) => f.category === "action_item");
    if (taskItems.length === 0) {
      overviewTasksEl.innerHTML = '<div style="color:#8a8780;font-size:11px;padding:6px 0;">No action items detected.</div>';
    } else {
      overviewTasksEl.innerHTML = taskItems.slice(0, 3).map(renderTaskCard).join("");
    }
    const tasksListEl = document.getElementById("tasksList");
    if (taskItems.length === 0) {
      tasksListEl.innerHTML = '<div style="text-align:center;padding:24px;color:#8a8780;">No tasks found in conversation.</div>';
    } else {
      tasksListEl.innerHTML = taskItems.map(renderTaskCard).join("");
    }
    const importantListEl = document.getElementById("importantList");
    const importantItems = activeAnalysis.findings.filter((f) => f.category !== "action_item");
    if (importantItems.length === 0) {
      importantListEl.innerHTML = '<div style="text-align:center;padding:24px;color:#8a8780;">No important items found.</div>';
    } else {
      importantListEl.innerHTML = importantItems.map(renderFindingCard).join("");
    }
    attachInteractiveHandlers();
  }
  function renderFindingCard(finding) {
    const isUrgent = finding.category === "urgent";
    const hasDeepLink = finding.sourceRef?.startsWith("https://wa.me/");
    return `
    <div class="finding-card ${isUrgent ? "urgent" : finding.category}">
      <div class="card-header">
        <span class="badge ${finding.category}">${finding.category}</span>
        <div class="card-actions-row">
          ${hasDeepLink ? `<a href="${finding.sourceRef}" target="_blank" class="deep-link-btn" title="Open WhatsApp deep link">wa.me ↗</a>` : ""}
          <button class="source-link-btn" data-snippet="${encodeURIComponent(
      finding.snippet
    )}" title="Scroll to message in WhatsApp Web">Source →</button>
        </div>
      </div>
      <div class="finding-title">${finding.title}</div>
      <div class="finding-snippet">"${finding.snippet}"</div>
      <div class="finding-meta">${finding.sender} • ${finding.timestamp || "No time recorded"}</div>
    </div>
  `;
  }
  function renderTaskCard(task) {
    const isDone = completedTasks.has(task.id);
    const hasDeepLink = task.sourceRef?.startsWith("https://wa.me/");
    return `
    <div class="finding-card task-item ${isDone ? "completed" : ""}">
      <input type="checkbox" class="task-checkbox" data-task-id="${task.id}" ${isDone ? "checked" : ""}>
      <div style="flex:1;min-width:0;">
        <div class="card-header">
          <span class="badge action">${task.assignee ? "@" + task.assignee : "Task"}</span>
          <div class="card-actions-row">
            ${hasDeepLink ? `<a href="${task.sourceRef}" target="_blank" class="deep-link-btn" title="Open WhatsApp deep link">wa.me ↗</a>` : ""}
            <button class="source-link-btn" data-snippet="${encodeURIComponent(
      task.snippet
    )}" title="Scroll to message in WhatsApp Web">Source →</button>
          </div>
        </div>
        <div class="finding-snippet">"${task.snippet}"</div>
        <div class="finding-meta">${task.sender} • ${task.timestamp || "No time recorded"}</div>
      </div>
    </div>
  `;
  }
  function attachInteractiveHandlers() {
    document.querySelectorAll(".task-checkbox").forEach((cb) => {
      cb.onchange = (e) => {
        const id = e.target.getAttribute("data-task-id");
        if (e.target.checked) completedTasks.add(id);
        else completedTasks.delete(id);
        renderUI();
      };
    });
    document.querySelectorAll(".source-link-btn").forEach((btn) => {
      btn.onclick = async (e) => {
        const snippet = decodeURIComponent(e.target.getAttribute("data-snippet"));
        if (typeof chrome !== "undefined" && chrome.tabs) {
          const waTabs = await chrome.tabs.query({
            url: ["https://web.whatsapp.com/*", "http://localhost/*", "http://127.0.0.1/*"]
          });
          const targetTab = waTabs[0] || (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
          if (targetTab?.id) {
            chrome.tabs.sendMessage(targetTab.id, { type: "HIGHLIGHT_SOURCE_MESSAGE", snippet }).catch(() => {
            });
          }
        }
      };
    });
  }
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.onclick = (e) => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".view-panel").forEach((p) => p.classList.remove("active"));
      const tab = e.target.getAttribute("data-tab");
      e.target.classList.add("active");
      document.getElementById(`${tab}View`).classList.add("active");
      activeTab = tab;
      void activeTab;
    };
  });
  document.querySelectorAll(".counter-card").forEach((card) => {
    card.onclick = () => {
      const targetTab = card.getAttribute("data-tab");
      const tabBtn = document.querySelector(`.tab-btn[data-tab="${targetTab}"]`);
      if (tabBtn) tabBtn.click();
    };
  });
  async function triggerWhatsAppScrape() {
    clearNotice();
    catchBtnText.textContent = "Scanning...";
    catchMeUpBtn.disabled = true;
    if (typeof chrome === "undefined" || !chrome.tabs) {
      showNotice(
        "Extension API unavailable in standalone browser. Loaded demo conversation instead.",
        "info"
      );
      loadSampleData();
      catchBtnText.textContent = "Capture current chat";
      catchMeUpBtn.disabled = false;
      return;
    }
    try {
      let targetTab = null;
      const waTabs = await chrome.tabs.query({
        url: ["https://web.whatsapp.com/*", "http://localhost/*", "http://127.0.0.1/*"]
      });
      if (waTabs.length > 0) {
        targetTab = waTabs.find((t) => t.url && (t.url.includes("web.whatsapp.com") || t.url.includes(":8088"))) || waTabs.find((t) => t.active) || waTabs[0];
      } else {
        const [activeTab2] = await chrome.tabs.query({ active: true, currentWindow: true });
        targetTab = activeTab2;
      }
      if (!targetTab || !targetTab.id) {
        showNotice("No active browser tab found.", "error");
        catchBtnText.textContent = "Capture current chat";
        catchMeUpBtn.disabled = false;
        return;
      }
      if (!targetTab.url || !targetTab.url.includes("web.whatsapp.com") && !targetTab.url.includes("whatsapp") && !targetTab.url.includes(":8088")) {
        showNotice(
          'Active tab is not WhatsApp Web. Open web.whatsapp.com or click "Demo".',
          "error"
        );
        catchBtnText.textContent = "Capture current chat";
        catchMeUpBtn.disabled = false;
        return;
      }
      chrome.tabs.sendMessage(targetTab.id, { type: "SCRAPE_WHATSAPP_CHAT" }, (response) => {
        catchBtnText.textContent = "Capture current chat";
        catchMeUpBtn.disabled = false;
        if (chrome.runtime.lastError || !response) {
          const detail = chrome.runtime.lastError?.message || "No response from tab";
          showNotice(
            `Could not connect to WhatsApp Web: ${detail}. Please ensure the chat tab is loaded.`,
            "error"
          );
          return;
        }
        if (!response.success) {
          showNotice(response.error || "Failed to read messages from WhatsApp Web.", "error");
          return;
        }
        currentMessages = response.messages;
        currentChatTitle = response.chatTitle || "Active WhatsApp Chat";
        isSampleMode = false;
        completedTasks.clear();
        activeAnalysis = analyzeConversation(currentMessages);
        showNotice(
          `✓ Captured ${currentMessages.length} messages from "${currentChatTitle}".`,
          "success"
        );
        setTimeout(clearNotice, 4e3);
        renderUI();
      });
    } catch (err) {
      catchBtnText.textContent = "Capture current chat";
      catchMeUpBtn.disabled = false;
      showNotice(`Error: ${err.message}`, "error");
    }
  }
  async function saveToWorkspace() {
    clearNotice();
    const token = await refreshSessionToken();
    if (!token) {
      showNotice(
        "No Missed. session detected. Sign in to Missed. at localhost:5173 to save.",
        "error"
      );
      return;
    }
    if (currentMessages.length === 0) {
      showNotice('No messages to save. Click "Capture current chat" first.', "error");
      return;
    }
    saveWorkspaceBtn.disabled = true;
    saveWorkspaceBtn.textContent = "Saving...";
    try {
      const serializedText = serializeWhatsAppMessagesToText(currentMessages);
      const fileName = `${currentChatTitle.replace(/[^a-zA-Z0-9_-]/g, "_")}_export.txt`;
      const res = await fetch(`${API_BASE_URL}/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: currentChatTitle,
          fileName,
          format: "txt",
          content: serializedText
        })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || `Server returned ${res.status}`);
      }
      showNotice(`✓ Saved "${currentChatTitle}" to workspace!`, "success");
      saveWorkspaceBtn.textContent = "Saved ✓";
      setTimeout(() => {
        saveWorkspaceBtn.textContent = "Save to workspace";
        saveWorkspaceBtn.disabled = false;
      }, 3e3);
    } catch (err) {
      saveWorkspaceBtn.textContent = "Save to workspace";
      saveWorkspaceBtn.disabled = false;
      showNotice(`Failed to save: ${err.message}`, "error");
    }
  }
  function loadSampleData() {
    currentMessages = SAMPLE_MESSAGES;
    currentChatTitle = "Payment Gateway Incident (Sample)";
    isSampleMode = true;
    completedTasks.clear();
    activeAnalysis = analyzeConversation(currentMessages);
    clearNotice();
    renderUI();
  }
  catchMeUpBtn.onclick = triggerWhatsAppScrape;
  refreshBtn.onclick = () => {
    refreshSessionToken();
    if (!isSampleMode) {
      triggerWhatsAppScrape();
    } else {
      renderUI();
    }
  };
  sampleBtn.onclick = loadSampleData;
  saveWorkspaceBtn.onclick = saveToWorkspace;
  if (sessionStatusEl) {
    sessionStatusEl.onclick = () => {
      if (typeof chrome !== "undefined" && chrome.tabs) {
        chrome.tabs.create({ url: "http://localhost:5173/workspace" });
      }
    };
  }
  copySummaryBtn.onclick = async () => {
    let text = `# Catch-Up Summary: ${currentChatTitle}

`;
    activeAnalysis.recap.summaryBullets.forEach((b) => text += `- ${b}
`);
    text += `
## Tasks
`;
    activeAnalysis.findings.filter((f) => f.category === "action_item").forEach((t) => {
      text += `- [${completedTasks.has(t.id) ? "x" : " "}] ${t.snippet}
`;
    });
    await navigator.clipboard.writeText(text);
    copySummaryBtn.textContent = "Copied!";
    setTimeout(() => copySummaryBtn.textContent = "Copy Summary", 2e3);
  };
  refreshSessionToken();
  renderUI();
  if (typeof window !== "undefined") {
    window.__missed = {
      refreshSessionToken,
      triggerWhatsAppScrape,
      saveToWorkspace,
      getAnalysis: () => activeAnalysis,
      getSessionToken: () => currentSessionToken,
      getChatTitle: () => currentChatTitle,
      getMessages: () => currentMessages
    };
  }
})();
