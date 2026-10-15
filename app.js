"use strict";
/* ===== Iconos SVG integrados (sin dependencias) ===== */
const P={home:'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',list:'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',chart:'M4 20V10m6 10V4m6 16v-7m5 7H2',cog:'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14.5 3h-4l-.4 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z',store:'M4 9l1-5h14l1 5M4 9a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 6 0 2.5 2.5 0 0 0 5 0M5 12v8h14v-8M10 20v-5h4v5',up:'M3 17l6-6 4 4 8-8M15 7h6v6',down:'M3 7l6 6 4-4 8 8M15 17h6v-6',dots:'M12 5h.01M12 12h.01M12 19h.01',back:'M15 18l-6-6 6-6',eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',edit:'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',trash:'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',cal:'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',box:'M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8',plus:'M12 5v14M5 12h14',count:'M9 4h6v3H9zM7 5H5v16h14V5h-2M9 14l2 2 4-4',search:'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3'};
const ic=n=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n]}"/></svg>`;

/* ===== Datos: localStorage (solo versión de prueba; importes en centavos enteros) =====
   S = {settings:{name,initial}, movs:[{id,type:'in'|'out',amount,desc,date,time,place,clientCat,cat,party,notes,created}], suppliers:[], clients:[]} */
const KEY='mi-negocio-v1';
function load(){try{const d=JSON.parse(localStorage.getItem(KEY));if(d&&Array.isArray(d.movs))return Object.assign({settings:{name:'Mi negocio',initial:0},suppliers:[],clients:[]},d)}catch(e){}
  return{settings:{name:'Mi negocio',initial:0},movs:[],suppliers:[],clients:[]}}
let mem=false;try{localStorage.setItem('_t','1');localStorage.removeItem('_t')}catch(e){mem=true}
let S=load();S.inv=S.inv||[];
/* Si el navegador bloquea localStorage, los datos quedan en memoria y se avisa en pantalla */
function save(){if(mem)return true;try{localStorage.setItem(KEY,JSON.stringify(S));return true}catch(e){toast('No se pudo guardar los cambios. Hacé una copia de seguridad.',1);return false}}

/* ===== Utilidades ===== */
const $=s=>document.querySelector(s);
const num=c=>{const[i,d]=(Math.abs(c)/100).toFixed(2).split('.');return i.replace(/\B(?=(\d{3})+(?!\d))/g,'.')+(d==='00'?'':','+d)};
const fmt=c=>(c<0?'-':'')+'$ '+num(c);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const today=()=>iso(new Date());
function parseMoney(v){v=String(v).trim().replace(/[^\d.,]/g,'');if(!v)return NaN;
  v=v.replace(/\./g,'').replace(',','.');
  const n=Number(v);return isFinite(n)?Math.round(n*100):NaN}
const uid=()=>{try{return crypto.randomUUID()}catch(e){return Date.now().toString(36)+Math.random().toString(36).slice(2)}};
function dlabel(m){const y=iso(new Date(Date.now()-864e5));if(m.date===today())return 'Hoy'+(m.time?', '+m.time:'');if(m.date===y)return 'Ayer';return m.date.split('-').reverse().join('/')}
function inPer(d,p){const t=new Date(),ts=today();if(p==='day')return d===ts;if(p==='month')return d.slice(0,7)===ts.slice(0,7);if(p==='year')return d.slice(0,4)===ts.slice(0,4);
  const k=(t.getDay()+6)%7,a=new Date(t);a.setDate(t.getDate()-k);const b=new Date(a);b.setDate(a.getDate()+6);return d>=iso(a)&&d<=iso(b)}
/* Stock: suma (+1) o descuenta (-1) la cantidad vendida de un movimiento */
const stk=(m,s)=>{(m.items||(m.itemId?[{id:m.itemId,qty:m.qty}]:[])).forEach(x=>{const i=S.inv.find(y=>y.id===x.id);if(i)i.stock+=s*(x.qty||0)})};
const sum=(l,t)=>l.filter(m=>m.type===t).reduce((a,m)=>a+m.amount,0);
const sorted=l=>[...l].sort((a,b)=>b.date.localeCompare(a.date)||b.created-a.created);
const avail=()=>S.settings.initial+sum(S.movs,'in')-sum(S.movs,'out');
const PER=[['day','Hoy'],['week','Esta semana'],['month','Este mes'],['year','Este año']];

/* ===== Estado de UI ===== */
const U={tab:'home',ht:'in',hp:'day',mt:'all',mp:'month',sp:'month',sd:'',md:'',q:'',lim:30};
let busy=false,pendingDel=null,pendingImp=null,anim=false,lastBal;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function toast(t,bad){const e=$('#toast');e.innerHTML=(bad?'':'<svg class="tk" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 13l4 4L19 7"/></svg>')+esc(t);e.className=bad?'bad':'';e.hidden=true;void e.offsetWidth;e.hidden=false;clearTimeout(toast.k);toast.k=setTimeout(()=>e.hidden=true,2600)}

/* ===== Vistas ===== */
const chips=(cur,act)=>`<div class="chips" role="group">${PER.map(([k,l])=>`<button class="chip${cur===k?' on':''}" data-a="${act}" data-v="${k}">${l}</button>`).join('')}</div>`;
function tabs(items,cur,act){return `<div class="tabs" role="tablist" style="--n:${items.length}">${items.map(([k,l])=>`<button role="tab" aria-selected="${cur===k}" class="${cur===k?'on':''}${k==='out'?' o':''}" data-a="${act}" data-v="${k}">${l}</button>`).join('')}</div>`}
function row(m,g){const o=m.type==='out';const sub=[g===true?(m.time||''):dlabel(m),o?m.cat:(m.client!==m.desc?m.client:m.clientCat),o?(m.party&&'Proveedor: '+m.party):m.place].filter(Boolean).map(esc).join(' · ');
  return `<div class="row"><div class="tx"><b>${esc(m.desc)}</b><small>${sub}</small></div><span class="amt ${m.type}">${o?'−':'+'}${fmt(m.amount)}</span><button class="dots" data-a="menu" data-id="${m.id}" aria-label="Opciones de ${esc(m.desc)}">${ic('dots')}</button></div>`}
const emptyList=(t)=>`<div class="empty">${ic('list')}<b>Sin movimientos</b>${t}</div>`;

