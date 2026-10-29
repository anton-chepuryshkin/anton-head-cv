/* Квіз Riviera Village — спільна логіка підбору і тексти повідомлень.
   Файл без залежностей від браузера: його можна перенести на сервер (Google Apps Script) для реальної відправки.
   Демо-концепт Антона Чепуришкіна для Riviera Village. */

var S = {ans:{}, name:'', phone:'', email:''};

/* ---------- Джерела зображень ---------- */
const RV = 'https://riviera-village.com.ua/wp-content/uploads/';
const LUN_IMG = 'https://lun-images.lunstatic.net/bd-ua-01/t.0.1.0/1200/800/cottage-typical-project/image/';
const LUN_PLAN = 'https://lun-images.lunstatic.net/bd-ua-01/t.0.1.0/1200/1200/cottage-typical-project/layout/';
const GENPLAN = 'https://riviera-village.com.ua/wp-content/themes/cotages/images/genplan.jpg';
const CV = 'https://anton-chepuryshkin.github.io/anton-head-cv/';

/* ---------- Каталог ----------
   Ціни і статуси — ЛУН, «Типові проєкти КМ Riviera Village», оновлено 23.10.2026.
   Площі Villa Zen, Villa Forest і Timber Trio — з riviera-village.com.ua (на ЛУН вказані інші: 308 і 360 м²).
   status: built — збудований, building — будується, project — у проєкті */
const HOUSES = [
  {id:'costa',  name:'Villa Costa',  status:'building', price:360000, area:166, bed:4, levels:2, plot:0.0637,
   photos:[LUN_IMG+'3725.jpg', LUN_IMG+'3726.jpg'], plans:[LUN_PLAN+'14322.jpg', LUN_PLAN+'14323.jpg']},
  {id:'timber', name:'Timber Trio',  status:'building', price:380000, area:152, bed:3, bath:2, levels:2,
   note:'стіни з клеєного дерев’яного бруса',
   photos:[LUN_IMG+'11451.png', RV+'2025/02/villa_timber_28_02_25_01.jpg', RV+'2025/02/villa_timber_28_02_25_03.jpg'], plans:[LUN_PLAN+'10132.png', LUN_PLAN+'10133.png']},
  {id:'zen',    name:'Villa Zen',    status:'built', price:390000, area:195, bed:3, bath:2, levels:1,
   photos:[LUN_IMG+'3735.jpg', LUN_IMG+'3734.jpg', RV+'2024/06/villa_zen_28_02_25_01.jpg'], plans:[LUN_PLAN+'4370.jpg']},
  {id:'spirit', name:'Villa Spirit', status:'built', price:410000, area:173, bed:3, levels:1, plot:0.0825,
   photos:[LUN_IMG+'18156.jpg', LUN_IMG+'18155.jpg', LUN_IMG+'18158.jpg'], plans:[LUN_PLAN+'14324.jpg']},
  {id:'optima', name:'Villa Optima', status:'project', price:515000, area:210, bed:3, levels:2,
   photos:[LUN_IMG+'3736.png', LUN_IMG+'3737.png'], plans:[LUN_PLAN+'4371.png', LUN_PLAN+'4372.png']},
  {id:'monaco', name:'Monaco',       status:'built', price:630000, area:302, bed:3, levels:2,
   photos:[LUN_IMG+'5289.jpg', LUN_IMG+'5288.jpg', LUN_IMG+'5287.jpg'], plans:[LUN_PLAN+'5827.jpg', LUN_PLAN+'5828.jpg']},
  {id:'terra',  name:'Villa Terra',  status:'project', price:636000, area:367, bed:2, levels:2,
   photos:[LUN_IMG+'2527.jpg', LUN_IMG+'2526.jpg', LUN_IMG+'2528.jpg'], plans:[LUN_PLAN+'3159.png', LUN_PLAN+'3160.png']},
  {id:'forest', name:'Villa Forest', status:'built', price:750000, area:248, bed:4, bath:3, levels:2,
   photos:[LUN_IMG+'18688.jpg', LUN_IMG+'18683.jpg', LUN_IMG+'18689.jpg'], plans:[LUN_PLAN+'4373.png', LUN_PLAN+'4374.png']}
].map(h => Object.assign({kind:'house'}, h));

const PLOTS = [
  {id:'f752',  zone:'forest', size:0.0752, price:120000},
  {id:'f1308', zone:'forest', size:0.1308, price:180000},
  {id:'f1323', zone:'forest', size:0.1323, price:221000},
  {id:'w1517', zone:'water',  size:0.1517, price:350000},
  {id:'w31',   zone:'water',  size:0.31,   price:430000}
].map(p => Object.assign({kind:'plot', status:'plot', name: p.zone==='water' ? 'Ділянка біля води' : 'Ділянка в районі Forest',
  photos: p.zone==='water' ? [RV+'2024/07/4-3.jpg', RV+'2024/07/2-4.jpg', RV+'2024/07/17.jpg'] : [RV+'2024/07/22.jpg', RV+'2024/07/14.jpg', RV+'2024/06/2-4.jpg'],
  plans:[GENPLAN]}, p));

var LOTS = HOUSES.concat(PLOTS);
var CAT = {houses: HOUSES.length, plots: PLOTS.length, built: 200, minHouse: Math.min.apply(null, HOUSES.map(h=>h.price)), minPlot: Math.min.apply(null, PLOTS.map(p=>p.price))};
const RESALE_FROM = 419000; // найдешевший готовий будинок з рук у Riviera Village на ЛУН, 29.10.2026

