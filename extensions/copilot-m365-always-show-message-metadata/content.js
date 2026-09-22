/* =========================================================================
   Copilot M365 Always Show Message Metadata

   Author      : MITSUISHI Yutaka
   Version     : 1.0.0
   Created     : 2026-09-15
   Updated     : 2026-09-22
   Description : Always shows message timestamps and actions in Microsoft 365 Copilot

   License     : MIT License
                 https://opensource.org/licenses/MIT
   ========================================================================= */

const turnSelector =
  '[data-testid="m365-chat-llm-web-ui-chat-message"]';

const userMessageSelector =
  '[data-testid="chatQuestion"]';

const userActionButtonSelector =
  '.fai-UserMessage__actionBarAccessibleButton';

const userActionsSelector =
  '.fai-UserMessage__actionBar';

const assistantMessageSelector =
  '[data-testid="markdown-reply"][data-message-id]';

const assistantActionsSelector =
  '.fai-CopilotMessage__actions';

const timestampClass =
  'copilot-m365-message-timestamp';

const userMetadataClass =
  'copilot-m365-user-metadata';

const customUserActionsClass =
  'copilot-m365-user-actions';

const nativeUserActionsHiddenClass =
  'copilot-m365-native-user-actions-hidden';


// -------------------------------------------------------------------------
// Conversation data
// -------------------------------------------------------------------------

// Read the conversation data embedded in the page's hydration script.
function getHydrationData() {
  const scripts = document.querySelectorAll("script");

  for (const script of scripts) {
    const text = script.textContent;

    if (!text.includes("window.__staticRouterHydrationData")) {
      continue;
    }

    const match = text.match(
      /window\.__staticRouterHydrationData\s*=\s*JSON\.parse\(("(?:\\.|[^"\\])*")\)/
    );

    if (!match) {
      continue;
    }

    try {
      return JSON.parse(JSON.parse(match[1]));
    } catch (error) {
      console.error(
        "M365 Copilot Always Show Message Metadata: failed to parse hydration data",
        error
      );

      return null;
    }
  }

  return null;
}

// Find the array that contains the conversation messages.
function findMessageArray(value) {
  if (!value || typeof value !== "object") {
    return null;
  }

  if (
    Array.isArray(value.messages) &&
    value.messages.some(message =>
      message &&
      typeof message === "object" &&
      typeof message.messageId === "string"
    )
  ) {
    return value.messages;
  }

  for (const child of Object.values(value)) {
    const result = findMessageArray(child);

    if (result) {
      return result;
    }
  }

  return null;
}

// Build indexes for looking up messages.
function getConversationMessages() {
  const hydrationData = getHydrationData();

  if (!hydrationData) {
    return null;
  }

  const messages = findMessageArray(hydrationData);

  if (!messages) {
    console.warn(
      "M365 Copilot Always Show Message Metadata: conversation messages not found"
    );

    return null;
  }

  const byMessageId = new Map();

  for (const message of messages) {
    if (message?.messageId) {
      byMessageId.set(message.messageId, message);
    }
  }

  return {
    messages,
    byMessageId
  };
}


// -------------------------------------------------------------------------
// Timestamp
// -------------------------------------------------------------------------

function formatTimestamp(message) {
  const value = message.timestamp || message.createdAt;

  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}

function createTimestamp(message) {
  const text = formatTimestamp(message);

  if (!text) {
    return null;
  }

  const timestamp = document.createElement("time");

  timestamp.className = timestampClass;
  timestamp.dateTime = message.timestamp || message.createdAt;
  timestamp.textContent = text;

  timestamp.style.display = "block";
  timestamp.style.marginTop = "4px";
  timestamp.style.fontSize = "12px";
  timestamp.style.lineHeight = "16px";
  timestamp.style.opacity = "0.65";

  return timestamp;
}


// -------------------------------------------------------------------------
// User metadata
// -------------------------------------------------------------------------

// Create the metadata area below the user message.
function getUserMetadata(question) {
  let metadata = question.querySelector(`.${userMetadataClass}`);

  if (metadata) {
    return metadata;
  }

  const article = question.querySelector('[role="article"]');

  if (!article) {
    return null;
  }

  metadata = document.createElement("div");
  metadata.className = userMetadataClass;

  metadata.style.display = "flex";
  metadata.style.flexDirection = "column";
  metadata.style.alignItems = "flex-end";
  metadata.style.width = "100%";
  metadata.style.marginTop = "-30px";

  article.insertAdjacentElement("afterend", metadata);

  return metadata;
}


// -------------------------------------------------------------------------
// Assistant message
// -------------------------------------------------------------------------

function processAssistantMessage(turn, conversation) {
  const reply = turn.querySelector(assistantMessageSelector);

  if (!reply) {
    return;
  }

  if (
    turn.querySelector(
      `.${timestampClass}[data-message-role="assistant"]`
    )
  ) {
    return;
  }

  const messageId = reply.dataset.messageId;
  const message = conversation.byMessageId.get(messageId);

  if (!message) {
    return;
  }

  const timestamp = createTimestamp(message);

  if (!timestamp) {
    return;
  }

  timestamp.dataset.messageRole = "assistant";

  const actions = turn.querySelector(assistantActionsSelector);

  if (actions) {
    timestamp.style.marginTop = "-18px";
    timestamp.style.marginBottom = "0";

    actions.insertAdjacentElement("beforebegin", timestamp);
  }
}


// -------------------------------------------------------------------------
// User message
// -------------------------------------------------------------------------

