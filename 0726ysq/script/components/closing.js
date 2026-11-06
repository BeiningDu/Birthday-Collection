(function () {
  window.Components = window.Components || {};

  window.Components.closing = {
    render(container, section) {
      const div = document.createElement("div");
      div.className = "section section-closing";
      const ackLines = section.ack || [];
      const ackHtml = ackLines
        .map((line) => `<p class="closing-ack-line">${line}</p>`)
        .join("");
      
      div.innerHTML = `
        <p class="closing-text">${
          section.text || "Okay, now come back and tell me if you liked it."
        }</p>
        <div class="closing-ack-container">${ackHtml}</div>
        <p class="replay-btn" id="replay">${
          section.replayText || "Or click, if you want to watch it again."
        }</p>
        <p class="last-smile">:D</p>
      `;
      container.appendChild(div);
      return div;
    },

    animate(tl, el) {
      const ideaIn = { opacity: 0, y: -20, rotationX: 5, skewX: "15deg" };
      const closingText = el.querySelector(".closing-text");
      const ackLines = el.querySelectorAll(".closing-ack-line");
      const replayBtn = el.querySelector("#replay");
      const lastSmile = el.querySelector(".last-smile");
      gsap.set(replayBtn, { pointerEvents: "none", display: "none" });
      gsap.set(lastSmile, { display: "none" });

      tl.from(closingText, {
        duration: 1, ...ideaIn,
      })
      .to(closingText, {
        duration: 0.8, opacity: 0, y: -20, delay: 2,
        onComplete: () => {
          closingText.style.display = "none";
        }
      })

      if (ackLines.length > 0) {
        gsap.set(ackLines, { display: "none", opacity: 0 });
      }

      if (ackLines.length > 0) {
        tl.set(ackLines, { display: "block" })
          .fromTo(ackLines, 
            { opacity: 0, y: 20, rotationX: 5, skewX: "15deg" },
            { opacity: 1, y: 0, rotationX: 0, skewX: "0deg", duration: 0.8, stagger: 0.5 }
          )
          .to(ackLines, {
            duration: 0.8,
            opacity: 0,
            y: -20,
            stagger: 0.3,
            delay: 1.5,
            onComplete: () => {
              ackLines.forEach(line => line.style.display = "none");
            }
          });
      }

      tl.set([replayBtn, lastSmile], { display: "block" })
      .from(replayBtn, { duration: 1, ...ideaIn })
      .from(lastSmile, { duration: 0.8, opacity: 0, scale: 0.5 }, "-=0.3")
      .set(replayBtn, { pointerEvents: "auto", cursor: "pointer" })
      .to(lastSmile, {
        duration: 0.5, rotation: 90,
      }, "+=1");
    },
  };
})();
