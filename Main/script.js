(function () {
  const container = document.querySelector('.paragraf');
  if (!container) return;

  const article = container.querySelector('article');
  if (!article) return;
  if (!article.dataset.originalHtml) article.dataset.originalHtml = article.innerHTML;

  if (article.querySelector('.char') || article.querySelector('.word')) {
    article.innerHTML = article.dataset.originalHtml;
  }

  const textLen = article.textContent.length;

  function splitChars(node) {
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.nodeValue;
        if (!text) continue;
        const frag = document.createDocumentFragment();
        for (const ch of text) {
          const wrapper = document.createElement('span');
          wrapper.className = 'char';
          const inner = document.createElement('span');
          inner.className = 'inner';
          inner.textContent = ch === ' ' ? '\u00A0' : ch;
          wrapper.appendChild(inner);
          frag.appendChild(wrapper);
        }
        node.replaceChild(frag, child);
        i += frag.childNodes.length - 1;
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        splitChars(child);
      }
    }
  }

  function splitWords(articleNode) {
    const text = articleNode.textContent;
    const parts = text.split(/(\s+)/);
    const frag = document.createDocumentFragment();
    for (const p of parts) {
      if (/^\s+$/.test(p)) {
        frag.appendChild(document.createTextNode(p));
      } else if (p.length === 0) {
        continue;
      } else {
        const wrapper = document.createElement('span');
        wrapper.className = 'word';
        const inner = document.createElement('span');
        inner.className = 'inner';
        inner.textContent = p;
        wrapper.appendChild(inner);
        frag.appendChild(wrapper);
      }
    }
    articleNode.innerHTML = '';
    articleNode.appendChild(frag);
  }

  try {

    if (textLen > 700) {
      splitWords(article);
      var wrappers = Array.from(article.querySelectorAll('.word'));
    } else {
      splitChars(article);
      var wrappers = Array.from(article.querySelectorAll('.char'));
    }

    if (!wrappers.length) return;

    const rects = wrappers.map(p => p.getBoundingClientRect());
    const nodes = wrappers.map((el, i) => ({ el, w: Math.max(6, rects[i].width), h: Math.max(6, rects[i].height) }));

    let targets;
    if (nodes.length <= 500) {
      targets = nodes;
    } else {
      const total = nodes.length;
      const cap = Math.min(300, Math.max(20, Math.floor(total * 0.25)));
      const stride = Math.max(1, Math.floor(total / cap));
      targets = nodes.filter((_, i) => i % stride === 0);
    }

    const nowBase = performance.now();
    for (const n of targets) {
      const capX = Math.max(1, n.w / 1.6);
      const capY = Math.max(1, n.h / 1.6);
      const verticalMultiplier = 6.0;
      const horizontalMultiplier = 3.0;
      n.ampX = (Math.random() * 1.6 + 1.2) * capX * horizontalMultiplier;
      n.ampY = (Math.random() * 2.0 + 1.6) * capY * verticalMultiplier;
      n.phase = Math.random() * Math.PI * 2;
      n.rotAmp = (Math.random() * 2.0 + 1.2) * 18;

      n.el.style.willChange = 'transform';
      n.el.style.zIndex = 80;
      n.el.style.transition = 'none';
      n.el.style.color = '';

      const x0 = (Math.random() * 2 - 1) * n.ampX * 0.6;
      const y0 = (Math.random() * 2 - 1) * n.ampY * 0.6;
      const r0 = (Math.random() * 2 - 1) * n.rotAmp * 0.6;
      n.el.style.transform = `translate3d(${x0.toFixed(2)}px, ${y0.toFixed(2)}px, 0) rotate(${r0.toFixed(2)}deg)`;

      n.nextChange = nowBase + 40 + Math.random() * 220;
      n.currentX = x0; n.currentY = y0; n.currentR = r0;
      n.targetX = x0; n.targetY = y0; n.targetR = r0;
      n.el.style.transition = 'transform 80ms linear';
    }

    const targetFPS = 22;
    const minFrameMs = 1000 / targetFPS;
    let lastFrame = performance.now();
    let loopStarted = false;
    let rafId = null;
    let intervalId = null;

    function update(now) {
      for (const n of targets) {
        if (now >= n.nextChange) {
          n.targetX = (Math.random() * 2 - 1) * n.ampX;
          n.targetY = (Math.random() * 2 - 1) * n.ampY;
          n.targetR = (Math.random() * 2 - 1) * n.rotAmp;
          n.nextChange = now + 40 + Math.random() * 220; 
          n.currentX = n.targetX; n.currentY = n.targetY; n.currentR = n.targetR;
          n.el.style.transform = `translate3d(${n.currentX.toFixed(2)}px, ${n.currentY.toFixed(2)}px, 0) rotate(${n.currentR.toFixed(2)}deg)`;
        }
      }
    }

    function loop(now) {
      loopStarted = true;
      const elapsed = now - lastFrame;
      if (elapsed < minFrameMs) {
        rafId = requestAnimationFrame(loop);
        return;
      }
      lastFrame = now;
      update(now);
      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);

    setTimeout(() => {
      if (!loopStarted && !intervalId) {
        intervalId = setInterval(() => {
          update(performance.now());
        }, minFrameMs);
      }
    }, 300);

    let lastClick = 0;
    container.addEventListener('click', () => {
      const now = performance.now();
      if (now - lastClick < 120) return;
      lastClick = now;
      for (const n of targets) {
        n.ampX = (Math.random() * 0.7 + 0.5) * Math.max(1, n.w / 1.8);
        n.ampY = (Math.random() * 0.6 + 0.4) * Math.max(1, n.h / 1.8);
        n.freq = 0.4 + Math.random() * 1.5;
        n.phase = Math.random() * Math.PI * 2;
        n.rotAmp = (Math.random() * 0.7 + 0.6) * 6;
      }
    });
  } catch (err) {
    console.error('trippy text: fallback due to error', err);
    article.classList.add('effect-fallback');
  }
})();