/* =========================================================================
   Claude Chat Title on Delete

   Author      : MITSUISHI Yutaka
   Version     : 1.0.1
   Created     : 2026-08-08
   Updated     : 2026-08-17
   Description : Shows the chat title in Claude's delete confirmation dialog

   License     : MIT License
                 https://opensource.org/licenses/MIT
   ========================================================================= */

let targetChatTitle = null;

// Remember the chat title when its options button is clicked.
document.addEventListener('click', event => {
  const button = event.target.closest?.(
    'button[aria-label$="のその他のオプション"]'
  );

  if (!button) {
    return;
  }

  targetChatTitle = button
    .getAttribute('aria-label')
    .replace(/のその他のオプション$/, '');
}, true);

// Show the remembered chat title in the delete confirmation dialog.
const observer = new MutationObserver(() => {
  const dialog = document.querySelector('[role="alertdialog"]');

  if (
    !dialog ||
    !targetChatTitle ||
    dialog.querySelector('.claude-chat-title-on-delete')
  ) {
    return;
  }

  const message = [...dialog.querySelectorAll('p')]
    .find(el =>
      el.textContent?.trim() === 'このチャットを削除してもよろしいですか？'
    );

  if (!message) {
    return;
  }

  const titleElement = document.createElement('p');
  titleElement.className = 'claude-chat-title-on-delete';
  titleElement.textContent = `「${targetChatTitle}」`;
  titleElement.style.fontWeight = 'bold';
  titleElement.style.marginTop = '8px';

  message.after(titleElement);
});

// Watch for Claude opening the delete confirmation dialog.
observer.observe(document.body, {
  childList: true,
  subtree: true
});