const STATUS = {
  built:   {short:'Збудований', line:'Будинок уже збудований — на перегляді зайдете всередину'},
  building:{short:'Будується',  line:'Будинок будується — строк здачі назве менеджер'},
  project: {short:'У проєкті',  line:'Проєкт: будинок зведуть під вас, строки назве менеджер'},
  plot:    {short:'Ділянка',    line:'Ділянка під ваш власний проєкт'}
};

/* ---------- Питання ---------- */
const Q = {
  qa:{n:1, photo:'2024/06/3-2.jpg', title:'Скільки вам років?', why:'Так ми краще зрозуміємо, який будинок вам потрібен: перший для молодої сім’ї чи такий, де буде зручно і через двадцять років.', type:'single', opts:[
    {id:'a20', t:'До 30'}, {id:'a30', t:'30–39'}, {id:'a40', t:'40–49'}, {id:'a50', t:'50–59'}, {id:'a60', t:'60 і більше'}]},
  q2:{n:2, photo:'2024/06/3-3.jpg', title:'Хто житиме в будинку?', why:'Від складу сім’ї залежить кількість спалень: у Riviera є вілли на 2, 3 і 4 спальні.', type:'single', opts:[
    {id:'single', t:'Тільки я'},
    {id:'couple', t:'Нас двоє'},
    {id:'kid1', t:'Ми з однією дитиною'},
    {id:'kid2', t:'Ми з двома дітьми'},
    {id:'kid3', t:'Троє і більше дітей'},
    {id:'multi', t:'Кілька поколінь, разом з батьками'},
    {id:'parents', t:'Купую для батьків або як інвестицію'}]},
  q3:{n:3, photo:'2024/07/14.jpg', title:'Що вас найбільше втомлює в нинішньому житті?', why:'Хочемо почути реальні причини, а не те, що прийнято казати. Далі говоритимемо саме про них.', type:'multi', max:3, hint:'Оберіть до 3 найважливіших', opts:[
    {id:'noise', t:'Шум і сусіди за стіною'},
    {id:'privacy', t:'Немає приватності'},
    {id:'traffic', t:'Затори й дорога'},
    {id:'nature', t:'Мало природи, брудне повітря'},
    {id:'space', t:'Мало простору для сім’ї й дітей'},
    {id:'blackout', t:'Відключення світла, відчуття небезпеки'},
    {id:'ok', t:'Загалом усе добре, просто розглядаю варіанти', solo:true}]},
  q4:{n:4, photo:'2024/09/budynku_new_1.jpg', title:'Що для вас найважливіше в житті за містом?', why:'Ваш вибір покаже, на що звернути увагу в підборі й на перегляді.', type:'multi', max:3, opts:[
    {id:'water', t:'Дніпро, пляж і вода поруч', j:1},
    {id:'forest', t:'Сосновий ліс для прогулянок', j:1},
    {id:'safety', t:'Безпека: закрита територія, охорона', k:1},
    {id:'kids', t:'Простір і заняття для дітей', j:1},
    {id:'neighbors', t:'Сусіди свого кола, ком’юніті', k:1},
    {id:'quality', t:'Якість будинку і матеріалів', k:1},
    {id:'cabinet', t:'Кабінет або гостьова кімната'},
    {id:'onefloor', t:'Один поверх, без сходів'},
    {id:'bigplot', t:'Велика ділянка: сад, барбекю', j:1}]},
  q5:{n:5, photo:'2024/06/2-4.jpg', title:'Наскільки важливо швидко діставатися до Києва?', why:'Від Riviera до Києва — близько 20 км. Перевіримо, чи це працює для вашого ритму життя.', type:'single', opts:[
    {id:'daily', t:'Дуже: їжджу в Київ щодня'},
    {id:'weekly', t:'Важливо: у Києві кілька разів на тиждень'},
    {id:'remote', t:'Не критично: працюю віддалено'},
    {id:'far', t:'Не важливо: живу в іншому місті або за кордоном'}]},
  q6:{n:6, photo:'2024/07/1-5.jpg', title:'Який формат вам ближчий?', why:'У Riviera є збудовані вілли, вілли в будівництві і ділянки під власний проєкт.', type:'single', opts:[
    {id:'built', t:'Готовий будинок: заїхати якнайшвидше'},
    {id:'any', t:'Будинок, що будується, якщо влаштують строки й умови'},
    {id:'plot', t:'Ділянка під власний проєкт'},
    {id:'unsure', t:'Ще не визначились'}]},
  q7:{n:7, photo:'2024/07/22.jpg', title:'Скільки котеджних містечок ви вже подивилися наживо?', why:'Якщо ви тільки починаєте, розповімо, на що дивитися. Якщо бачили багато, не повторюватимемо очевидне.', type:'single', opts:[
    {id:'none', t:'Жодного, тільки починаю'},
    {id:'few', t:'1–3'},
    {id:'many', t:'4 і більше'},
    {id:'lived', t:'Уже маю досвід життя в будинку, знаю, що шукаю'}]},
  q8:{n:8, photo:'2024/06/9.jpg', title:'Як ви зазвичай ухвалюєте великі рішення?', why:'Комусь треба відчути атмосферу, комусь — побачити цифри. Надішлемо підбір у тому вигляді, який вам зручніше читати.', type:'single', opts:[
    {id:'feel', t:'Мені важливо побачити й відчути. Якщо «моє» — вирішую швидко'},
    {id:'numbers', t:'Спершу цифри: ціна, графік оплат, документи, строки'},
    {id:'compare', t:'Порівнюю кілька варіантів і раджуся з тими, хто вже купив'},
    {id:'mixed', t:'Довіряю інтуїції, але перевіряю деталі'}]},
  q9:{n:9, photo:'2024/07/17.jpg', title:'Що досі стримує від переїзду у власний будинок?', why:'Назвіть це чесно — і ми покажемо факти саме по ваших сумнівах.', type:'multi', max:3, hint:'Оберіть до 3', opts:[
    {id:'fear', t:'Боюся, що забудовник підведе або не добудує'},
    {id:'burned', t:'Уже маю негативний досвід із забудовником'},
    {id:'resale', t:'Вагаюся між новим будинком і готовим з рук'},
    {id:'infra', t:'Сумніви щодо інфраструктури поруч'},
    {id:'price', t:'Ціна: не розумію, чи вона адекватна'},
    {id:'upkeep', t:'Незрозуміло, скільки коштує утримувати будинок'},
    {id:'sell', t:'Спершу треба продати нерухомість'},
    {id:'war', t:'Війна і невизначеність'},
    {id:'info', t:'Бракує інформації, не знаю, з чого почати'}]},
  q10:{n:10, photo:'2024/09/budynku_new_4.jpg', title:'Який бюджет ви розглядаєте?', why:'Щоб показати лише те, що реально у вашому діапазоні: будинки, ділянки або обидва варіанти.', type:'single', opts:[
    {id:'lt300', t:'До $300 000'},
    {id:'b300', t:'$300 000–400 000'},
    {id:'b400', t:'$400 000–500 000'},
    {id:'b500', t:'$500 000–650 000'},
    {id:'b650', t:'Від $650 000'},
    {id:'unknown', t:'Хочу спершу зрозуміти реальні ціни'}]},
  q11:{n:11, photo:'2024/06/6.jpg', title:'Як плануєте оплату?', why:'Розрахуємо платіж саме під ваш сценарій.', type:'single', opts:[
    {id:'full', t:'Повна оплата власними коштами'},
    {id:'install', t:'Розтермінування від забудовника'},
    {id:'trade', t:'Спершу продам свою нерухомість'},
    {id:'mortgage', t:'Іпотека або єОселя'},
    {id:'undecided', t:'Ще не вирішили'}]},
  q12:{n:12, photo:'2024/07/5-1.jpg', title:'Коли хотіли б переїхати?', why:'Частина вілл уже збудована, частина будується. Підберемо те, що встигне до вашої дати.', type:'single', opts:[
    {id:'m3', t:'Протягом 1–3 місяців, готові до рішення'},
    {id:'m6', t:'Через 3–6 місяців'},
    {id:'m12', t:'Через 6–12 місяців'},
    {id:'y1', t:'Через рік і пізніше'},
    {id:'browse', t:'Поки просто вивчаю'}]}
};
const TOTAL_Q = 12;

