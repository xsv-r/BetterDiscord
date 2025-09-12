/**
 * @name RoleColorContrast 1.0.0
 * @version 1.0.0
 * @author vari @variare
 * @description lightens role-colors that are too dark against theme background
 */

module.exports = class RoleColorContrast {
      static get SELECTORS() {
            return ".username_c19a55, .name__4eb92, .user__7d04b, .mention__3b95d, .headerText__05c5e, .title__10613";
      }

      constructor() {
            this.observer = new MutationObserver(mutations => {
                  for (const m of mutations) {
                        for (const node of m.addedNodes) {
                              if (node.nodeType !== 1) continue;
                              if (node.matches(RoleColorContrast.SELECTORS)) this.processNode(node);
                              node.querySelectorAll(RoleColorContrast.SELECTORS).forEach(n => this.processNode(n));
                        }
                  }
            });
      }

      start() {
            this.observer.observe(document.body, { childList: true, subtree: true });
            document.querySelectorAll(RoleColorContrast.SELECTORS).forEach(n => this.processNode(n));
      }

      stop() {
            this.observer.disconnect();
      }

      processNode(node) {
            // skip nodes that don't have an inline color
            if (!node.style.color) return;

            const rgb = getComputedStyle(node).color.match(/\d+/g).map(Number);
            const lum = RoleColorContrast.luminance(rgb);

            // bump up super dark colors so they're readable on dark themes (if below threshold (5%), lighten it (33%))
            if (lum < 0.05) {
                  const lighter = RoleColorContrast.lighten(rgb, 0.33);
                  node.style.color = `rgb(${lighter.join(",")})`;
            }
      }

      // W3C relative luminance formula 
      static luminance([r, g, b]) {
            const C = [r, g, b].map(v => {
                  v /= 255;
                  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
            });
            return 0.2126 * C[0] + 0.7152 * C[1] + 0.0722 * C[2];
      }

      // RGB -> HSL -> lighten -> RGB conversion
      static lighten([r, g, b], amount) {
            r /= 255; g /= 255; b /= 255;
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            let h, s, l = (max + min) / 2;

            if (max === min) {
                  h = s = 0;
            } else {
                  const d = max - min;
                  s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                  switch (max) {
                        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                        case g: h = (b - r) / d + 2; break;
                        case b: h = (r - g) / d + 4; break;
                  }
                  h /= 6;
            }

            l = Math.min(1, l + amount);

            if (s === 0) {
                  r = g = b = l;
            } else {
                  const hue2rgb = (p, q, t) => {
                        if (t < 0) t += 1;
                        if (t > 1) t -= 1;
                        if (t < 1 / 6) return p + (q - p) * 6 * t;
                        if (t < 1 / 2) return q;
                        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                        return p;
                  };
                  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                  const p = 2 * l - q;
                  r = hue2rgb(p, q, h + 1 / 3);
                  g = hue2rgb(p, q, h);
                  b = hue2rgb(p, q, h - 1 / 3);
            }

            return [r, g, b].map(c => Math.round(c * 255));
      }

};
