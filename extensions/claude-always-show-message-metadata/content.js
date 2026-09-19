/* =========================================================================
   Claude Always Show Message Metadata

   Author      : MITSUISHI Yutaka
   Version     : 1.0.3
   Created     : 2026-08-28
   Updated     : 2026-09-19
   Description : Always shows message timestamps and actions in Claude

   License     : MIT License
                 https://opensource.org/licenses/MIT
   ========================================================================= */

// Timestamp display mode:
// false = Claude's original display (e.g. "2時間前", "9月4日")
// true  = Full date and time (e.g. "2026年9月4日 19:10")
const SHOW_FULL_TIMESTAMP = true;

const deferredActionSelector =
  '[data-cds="MessageActions"][data-deferred] button.sr-only';

const timestampSelector =
  'time[data-cds="RelativeTime"]';

// Reveal metadata when a deferred action enters the viewport.
const intersectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) {
      return;
    }

    const button = entry.target;

    intersectionObserver.unobserve(button);

    if (button.isConnected) {
      button.click();
    }
  });
});

// Watch a deferred message action until it enters the viewport.
function observeDeferredAction(button) {
  intersectionObserver.observe(button);
}

// Always show a message timestamp.
function revealTimestamp(time) {
  time.removeAttribute("data-cds-reveal-on-hover");

  if (!SHOW_FULL_TIMESTAMP) {
    return;
  }

  const originalText = time.textContent.trim();
  const date = new Date(time.dateTime);

  const fullText = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);

  time.textContent = `${fullText} (${originalText})`;
}

// Process messages already present on the page.
document.querySelectorAll(deferredActionSelector).forEach(button => {
  observeDeferredAction(button);
});

document.querySelectorAll(timestampSelector).forEach(time => {
  revealTimestamp(time);
});

// Watch for message metadata added later.
const mutationObserver = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (!(node instanceof Element)) {
        return;
      }

      if (node.matches(deferredActionSelector)) {
        observeDeferredAction(node);
      } else {
        node.querySelectorAll(deferredActionSelector).forEach(button => {
          observeDeferredAction(button);
        });
      }

      if (node.matches(timestampSelector)) {
        revealTimestamp(node);
      }

      node.querySelectorAll(timestampSelector).forEach(time => {
        revealTimestamp(time);
      });
    });
  });
});

mutationObserver.observe(document.body, {
  childList: true,
  subtree: true
});