const has = (q, id) => Array.isArray(S.ans[q]) && S.ans[q].includes(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num = (n, d=0) => { const f = Math.pow(10, d), v = Math.round(n*f)/f; const parts = String(Math.abs(v)).split('.'); const i = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' '); return (v < 0 ? '−' : '') + i + (parts[1] ? ',' + parts[1] : ''); };
const usd = n => '$' + num(Math.round(n/100)*100);
const fromUsd = n => 'від ' + usd(n);
const plural = (n, one, few, many) => { const a=Math.abs(n)%100, b=a%10; if(!Number.isInteger(n)) return few; if(a>10&&a<20) return many; if(b===1) return one; if(b>=2&&b<=4) return few; return many; };
const sotky = ha => { const v = Math.round(ha*10000)/100; return num(v,2) + ' ' + plural(v,'сотка','сотки','соток'); };
const beds = n => n + ' ' + plural(n,'спальня','спальні','спалень');
const houses = n => n + ' ' + plural(n,'будинок','будинки','будинків');
const lc1 = x => x.charAt(0).toLowerCase() + x.slice(1);
const ansText = id => { const q = Q[id], v = S.ans[id]; if(!q || v === undefined || v === null || v === '') return '—'; const ids = Array.isArray(v) ? v : [v]; return ids.map(x => { const o = q.opts.find(o => o.id === x); return o ? o.t : x; }).join('; '); };
const listUa = arr => arr.length <= 1 ? (arr[0] || '') : arr.slice(0,-1).join(', ') + ' та ' + arr[arr.length-1];
const pick = (id, M) => (Array.isArray(S.ans[id]) ? S.ans[id] : [S.ans[id]]).map(x => M[x]).filter(Boolean);
const title = l => l.kind==='plot' ? `${l.name}, ${sotky(l.size)}` : l.name;

/* ---------- Сегментація ---------- */
function stage(){
  const q7 = S.ans.q7;
  let s = q7==='none' ? 'Турист' : q7==='few' ? 'Підготовлений' : 'Експерт';
  if(has('q9','info') || S.ans.q12==='browse') s = 'Турист';
  return s;
}
function psycho(){
  let j=0, k=0;
  ({feel:()=>j+=2, numbers:()=>k+=2, compare:()=>k+=2, mixed:()=>{j++;k++;}}[S.ans.q8]||(()=>{}))();
  (S.ans.q4||[]).forEach(id=>{ const o = Q.q4.opts.find(x=>x.id===id); if(o && o.j) j++; if(o && o.k) k++; });
  return j>k ? 'Життєлюб' : k>j ? 'Кар’єрист' : 'Змішаний';
}

