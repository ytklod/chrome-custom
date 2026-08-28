/* =========================================================================
   Claude Always Show Message Metadata

   Author      : MITSUISHI Yutaka
   Version     : 1.0.0
   Created     : 2026-08-28
   Updated     : 2026-08-28
   Description : Always shows message timestamps and actions in Claude

   License     : MIT License
                 https://opensource.org/licenses/MIT
   ========================================================================= */

// Trigger Claude to render metadata for deferred message actions.
function revealMessageMetadata() {
  document.querySelectorAll(
    '[data-cds="MessageActions"][data-deferred] button.sr-only'
  ).forEach(button => {
    button.focus({ focusVisible: true });
  });
}

// Process messages already present on the page.
revealMessageMetadata();

// Process messages added when navigating between chats.
const observer = new MutationObserver(() => {
  revealMessageMetadata();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
