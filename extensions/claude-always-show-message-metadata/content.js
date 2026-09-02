/* =========================================================================
   Claude Always Show Message Metadata

   Author      : MITSUISHI Yutaka
   Version     : 1.0.1
   Created     : 2026-08-28
   Updated     : 2026-09-02
   Description : Always shows message timestamps and actions in Claude

   License     : MIT License
                 https://opensource.org/licenses/MIT
   ========================================================================= */

const deferredActionSelector =
  '[data-cds="MessageActions"][data-deferred] button.sr-only';

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

// Process messages already present on the page.
document.querySelectorAll(deferredActionSelector).forEach(button => {
  observeDeferredAction(button);
});

// Watch for deferred message actions added later.
const mutationObserver = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (!(node instanceof Element)) {
        return;
      }

      if (node.matches(deferredActionSelector)) {
        observeDeferredAction(node);
        return;
      }

      node.querySelectorAll(deferredActionSelector).forEach(button => {
        observeDeferredAction(button);
      });
    });
  });
});

mutationObserver.observe(document.body, {
  childList: true,
  subtree: true
});