/* ---------- Підбір ---------- */
const NEED = {single:2, couple:2, kid1:3, kid2:3, kid3:4, multi:4, parents:2};
const BUDGET = {lt300:[0,300000], b300:[300000,400000], b400:[400000,500000], b500:[500000,650000], b650:[650000,Infinity]};

function wantsPlot(){ return S.ans.q6 === 'plot' || S.ans.q10 === 'lt300'; }

function match(){
  const q2 = S.ans.q2, q10 = S.ans.q10, q12 = S.ans.q12, q6 = S.ans.q6;
  const base = NEED[q2] || 2;
  const need = Math.min(4, base + (has('q4','cabinet') ? 1 : 0));
  const [lo, hi] = BUDGET[q10] || [0, Infinity];
  const noBudget = q10 === 'unknown' || !q10;
  const plotMode = wantsPlot();
  const one = has('q4','onefloor');
  const readyOnly = q12 === 'm3' || q6 === 'built';
  const water = has('q4','water');

  const viol = l => ({
    budget: !noBudget && l.price > hi*1.1,
    rooms: l.kind==='house' && l.bed < need,
    onefloor: l.kind==='house' && one && l.levels > 1,
    ready: l.kind==='house' && readyOnly && l.status !== 'built'
  });
  const clean = l => { const v = viol(l); return !v.budget && !v.rooms && !v.onefloor && !v.ready; };
  const pool = plotMode ? PLOTS : HOUSES;
  const exact = pool.filter(clean);
  const count = exact.length;
  const fallback = count ? null : 'soft';
  const cand = (count ? exact : pool).slice();

  const score = l => {
    let s = 0;
    if(noBudget) s += 10; else if(l.price >= lo*0.95 && l.price <= hi) s += 30; else if(l.price < lo) s += 12; else s += 6;
    if(l.kind==='plot'){
      if(water && l.zone==='water') s += 25;
      if(has('q4','forest') && l.zone==='forest') s += 15;
      if(has('q4','bigplot')) s += Math.round(l.size*100);
      return s - (viol(l).budget ? Math.round((l.price - hi)/hi*100) : 0);
    }
    if(l.status==='built' && ['m3','m6'].includes(q12)) s += 15;
    if(q6==='built' && l.status==='built') s += 20;
    if(q12==='y1' && l.status!=='built') s += 5;
    if(one && l.levels===1) s += 15;
    if(['a50','a60'].includes(S.ans.qa) && l.levels===1) s += 10;
    if(q2==='parents' && l.levels===1) s += 10;
    if((has('q4','kids') || has('q3','space')) && l.bed >= 3) s += 8;
    if(has('q4','bigplot') && l.plot && l.plot < 0.09) s -= 10;
    if(has('q4','quality') && l.status==='built') s += 6;
    const extra = l.bed - need; if(extra > 1) s -= 6*(extra-1);
    const v = viol(l);
    if(v.rooms) s -= 30*(need - l.bed);
    if(v.onefloor) s -= 30;
    if(v.ready) s -= 25;
    if(v.budget) s -= Math.round((l.price - hi)/hi*100);
    return s;
  };
  cand.forEach(l => l._s = score(l));
  cand.sort((a,b) => b._s - a._s || (noBudget ? a.price - b.price : b.price - a.price));
  const main = cand[0];

  // Альтернатива: інший формат, якщо він доречний, інакше — наступна вілла
  let alt = null;
  if(plotMode){
    const h = HOUSES.filter(x => x.bed >= need).sort((a,b) => a.price - b.price)[0];
    alt = h || null;
  } else if(water || has('q4','bigplot')){
    const fit = PLOTS.filter(p => (noBudget || p.price <= hi) && (!water || p.zone==='water')).sort((a,b) => b.size - a.size);
    alt = fit[0] || null;
  }
  if(!alt){
    const others = cand.filter(l => l.id !== main.id);
    alt = others[0] || null;
  }
  return {main, alt, count, fallback, viol: viol(main), need, base, lo, hi, noBudget, plotMode};
}

function reasonsFor(h, m){
  const r = [];
  if(h.kind==='plot'){
    r.push(h.zone==='water' ? `${sotky(h.size)} біля води` : `${sotky(h.size)} у районі Forest, серед сосен`);
    r.push('Будуєте будинок за власним проєктом');
    if(has('q4','bigplot')) r.push('Місце під сад, барбекю і терасу');
  } else {
    const roomTxt = {single:'вистачить і на спальню, і на кабінет', couple:'є місце для гостей або кабінету', kid1:'дитяча, ваша спальня і ще одна кімната', kid2:'кожній дитині своя кімната', kid3:'вистачить на всю сім’ю', multi:'вистачить на кілька поколінь', parents:'зручно для батьків'}[S.ans.q2];
    r.push(h.bed >= m.need ? `${beds(h.bed)} — ${roomTxt || 'простору вистачить'}` : beds(h.bed));
    if(has('q4','onefloor') && h.levels===1) r.push('Один рівень, без сходів');
    if(has('q4','cabinet') && h.bed > m.base) r.push('Зайва спальня — під кабінет або гостьову');
    if(h.note && (has('q4','forest') || has('q3','nature'))) r.push(h.note.charAt(0).toUpperCase() + h.note.slice(1));
    r.push(STATUS[h.status].line);
  }
  if(!m.noBudget && h.price < m.lo*0.95) r.push(`Дешевше за ваш бюджет на ${usd(m.lo - h.price)}`);
  else if(!m.noBudget && h.price <= m.hi) r.push('Вкладається у ваш бюджет');
  else if(!m.noBudget && h.price > m.hi) r.push(`На ${usd(h.price - m.hi)} вище верхньої межі бюджету`);
  return r.slice(0,4);
}

