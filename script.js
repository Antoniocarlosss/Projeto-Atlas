let db_users = JSON.parse(localStorage.getItem('atlas_users')) || [{nome:"Admin", email:"admin@atlas.com", senha:"123", nivel:"ilimitado"}];
let db_pastas = JSON.parse(localStorage.getItem('atlas_pastas')) || [];
let db_live = JSON.parse(localStorage.getItem('atlas_live')) || [];
let userLogado = null;

function fazerLogin() {
    const e = document.getElementById('login-email').value;
    const s = document.getElementById('login-senha').value;
    const u = db_users.find(x => x.email === e && x.senha === s);
    if(u) {
        userLogado = u;
        document.getElementById('tela-login').style.display='none';
        document.getElementById('app-principal').style.display='block';
        document.getElementById('user-display').innerText = u.nome;
        document.getElementById('card-gestao').style.display = u.nivel === 'ilimitado' ? 'flex' : 'none';
        mudarTema(localStorage.getItem('atlas_tema') || 'claro');
    } else { alert("Acesso negado"); }
}

function abrirModulo(m) {
    document.querySelectorAll('main > section').forEach(s => s.style.display = 'none');
    document.getElementById('grid-home').style.display = 'none';
    if(m === 'Home') document.getElementById('grid-home').style.display='grid';
    if(m === 'Injeção') { document.getElementById('modulo-injecao').style.display='block'; atualizarLista(); }
    if(m === 'Bobines') document.getElementById('modulo-bobines').style.display='block';
    if(m === 'Gestão') { document.getElementById('modulo-gestao').style.display='block'; }
    if(m === 'Configuração') document.getElementById('modulo-config').style.display='block';
}

function abrirSubModulo(sub) {
    document.getElementById('modulo-bobines').style.display = 'none';
    if(sub === 'calc') { document.getElementById('bobine-calc').style.display = 'block'; prepararCalculadora(); }
    if(sub === 'rel') document.getElementById('bobine-rel').style.display = 'block';
}

function voltarHome() { abrirModulo('Home'); }

// --- LÓGICA CALCULADORA ---
let espSel = 0.32; let velSel = 10;
function prepararCalculadora() {
    const lSelect = document.getElementById("largura-calc");
    if (lSelect.options.length === 0) {
        for(let i=1; i<=50; i+=0.5){
            let o = document.createElement("option"); o.value = i;
            o.text = i + " cm"; lSelect.appendChild(o);
        }
        lSelect.onchange = calcBobine;
    }
    const espDiv = document.getElementById("espessuras-btns"); espDiv.innerHTML = "";
    [0.28, 0.30, 0.32, 0.35, 0.38, 0.40, 0.45].forEach(e => {
        let b = document.createElement("button"); b.innerText = e + " mm";
        if(e === espSel) b.classList.add("selecionado");
        b.onclick = () => { espDiv.querySelectorAll("button").forEach(x => x.classList.remove("selecionado")); b.classList.add("selecionado"); espSel = e; calcBobine(); };
        espDiv.appendChild(b);
    });
    const velDiv = document.getElementById("velocidades-btns"); velDiv.innerHTML = "";
    [5, 6, 7, 8, 9, 10, 11, 12].forEach(v => {
        let b = document.createElement("button"); b.innerText = v + " m/min";
        if(v === velSel) b.classList.add("selecionado");
        b.onclick = () => { velDiv.querySelectorAll("button").forEach(x => x.classList.remove("selecionado")); b.classList.add("selecionado"); velSel = v; calcBobine(); };
        velDiv.appendChild(b);
    });
    calcBobine();
}

function calcBobine() {
    const interno = 500; const pi = 3.14;
    const largura_cm = parseFloat(document.getElementById("largura-calc").value) || 1;
    const largura_mm = largura_cm * 10;
    const metros = Math.round(((largura_mm / espSel) * pi * (interno + largura_mm)) / 1000);
    const tempoTotalMin = Math.round(metros / velSel);
    const fim = new Date(); fim.setMinutes(fim.getMinutes() + tempoTotalMin);
    document.getElementById("res-metros").innerText = "Falta: " + metros + " metros";
    document.getElementById("res-tempo").innerText = "Tempo: " + tempoTotalMin + " min";
    document.getElementById("res-hora").innerText = "Acaba às: " + fim.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
}

// --- FUNÇÕES INJEÇÃO (ORIGINAIS) ---
function iniciarRodada() {
    const esp = document.getElementById('inj-esp').value;
    if(!esp) return alert("Selecione a espessura!");
    db_live.push({ painel: document.getElementById('inj-painel').value, esp: esp + " mm", metros: "", vel: "", ocorrencias: [], quimicos: {}, op: userLogado.nome });
    localStorage.setItem('atlas_live', JSON.stringify(db_live)); atualizarLista();
}
function salvarEdicao() {
    const i = document.getElementById('edit-idx').value;
    db_live[i].metros = document.getElementById('ed-m').value;
    db_live[i].vel = document.getElementById('ed-v').value;
    localStorage.setItem('atlas_live', JSON.stringify(db_live));
    document.getElementById('area-edicao').style.display='none'; atualizarLista();
}
function atualizarLista() {
    document.getElementById('lista-rodadas').innerHTML = db_live.map((it, i) => `<div class="form-section"><b>${it.painel}</b> <button onclick="abrirEdicao(${i})">EDITAR</button></div>`).join('');
}
function abrirEdicao(i) { document.getElementById('edit-idx').value = i; document.getElementById('area-edicao').style.display='block'; }
function fecharPasta() { alert("Dia fechado!"); db_live = []; atualizarLista(); }
function mudarAba(a) { document.getElementById('aba-relatorio').style.display = a==='relatorio'?'block':'none'; document.getElementById('aba-historico').style.display = a==='historico'?'block':'none'; }
function mudarTema(t) { document.body.className = t==='escuro'?'tema-escuro':''; localStorage.setItem('atlas_tema', t); }
function salvarUsuario() { alert("Usuário Salvo!"); }