/* Compara los ingresos de hoy con los de ayer */
function vsY(per){const nw0=new Date(),Y=nw0.getFullYear(),M=nw0.getMonth(),D=nw0.getDate(),dt=(y,m,x)=>iso(new Date(y,m,x));let cu,pr,lb;
  /* Mismo tramo de tiempo en ambos períodos: lo que va de la semana/mes/año contra el período anterior hasta el mismo día */
  if(per==='week'){const k=(nw0.getDay()+6)%7;cu=[dt(Y,M,D-k),dt(Y,M,D)];pr=[dt(Y,M,D-k-7),dt(Y,M,D-7)];lb='la semana pasada'}
  else if(per==='month'){cu=[dt(Y,M,1),dt(Y,M,D)];pr=[dt(Y,M-1,1),dt(Y,M-1,Math.min(D,new Date(Y,M,0).getDate()))];lb='el mes pasado'}
  else if(per==='year'){cu=[dt(Y,0,1),dt(Y,M,D)];pr=[dt(Y-1,0,1),dt(Y-1,M,M===1&&D===29?28:D)];lb='el año pasado'}
  else{cu=[dt(Y,M,D),dt(Y,M,D)];pr=[dt(Y,M,D-1),dt(Y,M,D-1)];lb='ayer'}
  const at=r=>sum(S.movs.filter(m=>m.date>=r[0]&&m.date<=r[1]),'in');
  const p=at(pr),n=at(cu);let tx,c='var(--m)',i='';
  if(p===0)tx=n===0?'Sin ingresos todavía':'No hubo ingresos '+lb;
  else{const r=Math.round((n-p)/p*1000)/10,a=Math.abs(r),s=(a>=100?String(Math.round(a)):(a%1?a.toFixed(1):String(a))).replace('.',',');
    if(r>0){tx=s+'% más que '+lb;c='var(--g2)';i=ic('up')}else if(r<0){tx=s+'% menos que '+lb;c='var(--r)';i=ic('down')}else tx='Igual que '+lb}
  return `<span style="display:inline-flex;align-items:center;justify-content:center;gap:4px;margin-top:8px;padding:4px 10px;border-radius:999px;background:var(--c);box-shadow:0 1px 3px rgba(0,0,0,.12);font-size:11px;font-weight:700;line-height:1.25;color:${c};text-align:left">${i.replace('<svg','<svg style="width:14px;height:14px;color:'+c+'"')}${tx}</span>`}
/* Tarjeta de progreso de la meta mensual (solo si hay meta) */
function goalCard(){const g=S.settings.goal||0;if(!g||!S.settings.goalOn)return '';const v=sum(S.movs.filter(m=>inPer(m.date,'month')),'in'),r=Math.round(v/g*100),ok=v>=g;
  return `<div class="card" style="margin-top:12px"><div style="display:flex;justify-content:space-between;align-items:baseline"><b>Meta del mes</b><b style="color:${ok?'var(--g2)':'var(--t)'}">${r}%</b></div><div style="height:10px;border-radius:99px;background:var(--b);margin:10px 0 8px;overflow:hidden"><div class="gbar" style="width:${Math.min(100,r)}%;height:100%;background:var(--g2);border-radius:99px"></div></div><small style="color:var(--m)">${fmt(v)} de ${fmt(g)} · ${ok?'¡Meta cumplida!':'faltan '+fmt(g-v)}</small></div>`}
function vHome(){const per=S.movs.filter(m=>inPer(m.date,U.hp)),list=sorted(S.movs.filter(m=>m.type===U.ht));
  const shown=list.slice(0,5);
  return `<h2 class="sec" style="margin:0 0 8px">Resumen total</h2>
  <section class="bal${avail()<0?' neg':''}"><small>BALANCE</small><div class="big">${fmt(avail())}</div></section>
  ${chips(U.hp,'hper')}
  <div class="two"><div class="card sum in"><span>${ic('up')}Ingresos</span><b>${fmt(sum(per,'in'))}</b>${vsY(U.hp)}</div><div class="card sum out"><span>${ic('down')}Egresos</span><b>${fmt(sum(per,'out'))}</b></div></div>
  ${goalCard()}
  <h2 class="sec">Últimos movimientos</h2>
  ${tabs([['in','Ingresos'],['out','Egresos']],U.ht,'htab')}
  <div class="card">${shown.length?shown.map(row).join(''):emptyList(U.ht==='in'?'Registrá tu primera venta.':'Registrá tu primer gasto.')}</div>
  ${list.length>5?`<button class="link" data-a="tab" data-v="mov">Ver todos los movimientos</button>`:''}
  `}

/* Buscador: con texto escrito busca en todos los movimientos, sin importar el período */
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const hasQ=()=>U.q.trim()!=='';
function movFiltered(){const q=norm(U.q).split(/\s+/).filter(Boolean);
  const hay=m=>{const h=norm([m.desc,m.client,m.place,m.party,m.notes,m.cat,m.clientCat,m.amount/100,num(m.amount),dlabel(m),m.date.split('-').reverse().join('/')].concat((m.items||[]).map(x=>x.name),m.xt||[]).join(' '));return q.every(t=>h.includes(t))};
  return sorted(S.movs.filter(m=>(U.mt==='all'||m.type===U.mt)&&(q.length?hay(m):(U.md?m.date===U.md:inPer(m.date,U.mp)))))}
/* Muestra de a 30 movimientos; "Ver más" suma otros 30 */
/* Movimientos agrupados por día, con el total de ingresos y egresos de cada día */
function grpRows(l){const tot={};l.forEach(m=>{const t=tot[m.date]=tot[m.date]||{i:0,o:0};t[m.type==='in'?'i':'o']+=m.amount});
  const dl=d=>{if(d===today())return 'Hoy';if(d===iso(new Date(Date.now()-864e5)))return 'Ayer';const p=d.split('-');return ['dom','lun','mar','mié','jue','vie','sáb'][new Date(+p[0],+p[1]-1,+p[2]).getDay()]+' '+p[2]+'/'+p[1]+'/'+p[0]};
  let h='',prev='';l.slice(0,U.lim).forEach(m=>{if(m.date!==prev){prev=m.date;const t=tot[m.date];h+=`<div class="dh"><span>${dl(m.date)}</span><span>${t.i?`<b class="amt in">+${fmt(t.i)}</b>`:''}${t.i&&t.o?' ':''}${t.o?`<b class="amt out">−${fmt(t.o)}</b>`:''}</span></div>`}h+=row(m,true)});return h}
const movList=l=>l.length?grpRows(l)+(l.length>U.lim?`<div style="text-align:center;padding:10px 0 4px"><small style="color:var(--m)">Mostrando ${U.lim} de ${l.length}</small><button class="btn ghost" style="width:100%;margin-top:8px" data-a="more">Ver más</button></div>`:''):emptyList(hasQ()?'No encontramos movimientos con esa búsqueda.':'No hay movimientos con estos filtros.');
function movTop(){return (U.md&&!hasQ()?`<div class="chips"><span class="chip on">${U.md.split('-').reverse().join('/')}</span><button class="chip" data-a="mdclear">Quitar fecha</button></div>`:'')+(hasQ()?'<p style="color:var(--m);font-size:13px;margin:10px 0">Buscando en todos los movimientos</p>':chips(U.md?'':U.mp,'mper'))}
function vMov(){let l=movFiltered();
  return `<header class="hd"><div><h1>Movimientos</h1><p id="mc">${l.length} ${hasQ()?(l.length===1?'resultado':'resultados'):'en el período'}</p></div></header>
  <div class="sr">${ic('search')}<input id="q" type="search" autocomplete="off" placeholder="Buscar cliente, producto o lugar" value="${esc(U.q)}" aria-label="Buscar movimientos"></div>
  ${tabs([['all','Todos'],['in','Ingresos'],['out','Egresos']],U.mt,'mtab')}<div id="mt">${movTop()}</div>
  <div class="card" id="ml">${movList(l)}</div>`}