function paymentFor(h){
  const p = S.ans.q11;
  if(h.kind==='plot') return {title:'Як можна оплатити', lines:['Умови оплати ділянки розповість менеджер. Для вілл діє розтермінування від забудовника до 40 місяців з внеском від 30%.']};
  const inst = () => `Розтермінування від забудовника до 40 місяців: внесок від 30% — ${fromUsd(h.price*0.3)}, далі орієнтовно ${usd(h.price*0.7/40)} на місяць. Точний графік і умови розрахує менеджер.`;
  const full = () => 'Повна оплата: умови для оплати однією сумою розповість менеджер.';
  const trade = () => 'Продаж вашої нерухомості: менеджер підкаже, як узгодити графік оплати з продажем.';
  const mort = () => 'Іпотека: за даними ЛУН, єОселя для Riviera Village недоступна. Найближча альтернатива — розтермінування на 40 місяців.';
  const lines = [];
  let ttl = 'Як можна оплатити';
  if(p==='full'){ ttl='Ваш варіант оплати'; lines.push(full()); }
  else if(p==='install'){ ttl='Ваш варіант оплати'; lines.push(inst()); }
  else if(p==='trade'){ ttl='Ваш варіант оплати'; lines.push(trade(), inst()); }
  else if(p==='mortgage'){ ttl='Ваш варіант оплати'; lines.push(mort(), inst()); }
  else lines.push(inst(), full());
  return {title:ttl, lines};
}

function barrierBlocks(h){
  const picked = S.ans.q9 || [];
  const built = h.status === 'built';
  const B = {
    fear:['Ваше питання «чи добудують»', `У Riviera Village уже понад ${CAT.built} збудованих будинків, у них живуть люди. ${built ? 'Будинок, який ми підібрали, уже стоїть — на перегляді зайдете всередину.' : 'На перегляді покажемо збудовані вілли і розповімо, на якому етапі ваш варіант.'}`],
    burned:['Не вірте на слово', `Приїжджайте подивитися: понад ${CAT.built} будинків уже збудовано, клуб, марина і садок працюють. Усе наживо, а не на рендерах.`],
    resale:['Новий чи з рук', `Нові вілли — ${fromUsd(CAT.minHouse)}, з розтермінуванням до 40 місяців. Готові будинки з рук у селищі на ЛУН — ${fromUsd(RESALE_FROM)}, і за них зазвичай платять одразу всю суму.`],
    infra:['Ваше питання про інфраструктуру', 'Уже працюють Riviera Club із двома пляжами, басейнами і рестораном, дитячий садок Clever Kids від КМДШ, марина, тенісні корти й футбольне поле.'],
    price:['Ваше питання про ціну', `Вілли в Riviera — ${fromUsd(CAT.minHouse)}, ділянки — ${fromUsd(CAT.minPlot)}. Розтермінування до 40 місяців з внеском від 30%.`],
    upkeep:['Ваше питання про утримання', 'Вартість утримання будинку і території менеджер розрахує на перегляді.'],
    sell:['Ваше питання про продаж нерухомості', 'Менеджер підкаже, як узгодити графік оплати з продажем вашої нерухомості.'],
    war:['Ваше питання про безпеку', 'Закрита територія, охорона 24/7 і власна сервісна компанія. Про укриття й резервне живлення менеджер розповість на перегляді.'],
    info:['З чого почати', 'Нижче — чек-лист «9 питань забудовнику до підписання договору». Пройдіться по ньому на перегляді.']
  };
  const ORDER = ['burned','fear','resale','war','infra','price','sell','upkeep','info'];
  return ORDER.filter(id => picked.includes(id) && !(id==='fear' && picked.includes('burned'))).map(id => [...B[id], id]);
}

function buildResult(){
  const m = match();
  const main = m.main;
  const pay = paymentFor(main);
  const v = m.viol, gaps = [];
  if(m.fallback){
    if(v.rooms) gaps.push(`${beds(main.bed)} замість ${m.need}`);
    if(v.onefloor) gaps.push('два рівні замість одного');
    if(v.ready) gaps.push('будинок ще будується, тож заїхати одразу не вийде');
    if(v.budget) gaps.push(`на ${usd(main.price - m.hi)} вище вашого бюджету`);
  }
  const compromise = gaps.join('; ');
  const fallbackNote = m.fallback ? `Варіанта, що відповідає всім вашим умовам одразу, зараз у продажу немає. Найближчий має компроміс: ${compromise}.` : '';
  return Object.assign({}, m, {reasons:reasonsFor(main, m), payTitle:pay.title, payLines:pay.lines, fallbackNote, compromise, barriers:barrierBlocks(main), stage:stage(), psy:psycho()});
}

