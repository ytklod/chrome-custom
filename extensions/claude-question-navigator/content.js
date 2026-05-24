/* =========================================================================
   Claude Question Navigator

   Author      : MITSUISHI Yutaka
   Version     : 1.0.0
   Created     : 2026-05-22
   Updated     : 2026-05-22
   Description : Adds previous/next navigation controls
                 to Claude user questions

   License     : MIT License
                 https://opensource.org/licenses/MIT
   ========================================================================= */

console.log("Extension loaded");

// Find the actual scrollable container used by Claude
function findScrollableElement() {
  const elements = [...document.querySelectorAll("*")];

  return elements.find(el => {
    const style = getComputedStyle(el);

    return (
      (style.overflowY === "auto" ||
       style.overflowY === "scroll") &&
      el.scrollHeight > el.clientHeight
    );
  });
}

// Scroll the container so the target message appears near the top
function scrollToMessage(element) {
  const scrollable = findScrollableElement();

  if (!scrollable) {
    return;
  }

  const rect = element.getBoundingClientRect();
  const parentRect = scrollable.getBoundingClientRect();

  const y =
    scrollable.scrollTop +
    rect.top -
    parentRect.top -
    40;

  scrollable.scrollTop = y;
}

// Add navigation controls to user questions
function enhanceMessages() {
  const messages = [
    ...document.querySelectorAll('[data-testid="user-message"]')
  ];

  messages.forEach((msg, index) => {
    if (msg.dataset.enhanced === "true") {
        const prevBtn = msg.querySelector(".my-prev-btn");
        const nextBtn = msg.querySelector(".my-next-btn");
        const numberLabel =
            msg.querySelector(".my-number-label");

        if (prevBtn) {
            prevBtn.disabled = index === 0;
            prevBtn.style.opacity =
                prevBtn.disabled ? "0.4" : "1";
        }

        if (nextBtn) {
            nextBtn.disabled =
                index === messages.length - 1;

            nextBtn.style.opacity =
                nextBtn.disabled ? "0.4" : "1";
        }

        if (numberLabel) {
            numberLabel.textContent =
                `${index + 1} / ${messages.length}`;
        }

        return;
    }

    msg.dataset.enhanced = "true";

    Object.assign(msg.style, {
        position: "relative",
        minWidth: "90px",
        paddingTop: "28px"
    });

    const nav = document.createElement("div");

    const prevBtn = document.createElement("button");
    prevBtn.className = "my-prev-btn"
    prevBtn.textContent = "↑";

    const numberLabel = document.createElement("div");
    numberLabel.className = "my-number-label";
    numberLabel.textContent =
        `${index + 1} / ${messages.length}`;

    const nextBtn = document.createElement("button");
    nextBtn.className = "my-next-btn";
    nextBtn.textContent = "↓";

    Object.assign(nav.style, {
      position: "absolute",
      top: "0px",
      right: "0px",
      display: "flex",
      justifyContent: "flex-end",
      width: "100%",
      gap: "4px",
      zIndex: "10"
    });

    nav.onmouseenter = () => {
      nav.style.opacity = "1";
    };

    nav.onmouseleave = () => {
      nav.style.opacity = "0.7";
    };

    Object.assign(numberLabel.style, {
        fontSize: "10px",
        lineHeight: "20px",
        padding: "0 2px",
        color: "#666",
        userSelect: "none"
    });

    [prevBtn, nextBtn].forEach(btn => {
      Object.assign(btn.style, {
        border: "1px solid #222",
        borderRadius: "4px",
        padding: "1px 5px",
        fontSize: "10px",
        lineHeight: "1",
        height: "20px",
        cursor: "pointer",
        background: "#fff",
        color: "#000"
      });
    });

    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === messages.length - 1;

    [prevBtn, nextBtn].forEach(btn => {
        if (btn.disabled) {
            btn.style.opacity = "0.3";
            btn.style.cursor = "default";
        }
    });

    prevBtn.onclick = () => {
        if (prevBtn.disabled) {
            return;
        }

        const currentMessages = [
            ...document.querySelectorAll('[data-testid="user-message"]')
        ];

        const currentIndex =
            currentMessages.indexOf(msg);

        if (currentIndex > 0) {
            scrollToMessage(
                currentMessages[currentIndex - 1]
            );
        }
    };

    nextBtn.onclick = () => {
        if (nextBtn.disabled) {
            return;
        }

        const currentMessages = [
            ...document.querySelectorAll('[data-testid="user-message"]')
        ];

        const currentIndex =
            currentMessages.indexOf(msg);

        if (
            currentIndex < currentMessages.length - 1
        ) {
            scrollToMessage(
                currentMessages[currentIndex + 1]
            );
        }
    };

    nav.appendChild(prevBtn);
    nav.appendChild(numberLabel);
    nav.appendChild(nextBtn);

    msg.appendChild(nav);
  });
}

setInterval(enhanceMessages, 500);
