// TODO: create some sort of build system to compile this file

/*
// whenever user clicks on element with data-goto attribute, scroll to that message
document.addEventListener('click', (e) => {
  const target = e.target;
  if(!target) return;

  const goto = target?.getAttribute('data-goto');

  if (goto) {
    const message = document.getElementById(`m-\${goto}`);
    if (message) {
      message.scrollIntoView({ behavior: 'smooth', block: 'center' });
      message.style.backgroundColor = 'rgba(148, 156, 247, 0.1)';
      message.style.transition = 'background-color 0.5s ease';
      setTimeout(() => {
        message.style.backgroundColor = 'transparent';
      }, 1000);
    } else {
      console.warn(`Message \${goto} not found.`);
    }
  }
});
*/
export const scrollToMessage =
  'document.addEventListener("click",t=>{let e=t.target;if(!e)return;let o=e?.getAttribute("data-goto");if(o){let r=document.getElementById(`m-${o}`);r?(r.scrollIntoView({behavior:"smooth",block:"center"}),r.style.backgroundColor="rgba(148, 156, 247, 0.1)",r.style.transition="background-color 0.5s ease",setTimeout(()=>{r.style.backgroundColor="transparent"},1e3)):console.warn("Message ${goto} not found.")}});';

export const revealSpoiler =
  'const s=document.querySelectorAll(".discord-spoiler");s.forEach(s=>s.addEventListener("click",()=>{if(s.classList.contains("discord-spoiler")){s.classList.remove("discord-spoiler");s.classList.add("discord-spoiler--revealed");}}));';

export const formatDiscordTimestamps = `
  (() => {
    const dateOptions = {
      t: { hour: 'numeric', minute: '2-digit' },
      T: { hour: 'numeric', minute: '2-digit', second: '2-digit' },
      d: { month: 'numeric', day: 'numeric', year: 'numeric' },
      D: { month: 'long', day: 'numeric', year: 'numeric' },
      f: { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' },
      F: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' },
    };
    const relativeUnits = [
      ['year', 31536000], ['month', 2592000], ['day', 86400],
      ['hour', 3600], ['minute', 60], ['second', 1],
    ];
    const relativeFormatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
    const localDateFormatter = new Intl.DateTimeFormat(undefined, {
      dateStyle: 'full', timeStyle: 'long',
    });

    const renderTimestamp = (element) => {
      const epoch = Number(element.dataset.epoch);
      if (!Number.isFinite(epoch)) return;
      const date = new Date(epoch * 1000);
      const format = element.dataset.format || 'f';
      let text;

      if (format === 'R') {
        const delta = (date.getTime() - Date.now()) / 1000;
        const [unit, seconds] = relativeUnits.find(([, size]) => Math.abs(delta) >= size) ?? relativeUnits.at(-1);
        text = relativeFormatter.format(Math.round(delta / seconds), unit);
      } else {
        text = new Intl.DateTimeFormat(undefined, dateOptions[format] ?? dateOptions.f).format(date);
      }

      const detail = localDateFormatter.format(date);
      element.textContent = text;
      element.dataset.tooltip = detail;
      element.dateTime = date.toISOString();
      element.setAttribute('aria-label', detail);
    };

    const renderMessageTimestamp = (message) => {
      const date = new Date(message.getAttribute('timestamp'));
      if (Number.isNaN(date.getTime())) return;
      const time = message.shadowRoot?.querySelector('.discord-message-timestamp');
      if (!time) return;
      const text = new Intl.DateTimeFormat(undefined, {
        dateStyle: 'short', timeStyle: 'short',
      }).format(date);
      const detail = localDateFormatter.format(date);
      if (time.textContent !== text) time.textContent = text;
      if (time.dateTime !== date.toISOString()) time.dateTime = date.toISOString();
      if (time.title !== detail) time.title = detail;
      if (time.getAttribute('aria-label') !== detail) time.setAttribute('aria-label', detail);
    };

    document.querySelectorAll('.discord-timestamp').forEach(renderTimestamp);
    const observedMessages = new WeakSet();
    const localizeMessageTimestamps = (message) => {
      if (observedMessages.has(message)) return;
      observedMessages.add(message);

      const update = () => renderMessageTimestamp(message);
      customElements.whenDefined('discord-message').then(() => {
        message.updateComplete?.then(() => {
          update();
          if (message.shadowRoot) {
            new MutationObserver(update).observe(message.shadowRoot, { childList: true, subtree: true });
          }
        });
      });
    };
    const findMessageTimestamps = () => {
      document.querySelectorAll('discord-message[timestamp]').forEach(localizeMessageTimestamps);
    };
    findMessageTimestamps();
    new MutationObserver(findMessageTimestamps).observe(document.body, { childList: true, subtree: true });
    document.addEventListener('click', (event) => {
      const timestamp = event.target.closest?.('.discord-timestamp');
      document.querySelectorAll('.discord-timestamp[data-tooltip-visible="true"]').forEach((item) => {
        if (item !== timestamp) item.dataset.tooltipVisible = 'false';
      });
      if (timestamp) {
        timestamp.dataset.tooltipVisible = timestamp.dataset.tooltipVisible !== 'true' ? 'true' : 'false';
      }
    });
    document.addEventListener('keydown', (event) => {
      if ((event.key === 'Enter' || event.key === ' ') && event.target.matches?.('.discord-timestamp')) {
        event.preventDefault();
        event.target.dataset.tooltipVisible = event.target.dataset.tooltipVisible !== 'true' ? 'true' : 'false';
      }
    });
  })();
`;

export const ggSansFont =
  '@font-face{src:url(https://cdn.jsdelivr.net/gh/Tyrrrz/DiscordFonts@master/ggsans-normal-400.woff2);font-family:"gg sans";font-weight:400;font-style:normal}@font-face{src:url(https://cdn.jsdelivr.net/gh/Tyrrrz/DiscordFonts@master/ggsans-normal-500.woff2);font-family:"gg sans";font-weight:500;font-style:normal}@font-face{src:url(https://cdn.jsdelivr.net/gh/Tyrrrz/DiscordFonts@master/ggsans-normal-600.woff2);font-family:"gg sans";font-weight:600;font-style:normal}@font-face{src:url(https://cdn.jsdelivr.net/gh/Tyrrrz/DiscordFonts@master/ggsans-normal-700.woff2);font-family:"gg sans";font-weight:700;font-style:normal}@font-face{src:url(https://cdn.jsdelivr.net/gh/Tyrrrz/DiscordFonts@master/ggsans-normal-800.woff2);font-family:"gg sans";font-weight:800;font-style:normal}@font-face{src:url(https://cdn.jsdelivr.net/gh/Tyrrrz/DiscordFonts@master/ggsans-italic-400.woff2);font-family:"gg sans";font-weight:400;font-style:italic}@font-face{src:url(https://cdn.jsdelivr.net/gh/Tyrrrz/DiscordFonts@master/ggsans-italic-500.woff2);font-family:"gg sans";font-weight:500;font-style:italic}@font-face{src:url(https://cdn.jsdelivr.net/gh/Tyrrrz/DiscordFonts@master/ggsans-italic-600.woff2);font-family:"gg sans";font-weight:600;font-style:italic}@font-face{src:url(https://cdn.jsdelivr.net/gh/Tyrrrz/DiscordFonts@master/ggsans-italic-700.woff2);font-family:"gg sans";font-weight:700;font-style:italic}@font-face{src:url(https://cdn.jsdelivr.net/gh/Tyrrrz/DiscordFonts@master/ggsans-italic-800.woff2);font-family:"gg sans";font-weight:800;font-style:italic}';
