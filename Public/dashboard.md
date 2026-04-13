
<style>
  :root {
    --bv: #b89ff8; --bvs: #ede8ff; --bvm: #7c5fe6;
    --bk: #111114; --bg: #f2f2f4; --bgm: #e0dfe6; --bgt: #6b6880;
  }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: var(--font-sans); background: var(--bg); color: var(--bk); }
  .page { max-width: 560px; margin: 0 auto; padding: 2rem 1rem 3rem; }

  /* topbar */
  .topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; }
  .logo { display: flex; align-items: center; gap: 10px; }
  .logo-icon { width: 36px; height: 36px; border-radius: 10px; background: var(--bk); display: flex; align-items: center; justify-content: center; }
  .logo-icon svg { width: 18px; height: 18px; }
  .logo-name { font-size: 15px; font-weight: 500; color: var(--bk); }
  .btn-logout { border: 0.5px solid var(--bgm); background: transparent; border-radius: 8px; padding: 6px 14px; font-size: 13px; color: var(--bgt); cursor: pointer; transition: background 0.15s; }
  .btn-logout:hover { background: var(--bvs); color: var(--bvm); }

  /* greeting */
  .greeting { margin-bottom: 1.75rem; }
  .greeting p { margin: 0 0 4px; font-size: 13px; color: var(--bgt); }
  .greeting h2 { margin: 0; font-size: 22px; font-weight: 500; color: var(--bk); }

  /* card */
  .card { background: #fff; border: 0.5px solid var(--bgm); border-radius: 20px; padding: 1.5rem; margin-bottom: 1.25rem; }
  .card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 1.25rem; }
  .card-icon { width: 32px; height: 32px; border-radius: 8px; background: var(--bvs); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .card-icon svg { width: 16px; height: 16px; }
  .card-title { font-size: 15px; font-weight: 500; color: var(--bk); margin: 0; }
  .card-sub { font-size: 12px; color: var(--bgt); margin: 0; }

  /* fields */
  .field { display: grid; gap: 5px; margin-bottom: 1rem; }
  .field:last-child { margin-bottom: 0; }
  .field label { font-size: 12px; font-weight: 500; color: var(--bgt); }
  .field input, .field textarea {
    border-radius: 8px; border: 0.5px solid var(--bgm);
    background: var(--bg); color: var(--bk);
    padding: 9px 11px; font-size: 14px; outline: none; width: 100%;
    transition: border-color 0.15s, box-shadow 0.15s;
    font-family: var(--font-sans);
  }
  .field input:focus, .field textarea:focus {
    border-color: var(--bv); box-shadow: 0 0 0 3px var(--bvs);
  }
  .field textarea { resize: vertical; }

  .btn-main { width: 100%; border: none; border-radius: 10px; background: var(--bk); color: #fff; font-size: 14px; font-weight: 500; padding: 11px; cursor: pointer; margin-top: 1rem; transition: background 0.15s; }
  .btn-main:hover { background: #2a2930; }

  /* result */
  .result { border-top: 0.5px solid var(--bgm); margin-top: 1.25rem; padding-top: 1.25rem; display: none; }
  .result.visible { display: block; }
  .result-label { font-size: 11px; font-weight: 500; color: var(--bgt); text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 0.75rem; }
  .qr-wrap { background: var(--bg); border: 0.5px solid var(--bgm); border-radius: 14px; padding: 1rem; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; }
  .qr-wrap img { width: min(200px, 100%); height: auto; display: block; }
  .link-row { display: flex; gap: 8px; }
  .link-row input { flex: 1; min-width: 0; border-radius: 8px; border: 0.5px solid var(--bgm); background: var(--bg); color: var(--bk); padding: 8px 10px; font-size: 13px; outline: none; }
  .btn-copy { border: none; border-radius: 8px; background: var(--bvs); color: var(--bvm); font-size: 13px; font-weight: 500; padding: 8px 14px; cursor: pointer; white-space: nowrap; }
  .btn-copy:hover { background: var(--bv); color: #fff; }
  .btn-view { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 10px; padding: 9px; border-radius: 8px; border: 0.5px solid var(--bgm); background: transparent; color: var(--bvm); font-size: 13px; text-decoration: none; transition: background 0.15s; }
  .btn-view:hover { background: var(--bvs); }

  /* steps */
  .steps-card { background: #fff; border: 0.5px solid var(--bgm); border-radius: 20px; padding: 1.25rem 1.5rem; }
  .steps-title { font-size: 12px; font-weight: 500; color: var(--bgt); text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 1rem; }
  .step { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 10px; }
  .step:last-child { margin-bottom: 0; }
  .step-dot { width: 22px; height: 22px; border-radius: 50%; background: var(--bvs); color: var(--bvm); font-size: 11px; font-weight: 500; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
  .step-text { font-size: 13px; color: var(--bgt); line-height: 1.5; padding-top: 2px; }

  .badge-new { display: inline-flex; align-items: center; gap: 5px; background: var(--bvs); color: var(--bvm); font-size: 11px; font-weight: 500; padding: 3px 10px; border-radius: 99px; margin-bottom: 1rem; }
  .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--bv); }
</style>

<div class="page">

  <div class="topbar">
    <div class="logo">
      <div class="logo-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--bv)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
        </svg>
      </div>
      <span class="logo-name">Album QR</span>
    </div>
    <button class="btn-logout" onclick="toggleView()">Cerrar sesión</button>
  </div>

  <div class="greeting">
    <p>Bienvenido de vuelta</p>
    <h2>Crea tu álbum</h2>
  </div>

  <div class="card">
    <div class="card-header">
      <div class="card-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--bvm)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </div>
      <div>
        <p class="card-title">Nuevo álbum</p>
        <p class="card-sub">Generá un QR para compartir con tus invitados</p>
      </div>
    </div>

    <div class="field">
      <label>Título del álbum</label>
      <input type="text" placeholder="Cumpleaños de Marta, Boda 2025…" />
    </div>
    <div class="field">
      <label>Descripción <span style="font-weight:400;color:var(--bgt)">(opcional)</span></label>
      <textarea rows="2" placeholder="Un mensaje para tus invitados…"></textarea>
    </div>

    <button class="btn-main" onclick="showResult()">Generar QR</button>

    <div class="result" id="result">
      <p class="result-label">QR listo para compartir</p>
      <div class="badge-new"><div class="badge-dot"></div> Álbum creado</div>
      <div class="qr-wrap">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=albumqr.app/album/demo123&color=111114&bgcolor=f2f2f4" alt="QR del álbum" />
      </div>
      <div class="link-row">
        <input type="text" readonly value="albumqr.app/album/demo123" id="link-input" />
        <button class="btn-copy" onclick="copyLink()">Copiar</button>
      </div>
      <a class="btn-view" href="#" target="_blank">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        Ver página pública del álbum
      </a>
    </div>
  </div>

  <div class="steps-card">
    <p class="steps-title">Cómo funciona</p>
    <div class="step"><div class="step-dot">1</div><div class="step-text">Completá el título y creá el álbum</div></div>
    <div class="step"><div class="step-dot">2</div><div class="step-text">Compartí el QR o el enlace con tus invitados</div></div>
    <div class="step"><div class="step-dot">3</div><div class="step-text">Ellos suben fotos y videos sin necesidad de cuenta</div></div>
  </div>

</div>

<script>
function showResult() {
  document.getElementById('result').classList.add('visible');
}
function copyLink() {
  const val = document.getElementById('link-input').value;
  navigator.clipboard.writeText(val).catch(() => {});
  const btn = document.querySelector('.btn-copy');
  btn.textContent = '¡Copiado!';
  setTimeout(() => btn.textContent = 'Copiar', 1500);
}
function toggleView() {
  alert('Sesión cerrada (demo)');
}
</script>