function grade(R){
  const fast = ['m3','m6'].includes(S.ans.q12);
  const fits = R.noBudget || R.main.price <= R.hi;
  if(R.stage==='Турист' || ['y1','browse'].includes(S.ans.q12)) return 'C';
  if(fast && fits && !R.fallback) return 'A';
  return 'B';
}

function storyLine(h){
  if(has('q4','water')) return 'Уявіть вечір: пісок на пляжі клубу, Дніпро і захід сонця над Київським морем.';
  if(has('q4','forest') || has('q3','nature')) return 'Уявіть ранок: прогулянка сосновим лісом, який починається просто в містечку.';
  if(has('q4','kids') || has('q3','space')) return 'Уявіть суботу: діти в мотузковому парку, а ви п’єте каву на терасі.';
  if(has('q3','noise') || has('q3','privacy')) return 'Уявіть вечір без сусідів за стіною: тиша, сосни, своя тераса.';
  return 'Уявіть, як ви повертаєтеся додому — у тишу соснового лісу, а не в під’їзд.';
}

/* ---------- Чек-лист ---------- */
const CHECKLIST = [
  'Яка черга вже збудована і чи можна зайти в готовий будинок?',
  'Що з інфраструктури працює сьогодні, а що лише в планах — і коли?',
  'Скільки об’єктів компанія вже здала і хто відповідає за проєкт?',
  'Чи можна поговорити з мешканцями, які вже живуть у збудованій черзі?',
  'На кого оформлена земля, чи є дозвіл на будівництво і які документи покажуть до підписання?',
  'Що прописано в договорі, якщо строк здачі зірветься: штрафи, компенсація, право розірвати?',
  'Що буде з вашими грошима, якщо ви захочете розірвати договір або продати будинок до завершення?',
  'Що саме входить у ціну: комунікації, потужність електрики, вода, каналізація, дороги, оздоблення?',
  'Скільки коштуватиме утримання території після заселення: охорона, прибирання, сміття, освітлення?'
];
const CHECKLIST_TITLE = '9 питань забудовнику до підписання договору';
const checklistTg = () => `<b>Чек-лист: ${CHECKLIST_TITLE}</b>\n\n${CHECKLIST.map((q, i) => `${i+1}. ${q}`).join('\n')}\n\nПройдіться по ньому на перегляді — в будь-якому містечку, не лише в Riviera.`;