function vStats(){const l=S.movs.filter(m=>U.sd?m.date===U.sd:inPer(m.date,U.sp)),i=sum(l,'in'),o=sum(l,'out');
  let body;
  if(!S.movs.length)body=`<div class="card empty">${ic('chart')}<b>Todavía no hay datos</b>Registrá tu primera venta para ver tus estadísticas.</div>`;
  else if(!l.length)body=`<div class="card empty">${ic('chart')}<b>Sin movimientos en este período</b>Probá con otro período.</div>`;
  else if(U.sd)body=`<h2 class="sec">Movimientos del día</h2><div class="card">${sorted(l).map(row).join('')}</div>`;
  else{const yr=U.sp==='year',B={};l.forEach(m=>{const k=yr?m.date.slice(0,7):m.date;(B[k]=B[k]||{i:0,o:0})[m.type==='in'?'i':'o']+=m.amount});
    const ks=Object.keys(B).sort().slice(-31),mx=Math.max(...ks.map(k=>Math.max(B[k].i,B[k].o)));
    const lb=k=>{const p=k.split('-');if(yr)return p[1]+'/'+p[0].slice(2);const w=U.sp==='week'?['dom','lun','mar','mié','jue','vie','sáb'][new Date(+p[0],+p[1]-1,+p[2]).getDay()]+' ':'';return w+p[2]+'/'+p[1]};
    body=`<div class="card"><div class="chart">${ks.map(k=>`<button type="button" class="bk" data-a="bar" data-t="${lb(k)}" data-i="${B[k].i}" data-o="${B[k].o}" aria-label="${lb(k)}"><div class="bars"><i class="i" style="height:${B[k].i/mx*100}%"></i><i class="o" style="height:${B[k].o/mx*100}%"></i></div>${lb(k)}</button>`).join('')}</div>
    <p id="bi" style="font-size:13px;color:var(--m);margin-top:8px">Verde: ingresos · Rojo: egresos. Tocá una barra para ver los importes. Máximo: ${fmt(mx)}.</p></div>
    <h2 class="sec">Historial del período</h2><div class="card">${[...ks].reverse().map(k=>`<div class="kv"><span>${lb(k)}</span><span><b class="amt in">+${fmt(B[k].i)}</b> &nbsp; <b class="amt out">−${fmt(B[k].o)}</b></span></div>`).join('')}</div>`}
  return `<header class="hd"><div><h1>Estadísticas</h1><p>Calculadas con tus movimientos</p></div></header>${chips(U.sd?'':U.sp,'sper').replace(/Hoy/,'Día').replace('Esta semana','Semana').replace('Este mes','Mes').replace('Este año','Año')}<div class="card" style="display:flex;gap:8px;align-items:center;margin-bottom:12px"><label for="sd" style="margin:0;white-space:nowrap">Ver un día</label><input id="sd" type="date" value="${U.sd}">${U.sd?'<button class="chip" data-a="sdclear">Quitar</button>':''}</div>
  <div class="two"><div class="card sum in"><span>${ic('up')}Ingresos</span><b>${fmt(i)}</b></div><div class="card sum out"><span>${ic('down')}Egresos</span><b>${fmt(o)}</b></div></div>
  <div class="card sum" style="margin:12px 0"><span>Resultado neto</span><b style="color:${i-o<0?'var(--r)':'var(--g2)'}">${fmt(i-o)}</b></div>${body}`}

function vSet(){const sw=(k,t,d)=>`<div class="card" style="display:flex;align-items:center;gap:12px;margin-bottom:12px"><div style="flex:1"><b>${t}</b><p style="color:var(--m);font-size:14px">${d}</p></div><button class="sw${S.settings[k]?' on':''}" role="switch" aria-checked="${!!S.settings[k]}" aria-label="${t}" data-a="tog" data-v="${k}"><i></i></button></div>`;
  return `<header class="hd"><div><h1>Ajustes</h1></div></header>${sw('dark','Modo oscuro','Fondo negro para usar de noche.')}${sw('inv','Habilitar inventario','Agrega la sección Inventario y permite elegir productos al vender.')}${sw('goalOn','Habilitar meta mensual','Muestra en Inicio tu progreso de ventas del mes.')}${setForms()}${backupCard()}`}
/* Copia de seguridad: copiar los datos y pegarlos en otro dominio o teléfono */
function backupCard(){return `<h2 class="sec">Copia de seguridad</h2><div class="card"><p style="color:var(--m);font-size:14px">Tus datos se guardan solo en este navegador. Hacé una copia de vez en cuando para no perderlos y para pasarlos a otro teléfono o dirección.</p><label style="margin-top:16px">Con un archivo (recomendado)</label><p style="color:var(--m);font-size:13px;margin:0 0 8px">Exportar descarga un archivo con todos tus datos. Importar carga un archivo de copia que ya tengas.</p><div class="acts" style="margin-top:0"><button class="btn ghost" data-a="export">Exportar archivo</button><button class="btn ghost" data-a="file">Importar archivo</button></div><label for="ex" style="margin-top:20px">Con texto</label><p style="color:var(--m);font-size:13px;margin:0 0 8px">Copiar texto guarda todo como un texto largo que podés pegar en una nota. Para recuperarlo, pegalo en esta caja y tocá Importar texto.</p><textarea id="ex" class="box" spellcheck="false">${esc(JSON.stringify(S))}</textarea><div class="acts"><button class="btn ghost" data-a="copy">Copiar texto</button><button class="btn ghost" data-a="import">Importar texto</button></div><p style="color:var(--r);font-size:13px;margin-top:14px">Importar reemplaza todo lo que tengas cargado en la app.</p>${hasPrev()?'<button class="btn ghost" style="width:100%;margin-top:10px" data-a="restoreprev">Recuperar datos de antes de la última importación</button>':''}<input type="file" id="bf" accept=".json,application/json,text/plain" hidden></div>`}
/* Saldo inicial y meta mensual (importes con comas automáticas) */
function setForms(){const nf2=c=>c?num(c):'';
  const f=(id,t,d,n,v,e,b)=>`<form id="${id}" class="card" novalidate style="margin-bottom:12px"><b>${t}</b><p style="color:var(--m);font-size:14px;margin-bottom:10px">${d}</p><input class="money" name="${n}" inputmode="numeric" placeholder="$ 0" autocomplete="off" aria-label="${t}" value="${nf2(v)}"><small class="err" id="${e}"></small><button class="btn" style="width:100%;margin-top:8px">${b}</button></form>`;
  return f('sf','Saldo inicial','Con cuánta plata arrancás. Se suma al balance.','initial',S.settings.initial,'se','Guardar saldo inicial')+(S.settings.goalOn?f('gf','Meta mensual de ventas','Tu objetivo de ingresos por mes. Dejalo vacío para quitarla.','goal',S.settings.goal,'ge','Guardar meta'):'')}
