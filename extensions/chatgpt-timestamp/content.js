/* =========================================================================
   ChatGPT Timestamp

   Author      : MITSUISHI Yutaka
   Version     : 1.0.0
   Created     : 2026-09-01
   Updated     : 2026-09-01
   Description : Shows timestamps for user and assistant messages in ChatGPT

   License     : MIT License
                 https://opensource.org/licenses/MIT
   ========================================================================= */

(() => {
  if (window.__CHATGPT_TS_FINAL__) return;
  window.__CHATGPT_TS_FINAL__ = true;

  const SELECTOR = "[data-message-id]";
  const CLASS = "chatgpt-ts";

  // State
  let lastUrl = location.href;
  let conversationId = null;
  let timestamps = {};
  let cachedToken = null;

  let fetchTimer = null;
  let fetchInProgress = false;
  let lastFetchTime = 0;

  let messageObserver = null;

  // Minimum interval between conversation API requests.
  const MIN_FETCH_INTERVAL = 5000;

  // Wait for ChatGPT to settle before checking the conversation API.
  const FETCH_DELAY = 2000;

  // Style
  function injectStyle() {
    if (document.getElementById("chatgpt-ts-style")) return;

    const s = document.createElement("style");
    s.id = "chatgpt-ts-style";

    s.textContent = `
      .${CLASS}{
        font-size:11px;
        line-height:1.35;
        padding:3px 6px;
        margin:6px 0;
        display:inline-block;
        border-radius:6px;

        font-family:"Segoe UI","Noto Sans JP",system-ui,sans-serif;

        background:rgba(59,130,246,0.08);
        color:#2563eb;
      }

      @media(prefers-color-scheme:dark){
        .${CLASS}{
          background:rgba(96,165,250,0.18);
          color:#93c5fd;
        }
      }
    `;

    document.head.appendChild(s);
  }

  // Conversation
  function getConversationId() {
    const m = location.pathname.match(/\/c\/([a-zA-Z0-9-]+)/);
    return m ? m[1] : null;
  }

  function formatTime(unixTime) {
    if (!unixTime) return "";

    return new Date(unixTime * 1000).toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }

  // Access token
  async function getAccessToken() {
    if (cachedToken) {
      return cachedToken;
    }

    const res = await fetch("/api/auth/session", {
      credentials: "include"
    });

    if (!res.ok) {
      throw new Error(`Session request failed: ${res.status}`);
    }

    const session = await res.json();

    if (!session.accessToken) {
      throw new Error("Access token not found");
    }

    cachedToken = session.accessToken;
    return cachedToken;
  }

  // DOM
  function getMissingMessageIds() {
    const missing = [];

    document.querySelectorAll(SELECTOR).forEach(el => {
      const id = el.getAttribute("data-message-id");

      if (!id) return;

      if (!timestamps[id]) {
        missing.push(id);
      }
    });

    return [...new Set(missing)];
  }

  function applyTimestamps() {
    document.querySelectorAll(SELECTOR).forEach(el => {
      const id = el.getAttribute("data-message-id");

      if (!id) return;

      const timestamp = timestamps[id];

      if (!timestamp) return;

      if (el.querySelector(`.${CLASS}`)) return;

      const role = el.getAttribute("data-message-author-role");

      const label =
        role === "user"
          ? "User time"
          : "Assistant time";

      const text = `${label}: ${formatTime(timestamp)}`;

      const top = document.createElement("div");
      top.className = CLASS;
      top.textContent = text;

      const bottom = top.cloneNode(true);

      el.prepend(top);
      el.appendChild(bottom);
    });
  }

  // Timestamp API
  async function fetchTimestamps() {
    if (!conversationId) return;
    if (fetchInProgress) return;

    const now = Date.now();
    const wait = MIN_FETCH_INTERVAL - (now - lastFetchTime);

    // Postpone the request instead of dropping it if the previous
    // request was too recent.
    if (wait > 0) {
      scheduleFetch(wait);
      return;
    }

    fetchInProgress = true;
    lastFetchTime = Date.now();

    try {
      const token = await getAccessToken();

      const res = await fetch(
        `/backend-api/conversation/${conversationId}`,
        {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json"
          }
        }
      );

      if (res.status === 429) {
        console.warn(
          "ChatGPT Timestamp: rate limited; automatic refresh stopped."
        );

        clearTimeout(fetchTimer);
        fetchTimer = null;
        return;
      }

      if (res.status === 401 || res.status === 403) {
        cachedToken = null;

        console.warn(
          `ChatGPT Timestamp: authorization failed (${res.status})`
        );

        return;
      }

      if (!res.ok) {
        console.warn(
          `ChatGPT Timestamp: conversation request failed (${res.status})`
        );

        return;
      }

      const data = await res.json();

      if (data.mapping) {
        for (const [id, node] of Object.entries(data.mapping)) {
          const timestamp = node?.message?.create_time;

          if (timestamp) {
            timestamps[id] = timestamp;
          }
        }
      }

      applyTimestamps();

    } catch (e) {
      console.error("ChatGPT Timestamp: fetch error", e);

    } finally {
      fetchInProgress = false;
    }
  }

  // Fetch scheduling
  function scheduleFetch(delay = FETCH_DELAY) {
    // Keep at most one pending API request while the page is changing.
    if (fetchTimer !== null) {
      return;
    }

    fetchTimer = setTimeout(async () => {
      fetchTimer = null;

      if (getMissingMessageIds().length === 0) {
        return;
      }

      await fetchTimestamps();

    }, delay);
  }

  // DOM changes
  function handleDomChange() {
    // Apply cached timestamps without making an API request.
    applyTimestamps();

    // Refresh only when the DOM contains an unknown message ID.
    if (getMissingMessageIds().length > 0) {
      scheduleFetch();
    }
  }

  // Conversation setup
  async function loadConversation() {
    const newConversationId = getConversationId();

    if (!newConversationId) {
      conversationId = null;
      timestamps = {};
      return;
    }

    conversationId = newConversationId;
    timestamps = {};

    clearTimeout(fetchTimer);
    fetchTimer = null;

    if (messageObserver) {
      messageObserver.disconnect();
      messageObserver = null;
    }

    // Load timestamps for messages already present in the conversation.
    await fetchTimestamps();

    applyTimestamps();

    messageObserver = new MutationObserver(() => {
      handleDomChange();
    });

    messageObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Check for messages added between the initial fetch and observer setup.
    handleDomChange();
  }

  // SPA navigation
  function handleNavigation() {
    if (location.href === lastUrl) {
      return;
    }

    lastUrl = location.href;

    clearTimeout(fetchTimer);
    fetchTimer = null;

    setTimeout(() => {
      loadConversation();
    }, 1500);
  }

  const navigationObserver = new MutationObserver(() => {
    handleNavigation();
  });

  navigationObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Start
  injectStyle();

  setTimeout(() => {
    loadConversation();
  }, 2000);
})();