/* ---------- Повідомлення ---------- */
const small = (url, w, h) => 'https://wsrv.nl/?url=' + encodeURIComponent(url.replace(/^https?:\/\//, '')) + '&w=' + w + (h ? '&h=' + h + '&fit=cover' : '') + '&output=jpg&q=82';
const specsLine = h => h.kind==='plot'
  ? `${sotky(h.size)}, ${h.zone==='water' ? 'біля води' : 'район Forest'}`
  : `${num(h.area)} м², ${beds(h.bed)}, ${h.levels===1 ? '1 поверх' : h.levels + ' поверхи'}${h.plot ? `, ділянка ${sotky(h.plot)}` : ''}`;
const ROAD = 'Дорога: близько 20 км до Києва.';
const viewingLine = h => h.kind==='plot'
  ? 'Менеджер покаже ділянку на місці, збудовані вілли поруч і клуб.'
  : h.status==='built'
    ? `Менеджер покаже ${h.name} зсередини, клуб, пляж і марину.`
    : `Менеджер покаже збудовані вілли, клуб і марину, а також розповість, на якому етапі ${h.name}.`;

function vocative(raw){
  const name = String(raw || '').trim().split(/\s+/)[0] || '';
  if(!/^[А-ЯІЇЄҐа-яіїєґ'’-]{2,}$/.test(name)) return name;
  const n = name.charAt(0).toUpperCase() + name.slice(1);
  const lo = n.toLowerCase();
  const SPECIAL = {'ольга':'Ольго','любов':'Любове','ігор':'Ігоре','олег':'Олеже','лев':'Леве'};
  if(SPECIAL[lo]) return SPECIAL[lo];
  if(/ія$/.test(lo)) return n.slice(0,-1) + 'є';
  if(/[^і]я$/.test(lo)) return n.slice(0,-1) + 'ю';
  if(/[жчшщ]а$/.test(lo)) return n.slice(0,-1) + 'е';
  if(/а$/.test(lo)) return n.slice(0,-1) + 'о';
  if(/[ій]$/.test(lo) || /ь$/.test(lo)) return n.slice(0,-1) + 'ю';
  if(/о$/.test(lo)) return n.slice(0,-1) + 'е';
  if(/[кгх]$/.test(lo)) return n + 'у';
  if(/[бвдзлмнпрстфц]$/.test(lo)) return n + 'е';
  return n;
}

function personalNote(){
  const P = [];
  const fam = {single:'для себе', couple:'для вас двох', kid1:'для сім’ї з дитиною', kid2:'для сім’ї з двома дітьми', kid3:'для великої сім’ї', multi:'для кількох поколінь, разом із батьками', parents:'для батьків або як інвестицію'}[S.ans.q2] || 'для вашої сім’ї';
  P.push({
    none:`Бачимо, що ви тільки починаєте знайомитися з котеджними містечками і шукаєте будинок ${fam}.`,
    few:`Бачимо, що ви вже подивилися кілька містечок і шукаєте будинок ${fam}.`,
    many:`Бачимо, що ви вже подивилися чимало містечок і добре розумієте, що шукаєте: будинок ${fam}.`,
    lived:`Бачимо, що ви вже маєте досвід життя в будинку і тепер шукаєте новий ${fam}.`
  }[S.ans.q7] || `Бачимо, що ви шукаєте будинок ${fam}.`);
  const tired = pick('q3', {noise:'шум і сусіди за стіною', privacy:'брак приватності', traffic:'затори й дорога', nature:'брак природи і брудне повітря', space:'брак простору для сім’ї й дітей', blackout:'відключення світла і відчуття небезпеки'});
  if(tired.length) P.push(`Найбільше вас зараз втомлює ${listUa(tired)}.`);
  const want = pick('q4', {water:'Дніпро і пляж поруч', forest:'сосновий ліс', safety:'безпека', kids:'простір і заняття для дітей', neighbors:'ком’юніті', quality:'якість будинку', cabinet:'кабінет або гостьова', onefloor:'один поверх без сходів', bigplot:'велика ділянка'});
  if(want.length) P.push(`Для вас найважливіше — ${listUa(want)}.`);
  const fears = pick('q9', {fear:'надійності забудовника', burned:'надійності забудовника після попереднього досвіду', resale:'вибору між новим будинком і готовим з рук', infra:'інфраструктури', price:'того, чи адекватна ціна', upkeep:'вартості утримання', sell:'продажу вашої нерухомості', war:'безпеки й невизначеності', info:'браку інформації'});
  const f = has('q9','burned') ? fears.filter(x => x !== 'надійності забудовника') : fears;
  if(f.length) P.push(`Розуміємо ваші сумніви щодо ${listUa(f)} — нижче відповідаємо на них.`);
  return P.join(' ');
}

const SIGN = ['З повагою,', 'Команда Riviera Village'];

/* Telegram: фото → планування → текст із кнопками (Telegram HTML) */
function tgParts(R){
  const h = R.main, a = R.alt;
  const planList = h.plans.concat(a && a.kind==='house' && h.kind==='house' ? a.plans.slice(0,1) : []);
  const mainP = `<b>1. ${title(h)}</b>${h.kind==='house' ? ` · ${STATUS[h.status].short.toLowerCase()}` : ''}\n${specsLine(h)}\n<b>${fromUsd(h.price)}</b>\n\nЧому саме цей варіант: ${R.reasons.slice(0,3).map(lc1).join('; ')}.`;
  const altP = a ? `<b>2. ${a.kind!==h.kind ? (a.kind==='plot' ? 'Або побудуйте свій: ' : 'Або готова вілла: ') : 'Альтернатива: '}${title(a)}</b>\n${a.kind==='plot' ? '' : specsLine(a) + ', '}${fromUsd(a.price)}` : '';
  const payP = `<b>${R.payTitle}</b>\n${R.payLines.join('\n')}`;
  const barP = R.barriers.slice(0,2).map(b => `<b>${b[0]}</b>\n${b[1]}`);
  const head = ['<b>Ось що ми підібрали для вас</b>'].concat(R.fallbackNote ? [R.fallbackNote] : []);
  const body = R.psy !== 'Життєлюб'
    ? [mainP, payP, altP].concat(barP, [ROAD])
    : [storyLine(h), mainP, altP].concat(barP, [payP, ROAD]);
  const invite = `<b>Наступний крок — перегляд</b>\n\n${esc(vocative(S.name))}, пропонуємо обрати зручний час для індивідуальної екскурсії. ${viewingLine(h)} Запишіться кнопкою нижче або попросіть дзвінок.\n\n${SIGN.join('\n')}`;
  return {
    intro: `<i>Демо-концепт квізу для Riviera Village.</i>\n\n<b>Вітаємо, ${esc(vocative(S.name))}!</b>\nДякуємо, що пройшли тест. ${personalNote()}`,
    photos: h.photos.slice(0,3),
    plans: planList,
    planCaption: h.kind==='plot' ? 'Генплан Riviera Village' : `Планування ${h.name}${planList.length > h.plans.length ? ' і ' + a.name : ''}`,
    text: head.concat(body.filter(Boolean), [invite]).join('\n\n'),
    buttons: [[{text: h.kind==='plot' ? 'Подивитися ділянку наживо' : `Записатися на перегляд ${h.name}`}], [{text:'Попросити дзвінок'}]],
    extra: [checklistTg()]
  };
}

/* Email: таблиці з інлайн-стилями, щоб однаково виглядало в Gmail, Apple Mail і Outlook */
function mailParts(R){
  const h = R.main, a = R.alt;
  const F = 'font-family:Arial,Helvetica,sans-serif;color:#1C2226;';
  const P = (html, extra) => `<p style="${F}font-size:15px;line-height:1.55;margin:0 0 14px;${extra||''}">${html}</p>`;
  const img = (src, plan) => `<img src="${plan ? small(src, 1100) : small(src, 1100, 760)}" width="270" alt="" style="display:block;width:100%;max-width:270px;height:auto;border-radius:6px;${plan?'border:1px solid #E1E4E2;':''}">`;
  const grid = list => {
    if(!list.length) return '';
    const rows = [];
    for(let i=0; i<list.length; i+=2) rows.push(`<tr><td width="50%" style="padding:0 6px 12px 0;vertical-align:top">${list[i]}</td><td width="50%" style="padding:0 0 12px 6px;vertical-align:top">${list[i+1]||''}</td></tr>`);
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${rows.join('')}</table>`;
  };
  const html = `<div style="background:#EEF0EC;padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;border-collapse:separate">
<tr><td style="padding:26px 26px 8px">
${P('<span style="font-size:15px;letter-spacing:.42em">RIVIERA VILLAGE</span>', 'margin-bottom:18px')}
${P(`<b style="font-size:18px">Вітаємо, ${esc(vocative(S.name))}!</b>`)}
${P('Дякуємо, що пройшли тест. ' + personalNote())}
${P('<b>Ось що ми підібрали для вас:</b>', 'margin-top:20px')}
${R.fallbackNote ? P(R.fallbackNote) : ''}
${P(`<b>${title(h)}</b>${h.kind==='house' ? ' · ' + STATUS[h.status].short.toLowerCase() : ''}<br>${specsLine(h)}<br><span style="font-size:22px">${fromUsd(h.price)}</span>`)}
${grid(h.photos.slice(0,2).map(s => img(s)).concat(h.plans.slice(0,2).map(s => img(s, true))))}
${P(R.reasons.map(x => '— ' + x).join('<br>'))}
${a ? P(`<b>${a.kind!==h.kind ? (a.kind==='plot' ? 'Або побудуйте свій' : 'Або готова вілла') : 'Альтернатива'}: ${title(a)}</b> — ${a.kind==='plot' ? '' : specsLine(a) + ', '}${fromUsd(a.price)}`) + grid([img(a.photos[0])]) : ''}
${R.barriers.map(b => P(`<b>${b[0]}.</b> ${b[1]}`)).join('')}
${P(`<b>${R.payTitle}.</b> ${R.payLines.join(' ')}`)}
</td></tr>
<tr><td style="padding:0 26px 24px">
<div style="background:#E8F0EF;border-radius:10px;padding:18px 18px 6px">
${P('<b style="font-size:17px">Наступний крок — перегляд</b>', 'margin-bottom:6px')}
${P(`Пропонуємо обрати зручний час для індивідуальної екскурсії. ${viewingLine(h)}`)}
</div>
${P(`${SIGN[0]}<br><b>${SIGN[1]}</b>`, 'margin-top:18px')}
</td></tr>
<tr><td style="padding:14px 26px 22px;border-top:1px solid #E1E4E2">${P(`Демо-концепт квізу для Riviera Village від <a href="${CV}" style="color:#5D6A70">Антона Чепуришкіна</a>. Ви отримали цей лист, бо пройшли тест і залишили email.`, 'font-size:12px;color:#5D6A70;margin:0')}</td></tr>
</table></div>`;
  return {subject: `${S.name}, ${h.kind==='plot' ? 'ділянка' : h.name} в Riviera Village під вашу сім’ю`, html};
}

/* Картка ліда для менеджера — Telegram HTML */
function cardText(R){
  const h = R.main, gr = grade(R);
  const rest = R.barriers.slice(2);
  const L = [
    `<b>${gr} · Новий лід із квізу (демо)</b>`,
    `${esc(S.name)}, +380 ${esc(S.phone)}, ${esc(S.email)}`,
    '',
    `<b>Вік:</b> ${ansText('qa')}`,
    `<b>Стадія:</b> ${R.stage}${has('q9','burned') ? ', травматолог — є негативний досвід із забудовником' : ''}`,
    `<b>Психотип:</b> ${R.psy}${R.psy==='Кар’єрист' ? ' — починайте з цифр і графіка оплат' : R.psy==='Життєлюб' ? ' — починайте з атмосфери: пляж, клуб, ліс' : ''}`,
    `<b>Сім’я:</b> ${ansText('q2')}`,
    `<b>Втомлює:</b> ${ansText('q3')}`,
    `<b>Важливо:</b> ${ansText('q4')}`,
    `<b>Формат:</b> ${ansText('q6')}`,
    `<b>Стримує:</b> ${ansText('q9')}`
  ];
  if(has('q9','resale')) L.push('<b>Увага:</b> порівнює з вторинкою в селищі — покажіть різницю: розтермінування, вибір проєкту, новий будинок.');
  if(rest.length) L.push(`<b>Не розкрито в повідомленні:</b> ${rest.map(b => lc1(Q.q9.opts.find(o => o.id===b[2]).t)).join('; ')} — підніміть на дзвінку.`);
  L.push(`<b>Бюджет і оплата:</b> ${ansText('q10')}; ${ansText('q11')}`);
  L.push(`<b>Терміни:</b> ${ansText('q12')}`);
  L.push(`<b>Поїздки в Київ:</b> ${ansText('q5')}`);
  if(S.ans.q5==='daily') L.push('<b>Ризик:</b> щодня їздить у Київ — проговоріть маршрут і час у дорозі.');
  if(R.fallback) L.push(`<b>Компроміс:</b> повного збігу немає — ${R.compromise}. Обговоріть це першим.`);
  L.push(`<b>Підібрано:</b> ${title(h)}, ${usd(h.price)}${R.alt ? ` · ${title(R.alt)}, ${usd(R.alt.price)}` : ''}`);
  L.push('');
  L.push(`<b>Почати дзвінок:</b> «${esc(S.name)}, за вашими відповідями ми підібрали ${title(h)}. ${h.kind==='house' && h.status==='built' ? 'Будинок уже збудований.' : ''} Коли вам зручно приїхати подивитися?»`.replace('  ', ' '));
  return L.join('\n');
}