/* ===== Inventario ===== */
function vInv(){const l=[...S.inv].sort((a,b)=>a.name.localeCompare(b.name)),u=l.reduce((a,i)=>a+i.stock,0),v=l.reduce((a,i)=>a+i.price*i.stock,0);
  return `<header class="hd"><div><h1>Inventario</h1><p>${l.length} productos</p></div></header><div class="two" style="margin-bottom:12px"><div class="card sum in"><span>${ic('box')}Productos total</span><b>${u}</b></div><div class="card sum"><span>Valor del inventario</span><b>${fmt(v)}</b></div></div><div class="card">${l.length?l.map(i=>`<div class="row"><div class="tx"><b>${esc(i.name)}</b><small>Stock: <span style="color:${i.stock<=0?'var(--r)':'inherit'}">${i.stock}</span></small></div><span class="amt">${fmt(i.price)}</span><button class="dots" data-a="itemmenu" data-id="${i.id}" aria-label="Opciones de ${esc(i.name)}">${ic('dots')}</button></div>`).join(''):`<div class="empty">${ic('box')}<b>Sin productos</b>Agregá tu primer producto con su precio y stock.</div>`}</div>`}
function openItem(id){const i=(id&&S.inv.find(x=>x.id===id))||{};const L=$('#layer');L.hidden=false;document.body.style.overflow='hidden';
  L.innerHTML=`<div class="ctr"><div class="fh"><button class="ib" type="button" data-a="back" aria-label="Volver">${ic('back')}</button></div><form id="if" class="fcard" autocomplete="off" novalidate data-id="${id||''}"><div class="ficon">${ic('box')}</div><h2>${id?'Editar producto':'Nuevo producto'}</h2><p class="sub">Cargá el nombre, el precio y las unidades que tenés.</p>
  <label for="in">Nombre del producto</label><input id="in" name="name" autocomplete="off" maxlength="60" placeholder="Ej: Una remerita de boca" value="${esc(i.name||'')}"><small class="err" id="e1"></small>
  <label for="fa">Precio</label><div class="pf"><span>$</span><input id="fa" name="price" class="amtin" inputmode="numeric" placeholder="0" autocomplete="off" value="${i.price?num(i.price):''}"></div><small class="err" id="ea"></small>
  <label for="is">Stock (unidades)</label><div class="step"><button type="button" data-a="stk" data-t="is" data-v="-1" aria-label="Restar">−</button><input id="is" name="stock" inputmode="numeric" value="${i.stock??''}"><button type="button" data-a="stk" data-t="is" data-v="1" aria-label="Sumar">+</button></div><small class="err" id="e2"></small>
  <div class="acts"><button type="button" class="btn ghost" data-a="back">Cancelar</button><button class="btn">${id?'Guardar cambios':'Guardar producto'}</button></div></form></div>`;try{history.pushState({f:1},'')}catch(e){}}
function submitItem(f){const d=Object.fromEntries(new FormData(f)),pr=parseMoney(d.price),st=Math.floor(Number(d.stock));let bad=0;
  ['e1','ea','e2'].forEach(k=>$('#'+k).textContent='');
  if(!d.name.trim()){$('#e1').textContent='Escribí el nombre del producto.';bad=1}
  if(d.price===''||!(pr>=0)){$('#ea').textContent='Ingresá el precio.';bad=1}
  if(d.stock===''||!(st>=0)){$('#e2').textContent='Ingresá el stock (0 o más).';bad=1}
  if(bad)return;const rec={name:d.name.trim(),price:pr,stock:st};
  if(f.dataset.id)Object.assign(S.inv.find(x=>x.id===f.dataset.id),rec);else S.inv.push(Object.assign({id:uid()},rec));
  const ok=save();closeForm();render();if(ok)toast('Producto guardado')}
/* Conteo de stock: edita las cantidades de todos los productos en un solo formulario */
function openCount(){const L=$('#layer');L.hidden=false;document.body.style.overflow='hidden';
  L.innerHTML=`<div class="ctr"><div class="fh"><button class="ib" type="button" data-a="back" aria-label="Volver">${ic('back')}</button><h2>Conteo de stock</h2></div>
  <form id="cf" class="fcard" novalidate>${S.inv.length?`<p style="color:var(--m);font-size:14px">Poné la cantidad real que tenés de cada producto.</p>`+[...S.inv].sort((a,b)=>a.name.localeCompare(b.name)).map(i=>`<div class="crow"><b>${esc(i.name)}</b><div class="step"><button type="button" data-a="stk" data-t="c_${i.id}" data-v="-1" aria-label="Restar">−</button><input id="c_${i.id}" name="${i.id}" inputmode="numeric" value="${i.stock}" aria-label="${esc(i.name)}"><button type="button" data-a="stk" data-t="c_${i.id}" data-v="1" aria-label="Sumar">+</button></div></div>`).join('')+`<small class="err" id="ec"></small><div class="acts"><button type="button" class="btn ghost" data-a="back">Cancelar</button><button class="btn">Guardar conteo</button></div>`:`<div class="empty">${ic('box')}<b>Sin productos</b>Creá un producto para poder contar el stock.</div>`}</form></div>`;
  try{history.pushState({f:1},'')}catch(e){}}
function submitCount(f){const v={};for(const i of S.inv){const r=f.elements[i.id].value.trim(),n=Math.floor(Number(r));if(r===''||!(n>=0)){$('#ec').textContent='Revisá "'+i.name+'": ingresá un número (0 o más).';f.elements[i.id].focus();return}v[i.id]=n}
  S.inv.forEach(i=>i.stock=v[i.id]);const ok=save();closeForm();render();if(ok)toast('Conteo guardado')}
function itemMenu(id){const i=S.inv.find(x=>x.id===id);if(!i)return;sheet(`<h3>${esc(i.name)}</h3><button class="opt" data-a="itemedit" data-id="${id}">${ic('edit')}Editar</button><button class="opt d" data-a="itemdel" data-id="${id}">${ic('trash')}Eliminar</button>`)}
function itemDel(id){const i=S.inv.find(x=>x.id===id);if(!i)return;sheet(`<h3>Eliminar producto</h3><p>¿Querés eliminar ${esc(i.name)} del inventario? Las ventas ya registradas no se modifican.</p><div class="acts"><button class="btn ghost" data-a="close">Cancelar</button><button class="btn dng" data-a="itemdelok" data-id="${id}">Sí, eliminar</button></div>`,1)}

