/* =========================================================================
   Claude Always Show Message Metadata

   Author      : MITSUISHI Yutaka
   Version     : 1.0.2
   Created     : 2026-08-28
   Updated     : 2026-09-11
   Description : Always shows message timestamps and actions in Claude

   License     : MIT License
                 https://opensource.org/licenses/MIT
   ========================================================================= */

const deferredActionSelector =
  '[data-cds="MessageActions"][data-deferred] button.sr-only';

const hiddenTimeSelector =
  'time[data-cds="RelativeTime"][data-cds-reveal-on-hover]';

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
}

// Process messages already present on the page.
document.querySelectorAll(deferredActionSelector).forEach(button => {
  observeDeferredAction(button);
});

document.querySelectorAll(hiddenTimeSelector).forEach(time => {
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

      if (node.matches(hiddenTimeSelector)) {
        revealTimestamp(node);
      }

      node.querySelectorAll(hiddenTimeSelector).forEach(time => {
        revealTimestamp(time);
      });
    });
  });
});

mutationObserver.observe(document.body, {
  childList: true,
  subtree: true
});