function processUserMessage(turn, conversation) {
  const question = turn.querySelector(userMessageSelector);

  if (!question) {
    return;
  }

  if (
    turn.querySelector(
      `.${timestampClass}[data-message-role="user"]`
    )
  ) {
    return;
  }

  // Use the assistant message in the same turn to identify the request.
  const reply = turn.querySelector(assistantMessageSelector);

  if (!reply) {
    return;
  }

  const assistantMessage =
    conversation.byMessageId.get(reply.dataset.messageId);

  if (!assistantMessage?.requestId) {
    return;
  }

  // The user message uses the request ID as its message ID.
  const userMessage =
    conversation.byMessageId.get(assistantMessage.requestId);

  if (!userMessage) {
    return;
  }

  const timestamp = createTimestamp(userMessage);

  if (!timestamp) {
    return;
  }

  timestamp.dataset.messageRole = "user";

  const metadata = getUserMetadata(question);

  if (metadata) {
    metadata.append(timestamp);
  }
}


// -------------------------------------------------------------------------
// User actions
// -------------------------------------------------------------------------

const userActions = [
  {
    id: "edit-button",
    label: "編集",
    symbol: "✎"
  },
  {
    id: "copy-button",
    label: "コピー",
    symbol: "⧉"
  },
  {
    id: "bookmark-button",
    label: "プロンプトを保存します",
    symbol: "☆"
  },
  {
    id: "PopoverAction-copy-prompt-link-button",
    label: "プロンプト リンクのコピー",
    symbol: "🔗"
  }
];

// Hide the native user action bar while keeping its actions available.
function hideNativeUserActions(question) {
  const actions = question.querySelector(userActionsSelector);

  if (!actions || actions.classList.contains(nativeUserActionsHiddenClass)) {
    return;
  }

  actions.classList.add(nativeUserActionsHiddenClass);

  actions.style.setProperty("opacity", "0", "important");
  actions.style.setProperty("pointer-events", "none", "important");
}

// Wait briefly for a native action button to be created.
function clickNativeUserAction(question, actionId) {
  const trigger = question.querySelector(userActionButtonSelector);

  if (!trigger) {
    return;
  }

  trigger.click();

  let frames = 0;
  const maxFrames = 30;

  function findAndClick() {
    if (!question.isConnected) {
      return;
    }

    const nativeActions = question.querySelector(userActionsSelector);

    if (nativeActions) {
      hideNativeUserActions(question);
    }

    const nativeButton = question.querySelector(
      `${userActionsSelector} [data-automation-id="${actionId}"]`
    );

    if (nativeButton) {
      nativeButton.click();
      return;
    }

    frames += 1;

    if (frames < maxFrames) {
      requestAnimationFrame(findAndClick);
    }
  }

  requestAnimationFrame(findAndClick);
}

function createCustomUserActions(question) {
  if (question.querySelector(`.${customUserActionsClass}`)) {
    return;
  }

  const metadata = getUserMetadata(question);

  if (!metadata) {
    return;
  }

  const actions = document.createElement("div");

  actions.className = customUserActionsClass;
  actions.setAttribute("role", "toolbar");
  actions.setAttribute("aria-label", "クイック アクション");

  actions.style.display = "flex";
  actions.style.alignItems = "center";
  actions.style.gap = "2px";
  actions.style.marginTop = "4px";

  for (const action of userActions) {
    const button = document.createElement("button");

    button.type = "button";
    button.title = action.label;
    button.setAttribute("aria-label", action.label);
    button.dataset.actionId = action.id;
    button.textContent = action.symbol;

    button.style.display = "inline-flex";
    button.style.alignItems = "center";
    button.style.justifyContent = "center";
    button.style.width = "28px";
    button.style.height = "28px";
    button.style.padding = "0";
    button.style.border = "0";
    button.style.borderRadius = "4px";
    button.style.background = "transparent";
    button.style.font = "inherit";
    button.style.fontSize = "18px";
    button.style.lineHeight = "1";
    button.style.cursor = "pointer";

    button.addEventListener("mouseenter", () => {
      button.style.background = "rgba(0, 0, 0, 0.08)";
    });

    button.addEventListener("mouseleave", () => {
      button.style.background = "transparent";
    });

    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();

      clickNativeUserAction(question, action.id);
    });

    actions.append(button);
  }

  metadata.append(actions);
}


// -------------------------------------------------------------------------
// Assistant actions
// -------------------------------------------------------------------------

// Keep the assistant message action bar visible.
function revealAssistantActions(turn) {
  const actions = turn.querySelector(assistantActionsSelector);

  if (!actions) {
    return;
  }

  actions.style.setProperty("display", "flex", "important");
  actions.style.setProperty("visibility", "visible", "important");
  actions.style.setProperty("opacity", "1", "important");
}


// -------------------------------------------------------------------------
// Turn processing
// -------------------------------------------------------------------------

function processTurn(turn, conversation) {
  processUserMessage(turn, conversation);
  processAssistantMessage(turn, conversation);

  const question = turn.querySelector(userMessageSelector);

  if (question) {
    createCustomUserActions(question);
    hideNativeUserActions(question);
  }

  revealAssistantActions(turn);
}

function processAllTurns() {
  const conversation = getConversationMessages();

  if (!conversation) {
    return;
  }

  document.querySelectorAll(turnSelector).forEach(turn => {
    processTurn(turn, conversation);
  });
}


// -------------------------------------------------------------------------
// Initial processing
// -------------------------------------------------------------------------

processAllTurns();


// -------------------------------------------------------------------------
// Watch for messages added later
// -------------------------------------------------------------------------

const mutationObserver = new MutationObserver(() => {
  processAllTurns();
});

mutationObserver.observe(document.body, {
  childList: true,
  subtree: true
});