/* Cabecera fija: logo, nombre, últimos 4 días y calendario; barra de acciones sobre el menú */
/* El botón "atrás" desde cualquier sección vuelve a Inicio; el espacio final se ajusta a la altura del bloque inferior */
function pushT(){if(U.tab==='home'){try{history.pushState({t:1},'')}catch(e){}}}
function dockPad(){const d=$('#dock'),a=$('#app');if(d&&a)a.style.paddingBottom=(d.offsetHeight+12)+'px'}
window.addEventListener('resize',dockPad);
if(window.ResizeObserver)new ResizeObserver(dockPad).observe($('#dock'));
function chrome(){document.documentElement.dataset.theme=S.settings.dark?'dark':'light';$('#nav').style.setProperty('--nn',S.settings.inv?5:4);const M=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];let h='';
  for(let k=4;k>=1;k--){const d=new Date(Date.now()-k*864e5),s=iso(d);h+=`<button class="chip${U.md===s?' on':''}" data-a="day" data-v="${s}">${d.getDate()} ${M[d.getMonth()]}</button>`}
  if(!$('#logo').firstChild)$('#logo').innerHTML=ic('store')+'<img alt="Zina Basicos" referrerpolicy="no-referrer" src="icon.png" onerror="this.remove()">';
  $('#dates').innerHTML=h+`<span class="calb">${ic('cal')}<input type="date" id="cd" aria-label="Elegir fecha en el calendario"></span>`;
  $('#fab').hidden=!(U.tab==='home'||U.tab==='inv');
  const fh=U.tab==='inv'?`<button class="btn cnt" data-a="count">${ic('count')}Conteo de stock</button><button class="btn fin" data-a="itemnew">${ic('plus')}Crear producto</button>`:`<button class="btn fin" data-a="new" data-v="in">${ic('up')}Nueva venta</button><button class="btn fout" data-a="new" data-v="out">${ic('down')}Nuevo gasto</button>`;if(fh!==chrome.f){chrome.f=fh;$('#fab').innerHTML=fh}dockPad()}
/* El balance "cuenta" hasta su valor nuevo */
function countTo(el,a,b){const t0=performance.now(),D=650;(function f(t){const k=Math.min(1,(t-t0)/D),e=1-Math.pow(1-k,3);el.textContent=fmt(k<1?Math.round((a+(b-a)*e)/100)*100:b);if(k<1)requestAnimationFrame(f)})(t0)}
function render(){chrome();$('#main').innerHTML=(mem?'<div class="card" style="background:var(--rl);margin-bottom:12px;font-size:14px"><b>Modo temporal:</b> este navegador no permite guardar datos. Se mantienen solo mientras la app esté abierta. Abrí el archivo index.html en tu navegador para que se conserven.</div>':'')+{home:vHome,mov:vMov,stats:vStats,set:vSet,inv:vInv}[U.tab]();
  $('#nav').innerHTML=[['home','Inicio','home'],['mov','Movimientos','list'],['stats','Estadísticas','chart']].concat(S.settings.inv?[['inv','Inventario','box']]:[]).concat([['set','Ajustes','cog']]).map(([k,l,i])=>`<button data-a="tab" data-v="${k}" class="${U.tab===k?'on':''}"${U.tab===k?' aria-current="page"':''}>${ic(i)}${l}</button>`).join('');dockPad();const ch=document.querySelector('.chart');if(ch)ch.scrollLeft=ch.scrollWidth;
  const mn=$('#main');mn.className='';if(anim&&!reduced){void mn.offsetWidth;mn.className='anim'}anim=false;
  const bb=document.querySelector('.bal .big');if(bb){const v=avail();if(lastBal!==undefined&&lastBal!==v&&!reduced)countTo(bb,lastBal,v);lastBal=v}}

/* ===== Formularios (pantalla completa dentro de la app) ===== */
function openForm(type,id){const m=id?S.movs.find(x=>x.id===id):null,o=type==='out',v=m||{};
  const L=$('#layer');L.hidden=false;document.body.style.overflow='hidden';
  L.innerHTML=`<div class="fx"><form id="mf" autocomplete="off" novalidate data-type="${type}" data-id="${m?m.id:''}"><div class="fxh${o?' out':''}"><div class="fxt"><button class="ib" type="button" data-a="back" aria-label="Volver">${ic('back')}</button><b>${m?(o?'Editar gasto':'Editar venta'):(o?'Nuevo gasto':'Nueva venta')}</b></div><label for="fa">Importe</label><div class="pf2"><span>$</span><input id="fa" name="amount" inputmode="numeric" placeholder="0" autocomplete="off" value="${m?num(m.amount):''}"></div><small class="err" id="ea"></small></div><div class="fxb">
  <label for="ff">Fecha</label><input id="ff" name="date" type="date" value="${v.date||today()}"><small class="err" id="ef"></small>
  
  ${o?`<label for="fd">Producto</label><input id="fd" name="desc" autocomplete="off" maxlength="80" value="${esc(v.desc||'')}"><small class="err" id="e1"></small>
  <label for="fp">Proveedor (opcional)</label><input id="fp" name="party" autocomplete="off" maxlength="60" value="${esc(v.party||'')}">
  <label for="fn">Nota (opcional)</label><textarea id="fn" name="notes" rows="2" maxlength="200">${esc(v.notes||'')}</textarea>`
  :`<label for="fc">Cliente</label><input id="fc" name="client" autocomplete="off" maxlength="60" value="${esc(v.client||'')}"><small class="err" id="e1"></small>
  <label for="fd">Productos</label>${S.settings.inv?'<div id="il"></div>':''}<input id="fd" name="desc" autocomplete="off" maxlength="80" placeholder="${S.settings.inv?'Se completa al elegir del inventario':'Nombre del producto'}" value="${esc(v.desc||'')}"><small class="err" id="e3"></small><div id="xp"></div><small class="err" id="e4"></small>
  <div class="cr">${S.settings.inv?'<button type="button" class="chip" id="al" data-a="addline">+ Del inventario</button>':''}<button type="button" class="chip" id="ap" data-a="addp">+ Otro producto</button></div>
  <label for="fl">Lugar de entrega</label><input id="fl" name="place" maxlength="60" autocomplete="off" value="${esc(v.place||'')}">
  <small class="err" id="e2"></small>
  <label for="fn">Nota (opcional)</label><textarea id="fn" name="notes" rows="2" maxlength="200">${esc(v.notes||'')}</textarea>`}
  <div class="acts"><button type="button" class="btn ghost" data-a="back">Cancelar</button><button class="btn${o?' red':''}">${m?'Guardar cambios':(o?'Guardar gasto':'Guardar venta')}</button></div></div></form></div>`;
  if(S.settings.inv&&!o)(v.items||(v.itemId?[{id:v.itemId,qty:v.qty}]:[])).forEach(x=>addLine(x.id,x.qty));
  if(S.settings.inv&&!o&&v.items&&v.items.length&&v.xt)v.xt.forEach(x=>addX(x));
  try{history.pushState({f:1},'')}catch(e){}}
