/* =========================================================================
   Claude Chat Title on Delete

   Author      : MITSUISHI Yutaka
   Version     : 1.0.0
   Created     : 2026-08-08
   Updated     : 2026-08-08
   Description : Shows the chat title in Claude's delete confirmation dialog

   License     : MIT License
                 https://opensource.org/licenses/MIT
   ========================================================================= */

const observer = new MutationObserver(() => {
  // Find the delete confirmation dialog.
  const dialog = document.querySelector('[role="alertdialog"]');

  // Do nothing if the dialog is not open or the title has already been added.
  if (!dialog || dialog.querySelector('.claude-chat-title-on-delete')) {
    return;
  }

  // Find the delete confirmation message.
  const message = [...dialog.querySelectorAll('p')]
    .find(el =>
      el.textContent?.trim() === 'このチャットを削除してもよろしいですか？'
    );

  if (!message) {
    return;
  }

  // Find the current chat in the sidebar.
  const chatLink = document.querySelector(
    `a[href="${location.pathname}"]`
  );

  // Get the chat title.
  const title = chatLink
    ?.querySelector('.block.truncate')
    ?.textContent
    ?.trim();

  if (!title) {
    return;
  }

  // Add the chat title below the confirmation message.
  const titleElement = document.createElement('p');
  titleElement.className = 'claude-chat-title-on-delete';
  titleElement.textContent = `「${title}」`;
  titleElement.style.fontWeight = 'bold';
  titleElement.style.marginTop = '8px';

  message.after(titleElement);
});

// Watch for Claude opening the delete confirmation dialog.
observer.observe(document.body, {
  childList: true,
  subtree: true
});
