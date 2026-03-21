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
    if(m === 'Injeção') { document.getElementById('modulo-injecao').style.display='block'; atualizarLista(); }
    if(m === 'Gestão') { document.getElementById('modulo-gestao').style.display='block'; listarUsers(); monitorLive(); }
    if(m === 'Configuração') document.getElementById('modulo-config').style.display='block';
}

function salvarUsuario() {
    const n = document.getElementById('g-nome').value;
    const e = document.getElementById('g-email').value;
    const s = document.getElementById('g-senha').value;
    const v = document.getElementById('g-nivel').value;
    if(!n || !e || !s) return alert("Preencha tudo");
    db_users.push({nome:n, email:e, senha:s, nivel:v});
    localStorage.setItem('atlas_users', JSON.stringify(db_users));
    alert("Usuário Salvo!");
    listarUsers();
}

function iniciarRodada() {
    const esp = document.getElementById('inj-esp').value;
    if(!esp) return alert("Selecione a espessura!");
    
    db_live.push({
        painel: document.getElementById('inj-painel').value,
        esp: esp + " mm", // Adiciona o espaço e mm aqui
        metros: "", 
        vel: "", 
        ocorrencias: [],
        quimicos: {mdi:"", pur:"", pir:"", c1:"", c4:"", pent:""},
        op: userLogado.nome
    });
    
    localStorage.setItem('atlas_live', JSON.stringify(db_live));
    atualizarLista();
    
    // Limpa a seleção após adicionar
    document.getElementById('inj-esp').value = "";
}

function salvarEdicao() {
    const i = document.getElementById('edit-idx').value;
    const item = db_live[i];
    item.metros = document.getElementById('ed-m').value;
    item.vel = document.getElementById('ed-v').value;
    item.quimicos = {
        mdi: document.getElementById('q-mdi').value, pur: document.getElementById('q-pur').value,
        pir: document.getElementById('q-pir').value, c1: document.getElementById('q-c1').value,
        c4: document.getElementById('q-c4').value, pent: document.getElementById('q-pent').value
    };
    localStorage.setItem('atlas_live', JSON.stringify(db_live));
    document.getElementById('area-edicao').style.display='none';
    atualizarLista();
}

function fecharPasta() {
    const d = document.getElementById('inj-data').value;
    if(!d || db_live.length === 0) return alert("Falta data ou rodada");
    db_pastas.push({ data: d, itens: JSON.parse(JSON.stringify(db_live)), resp: userLogado.nome });
    localStorage.setItem('atlas_pastas', JSON.stringify(db_pastas));
    db_live = [];
    localStorage.setItem('atlas_live', JSON.stringify(db_live));
    abrirModulo('Injeção');
}

function gerarPDF(idx) {
    const p = db_pastas[idx];
    let linhas = p.itens.map(it => `
        <tr>
            <td>${it.painel} / ${it.esp}</td>
            <td>${it.metros}m</td>
            <td>${it.quimicos.mdi}|${it.quimicos.pur}|${it.quimicos.pir}</td>
            <td>${it.ocorrencias.map(o => `[${o.hora}] ${o.texto}`).join('<br>')}</td>
        </tr>`).join('');

    document.getElementById('conteudo-imprimivel').innerHTML = `
        <div style="display:flex; justify-content:space-between; border-bottom:2px solid #000;">
            <img src="logo.png" style="height:40px;">
            <div style="text-align:right">
                <h2>RELATÓRIO DE INJEÇÃO</h2>
                <p>Data: ${p.data} | Resp: ${p.resp}</p>
            </div>
        </div>
        <table class="pdf-table">
            <thead><tr style="background:#eee"><th>PRODUTO</th><th>METROS</th><th>QUÍMICOS</th><th>OCORRÊNCIAS</th></tr></thead>
            <tbody>${linhas}</tbody>
        </table>`;
    document.getElementById('modal-pdf').style.display='block';
}

// Funções de suporte (listar, mudar aba, tema, etc) omitidas por brevidade mas seguem a lógica anterior.
function voltarHome() { abrirModulo('Home'); document.getElementById('grid-home').style.display='grid'; }
function mudarTema(t) { document.body.className = t==='escuro'?'tema-escuro':''; localStorage.setItem('atlas_tema', t); }
function addOcorrencia() {
    const i = document.getElementById('edit-idx').value;
    const h = document.getElementById('ed-h').value;
    const t = document.getElementById('ed-t').value;
    db_live[i].ocorrencias.push({hora:h, texto:t});
    localStorage.setItem('atlas_live', JSON.stringify(db_live));
    alert("Add!");
}
function atualizarLista() {
    const l = document.getElementById('lista-rodadas');
    l.innerHTML = db_live.map((it, i) => `
        <div class="form-section">
            <b>${it.painel} (${it.esp})</b> - Op: ${it.op}
            <button onclick="abrirEdicao(${i})" class="btn-small">EDITAR</button>
        </div>`).join('');
}
function abrirEdicao(i) {
    document.getElementById('edit-idx').value = i;
    document.getElementById('area-edicao').style.display='block';
}
function listarPastasFechadas() {
    const l = document.getElementById('lista-pastas');
    l.innerHTML = db_pastas.map((p, i) => `<div class="card" onclick="gerarPDF(${i})">📂 Pasta ${p.data}</div>`).reverse().join('');
}
function mudarAba(a) {
    document.getElementById('aba-relatorio').style.display = a==='relatorio'?'block':'none';
    document.getElementById('aba-historico').style.display = a==='historico'?'block':'none';
    if(a==='historico') listarPastasFechadas();
}