/* Venta con varios productos del inventario: cada línea tiene producto + cantidad; el importe y el nombre se completan solos */
function addLine(id,q){const d=document.createElement('div');d.className='il';
  d.innerHTML=`<select name="itemId" aria-label="Producto"><option value="">— Elegir producto —</option>${S.inv.map(i=>`<option value="${i.id}"${id===i.id?' selected':''}>${esc(i.name)} · ${fmt(i.price)} · stock ${i.stock}</option>`).join('')}</select><div class="step"><button type="button" data-a="lq" data-v="-1" aria-label="Restar">−</button><input name="qty" inputmode="numeric" value="${q||1}" aria-label="Cantidad"><button type="button" data-a="lq" data-v="1" aria-label="Sumar">+</button></div><button type="button" class="dots" data-a="lrm" aria-label="Quitar producto">${ic('trash')}</button>`;
  $('#il').appendChild(d);sumLines();lblAdd()}
function addX(t){const d=document.createElement('div');d.className='il';d.innerHTML='<input name="xdesc" autocomplete="off" maxlength="80" placeholder="Otro producto" aria-label="Otro producto" style="flex:1 1 0;min-width:0" value="'+esc(t||'')+'"><button type="button" class="dots" data-a="lrm" aria-label="Quitar producto">'+ic('trash')+'</button>';$('#xp').appendChild(d);if(t===undefined)d.querySelector('input').focus()}
function lblAdd(){const b=$('#al');if(b)b.textContent=document.querySelector('#il .il')?'+ Otro del inventario':'+ Del inventario'}
function sumLines(){let t=0;const n=[];document.querySelectorAll('#il .il').forEach(r=>{const p=S.inv.find(x=>x.id===r.querySelector('select').value);if(!p)return;const q=Math.max(1,Math.floor(Number(r.querySelector('.step input').value))||1);t+=p.price*q;n.push(p.name+(q>1?' x'+q:''))});
  if(!n.length)return;$('#fa').value=num(t);$('#fd').value=n.join(', ')}
let skipPop=false,dirty=false;
/* Si hay cambios sin guardar, pregunta antes de cerrar un formulario */
function tryClose(fromPop){if(!$('#layer').hidden&&dirty){if(fromPop){try{history.pushState({f:1},'')}catch(e){}}sheet(`<h3>¿Descartar lo que escribiste?</h3><p>Si salís ahora, se pierden los cambios sin guardar.</p><div class="acts"><button class="btn ghost" data-a="close">Seguir editando</button><button class="btn dng" data-a="discard">Descartar</button></div>`,1);return}closeForm(fromPop?1:0)}
function closeForm(p){dirty=false;document.body.classList.remove('kb');$('#layer').hidden=true;$('#layer').innerHTML='';document.body.style.overflow='';if(!p){try{if(history.state&&history.state.f){skipPop=true;history.back()}}catch(e){}}}

function submitForm(f){if(busy)return;const fd=new FormData(f),d=Object.fromEntries(fd),o=f.dataset.type==='out',id=f.dataset.id;
  const a=parseMoney(d.amount);let bad=false;$('#ea').textContent='';$('#ef').textContent='';
  if(!(a>0)){$('#ea').textContent='Ingresá un importe mayor que cero.';bad=true}
  if(!/^\d{4}-\d{2}-\d{2}$/.test(d.date||'')){$('#ef').textContent='Elegí una fecha válida.';bad=true}
  const nm=[d.desc.trim()].concat(fd.getAll('xdesc').map(x=>x.trim())).filter(Boolean).join(', '),cl=o?'':d.client.trim();$('#e1').textContent='';if(o){if(!nm){$('#e1').textContent='Escribí el producto.';bad=true}}else{$('#e3').textContent='';if(!cl){$('#e1').textContent='Escribí el cliente.';bad=true}if(!nm){$('#e3').textContent='Escribí el producto.';bad=true}}
  if(!o){$('#e2').textContent='';if(!d.place.trim()){$('#e2').textContent='Escribí el lugar de entrega.';bad=true}}
  if(bad)return;
  const mg={};if(!o)fd.getAll('itemId').forEach((x,k)=>{if(x&&S.inv.find(y=>y.id===x))mg[x]=(mg[x]||0)+(Math.floor(Number(fd.getAll('qty')[k]))||1)});
  const old=id?S.movs.find(x=>x.id===id):null,oq=old?(old.items||(old.itemId?[{id:old.itemId,qty:old.qty}]:[])):[];
  const its=Object.keys(mg).map(k=>{const p=S.inv.find(y=>y.id===k);return{id:k,name:p.name,price:p.price,qty:mg[k]}});
  for(const x of its){const p=S.inv.find(y=>y.id===x.id),have=p.stock+oq.filter(z=>z.id===x.id).reduce((a,z)=>a+(z.qty||0),0);if(x.qty>have){$('#e4').textContent='Stock insuficiente de '+p.name+' (hay '+have+').';return}}
  busy=true;const t=nm;
  const rec=o?{amount:a,desc:t,date:d.date,party:d.party.trim(),notes:d.notes.trim()}:{amount:a,desc:t,client:cl,date:d.date,place:d.place.trim(),notes:d.notes.trim(),items:its,xt:its.length?fd.getAll('xdesc').map(x=>x.trim()).filter(Boolean):[]};
  const before=JSON.stringify(S);
  if(id){const m=S.movs.find(x=>x.id===id);if(!m){busy=false;return toast('No se encontró el movimiento',1)}stk(m,1);Object.assign(m,rec);stk(m,-1)}
  else{const n=new Date();S.movs.push(Object.assign({id:uid(),type:f.dataset.type,time:pad(n.getHours())+':'+pad(n.getMinutes()),created:Date.now()},rec));stk(S.movs[S.movs.length-1],-1)}
  if(!save()){S=JSON.parse(before);busy=false;return}
  closeForm();render();toast(id?'Cambios guardados':(o?'Gasto guardado':'Venta guardada'));setTimeout(()=>busy=false,400)}

/* ===== Hojas: menú, detalle y confirmación ===== */
function sheet(h,mid){const s=$('#shade');s.className='shade'+(mid?' mid':'');s.innerHTML=`<div class="sheet" role="dialog" aria-modal="true">${h}</div>`;s.hidden=false}
const closeSheet=()=>{$('#shade').hidden=true;$('#shade').innerHTML=''};
const kind=m=>m.type==='out'?'gasto':'venta';
function menu(id){const m=S.movs.find(x=>x.id===id);if(!m)return;
  sheet(`<h3>${esc(m.desc)} · ${fmt(m.amount)}</h3><button class="opt" data-a="detail" data-id="${id}">${ic('eye')}Ver detalle</button><button class="opt" data-a="edit" data-id="${id}">${ic('edit')}Editar</button><button class="opt d" data-a="del" data-id="${id}">${ic('trash')}Eliminar</button>`)}
