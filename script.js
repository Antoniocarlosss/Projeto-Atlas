// --- BANCO DE DADOS (LOCAL STORAGE) ---
let db_users = JSON.parse(localStorage.getItem('atlas_users')) || [
    {nome:"Admin", email:"admin@atlas.com", senha:"123", nivel:"ilimitado"}
];
let db_live = JSON.parse(localStorage.getItem('atlas_live')) || [];
let userLogado = null;

// --- SISTEMA DE LOGIN ---
function fazerLogin() {
    const e = document.getElementById('login-email').value;
    const s = document.getElementById('login-senha').value;
    const u = db_users.find(x => x.email === e && x.senha === s);

    if(u) {
        userLogado = u;
        document.getElementById('tela-login').style.display = 'none';
        document.getElementById('app-principal').style.display = 'block';
        document.getElementById('user-display').innerText = u.nome;
        
        // Esconde o card de Gestão se não for ADM
        document.getElementById('card-gestao').style.display = u.nivel === 'ilimitado' ? 'flex' : 'none';
        
        mudarTema(localStorage.getItem('atlas_tema') || 'claro');
    } else { 
        alert("E-mail ou senha incorretos!"); 
    }
}

// --- NAVEGAÇÃO ---
function abrirModulo(m) {
    document.querySelectorAll('main > section').forEach(s => s.style.display = 'none');
    document.getElementById('grid-home').style.display = 'none';

    if(m === 'Home') document.getElementById('grid-home').style.display = 'grid';
    if(m === 'Injeção') { document.getElementById('modulo-injecao').style.display = 'block'; atualizarLista(); }
    if(m === 'Bobines') document.getElementById('modulo-bobines').style.display = 'block';
    if(m === 'Gestão') { 
        document.getElementById('modulo-gestao').style.display = 'block'; 
        listarUsuarios(); // Carrega a lista ao abrir
    }
    if(m === 'Configuração') document.getElementById('modulo-config').style.display = 'block';
}

function abrirSubModulo(sub) {
    document.getElementById('modulo-bobines').style.display = 'none';
    if(sub === 'calc') { document.getElementById('bobine-calc').style.display = 'block'; prepararCalculadora(); }
    if(sub === 'rel') document.getElementById('bobine-rel').style.display = 'block';
}

function voltarHome() { abrirModulo('Home'); }

// --- GESTÃO DE USUÁRIOS (A PARTE QUE NÃO ESTAVA FUNCIONANDO) ---
function salvarUsuario() {
    const nome = document.getElementById('g-nome').value;
    const email = document.getElementById('g-email').value;
    const senha = document.getElementById('g-senha').value;
    const nivel = document.getElementById('g-nivel').value;

    if (!nome || !email || !senha) {
        alert("Preencha todos os campos para cadastrar!");
        return;
    }

    // Verifica se e-mail já existe
    if (db_users.some(user => user.email === email)) {
        alert("Este e-mail já está cadastrado!");
        return;
    }

    const novoUser = { nome, email, senha, nivel };
    db_users.push(novoUser);
    
    // Salva no Navegador
    localStorage.setItem('atlas_users', JSON.stringify(db_users));
    
    // Limpa formulário
    document.getElementById('g-nome').value = "";
    document.getElementById('g-email').value = "";
    document.getElementById('g-senha').value = "";

    alert("Usuário cadastrado com sucesso!");
    listarUsuarios();
}

function listarUsuarios() {
    const listaDiv = document.getElementById('lista-usuarios');
    listaDiv.innerHTML = "<h3 style='margin-top:20px'>Usuários Cadastrados</h3>";
    
    db_users.forEach((u, index) => {
        const item = document.createElement('div');
        item.style = "background:#fff; padding:10px; margin:5px 0; border-radius:5px; display:flex; justify-content:space-between; align-items:center; color:#333; box-shadow: 0 1px 3px rgba(0,0,0,0.1)";
        item.innerHTML = `
            <div>
                <strong>${u.nome}</strong> <br> 
                <small>${u.email} | ${u.nivel === 'ilimitado' ? 'ADM' : 'Operador'}</small>
            </div>
            ${u.email !== 'admin@atlas.com' ? `<button onclick="excluirUser(${index})" style="background:#ff4d4d; color:white; border:none; padding:5px 10px; border-radius:3px; cursor:pointer;">Remover</button>` : ''}
        `;
        listaDiv.appendChild(item);
    });
}

function excluirUser(index) {
    if(confirm("Deseja realmente excluir este usuário?")) {
        db_users.splice(index, 1);
        localStorage.setItem('atlas_users', JSON.stringify(db_users));
        listarUsuarios();
    }
}

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

// --- FUNÇÕES INJEÇÃO ---
function iniciarRodada() {
    const esp = document.getElementById('inj-esp').value;
    if(!esp) return alert("Selecione a espessura!");
    db_live.push({ painel: document.getElementById('inj-painel').value, esp: esp + " mm", metros: "", vel: "", ocorrencias: [], quimicos: {}, op: userLogado.nome });
    localStorage.setItem('atlas_live', JSON.stringify(db_live)); 
    atualizarLista();
}

function salvarEdicao() {
    const i = document.getElementById('edit-idx').value;
    db_live[i].metros = document.getElementById('ed-m').value;
    db_live[i].vel = document.getElementById('ed-v').value;
    localStorage.setItem('atlas_live', JSON.stringify(db_live));
    document.getElementById('area-edicao').style.display='none'; 
    atualizarLista();
}

function atualizarLista() {
    const lista = document.getElementById('lista-rodadas');
    if(lista) {
        lista.innerHTML = db_live.map((it, i) => `
            <div class="form-section" style="display:flex; justify-content:space-between; align-items:center;">
                <span><b>${it.painel}</b> (${it.esp})</span> 
                <button onclick="abrirEdicao(${i})" class="btn-save blue" style="width:auto; padding:5px 15px;">EDITAR</button>
            </div>
        `).join('');
    }
}

function abrirEdicao(i) { 
    document.getElementById('edit-idx').value = i; 
    document.getElementById('area-edicao').style.display='block'; 
}

function fecharPasta() { 
    if(confirm("Deseja fechar o dia? Isso limpará a lista atual.")) {
        db_live = []; 
        localStorage.setItem('atlas_live', JSON.stringify(db_live));
        atualizarLista(); 
    }
}

function mudarAba(a) { 
    document.getElementById('aba-relatorio').style.display = a==='relatorio'?'block':'none'; 
    document.getElementById('aba-historico').style.display = a==='historico'?'block':'none'; 
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
}

function mudarTema(t) { 
    document.body.className = t==='escuro'?'tema-escuro':''; 
    localStorage.setItem('atlas_tema', t); 
}
