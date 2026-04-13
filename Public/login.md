
<style>
  :root {
    --brand-violet: #b89ff8;
    --brand-violet-soft: #ede8ff;
    --brand-violet-mid: #7c5fe6;
    --brand-black: #111114;
    --brand-gray: #f2f2f4;
    --brand-gray-mid: #e0dfe6;
    --brand-gray-text: #6b6880;
  }
  .wr { font-family: var(--font-sans); max-width: 480px; margin: 0 auto; padding: 2rem 1rem; }
  .brand { text-align: center; margin-bottom: 2rem; }
  .brand-icon { width: 48px; height: 48px; border-radius: 14px; background: var(--brand-black); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 0.75rem; }
  .brand-icon svg { width: 24px; height: 24px; }
  .brand h1 { font-size: 22px; font-weight: 500; margin: 0 0 4px; color: var(--color-text-primary); }
  .brand p { font-size: 14px; color: var(--color-text-secondary); margin: 0; }
  .card { background: var(--color-background-primary); border: 0.5px solid var(--brand-gray-mid); border-radius: var(--border-radius-xl); padding: 1.75rem; }
  .tabs { display: flex; background: var(--brand-gray); border-radius: 10px; padding: 3px; margin-bottom: 1.5rem; gap: 3px; }
  .tab { flex: 1; border: none; background: transparent; padding: 8px; border-radius: 8px; font-size: 14px; font-weight: 500; color: var(--brand-gray-text); cursor: pointer; transition: all 0.15s; }
  .tab.active { background: var(--color-background-primary); color: var(--brand-black); border: 0.5px solid var(--brand-gray-mid); }
  .form-section { display: none; }
  .form-section.active { display: grid; gap: 1rem; }
  .field { display: grid; gap: 6px; }
  .field label { font-size: 13px; font-weight: 500; color: var(--brand-gray-text); }
  .field input { border-radius: var(--border-radius-md); border: 0.5px solid var(--brand-gray-mid); background: var(--brand-gray); color: var(--brand-black); padding: 10px 12px; font-size: 15px; outline: none; transition: border-color 0.15s; }
  .field input:focus { border-color: var(--brand-violet); box-shadow: 0 0 0 3px var(--brand-violet-soft); }
  .btn-primary { width: 100%; border: none; border-radius: var(--border-radius-md); background: var(--brand-black); color: #fff; font-size: 15px; font-weight: 500; padding: 11px; cursor: pointer; margin-top: 0.25rem; transition: background 0.15s; }
  .btn-primary:hover { background: #2a2930; }
  .help-text { text-align: center; font-size: 13px; color: var(--brand-gray-text); margin-top: 1.25rem; }
  .help-text span { color: var(--brand-violet-mid); cursor: pointer; font-weight: 500; }
  .steps { display: flex; flex-direction: column; gap: 10px; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 0.5px solid var(--brand-gray-mid); }
  .step { display: flex; align-items: flex-start; gap: 12px; }
  .step-num { width: 22px; height: 22px; border-radius: 50%; background: var(--brand-violet-soft); color: var(--brand-violet-mid); font-size: 11px; font-weight: 500; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
  .step-text { font-size: 13px; color: var(--brand-gray-text); line-height: 1.5; }
  .accent-bar { height: 3px; width: 32px; background: var(--brand-violet); border-radius: 99px; margin: 0 auto 1.5rem; }
</style>

<div class="wr">
  <div class="brand">
    <div class="brand-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="var(--brand-violet)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
      </svg>
    </div>
    <h1>Album QR</h1>
    <p>Tu álbum compartido con código QR</p>
  </div>

  <div class="card">
    <div class="accent-bar"></div>
    <div class="tabs">
      <button class="tab active" onclick="switchTab('login', this)">Ingresar</button>
      <button class="tab" onclick="switchTab('register', this)">Crear cuenta</button>
    </div>

    <div id="login" class="form-section active">
      <div class="field">
        <label>Correo electrónico</label>
        <input type="email" placeholder="tu@correo.com" />
      </div>
      <div class="field">
        <label>Contraseña</label>
        <input type="password" placeholder="••••••••" />
      </div>
      <button class="btn-primary">Ingresar</button>
    </div>

    <div id="register" class="form-section">
      <div class="field">
        <label>Correo electrónico</label>
        <input type="email" placeholder="tu@correo.com" />
      </div>
      <div class="field">
        <label>Contraseña</label>
        <input type="password" placeholder="Mínimo 8 caracteres" />
      </div>
      <button class="btn-primary">Crear cuenta gratis</button>
    </div>

    <div class="help-text" id="help-text">
      ¿No tenés cuenta? <span onclick="switchTab('register', null)">Registrate gratis</span>
    </div>

    <div class="steps">
      <div class="step"><div class="step-num">1</div><div class="step-text">Registrate como anfitrión</div></div>
      <div class="step"><div class="step-num">2</div><div class="step-text">Creá el álbum y obtenés un QR único</div></div>
      <div class="step"><div class="step-num">3</div><div class="step-text">Tus invitados escanean y suben fotos</div></div>
    </div>
  </div>
</div>

<script>
function switchTab(tab, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
  document.getElementById(tab).classList.add('active');
  if (el) el.classList.add('active');
  else document.querySelector('.tab[onclick*="' + tab + '"]').classList.add('active');
  const ht = document.getElementById('help-text');
  ht.innerHTML = tab === 'login'
    ? '¿No tenés cuenta? <span onclick="switchTab(\'register\', null)">Registrate gratis</span>'
    : '¿Ya tenés cuenta? <span onclick="switchTab(\'login\', null)">Ingresá acá</span>';
}
</script>