function detail(id){const m=S.movs.find(x=>x.id===id);if(!m)return;const o=m.type==='out';
  const r=[['Tipo',o?'Gasto (egreso)':'Venta (ingreso)'],['Importe',(o?'−':'+')+fmt(m.amount)],['Producto',m.desc],m.items&&m.items.length?['Del inventario',m.items.map(x=>x.name+' x'+x.qty).join(', ')]:null,['Fecha',dlabel(m)],o?['Proveedor',m.party]:['Cliente',m.client],o?null:['Lugar de entrega',m.place],['Nota',m.notes]].filter(x=>x&&x[1]);
  sheet(`<h3>Detalle</h3><dl>${r.map(([k,v])=>`<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl><div class="acts"><button class="btn ghost" data-a="close">Cerrar</button><button class="btn" data-a="edit" data-id="${id}">Editar</button></div>`)}
function confirmDel(id){const m=S.movs.find(x=>x.id===id);if(!m)return;pendingDel=id;
  sheet(`<h3>Eliminar ${kind(m)}</h3><p>¿Querés eliminar ${m.type==='out'?'este gasto':'esta venta'} de ${fmt(m.amount)}? Esta acción no se puede deshacer.</p><div class="acts"><button class="btn ghost" data-a="close">Cancelar</button><button class="btn dng" data-a="delok">Sí, eliminar</button></div>`,1)}

/* ===== Importar copias: se valida todo antes de tocar los datos ===== */
function parseBackup(t){const d=JSON.parse(t);if(!d||!Array.isArray(d.movs)||!d.settings)throw 0;
  const ok=d.movs.every(m=>m&&typeof m.id==='string'&&(m.type==='in'||m.type==='out')&&Number.isInteger(m.amount)&&m.amount>0&&/^\d{4}-\d{2}-\d{2}$/.test(m.date));if(!ok||!Number.isInteger(d.settings.initial))throw 0;
  const r=Object.assign({suppliers:[],clients:[]},d);r.inv=Array.isArray(r.inv)?r.inv:[];
  if(!r.inv.every(i=>i&&typeof i.id==='string'&&typeof i.name==='string'&&Number.isInteger(i.price)&&Number.isInteger(i.stock)))throw 0;
  r.movs.forEach((m,i)=>{m.desc=m.desc||'Movimiento';m.created=m.created||i});return r}
function confirmImport(d){pendingImp=d;sheet(`<h3>¿Reemplazar todos tus datos?</h3><p>Vas a cargar ${d.movs.length} movimientos y ${d.inv.length} productos. Lo que tenés ahora se va a reemplazar, pero antes se guarda una copia por si te arrepentís.</p><div class="acts"><button class="btn ghost" data-a="close">Cancelar</button><button class="btn dng" data-a="importok">Sí, reemplazar</button></div>`,1)}
const hasPrev=()=>{try{return !!localStorage.getItem(KEY+'-antes')}catch(e){return false}};

/* ===== Eventos ===== */
document.addEventListener('click',e=>{if(e.target.id==='layer'){tryClose();return}const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,v=b.dataset.v,id=b.dataset.id;
  if(a==='tab'){if(v==='home'&&history.state&&history.state.t){history.back();return}pushT();U.tab=v;U.md='';U.q='';U.lim=30;anim=true;render();scrollTo(0,0)}
  else if(a==='htab'){U.ht=v;render()}else if(a==='mtab'){U.mt=v;U.lim=30;render()}
  else if(a==='hper'){U.hp=v;render()}else if(a==='mper'){U.mp=v;U.md='';U.q='';U.lim=30;render()}else if(a==='mdclear'){U.md='';U.lim=30;render()}else if(a==='day'){pushT();U.q='';U.lim=30;U.md=v;U.tab='mov';anim=true;render();scrollTo(0,0)}else if(a==='sper'){U.sp=v;U.sd='';anim=true;render()}else if(a==='sdclear'){U.sd='';render()}
  else if(a==='new')openForm(v);
  else if(a==='tog'){S.settings[v]=!S.settings[v];if(v==='inv'&&!S.settings.inv&&U.tab==='inv')U.tab='set';save();render()}
  else if(a==='itemnew')openItem();else if(a==='count')openCount();else if(a==='addline')addLine();else if(a==='addp')addX();else if(a==='lq'){const inp=b.parentElement.querySelector('input');inp.value=Math.max(1,(Math.floor(Number(inp.value))||1)+Number(v));sumLines()}else if(a==='lrm'){b.closest('.il').remove();sumLines();lblAdd()}else if(a==='stk'){const el=document.getElementById(b.dataset.t);if(el)el.value=Math.max(0,(Math.floor(Number(el.value))||0)+Number(v))}else if(a==='itemmenu')itemMenu(id);else if(a==='itemedit'){closeSheet();openItem(id)}else if(a==='itemdel')itemDel(id);
  else if(a==='itemdelok'){S.inv=S.inv.filter(x=>x.id!==id);const ok=save();closeSheet();render();if(ok)toast('Producto eliminado')}
  else if(a==='export'){try{const u=URL.createObjectURL(new Blob([JSON.stringify(S)],{type:'application/json'})),l=document.createElement('a');l.href=u;l.download='copia-zina-'+today()+'.json';document.body.appendChild(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(u),2000);toast('Archivo guardado')}catch(x){toast('No se pudo guardar el archivo',1)}}
  else if(a==='file'){$('#bf').click()}else if(a==='more'){U.lim+=30;$('#ml').innerHTML=movList(movFiltered())}else if(a==='back')tryClose();else if(a==='discard'){closeSheet();closeForm()}else if(a==='bar'){document.querySelectorAll('.bk.sel').forEach(x=>x.classList.remove('sel'));b.classList.add('sel');$('#bi').innerHTML='<b style="color:var(--t)">'+esc(b.dataset.t)+'</b> · Ingresos <b style="color:var(--g2)">'+fmt(+b.dataset.i)+'</b> · Egresos <b style="color:var(--r)">'+fmt(+b.dataset.o)+'</b>'}
  else if(a==='menu')menu(id);
  else if(a==='detail')detail(id);
  else if(a==='edit'){closeSheet();openForm(S.movs.find(x=>x.id===id).type,id)}
  else if(a==='del')confirmDel(id);
  else if(a==='delok'){const n=S.movs.length;S.movs.filter(x=>x.id===pendingDel).forEach(m=>stk(m,1));S.movs=S.movs.filter(x=>x.id!==pendingDel);const k=n>S.movs.length;pendingDel=null;closeSheet();if(k&&save()){render();toast('Movimiento eliminado')}else render()}
  else if(a==='close')closeSheet();
  else if(a==='copy'){const t=$('#ex');t.select();try{navigator.clipboard.writeText(t.value).then(()=>toast('Datos copiados'),()=>toast('Seleccionado: copialo manualmente'))}catch(x){toast('Seleccionado: copialo manualmente')}}
  else if(a==='import'){try{confirmImport(parseBackup($('#ex').value))}catch(x){toast('El texto no es una copia válida',1)}}
  else if(a==='restoreprev'){try{confirmImport(parseBackup(localStorage.getItem(KEY+'-antes')))}catch(x){toast('No se pudo leer la copia anterior',1)}}
  else if(a==='importok'){if(pendingImp){const d=pendingImp,prev=JSON.stringify(S);pendingImp=null;closeSheet();try{localStorage.setItem(KEY+'-antes',prev)}catch(x){}S=d;if(save()){render();toast('Datos importados')}else{S=JSON.parse(prev);render()}}}
  });
$('#shade').addEventListener('click',e=>{if(e.target.id==='shade')closeSheet()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('#shade').hidden)closeSheet();else if(!$('#layer').hidden)tryClose()}});
document.addEventListener('submit',e=>{e.preventDefault();const f=e.target;
  if(f.id==='mf')submitForm(f);else if(f.id==='if')submitItem(f);else if(f.id==='cf')submitCount(f);
  else if(f.id==='sf'){const i=parseMoney(f.initial.value||'0');if(isNaN(i)||i<0){$('#se').textContent='Ingresá un saldo válido (0 o más).';return}
    S.settings.initial=i;const ok=save();render();if(ok)toast('Saldo inicial guardado')}
  else if(f.id==='gf'){const g=parseMoney(f.goal.value||'0');if(isNaN(g)||g<0){$('#ge').textContent='Ingresá una meta válida (0 o más).';return}
    S.settings.goal=g;const ok=save();render();if(ok)toast(g?'Meta guardada':'Meta quitada')}});
/* Sin zoom, sin menú de copiar/pegar fuera de los campos; filtro por día */
document.addEventListener('gesturestart',e=>e.preventDefault());
/* Efecto de toque tipo Android en botones */
document.addEventListener('pointerdown',e=>{const b=e.target.closest('.btn,.chip,nav button,.tabs button,.dots,.ib,.opt,.step button');if(!b||reduced)return;const r=b.getBoundingClientRect(),d=Math.max(r.width,r.height)*2,s=document.createElement('span');s.className='rp';s.style.cssText='width:'+d+'px;height:'+d+'px;left:'+(e.clientX-r.left-d/2)+'px;top:'+(e.clientY-r.top-d/2)+'px';b.appendChild(s);setTimeout(()=>s.remove(),600)});
/* Marca el formulario como modificado cuando se escribe o se tocan los botones + / − / agregar / quitar */
document.addEventListener('input',e=>{if(e.target.closest('#layer form'))dirty=true});
document.addEventListener('change',e=>{if(e.target.closest('#layer form'))dirty=true});
document.addEventListener('click',e=>{if(e.target.closest('#layer [data-a="stk"],#layer [data-a="lq"],#layer [data-a="lrm"],#layer [data-a="addline"],#layer [data-a="addp"]'))dirty=true});
/* Con el teclado abierto se oculta el menú de abajo y el campo queda centrado, con su botón Guardar a la vista */
const typing=()=>{const a=document.activeElement||{};return /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)&&a.type!=='date'};
/* El botón de agregar producto no le quita el foco al campo, así el teclado no se cierra */
document.addEventListener('mousedown',e=>{if(e.target.closest('#layer button,#shade button,form .btn,.acts .btn'))e.preventDefault()});
function kbFix(){try{const a=document.activeElement,sc=a&&a.closest('.fx');if(!sc)return;const v=window.visualViewport,vb=v?v.offsetTop+v.height:innerHeight,t=a.closest('#xp')||a.id==='fd'?$('#ap'):a.closest('#il')?$('#al'):a,o=(t||a).getBoundingClientRect().bottom-(vb-24);if(o>0)sc.scrollTop+=o}catch(e){}}
if(window.visualViewport)visualViewport.addEventListener('resize',()=>{if(typing())kbFix()});
function kb(){document.body.classList.toggle('kb',typing());if(typing())setTimeout(()=>{try{if(document.activeElement.closest('.fx')){kbFix();setTimeout(kbFix,350);return}const a=document.activeElement,f=a.closest('form')||a,h=window.visualViewport?visualViewport.height:innerHeight;(f.offsetHeight<h-130?f:a).scrollIntoView({block:'nearest',behavior:'smooth'})}catch(e){}},300)}
document.addEventListener('focusin',kb);document.addEventListener('focusout',()=>setTimeout(()=>document.body.classList.toggle('kb',typing()),150));
/* Botón/gesto "atrás" del teléfono = Cancelar dentro de un formulario */
window.addEventListener('popstate',()=>{if(skipPop){skipPop=false;return}if(!$('#layer').hidden)tryClose(true);else if(U.tab!=='home'){U.tab='home';U.md='';anim=true;render();scrollTo(0,0)}});
/* Importe con comas automáticas: 10,000 */
document.addEventListener('input',e=>{const el=e.target;if(el.id!=='fa'&&!el.classList.contains('money'))return;const p=el.value.replace(/[^\d,]/g,'').split(',');const ip=p[0].replace(/^0+(?=\d)/,'').replace(/\B(?=(\d{3})+(?!\d))/g,'.');el.value=p.length>1?ip+','+p.slice(1).join('').slice(0,2):ip});
document.addEventListener('change',e=>{if(e.target.closest('.il'))sumLines()});
document.addEventListener('input',e=>{if(e.target.closest('.il'))sumLines()});
/* Buscador de Movimientos: actualiza solo la lista (el teclado no se cierra) */
document.addEventListener('input',e=>{if(e.target.id!=='q')return;U.q=e.target.value;U.lim=30;const l=movFiltered();$('#ml').innerHTML=movList(l);$('#mt').innerHTML=movTop();$('#mc').textContent=l.length+' '+(hasQ()?(l.length===1?'resultado':'resultados'):'en el período')});
document.addEventListener('change',e=>{if(e.target.id==='bf'&&e.target.files[0]){const r=new FileReader();r.onload=()=>{$('#ex').value=String(r.result);$('[data-a="import"]').click()};r.onerror=()=>toast('No se pudo leer el archivo',1);r.readAsText(e.target.files[0]);e.target.value=''}});
document.addEventListener('contextmenu',e=>{if(!e.target.closest('input,textarea'))e.preventDefault()});
document.addEventListener('change',e=>{if(e.target.id==='sd'){U.sd=e.target.value;render()}else if(e.target.id==='cd'&&e.target.value){pushT();U.q='';U.lim=30;U.md=e.target.value;U.tab='mov';anim=true;render();scrollTo(0,0)}});
render();
/* Instalación como app (PWA): registra el service worker si el navegador lo permite */
try{if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}))}catch(e){}
