/* =========================================================================
   KINET OS · motor de documentos PDF (v40)
   Un único sitio para que TODOS los PDF de la app tengan la misma estructura profesional:
   cabecera KINET, título, secciones numeradas, tablas con filas alternas, avisos, pie con paginación.
   - Texto vectorial real (seleccionable, pesa KBs, no una foto aplastada de 20 MB).
   - Salto de página automático (cada sección y cada fila de tabla), con la cabecera de tabla repetida.
   - Capturas de pantalla (html2canvas) sin error de imágenes externas y SIN deformar la proporción.
   API:  KinetPDF.plan(opts)  ·  KinetPDF.chat(opts)  ·  KinetPDF.create(opts)  ·  KinetPDF.capture(el, opts)
   ========================================================================= */
(function () {
  'use strict';
  if (window.KinetPDF) return;

  var PAPER = [255, 255, 255], INK = [15, 23, 42], TEXT = [30, 41, 59], MUTE = [100, 116, 139], LINE = [214, 222, 233], SOFT = [244, 247, 251], NAVY = [8, 12, 22];
  var CP1252 = { 0x20AC: 1, 0x201A: 1, 0x0192: 1, 0x201E: 1, 0x2026: 1, 0x2020: 1, 0x2021: 1, 0x02C6: 1, 0x2030: 1, 0x0160: 1, 0x2039: 1, 0x0152: 1, 0x017D: 1, 0x2018: 1, 0x2019: 1, 0x201C: 1, 0x201D: 1, 0x2022: 1, 0x2013: 1, 0x2014: 1, 0x02DC: 1, 0x2122: 1, 0x0161: 1, 0x203A: 1, 0x0153: 1, 0x017E: 1, 0x0178: 1 };

  /* Las fuentes estándar de PDF solo entienden Latin-1: se limpian emojis y símbolos para que NUNCA salgan caracteres rotos */
  function safe(t) {
    t = String(t == null ? '' : t)
      .replace(/→|⇒|➡/g, '->').replace(/←/g, '<-').replace(/≥/g, '>=').replace(/≤/g, '<=').replace(/≈/g, '~')
      .replace(/[✓✔✅☑]/g, '').replace(/[●○▪▫■□]/g, '•').replace(/ /g, ' ')
      .replace(/\*\*(.+?)\*\*/g, '$1').replace(/__(.+?)__/g, '$1').replace(/`([^`]+)`/g, '$1');
    var out = '';
    for (var i = 0; i < t.length; i++) {
      var c = t.charCodeAt(i);
      if (c === 10) { out += '\n'; continue; }
      if (c < 32) continue;
      if (c <= 255 || CP1252[c]) out += t.charAt(i);
      else if (c >= 0xD800 && c <= 0xDFFF) { /* mitades de emoji */ }
    }
    return out.replace(/[ \t]{2,}/g, ' ');
  }
  function rgbOf(a) {
    if (a && a.length === 3) return a;
    try {
      var v = getComputedStyle(document.body).getPropertyValue('--role-rgb').trim().split(',').map(function (n) { return parseInt(n, 10); });
      if (v.length === 3 && v.every(function (n) { return n >= 0 && n <= 255; })) return v;
    } catch (e) {}
    return [0, 255, 136];
  }
  function dark(c, k) { return [Math.round(c[0] * k), Math.round(c[1] * k), Math.round(c[2] * k)]; }
  function tint(c, k) { return [Math.round(255 - (255 - c[0]) * k), Math.round(255 - (255 - c[1]) * k), Math.round(255 - (255 - c[2]) * k)]; }
  function ls(k, d) { try { return localStorage.getItem(k) || d || ''; } catch (e) { return d || ''; } }
  function today() { return new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }); }

  /* ───────────────────────── Documento ───────────────────────── */
  function Doc(o) {
    o = o || {};
    var J = window.jspdf && window.jspdf.jsPDF;
    if (!J) throw new Error('jsPDF no está cargado');
    this.o = o;
    this.land = o.orientation === 'landscape';
    this.pdf = new J({ orientation: this.land ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
    this.W = this.land ? 297 : 210; this.H = this.land ? 210 : 297;
    this.mx = 14; this.bottom = 18;
    this.acc = rgbOf(o.accent); this.accT = dark(this.acc, 0.55);
    this.y = 0; this.n = 0; this.secN = 0;
    try { this.pdf.setLineHeightFactor(1.38); } catch (e) {}
    this.pdf.setProperties({ title: safe(o.title || 'KINET OS'), author: 'KINET OS', creator: 'KINET OS · kinetos.es' });
    this.page(true);
  }
  var P = Doc.prototype;
  P.cw = function () { return this.W - this.mx * 2; };
  P.setFont = function (style, size, color) { this.pdf.setFont('helvetica', style || 'normal'); this.pdf.setFontSize(size || 9); if (color) this.pdf.setTextColor(color[0], color[1], color[2]); };
  P.fill = function (c) { this.pdf.setFillColor(c[0], c[1], c[2]); };
  P.stroke = function (c, w) { this.pdf.setDrawColor(c[0], c[1], c[2]); this.pdf.setLineWidth(w || 0.2); };
  P.lh = function (size) { return size * 0.3528 * 1.38; };
  P.lines = function (txt, w, size, style) { this.pdf.setFont('helvetica', style || 'normal'); this.pdf.setFontSize(size); return this.pdf.splitTextToSize(safe(txt), w); };

  // Cabecera: completa en la primera página, delgada en las siguientes
  P.page = function (first) {
    var pdf = this.pdf, o = this.o;
    if (!first) pdf.addPage();
    this.n++;
    this.fill(PAPER); pdf.rect(0, 0, this.W, this.H, 'F');
    if (first) {
      this.fill(NAVY); pdf.rect(0, 0, this.W, 34, 'F');
      this.fill(this.acc); pdf.rect(0, 34, this.W, 1.3, 'F');
      this.fill(this.acc); pdf.roundedRect(this.mx, 8.5, 14, 14, 3.2, 3.2, 'F');
      this.setFont('bold', 14, [4, 6, 10]); pdf.text('K', this.mx + 7, 18.1, { align: 'center' });
      this.setFont('bold', 15, [255, 255, 255]); pdf.text('KINET OS', this.mx + 19, 15.2);
      this.setFont('bold', 6.6, this.acc); pdf.text(safe(o.tag || 'DOCUMENTO OFICIAL').toUpperCase(), this.mx + 19, 20.6);
      var rx = this.W - this.mx;
      if (o.athlete && o.athlete.name) {
        this.setFont('bold', 9, [255, 255, 255]); pdf.text(safe(o.athlete.name).toUpperCase(), rx, 14.2, { align: 'right' });
        this.setFont('normal', 7.2, [170, 184, 204]);
        if (o.athlete.sub) pdf.text(safe(o.athlete.sub), rx, 19.4, { align: 'right' });
      }
      this.setFont('normal', 7.2, [140, 156, 180]); pdf.text(today(), rx, 25.4, { align: 'right' });
      this.y = 45;
      if (o.title) {
        this.setFont('bold', 17, INK); var tl = pdf.splitTextToSize(safe(o.title), this.cw());
        pdf.text(tl, this.mx, this.y); this.y += tl.length * 7;
        if (o.subtitle) { this.setFont('normal', 9, MUTE); var sl = pdf.splitTextToSize(safe(o.subtitle), this.cw()); pdf.text(sl, this.mx, this.y); this.y += sl.length * 4.3; }
        this.fill(this.acc); pdf.rect(this.mx, this.y + 1, 22, 1.1, 'F'); this.y += 7;
      }
    } else {
      this.fill(NAVY); pdf.rect(0, 0, this.W, 11, 'F'); this.fill(this.acc); pdf.rect(0, 11, this.W, 0.7, 'F');
      this.setFont('bold', 8, [255, 255, 255]); pdf.text('KINET OS', this.mx, 7.2);
      this.setFont('normal', 7, [170, 184, 204]); pdf.text(safe(o.title || o.tag || ''), this.W - this.mx, 7.2, { align: 'right' });
      this.y = 20;
    }
  };
  P.ensure = function (h) { if (this.y + h > this.H - this.bottom) this.page(false); };
  P.gap = function (h) { this.y += h; };

  P.heading = function (txt, o) {
    o = o || {}; var pdf = this.pdf; this.ensure(o.keep || 34); this.y += 3; this.secN++;
    var n = o.number === false ? '' : String(this.secN).padStart(2, '0');
    this.fill(this.acc); pdf.roundedRect(this.mx, this.y - 4.4, 1.6, 6.4, 0.6, 0.6, 'F');
    var x = this.mx + 4.5;
    if (n) { this.setFont('bold', 8, this.accT); pdf.text(n, x, this.y); x += 7; }
    this.setFont('bold', 10.4, INK); pdf.text(safe(txt).toUpperCase(), x, this.y);
    if (o.chip) {
      var cw = Math.max(14, pdf.getTextWidth(safe(o.chip)) + 7);
      this.setFont('bold', 7, this.accT); var chipTxt = safe(o.chip);
      cw = pdf.getTextWidth(chipTxt) + 7;
      var cx = this.W - this.mx - cw;
      this.fill(tint(this.acc, 0.16)); this.stroke(tint(this.acc, 0.5), 0.25); pdf.roundedRect(cx, this.y - 4.6, cw, 6.2, 3.1, 3.1, 'FD');
      pdf.text(chipTxt, cx + cw / 2, this.y - 0.3, { align: 'center' });
    }
    this.stroke(LINE, 0.25); pdf.line(this.mx, this.y + 2.6, this.W - this.mx, this.y + 2.6);
    this.y += 7.2;
  };

  P.paragraph = function (txt, o) {
    o = o || {}; var size = o.size || 9.2, w = o.w || this.cw(), x = o.x == null ? this.mx : o.x;
    this.setFont(o.bold ? 'bold' : 'normal', size, o.color || TEXT);
    var ls_ = this.pdf.splitTextToSize(safe(txt), w), lh = this.lh(size);
    for (var i = 0; i < ls_.length; i++) { this.ensure(lh + 1); this.pdf.text(ls_[i], x, this.y); this.y += lh; }
    this.y += o.gap == null ? 2 : o.gap;
  };

  P.bullets = function (items, o) {
    o = o || {}; var size = o.size || 9, lh = this.lh(size), pdf = this.pdf, ind = 5, w = this.cw() - ind - 2;
    items.forEach(function (it) {
      var ln = this.lines(it, w, size); this.ensure(ln.length * lh + 1.5);
      this.fill(o.color || this.acc); pdf.rect(this.mx + 1, this.y - 2.2, 1.7, 1.7, 'F');
      this.setFont('normal', size, TEXT); pdf.text(ln, this.mx + ind, this.y); this.y += ln.length * lh + 1.6;
    }, this);
    this.y += 1.5;
  };

  P.callout = function (txt, o) {
    o = o || {}; var pdf = this.pdf, size = 8.8, lh = this.lh(size), col = o.color || this.acc, pad = 4;
    var title = o.title ? safe(o.title).toUpperCase() : '';
    var ln = this.lines(txt, this.cw() - pad * 2 - 3, size);
    var h = ln.length * lh + pad * 2 + (title ? 5 : 0);
    this.ensure(Math.min(h, 40));
    // si no cabe entera, se parte por líneas manteniendo el recuadro por tramos
    var i = 0, first = true;
    while (i < ln.length) {
      var room = this.H - this.bottom - this.y - pad * 2 - (first && title ? 5 : 0);
      var take = Math.max(1, Math.min(ln.length - i, Math.floor(room / lh)));
      var seg = ln.slice(i, i + take), bh = seg.length * lh + pad * 2 + (first && title ? 5 : 0);
      this.fill(tint(col, 0.1)); this.stroke(tint(col, 0.4), 0.25); pdf.roundedRect(this.mx, this.y, this.cw(), bh, 2, 2, 'FD');
      this.fill(col); pdf.roundedRect(this.mx, this.y, 1.8, bh, 0.9, 0.9, 'F');
      var ty = this.y + pad + 3;
      if (first && title) { this.setFont('bold', 7.4, dark(col, 0.55)); pdf.text(title, this.mx + pad + 2, ty); ty += 5; }
      this.setFont('normal', size, TEXT); pdf.text(seg, this.mx + pad + 2, ty);
      this.y += bh + 2.5; i += take; first = false;
      if (i < ln.length) this.page(false);
    }
    this.y += 1;
  };

  // Pares etiqueta/valor en cuadrícula de N columnas
  P.kv = function (pairs, cols) {
    cols = cols || 2; var pdf = this.pdf, gap = 3, w = (this.cw() - gap * (cols - 1)) / cols, rows = [];
    for (var i = 0; i < pairs.length; i += cols) rows.push(pairs.slice(i, i + cols));
    rows.forEach(function (row) {
      var hs = row.map(function (p) { return this.lines(p[1], w - 7, 9, 'bold').length; }, this), h = Math.max.apply(null, hs) * this.lh(9) + 11;
      this.ensure(h + 2);
      row.forEach(function (p, ci) {
        var x = this.mx + ci * (w + gap);
        this.fill(SOFT); this.stroke(LINE, 0.22); pdf.roundedRect(x, this.y, w, h, 2, 2, 'FD');
        this.fill(this.acc); pdf.rect(x + 0.4, this.y + 2.4, 1.1, h - 4.8, 'F');
        this.setFont('bold', 6.4, MUTE); pdf.text(safe(p[0]).toUpperCase(), x + 4.2, this.y + 4.6);
        this.setFont('bold', 9, INK); pdf.text(this.lines(p[1], w - 7, 9, 'bold'), x + 4.2, this.y + 9.4);
      }, this);
      this.y += h + gap;
    }, this);
    this.y += 1.5;
  };

  // Tabla con cabecera oscura, filas alternas y repetición de cabecera al saltar de página
  P.table = function (cols, rows, o) {
    o = o || {}; var pdf = this.pdf, size = o.size || 8.6, lh = this.lh(size), padX = 2.6, padY = 2.2, total = cols.reduce(function (a, c) { return a + (c.w || 1); }, 0);
    var cw = cols.map(function (c) { return (c.w || 1) / total * this.cw(); }, this);
    var self = this;
    function head() {
      self.ensure(9 + 8);
      self.fill(NAVY); pdf.rect(self.mx, self.y, self.cw(), 7, 'F');
      var x = self.mx;
      cols.forEach(function (c, i) {
        self.setFont('bold', 6.8, [255, 255, 255]);
        var tx = c.align === 'center' ? x + cw[i] / 2 : x + padX;
        pdf.text(safe(c.label).toUpperCase(), tx, self.y + 4.7, { align: c.align === 'center' ? 'center' : 'left' });
        x += cw[i];
      });
      self.fill(self.acc); pdf.rect(self.mx, self.y + 7, self.cw(), 0.6, 'F');
      self.y += 7.6;
    }
    head();
    rows.forEach(function (r, ri) {
      var cells = r.map(function (v, i) { var t = (v && typeof v === 'object') ? v.t : v; var bold = (v && typeof v === 'object' && v.b) || cols[i].bold; return { lines: self.lines(t, cw[i] - padX * 2, size, bold ? 'bold' : 'normal'), bold: !!bold, chip: v && typeof v === 'object' && v.chip }; });
      var h = Math.max.apply(null, cells.map(function (c) { return c.lines.length; })) * lh + padY * 2;
      if (self.y + h > self.H - self.bottom) { self.page(false); head(); }
      self.fill(ri % 2 ? SOFT : PAPER); pdf.rect(self.mx, self.y, self.cw(), h, 'F');
      self.stroke(LINE, 0.2); pdf.line(self.mx, self.y + h, self.mx + self.cw(), self.y + h);
      var x = self.mx;
      cells.forEach(function (c, i) {
        if (c.chip) {
          var tw = pdf.getTextWidth(safe(c.lines[0] || '')) + 5; self.setFont('bold', size - 0.6, self.accT);
          tw = pdf.getTextWidth(safe(c.lines[0] || '')) + 5;
          self.fill(tint(self.acc, 0.16)); self.stroke(tint(self.acc, 0.5), 0.22); pdf.roundedRect(x + padX - 0.6, self.y + padY - 0.8, tw, lh + 0.8, 1.6, 1.6, 'FD');
          pdf.text(safe(c.lines[0] || ''), x + padX + 1.9, self.y + padY + lh - 1.1);
        } else {
          self.setFont(c.bold ? 'bold' : 'normal', size, c.bold ? INK : TEXT);
          var tx = cols[i].align === 'center' ? x + cw[i] / 2 : x + padX;
          pdf.text(c.lines, tx, self.y + padY + lh - 1.2, { align: cols[i].align === 'center' ? 'center' : 'left' });
        }
        x += cw[i];
      });
      self.y += h;
    });
    this.stroke(LINE, 0.25); pdf.line(this.mx, this.y, this.mx + this.cw(), this.y);
    this.y += 5;
  };


  // Barras de porcentaje (percentiles, métricas)
  P.bars = function (items) {
    var pdf = this.pdf, self = this;
    items.forEach(function (it) {
      self.ensure(12);
      var pct = Math.max(0, Math.min(100, Number(it.pct) || 0));
      self.setFont('bold', 8.6, INK); pdf.text(safe(it.label), self.mx, self.y);
      self.setFont('bold', 8.6, self.accT); pdf.text(pct + (it.unit || ' %'), self.W - self.mx, self.y, { align: 'right' });
      self.fill([226, 232, 240]); pdf.roundedRect(self.mx, self.y + 2, self.cw(), 2.6, 1.3, 1.3, 'F');
      if (pct > 0) { self.fill(self.acc); pdf.roundedRect(self.mx, self.y + 2, Math.max(2.6, self.cw() * pct / 100), 2.6, 1.3, 1.3, 'F'); }
      self.y += 9.2;
    });
    this.y += 2;
  };


  // Bloque de firmas
  P.signatures = function (left, right) {
    var pdf = this.pdf, w = (this.cw() - 14) / 2; this.ensure(34); this.y += 14;
    this.stroke(MUTE, 0.3); pdf.line(this.mx, this.y, this.mx + w, this.y); pdf.line(this.mx + w + 14, this.y, this.W - this.mx, this.y);
    this.setFont('bold', 7.6, INK); pdf.text(safe(left).toUpperCase(), this.mx, this.y + 5); pdf.text(safe(right).toUpperCase(), this.mx + w + 14, this.y + 5);
    this.y += 10;
  };

  // Pie en todas las páginas
  P.finish = function (disclaimer) {
    var pdf = this.pdf, N = pdf.getNumberOfPages();
    for (var i = 1; i <= N; i++) {
      pdf.setPage(i);
      this.stroke(LINE, 0.25); pdf.line(this.mx, this.H - 12, this.W - this.mx, this.H - 12);
      this.setFont('normal', 6.8, MUTE);
      pdf.text(safe(disclaimer || this.o.footer || 'Generado por KINET OS · orientativo'), this.mx, this.H - 7.6);
      this.setFont('bold', 6.8, MUTE);
      pdf.text('kinetos.es  \u2022  Pagina ' + i + ' / ' + N, this.W - this.mx, this.H - 7.6, { align: 'right' });
    }
    return pdf;
  };
  P.save = function (name, disclaimer) { this.finish(disclaimer); this.pdf.save(name); };

  /* ───────────────────────── Plan / rutina ───────────────────────── */
  var SEP = /\s+[—–]\s+|\s+-\s+/;
  function splitParts(t) {
    var p = String(t).split(SEP).map(function (s) { return s.replace(/^[\u2014\u2013-]+\s*/, '').replace(/\s*[\u2014\u2013-]+$/, '').trim(); }).filter(Boolean);
    // "Semana 1: texto" / "Lunes: texto" / "Sentadilla: 3x8"  ->  dos partes
    if (p.length === 1) { var m = /^([^:]{1,34}):\s+(.+)$/.exec(p[0]); if (m) p = [m[1].trim(), m[2].trim()]; }
    else if (p.length > 1 && !SEP.test(p[0]) ) { var m2 = /^((?:semanas?|sem\.?|fase|mes|d[i\u00ED]a|bloque|ciclo)\s*[\d\-\u2013y\/ ]+):\s*(.+)$/i.exec(p[0]); if (m2) p = [m2[1].trim(), m2[2].trim()].concat(p.slice(1)); }
    p = p.map(function (s) { return s.charAt(0).toLowerCase() === s.charAt(0) && /[a-z\u00e1\u00e9\u00ed\u00f3\u00fa\u00f1]/.test(s.charAt(0)) ? s.charAt(0).toUpperCase() + s.slice(1) : s; });
    return p;
  }
  var DAY = /^(lun|mar|mi[eé]|jue|vie|s[aá]b|dom)[a-zé.]*$/i;
  function timeOf(title) { var m = /[·•|\-–—]\s*(\d+\s*(?:-\s*\d+\s*)?(?:min|minutos|h|horas|semanas?|s))\b/i.exec(title); return m ? m[1].toUpperCase().replace(/\s+/g, ' ') : ''; }
  function cleanTitle(title) { return title.replace(/\s*[·•|\-–—]\s*\d+\s*(?:-\s*\d+\s*)?(?:min|minutos|h|horas)\b.*$/i, '').trim(); }

  function renderBlock(d, b) {
    var items = b.items, title = b.phase, chip = timeOf(title), clean = cleanTitle(title);
    var low = clean.toLowerCase();
    var parts = items.map(splitParts);
    var isWarn = /se[nñ]ales|parar|alerta|riesgo|cuidado|contraindic|stop|precauci/.test(low);
    d.heading(clean, { chip: chip });
    if (isWarn) { d.callout(items.map(function (x) { return '• ' + x; }).join('\n'), { color: [239, 68, 68], title: 'Detener la sesion y consultar si aparece' }); return; }
    var weekly = parts.every(function (p) { return p.length >= 2 && DAY.test(p[0]); });
    var weeks = parts.every(function (p) { return p.length >= 2 && /^(semanas?|sem\.?|fase|mes|d[ií]a|bloque|ciclo)\s*\d+/i.test(p[0]); });
    var exercise = parts.length && parts.filter(function (p) { return p.length >= 3; }).length >= Math.ceil(parts.length * 0.6);
    var pairs = parts.length && parts.every(function (p) { return p.length === 2 && p[0].length <= 38; });
    if (weekly) {
      d.table([{ label: 'Dia', w: 1.1, bold: true }, { label: 'Sesion / foco', w: 5 }, { label: 'Duracion', w: 1.4, align: 'center' }], parts.map(function (p) {
        var last = p[p.length - 1], dur = /\d+\s*(min|h)\b/i.test(last) && p.length > 2 ? last : '';
        var body = (dur ? p.slice(1, -1) : p.slice(1)).join(' — ');
        return [{ t: p[0], chip: true }, body, dur || '—'];
      }));
    } else if (weeks) {
      d.table([{ label: 'Etapa', w: 1.3 }, { label: 'Enfoque y criterio de progresion', w: 6 }], parts.map(function (p) { return [{ t: p[0], chip: true }, p.slice(1).join(' — ')]; }));
    } else if (exercise) {
      var four = parts.some(function (p) { return p.length >= 4; });
      if (four) d.table([{ label: 'Ejercicio', w: 3.3, bold: true }, { label: 'Series x rep.', w: 1.5 }, { label: 'Pausa', w: 0.95 }, { label: 'Objetivo / notas', w: 3.6 }],
        parts.map(function (p) { return [p[0], p[1] || '', p[2] || '', p.slice(3).join(' — ')]; }));
      else d.table([{ label: 'Ejercicio', w: 3.3, bold: true }, { label: 'Dosis', w: 1.7 }, { label: 'Objetivo / notas', w: 4.3 }], parts.map(function (p) { return [p[0], p[1] || '', p.slice(2).join(' — ')]; }));
    } else if (pairs) {
      d.table([{ label: 'Concepto', w: 2.2, bold: true }, { label: 'Detalle', w: 6 }], parts.map(function (p) { return [p[0], p[1]]; }));
    } else d.bullets(items);
  }

  // Extrae "Objetivo / Frecuencia / Nivel de carga / Supuestos" del párrafo de introducción
  function introPairs(txt) {
    var re = /(Objetivo|Frecuencia|Nivel de carga|Supuestos?|Contexto|Duraci[oó]n|Material|Perfil|Meta)\s*:/gi, m, idx = [];
    while ((m = re.exec(txt))) idx.push({ k: m[1], at: m.index, end: re.lastIndex });
    if (idx.length < 2) return null;
    var out = [];
    idx.forEach(function (x, i) { var v = txt.slice(x.end, i + 1 < idx.length ? idx[i + 1].at : txt.length).trim().replace(/[.\s]+$/, ''); if (v) out.push([x.k.charAt(0).toUpperCase() + x.k.slice(1).toLowerCase(), v]); });
    return out;
  }

  function plan(o) {
    o = o || {};
    var d = new Doc({ title: o.title, subtitle: o.subtitle, tag: o.tag, athlete: o.athlete, accent: o.accent, footer: 'Generado por KINET AI Technical Staff · orientativo, no sustituye a un profesional sanitario' });
    if (o.intro) {
      var kv = introPairs(o.intro);
      d.heading('Resumen del plan');
      if (kv) {
        var short = kv.filter(function (p) { return p[1].length <= 70; }), long = kv.filter(function (p) { return p[1].length > 70; });
        if (short.length) d.kv(short, short.length > 1 ? 2 : 1);
        long.forEach(function (p) { d.callout(p[1], { title: p[0] }); });
      } else d.callout(o.intro, {});
    }
    (o.blocks || []).forEach(function (b) { renderBlock(d, b); });
    if (o.outro) { d.heading('Nota del especialista', { number: false }); d.callout(o.outro, {}); }
    d.save(o.filename || 'KINET_Plan.pdf');
  }

  /* ───────────────────────── Informe de conversación ───────────────────────── */
  function chat(o) {
    o = o || {};
    var d = new Doc({ title: o.title || 'Informe del cuerpo tecnico', subtitle: o.subtitle, tag: o.tag || 'ACTA OFICIAL // CUERPO TECNICO IA', athlete: o.athlete, accent: o.accent, footer: 'Informe generado por KINET OS · Cuerpo Tecnico IA · orientativo' });
    var msgs = (o.messages || []).filter(function (m) { return m && String(m.text || '').trim(); });
    if (o.meta && o.meta.length) d.kv(o.meta, 3);
    d.heading('Conversacion', { number: false, chip: msgs.length + ' mensajes' });
    var pdf = d.pdf, size = 8.9, lh = d.lh(size);
    msgs.forEach(function (m) {
      var mine = !m.incoming;
      var paras = safe(String(m.text).replace(/\r/g, '')).split(/\n+/).map(function (s) { return s.trim(); }).filter(Boolean);
      var allLines = [];
      paras.forEach(function (p) {
        var bullet = /^(?:[-•*]|\d+[.)])\s+/.test(p), body = p.replace(/^(?:[-•*]|\d+[.)])\s+/, ''), pre = bullet ? '• ' : '';
        var wrapped = d.lines(pre + body, d.cw() - 12 - (bullet ? 3 : 0), size);
        wrapped.forEach(function (l, i) { allLines.push({ t: l, ind: bullet && i > 0 ? 3 : 0 }); });
        allLines.push({ t: '', gap: true });
      });
      if (allLines.length && allLines[allLines.length - 1].gap) allLines.pop();
      var who = safe(m.sender || (mine ? 'Tu' : 'Especialista')), when = safe(m.time || '');
      d.ensure(14);
      var col = mine ? [100, 116, 139] : d.acc, i = 0, first = true;
      while (i < allLines.length) {
        var room = d.H - d.bottom - d.y - 12, take = Math.max(1, Math.min(allLines.length - i, Math.floor(room / lh)));
        var seg = allLines.slice(i, i + take), h = seg.reduce(function (a, l) { return a + (l.gap ? lh * 0.5 : lh); }, 0) + 11;
        d.fill(mine ? SOFT : PAPER); d.stroke(LINE, 0.25); pdf.roundedRect(d.mx, d.y, d.cw(), h, 2, 2, 'FD');
        d.fill(col); pdf.roundedRect(d.mx, d.y, 1.8, h, 0.9, 0.9, 'F');
        d.setFont('bold', 7.4, dark(col, mine ? 0.8 : 0.55)); pdf.text(first ? who.toUpperCase() : who.toUpperCase() + ' (cont.)', d.mx + 6, d.y + 5.2);
        if (when && first) { d.setFont('normal', 7, MUTE); pdf.text(when, d.W - d.mx - 4, d.y + 5.2, { align: 'right' }); }
        var ty = d.y + 10.6; d.setFont('normal', size, TEXT);
        seg.forEach(function (l) { if (l.gap) { ty += lh * 0.5; return; } pdf.text(l.t, d.mx + 6 + l.ind, ty); ty += lh; });
        d.y += h + 3; i += take; first = false;
        if (i < allLines.length) d.page(false);
      }
    });
    d.save(o.filename || 'KINET_Informe.pdf');
  }

  /* ───────────────────────── Capturas de pantalla (html2canvas) ───────────────────────── */
  function isSafeSrc(src) {
    if (!src) return true; src = String(src);
    if (/^(data:|blob:|about:)/i.test(src)) return true;
    try { return new URL(src, location.href).origin === location.origin; } catch (e) { return false; }
  }
  function stripForeign(doc) {
    try {
      doc.querySelectorAll('img').forEach(function (im) { if (!isSafeSrc(im.currentSrc || im.src)) { im.removeAttribute('srcset'); im.style.visibility = 'hidden'; } });
      var win = doc.defaultView || window;
      doc.querySelectorAll('*').forEach(function (el) {
        var bg = ''; try { bg = win.getComputedStyle(el).backgroundImage || ''; } catch (e) {}
        if (bg && bg !== 'none') {
          var urls = bg.match(/url\((['"]?)(.*?)\1\)/g) || [];
          if (urls.some(function (u) { return !isSafeSrc(u.replace(/^url\((['"]?)/, '').replace(/(['"]?)\)$/, '')); })) el.style.backgroundImage = 'none';
        }
      });
    } catch (e) {}
  }
  // Captura SIN "allowTaint": una imagen de otro dominio sin permiso ya no rompe la exportación (se omite y el resto sale bien)
  async function capture(el, o) {
    o = o || {};
    if (typeof html2canvas !== 'function') throw new Error('html2canvas no está cargado');
    var base = { scale: o.scale || 2, backgroundColor: o.bg == null ? null : o.bg, useCORS: true, allowTaint: false, logging: false, imageTimeout: 9000 };
    var cv;
    try { cv = await html2canvas(el, base); cv.toDataURL('image/jpeg', 0.3); }
    catch (e) { cv = await html2canvas(el, Object.assign({}, base, { onclone: function (doc) { stripForeign(doc); } })); }
    return cv;
  }
  // Coloca una captura dentro de un rectángulo SIN deformarla (misma proporción), en JPEG para que el PDF pese poco
  function place(pdf, canvas, x, y, maxW, maxH, o) {
    o = o || {}; var r = canvas.width / canvas.height, w = maxW, h = w / r;
    if (h > maxH) { h = maxH; w = h * r; }
    var px = x + (maxW - w) / 2, py = o.top ? y : y + (maxH - h) / 2;
    pdf.addImage(canvas.toDataURL('image/jpeg', o.quality || 0.92), 'JPEG', px, py, w, h, undefined, 'FAST');
    return { x: px, y: py, w: w, h: h };
  }
  // Documento con una captura (varias páginas si es muy alta) usando la misma cabecera y pie KINET
  async function shot(o) {
    o = o || {};
    var cv = await capture(o.element, { scale: o.scale || 2.2, bg: o.bg || '#050811' });
    var d = new Doc({ title: o.title, subtitle: o.subtitle, tag: o.tag, athlete: o.athlete, orientation: o.orientation, accent: o.accent, footer: o.footer || 'Generado por KINET OS · kinetos.es' });
    var maxW = d.cw(), r = cv.width / cv.height, availFirst = d.H - d.bottom - d.y - 2;
    var fitW = Math.min(maxW, availFirst * r);
    if (fitW >= maxW * 0.6) {
      // cabe en una página SIN deformar (se reduce un poco, centrada)
      var hh = fitW / r;
      d.fill(NAVY); d.pdf.roundedRect(d.mx + (maxW - fitW) / 2 - 1, d.y - 1, fitW + 2, hh + 2, 2, 2, 'F');
      d.pdf.addImage(cv.toDataURL('image/jpeg', 0.92), 'JPEG', d.mx + (maxW - fitW) / 2, d.y, fitW, hh, undefined, 'FAST'); d.y += hh + 3;
    } else {
      // muy alta: se trocea en varias páginas a ancho completo, sin deformar
      var scale = cv.width / maxW, sliceH = availFirst * scale, sy = 0, first = true;
      while (sy < cv.height) {
        var avail = first ? availFirst : (d.H - d.bottom - 22);
        var ch = Math.min(avail * scale, cv.height - sy), part = document.createElement('canvas'); part.width = cv.width; part.height = Math.ceil(ch);
        part.getContext('2d').drawImage(cv, 0, sy, cv.width, ch, 0, 0, cv.width, ch);
        if (!first) d.page(false);
        d.pdf.addImage(part.toDataURL('image/jpeg', 0.92), 'JPEG', d.mx, d.y, maxW, ch / scale, undefined, 'FAST');
        d.y += ch / scale; sy += ch; first = false;
      }
    }
    if (typeof o.after === 'function') { if (o.afterNewPage) d.page(false); o.after(d); }
    if (o.notes && o.notes.length) { d.gap(6); d.heading('Detalle', { number: false }); d.bullets(o.notes); }
    d.save(o.filename || 'KINET_Documento.pdf');
  }


  // Página completa oscura con UNA imagen centrada sin deformar (pósters, pizarras, cartas)
  function visual(o) {
    o = o || {};
    var J = window.jspdf && window.jspdf.jsPDF; if (!J) throw new Error('jsPDF no está cargado');
    var land = o.orientation === 'landscape', W = land ? 297 : 210, H = land ? 210 : 297;
    var pdf = new J({ orientation: land ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
    pdf.setProperties({ title: safe(o.title || 'KINET OS'), author: 'KINET OS', creator: 'KINET OS · kinetos.es' });
    pdf.setFillColor(NAVY[0], NAVY[1], NAVY[2]); pdf.rect(0, 0, W, H, 'F');
    var acc = rgbOf(o.accent), m = 10, foot = 9;
    place(pdf, o.canvas, m, m, W - m * 2, H - m * 2 - foot, { quality: 0.93 });
    pdf.setFillColor(acc[0], acc[1], acc[2]); pdf.rect(m, H - foot - 1, 14, 0.8, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.setTextColor(150, 164, 186);
    pdf.text(safe(o.footer || 'Generado por KINET OS'), m, H - 4.5);
    pdf.text('kinetos.es', W - m, H - 4.5, { align: 'right' });
    pdf.save(o.filename || 'KINET.pdf');
  }

  window.KinetPDF = { visual: visual, create: function (o) { return new Doc(o); }, plan: plan, chat: chat, capture: capture, place: place, shot: shot, safe: safe };
})();
