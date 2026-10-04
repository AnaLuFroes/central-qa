// "Baixar HTML": gera uma página autocontida do lote, para mandar um lote isolado ao dev.
import { carregarPrint } from '@/data/prints'
import { esperadoItens, fixCode, fmtData } from '@/lib/format'
import type { Lote } from '@/types'

const esc = (s: string) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

/** `imgs`: id do print -> data URL (as imagens vão embutidas no HTML). */
export function loteHtml(l: Lote, imgs: Record<string, string>): string {
  const secoes = l.secoes
    .map(
      (s) => `<section><div class="sh"><h2>${esc(s.nome)}</h2><span class="cnt" data-sec></span></div>${s.itens
        .map((f) => {
          const esp = esperadoItens(f.esperado)
          return `<article data-key="${esc(f.key)}"><span class="bar"></span><div class="hd">
<button class="ck" aria-label="Marcar como concluído"></button>
<span class="code">${esc(fixCode(f.key))}</span><span class="tt">${esc(f.titulo)}</span>${f.prioridade === 'alta' ? '<span class="alta">Prioridade alta</span>' : ''}</div>
<div class="bd">
${f.onde ? `<p class="onde"><b>Onde ocorre:</b> ${esc(f.onde)}</p>` : ''}
${f.passos.length ? `<h4>Como reproduzir</h4><ol>${f.passos.map((p, i) => `<li><span>${i + 1}</span>${esc(p)}</li>`).join('')}</ol>` : ''}
${f.atual ? `<h4>Situação atual</h4><p>${esc(f.atual)}</p>` : ''}
${f.erro ? `<pre class="err">${esc(f.erro)}</pre>` : ''}
${esp.length ? `<h4>Ajuste esperado</h4>${esp.map((e) => (e.quote ? `<p class="q">${esc(e.t)}</p>` : `<div class="it"><i>•</i>${esc(e.t)}</div>`)).join('')}` : ''}
${f.obs ? `<p class="obs"><b>Observação:</b> ${esc(f.obs)}</p>` : ''}
${f.prints.length ? `<h4>Prints</h4><div class="pr">${f.prints.filter((p) => imgs[p.id]).map((p) => `<img src="${esc(imgs[p.id])}" alt="${esc(p.nome)}">`).join('')}</div>` : ''}
</div></article>`
        })
        .join('')}</section>`,
    )
    .join('')

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(l.titulo)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Serif:wght@600;700&display=swap">
<style>
body{margin:0;background:#F5F5FC;color:#15172E;font:15px/1.6 "IBM Plex Sans",-apple-system,"Segoe UI",sans-serif}*{box-sizing:border-box}
header{background:radial-gradient(120% 140% at 50% 0%,#262A55 0%,#111430 72%);color:#fff;padding:44px 0 72px}
.w{max-width:1168px;margin:0 auto;padding:0 20px}
.eb{font:.8rem "IBM Plex Mono",monospace;letter-spacing:.06em;color:#8FF0F2;margin:0 0 12px}
h1{font:700 clamp(1.9rem,4.5vw,2.8rem)/1.12 "IBM Plex Serif",serif;margin:0 0 12px;background:linear-gradient(100deg,#8FF0F2,#B4C8F8 50%,#C39BF5);-webkit-background-clip:text;background-clip:text;color:transparent;width:fit-content}
header p{max-width:62ch;color:#CFD1EE;margin:0;font-size:1.05rem}
.card{background:#fff;border:1px solid #E0DFF2;border-radius:14px;box-shadow:0 1px 2px rgba(17,20,48,.06),0 6px 18px rgba(17,20,48,.08);margin-top:-44px;padding:20px 22px;position:relative}
.dn{font:700 2.1rem/1 "IBM Plex Serif",serif;color:#5B45C8}.dn small{font:500 .95rem "IBM Plex Sans",sans-serif;color:#5D6082;margin-left:8px}
.trk{height:10px;border-radius:99px;background:#EFEEFA;overflow:hidden;margin-top:14px}.trk span{display:block;height:100%;background:linear-gradient(90deg,#5FD8E8,#A98BF5);transition:width .35s}
section{margin-top:34px}.sh{display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px solid #5B45C8;padding-bottom:8px;margin-bottom:14px}
h2{font:600 1.35rem "IBM Plex Serif",serif;margin:0}.cnt{font:.8rem "IBM Plex Mono",monospace;color:#5D6082}
article{position:relative;background:#fff;border:1px solid #E0DFF2;border-radius:10px;overflow:hidden;margin-bottom:12px}
.bar{position:absolute;left:0;top:0;bottom:0;width:4px;background:linear-gradient(180deg,#8FF0F2,#B4C8F8 50%,#C39BF5)}
.hd{display:flex;align-items:flex-start;flex-wrap:wrap;gap:4px 10px;padding:14px 18px 14px 20px}
.ck{flex:none;width:24px;height:24px;border-radius:6px;border:2px solid #5B45C8;background:#fff;cursor:pointer;margin-right:2px}
.code{font:600 .76rem "IBM Plex Mono",monospace;border-radius:5px;padding:2px 7px;color:#5B45C8;background:#EEEAFD}
.tt{font-weight:600;font-size:1.02rem;flex:1 1 300px}.alta{font-size:.78rem;font-weight:600;color:#A8660C;background:#FBF0DD;border-radius:99px;padding:2px 10px}
.bd{padding:0 18px 18px 56px}.onde{color:#5D6082;font-size:.92rem;margin:0 0 4px}
h4{font-size:.88rem;font-weight:600;color:#5B45C8;margin:16px 0 6px}ol{list-style:none;padding:0;margin:0}
ol li{display:flex;gap:12px;margin-bottom:6px}ol li span{flex:none;width:22px;height:22px;border-radius:50%;background:#EEEAFD;color:#5B45C8;font:600 .76rem "IBM Plex Mono",monospace;display:grid;place-items:center}
.err{font:.82rem "IBM Plex Mono",monospace;background:#EFEEFA;color:#B42336;border-left:3px solid #B42336;border-radius:6px;padding:10px 12px;white-space:pre-wrap}
.q{border-left:3px solid #5B45C8;padding:2px 0 2px 12px;font-weight:600;margin:2px 0 2px 4px}.it{display:flex;gap:10px}.it i{color:#5B45C8;font-style:normal}
.obs{background:#EEEAFD;border-radius:8px;padding:10px 12px;margin:14px 0 0}.pr{display:flex;gap:10px;flex-wrap:wrap}.pr img{height:110px;border:1px solid #E0DFF2;border-radius:8px}
article.done{opacity:.72}article.done .bar{background:#0F7A55}article.done .ck{background:#0F7A55;border-color:#0F7A55}article.done .ck:after{content:"✓";color:#fff;font-weight:700}
article.done .code{color:#0F7A55;background:#DDF2E8}article.done .tt{text-decoration:line-through}
footer{color:#5D6082;font-size:.92rem;padding:48px 0 30px;text-align:center}
</style></head><body>
<header><div class="w">${l.eyebrow ? `<p class="eb">${esc(l.eyebrow)}</p>` : ''}<h1>${esc(l.titulo)}</h1><p>${esc(l.intro)}</p></div></header>
<main class="w"><div class="card"><div class="dn"><span id="dn">0</span><small>de ${l.total} fixes concluídos</small></div><div class="trk"><span id="pb" style="width:0"></span></div></div>${secoes}</main>
<footer>Gerado pela Central de QA em ${esc(fmtData(l.criadoEm))}</footer>
<script>
const K='central-qa-lote-${esc(l.id)}';let d={};try{d=JSON.parse(localStorage.getItem(K)||'{}')}catch(e){}
const upd=()=>{const a=[...document.querySelectorAll('article')];let n=0;a.forEach(x=>{const on=!!d[x.dataset.key];x.classList.toggle('done',on);if(on)n++});
document.getElementById('dn').textContent=n;document.getElementById('pb').style.width=(a.length?Math.round(n/a.length*100):0)+'%';
document.querySelectorAll('section').forEach(s=>{const it=[...s.querySelectorAll('article')];s.querySelector('[data-sec]').textContent=it.filter(x=>d[x.dataset.key]).length+' de '+it.length});
try{localStorage.setItem(K,JSON.stringify(d))}catch(e){}};
document.querySelectorAll('.ck').forEach(b=>b.onclick=()=>{const k=b.closest('article').dataset.key;d[k]?delete d[k]:d[k]=true;upd()});upd();
</script></body></html>`
}

export async function baixarLote(l: Lote) {
  const ids = [...new Set(l.secoes.flatMap((s) => s.itens.flatMap((f) => f.prints.map((p) => p.id))))]
  const imgs: Record<string, string> = {}
  await Promise.all(ids.map(async (id) => (imgs[id] = await carregarPrint(id).catch(() => ''))))
  const blob = new Blob([loteHtml(l, imgs)], { type: 'text/html;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${l.titulo.replace(/[\\/:*?"<>|]+/g, '-')}.html`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
