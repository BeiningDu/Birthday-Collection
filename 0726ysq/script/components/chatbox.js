(function () {
  window.Components = window.Components || {};

  window.Components.chatbox = {
    render(container, section) {
      const div = document.createElement("div");
      div.className = "section section-chatbox";
      div.innerHTML = `
        <div class="text-box">
          <p class="hbd-chatbox"></p>
          <p class="fake-btn">${section.buttonText || "Send"}</p>
        </div>
      `;
      // Split message into individual character spans for typing animation
      const chatbox = div.querySelector(".hbd-chatbox");
      const msg = section.message || "Happy Birthday!";
      chatbox.innerHTML = msg
        .split("")
        .map((ch) => `<span>${ch}</span>`)
        .join("");

      container.appendChild(div);
      return div;
    },

    animate(tl, el) {
      const spans = el.querySelectorAll(".hbd-chatbox span");
      const fakeBtn = el.querySelector(".fake-btn");
      const textBox = el.querySelector(".text-box");
      gsap.set(fakeBtn, { pointerEvents: "none" });

      tl.from(textBox, {
        duration: 0.7, scale: 0.2, opacity: 0,
      })
      .from(fakeBtn, {
        duration: 0.3, scale: 0.2, opacity: 0,
      })
      .to(spans, {
        duration: 1.5, visibility: "visible", stagger: 0.05,
      })
      .addPause("+=0", () => {
        el.style.pointerEvents = "auto";
        fakeBtn.style.pointerEvents = "auto";
        fakeBtn.style.cursor = "pointer";

        fakeBtn.onclick = () => {
          fakeBtn.onclick = null;
          el.style.pointerEvents = "none";
          fakeBtn.style.pointerEvents = "none";
          gsap.to(fakeBtn, { duration: 0.1, backgroundColor: "rgb(127, 206, 248)", scale: 0.95 });
          tl.play();
        };
      })
      .to(fakeBtn, { duration: 0.15, scale: 1 })
      .to(textBox, { duration: 0.5, scale: 0.2, opacity: 0, y: -150, delay: 0.1 });
    },
  };
})();
