/* 單元頁引擎：單字卡（回音法）→ 筆記・文型 → 課文跟讀（例文＋會話）→ 練習（測驗）→ 口說。資料來自 window.LESSON，不含任何課別專屬邏輯。 */
(function(){
const L=window.LESSON,{R:rb,P:pl,K:kn,esc}=window.JP,$=id=>document.getElementById(id);
const RATES=[0.7,0.85,1.0];let rate=0.85,run=0,playing=false;
const shuf=a=>{a=a.slice();for(let k=a.length-1;k>0;k--){const j=Math.floor(Math.random()*(k+1));[a[k],a[j]]=[a[j],a[k]]}return a};
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
/* ---------- 單字資料 ---------- */
const prep=(x,rel)=>({...x,rel,key:x.say||pl(x.w),kana:kn(x.w),kanji:pl(x.w),hasKanji:kn(x.w)!==pl(x.w)});
const G=[{name:"單字",cards:L.vocab.map(x=>prep(x,0))},{name:"關聯",cards:(L.related||[]).map(x=>prep(x,1))}].filter(g=>g.cards.length);
const ALL=G.flatMap(g=>g.cards);
const EXKEY={};ALL.forEach(c=>{EXKEY[pl(c.ex)]=c.key});
/* ---------- 跟讀句子 ---------- */
const SENT=[];L.sentences.forEach(s=>{SENT.push(pl(s.ja));if(s.re)SENT.push(pl(s.re))});L.dialogue.lines.forEach(l=>SENT.push(pl(l.ja)));
/* ---------- 播放 ---------- */
const wait=s=>{const t=TTS.sess();return new Promise(r=>setTimeout(()=>r(TTS.sess()===t),s*1000))};
const play1=k=>{RW.heard(k);return TTS.play(k,rate)};
const echoGap=d=>Math.max(1,d+.3),shadowGap=d=>Math.max(1.5,d*1.25+.6);
const myGap=t=>Math.max(2.5,pl(t).length*.3+1.5);
function seg(el,opts,sel,on){el.innerHTML="";opts.forEach((o,k)=>{const b=document.createElement("button");b.textContent=o;if(k===sel)b.className="on";b.onclick=()=>{on(k);seg(el,opts,k,on)};el.appendChild(b)})}
function cueEl(el,p,lb){el.textContent=(p?lb||"":"")+({listen:"聽",echo:"回音・心裡默念",shadow:"跟讀・大聲說出來",me:"換你說！"}[p]||"");el.style.color=(p==="shadow"||p==="me")?"var(--ac)":""}
const mine=()=>mineSel>0?L.dialogue.roles[mineSel-1].n:null;let mineSel=0;
function stop(){TTS.cancel();run++;playing=false;document.querySelectorAll(".sn.hl,.cue-hl").forEach(e=>e.classList.remove("hl","cue-hl"));document.querySelectorAll(".cue").forEach(e=>{e.textContent="";e.style.color=""});document.querySelectorAll(".sn.hide").forEach(e=>e.classList.remove("hide"));if(window.__renderCard)__renderCard()}
async function once(keys){if(TTS.unlock)TTS.unlock();stop();for(const k of keys){const d=await play1(k);if(d==null)return}}
const seq=async keys=>{let t=0;for(const k of keys){const d=await play1(k);if(d==null)return null;t+=d}return t};
const bones=n=>RW.BONE(n);
/* ---------- 骨架 ---------- */
$("app").innerHTML=`<header class="wk"><div class="wk-top"><a class="nav" href="index.html">← 首頁</a><h1>第 ${L.n} 課<span class="wk-date">${esc(L.title)}</span></h1><a class="nav" href="kennel.html" style="margin-left:auto">🐕 狗舍</a></div>
<div id="dogbar"></div>
<div class="ctl"><button type="button" id="tfg" class="tg on">假名：顯示</button><button type="button" id="tzh" class="tg">中文：隱藏</button></div>
<nav class="jump" id="jump"><div class="jump-bar"><button type="button" class="on" data-sec="v">單字</button><button type="button" data-sec="n">筆記</button><button type="button" data-sec="t">課文</button><button type="button" data-sec="q">練習</button><button type="button" data-sec="s">口說</button></div></nav></header>
<div id="nov" style="display:none;color:var(--bad);font-size:14px">⚠️ 這個瀏覽器不支援音訊播放，請改用 Chrome／Safari／Edge。</div>
<section id="sec-v" class="panel"><div class="seg" id="grp"></div><div class="seg" id="fmode"></div>
<div class="box c bc" id="bigcard"><div class="pm" id="pmw"></div><div class="big" id="front"></div><div id="back"></div><button class="b" id="flip" style="margin-top:6px">👀 翻面看答案</button></div>
<div class="row" style="flex-wrap:nowrap"><button class="b" id="o1">念單字</button><button class="b" id="o2">念例句</button></div>
<div class="row"><button class="b" id="pv">‹ 上一個</button><button class="b p" id="pl">▶ 回音法播放</button><button class="b" id="nx">下一個 ›</button></div><div class="cue" id="cue"></div>
<div class="mu">語速</div><div class="seg" id="rate"></div>
<div class="box"><b>單字卡</b><div class="mu" style="font-size:14px">點卡聽發音（單字→例句），並切換到這張卡練習。</div><div class="ga" id="ga"></div></div></section>
<section id="sec-n" class="panel" hidden><div id="notes"></div></section>
<section id="sec-t" class="panel" hidden><div id="dlg" class="box tx"></div><div id="exs" class="box tx"></div></section>
<section id="sec-q" class="panel" hidden><div class="seg" id="qseg"></div><div class="box c" id="qbox"></div></section>
<section id="sec-s" class="panel" hidden><div class="box c"><b>口說練習：看中文→先說日文</b><div class="seg" id="dkseg"></div><div class="mu" id="dpos"></div><div class="sen" id="dq"></div><div class="sen hl" id="da" style="visibility:hidden"></div><div class="mu" id="dnote" style="font-size:14px"></div><div class="mu" style="font-size:13px">先大聲說，再按「看答案＋聽」。</div><div class="row"><button class="b p" id="dr">看答案＋聽</button><button class="b" id="dn">換一題 ›</button></div></div></section>
<div id="rw"></div>`;
/* 假名／中文開關 */
function applyToggles(){const fg=store.get("jpFg")!=="0",zh=store.get("jpZh")==="1";document.body.classList.toggle("nofg",!fg);document.body.classList.toggle("showzh",zh);$("tfg").textContent="假名："+(fg?"顯示":"隱藏");$("tfg").classList.toggle("on",fg);$("tzh").textContent="中文："+(zh?"顯示":"隱藏");$("tzh").classList.toggle("on",zh)}
$("tfg").onclick=()=>{store.set("jpFg",store.get("jpFg")==="0"?"1":"0");applyToggles()};
$("tzh").onclick=()=>{store.set("jpZh",store.get("jpZh")==="1"?"0":"1");applyToggles()};applyToggles();
/* ---------- 單字卡 ---------- */
let g=0,i=0,fm=0,rev=false;const list=()=>G[g].cards;
function startIdx(k=g){const Lc=G[k].cards;let b=0,m=Infinity;for(let j=0;j<Lc.length;j++){const n=RW.pm("cards",Lc[j].key)||0;if(n<m){m=n;b=j}}return b}
const badge=p=>/自/.test(p)?'<span class="vb vi">'+esc(p)+'</span>':/他/.test(p)?'<span class="vb vt">'+esc(p)+'</span>':'<span class="vb">'+esc(p)+'</span>';
function render(){const Lc=list();if(i>=Lc.length)i=0;const c=Lc[i];$("pl").textContent=playing?"⏸ 暫停":"▶ 回音法播放";
 const front=fm===0?c.kanji:fm===1?c.kana:c.zh;$("front").textContent=front;$("front").className="big"+(fm===2?" zhf":"");
 $("back").innerHTML=rev?`<div class="bk">${fm!==0?`<div class="rbig">${rb(c.w)}</div>`:""}${fm!==1?`<div class="mu">${esc(c.kana)}</div>`:""}<div class="zhb">${esc(c.zh)}</div>${c.note?`<div class="mu">${rb(c.note)}</div>`:""}<div>${badge(c.pos)}</div>
 <div class="exs"><div class="exj">${rb(c.ex)}</div><div class="mu">${esc(c.exzh)}</div></div></div>`:"";
 $("flip").style.display=rev?"none":"";$("pmw").textContent=bones(RW.pm("cards",c.key));grid();grpLabels()}
function grid(){$("ga").innerHTML=list().map((c,k)=>`<div class="ca${k===i?" cur":""}" data-k="${k}"><span class="sp">🔊</span><div class="en">${rb(c.w)}</div><div class="zh">${esc(c.zh)}</div><div class="tg2">${badge(c.pos)}</div><div class="pm">${bones(RW.pm("cards",c.key))}</div></div>`).join("");
 $("ga").querySelectorAll(".ca").forEach(el=>el.onclick=()=>{stop();i=+el.dataset.k;rev=true;render();once([list()[i].key])})}
async function playEcho(){if(TTS.unlock)TTS.unlock();TTS.cancel();const r=++run,s0=TTS.sess();playing=true;rev=false;render();const ok=()=>run===r&&TTS.sess()===s0;const Lc=list();
 const cue=$("cue");
 while(ok()&&i<Lc.length){rev=true;render();const c=Lc[i],parts=[c.key,pl(c.ex)];
  for(let j=0;j<2;j++){const rounds=j===0?2:1;for(let k=0;k<rounds;k++){cueEl(cue,"listen",(j?"例句":"單字")+"｜");$("front").classList.add("hl");const d=await play1(parts[j]);$("front").classList.remove("hl");if(d==null||!ok())return;
   cueEl(cue,"echo");if(!await wait(echoGap(d))||!ok())return;cueEl(cue,"shadow");if(!await wait(shadowGap(d))||!ok())return}}
  if(!await wait(.5)||!ok())return;if(i+1<Lc.length){i++;rev=false}else break}
 if(ok()){playing=false;i=startIdx();rev=false;cueEl(cue,"");render()}}
$("flip").onclick=()=>{rev=true;render()};$("bigcard").addEventListener("click",e=>{if(e.target.closest("button"))return;rev=!rev;render()});
$("o1").onclick=()=>{rev=true;once([list()[i].key]);render()};$("o2").onclick=()=>{rev=true;once([pl(list()[i].ex)]);render()};
$("pv").onclick=()=>{stop();i=(i-1+list().length)%list().length;rev=false;render()};$("nx").onclick=()=>{stop();i=(i+1)%list().length;rev=false;render()};$("pl").onclick=()=>playing?stop():playEcho();
["pl","o1","o2"].forEach(id=>$(id).addEventListener("pointerdown",()=>{TTS.unlock&&TTS.unlock()},{passive:true}));
seg($("fmode"),["漢字 →","假名 →","中文 →"],0,k=>{fm=k;rev=false;render()});
seg($("rate"),RATES.map(r=>r+"x"),RATES.indexOf(rate),k=>{rate=RATES[k]});
const gLast=G.map(()=>-1);
function grpLabels(){gLast[g]=i;const el=$("grp");if(!el.children.length){G.forEach((x,k)=>{const b=document.createElement("button");b.onclick=()=>{stop();g=k;i=startIdx();rev=false;render()};el.appendChild(b)})}
 G.forEach((x,k)=>{const b=el.children[k],n=x.cards.length,cur=k===g?i:(gLast[k]>=0?gLast[k]:startIdx(k));b.innerHTML=esc(x.name)+"<small>"+(cur+1)+"/"+n+"</small>";b.className=k===g?"on":""})}
/* ---------- 筆記・文型 ---------- */
function notesHTML(){const ln=(l)=>`<div class="nl" data-k="${esc(pl(l.ja))}"><div class="nj">🔊 ${rb(l.ja)}${l.tag?` <span class="vb">${esc(l.tag)}</span>`:""}</div><div class="zhs">${esc(l.zh)}</div></div>`;
 return `<div class="box"><b style="font-size:18px">📒 我的筆記</b><div class="mu" style="font-size:13px">點一行聽發音。</div>${L.notes.map(n=>`<div class="ncard"><b>${esc(n.title)}</b>${n.lines.map(ln).join("")}${n.tip?`<div class="tip">💡 ${esc(n.tip)}</div>`:""}</div>`).join("")}</div>`+
 L.grammar.map(x=>`<div class="box"><b style="font-size:18px">${esc(x.title)}</b>${x.ex.map(ln).join("")}<table class="tb">${x.rows.map(r=>`<tr><td>${esc(r[0])}</td><td>${rb(r[1])}</td><td>${esc(r[2])}</td></tr>`).join("")}</table>${x.body.map(b=>`<div class="def">${esc(b)}</div>`).join("")}</div>`).join("")+
 `<div class="box"><b style="font-size:18px">自動詞／他動詞對照</b><table class="tb"><tr><th>他動詞（を）</th><th>自動詞（が）</th></tr>${L.tviTable.map(r=>`<tr><td>${rb(r[0])}</td><td>${rb(r[1])}</td></tr>`).join("")}</table></div>`}
$("notes").innerHTML=notesHTML();$("notes").querySelectorAll(".nl").forEach(e=>e.onclick=()=>once([e.dataset.k]));
/* ---------- 課文：會話＋例文 ---------- */
const roleCls=n=>"r"+Math.max(0,L.dialogue.roles.findIndex(r=>r.n===n));
function buildText(){const D=L.dialogue;
 $("dlg").innerHTML=`<b style="font-size:18px">💬 會話：${esc(D.title)}</b><div class="mu" style="font-size:13px">${esc(D.intro||"")}</div>
 <div class="seg" id="roleseg"></div>
 <div class="row"><button class="b p" data-a="all">▶ 全文連播</button><button class="b" data-a="echo">回音法逐句</button><button class="b" data-a="stop">⏹ 停止</button></div><div class="cue" id="dcue" style="min-height:20px"></div>
 <div class="story">${D.lines.map((l,j)=>`<div class="sn ${roleCls(l.r)}" id="dl${j}" data-j="${j}"><span class="rn">${esc(l.r)}</span><div class="jt">${rb(l.ja)}</div><div class="zhs">${esc(l.zh)}</div></div>`).join("")}</div><div class="mu" style="font-size:12px">點任一句可單獨聽。選「我扮○○」：輪到那個角色時只留空白，換你說。</div>`;
 seg($("roleseg"),["全部播放",...D.roles.map(r=>"我扮"+r.n)],0,k=>{stop();mineSel=k});
 $("dlg").querySelectorAll(".sn").forEach(e=>e.onclick=()=>{stop();e.classList.add("hl");play1(pl(D.lines[+e.dataset.j].ja)).then(()=>e.classList.remove("hl"))});
 const box=$("dlg"),cue=$("dcue");box.querySelector('[data-a="stop"]').onclick=stop;
 async function go(echo){if(TTS.unlock)TTS.unlock();stop();const r=run,s0=TTS.sess();const ok=()=>run===r&&TTS.sess()===s0;const me=mine();
  for(let n=0;n<D.lines.length&&ok();n++){const l=D.lines[n],e=$("dl"+n),t=pl(l.ja),lb="【"+(n+1)+"/"+D.lines.length+"】";e.classList.add("hl");
   if(me&&l.r===me){e.classList.add("hide");cueEl(cue,"me",lb+"（"+me+"）");if(!await wait(myGap(t))||!ok()){e.classList.remove("hl");return}e.classList.remove("hide");RW.heard(t);if(!await wait(.6)||!ok()){e.classList.remove("hl");return}e.classList.remove("hl");continue}
   cueEl(cue,"listen",lb);const d=await play1(t);if(d==null||!ok()){e.classList.remove("hl");return}
   if(echo){cueEl(cue,"echo",lb);if(!await wait(echoGap(d))||!ok()){e.classList.remove("hl");return}cueEl(cue,"shadow",lb);if(!await wait(shadowGap(d))||!ok()){e.classList.remove("hl");return}}
   else if(!await wait(.4)||!ok()){e.classList.remove("hl");return}
   e.classList.remove("hl")}
  if(ok())cue.textContent="完成 ✔"}
 box.querySelector('[data-a="all"]').onclick=()=>go(false);box.querySelector('[data-a="echo"]').onclick=()=>go(true);
 /* 例文 */
 $("exs").innerHTML=`<b style="font-size:18px">📖 例文</b><div class="row"><button class="b p" data-a="all">▶ 全部連播</button><button class="b" data-a="echo">回音法逐句</button><button class="b" data-a="stop">⏹ 停止</button></div><div class="cue" id="ecue" style="min-height:20px"></div>
 <div class="story">${L.sentences.map((s,j)=>`<div class="sn" id="ex${j}" data-j="${j}"><span class="rn">${j+1}</span><div class="jt">${rb(s.ja)}</div><div class="zhs">${esc(s.zh)}</div>${s.re?`<div class="jt rep">…${rb(s.re)}</div><div class="zhs">${esc(s.rezh||"")}</div>`:""}</div>`).join("")}</div><div class="mu" style="font-size:12px">點任一句可聽（有回答的會連回答一起念）。</div>`;
 const eb=$("exs"),ec=$("ecue"),parts=s=>s.re?[pl(s.ja),pl(s.re)]:[pl(s.ja)];
 eb.querySelectorAll(".sn").forEach(e=>e.onclick=()=>{stop();e.classList.add("hl");seq(parts(L.sentences[+e.dataset.j])).then(()=>e.classList.remove("hl"))});
 eb.querySelector('[data-a="stop"]').onclick=stop;
 async function goE(echo){if(TTS.unlock)TTS.unlock();stop();const r=run,s0=TTS.sess();const ok=()=>run===r&&TTS.sess()===s0;
  for(let n=0;n<L.sentences.length&&ok();n++){const e=$("ex"+n),lb="【"+(n+1)+"/"+L.sentences.length+"】";e.classList.add("hl");
   for(const t of parts(L.sentences[n])){cueEl(ec,"listen",lb);const d=await play1(t);if(d==null||!ok()){e.classList.remove("hl");return}
    if(echo){cueEl(ec,"echo",lb);if(!await wait(echoGap(d))||!ok()){e.classList.remove("hl");return}cueEl(ec,"shadow",lb);if(!await wait(shadowGap(d))||!ok()){e.classList.remove("hl");return}}else if(!await wait(.3)||!ok()){e.classList.remove("hl");return}}
   e.classList.remove("hl")}
  if(ok())ec.textContent="完成 ✔"}
 eb.querySelector('[data-a="all"]').onclick=()=>goE(false);eb.querySelector('[data-a="echo"]').onclick=()=>goE(true)}
buildText();
/* ---------- 練習：通用題組 ---------- */
const TYPES=[["vquiz","單字測驗"],["particle","助詞"],["tvi","自動詞／他動詞"],["pattern","と／とき"]];
const blankHTML=(q,fill,cls)=>rb(q).replace("＿",`<span class="blank ${cls||""}">${fill?esc(fill):"＿＿"}</span>`);
function genV(){const dirs=[["kanji","kana"],["kana","kanji"],["kanji","zh"],["zh","kanji"],["kana","zh"],["zh","kana"]];const lab={kanji:"漢字",kana:"假名",zh:"中文"};
 return shuf(ALL).slice(0,10).map(c=>{const ok=dirs.filter(([a,b])=>{if((a==="kanji"||b==="kanji")&&(!c.hasKanji))return false;return true});const [a,b]=ok[Math.floor(Math.random()*ok.length)];
  const val=(x,f)=>f==="kanji"?x.kanji:f==="kana"?x.kana:x.zh;const ans=val(c,b);const ds=[];shuf(ALL).forEach(x=>{if(x!==c&&ds.length<3&&val(x,b)!==ans&&!ds.includes(val(x,b))&&(b!=="kanji"||x.hasKanji))ds.push(val(x,b))});
  return {k:"c",key:"v|"+a+b+"|"+c.key,qtext:val(c,a),z:lab[a]+" → "+lab[b],opts:shuf([ans,...ds]),ans,why:c.kanji+"（"+c.kana+"）＝"+c.zh,say:c.key,zhq:a==="zh"}})}
function genChoice(items,key){return shuf(items).slice(0,10).map(it=>({k:"c",key:key+"|"+pl(it.q),q:it.q,z:it.z||"",opts:it.opts,ans:it.ans,why:it.why,say:it.say||pl(it.q.replace("＿",it.ans))}))}
const P=L.particle,PT=L.pattern;
function genPattern(){const a=[...PT.choice.map(x=>({k:"c",key:"p|"+pl(x.q),q:x.q,opts:x.opts,ans:x.ans,why:x.why,say:pl(x.q.replace("＿",x.ans)),z:"選出正確的接法"})),
 ...PT.judge.map(x=>({k:"c",key:"j|"+pl(x.s),sent:x.s,opts:["○ 可以用「と」","✕ 不能用「と」"],ans:x.ok?"○ 可以用「と」":"✕ 不能用「と」",why:x.why,say:pl(x.s),z:"這句話的「〜と」用法正確嗎？"})),
 ...PT.reorder.map(x=>({k:"r",key:"r|"+pl(x.chunks.join("")),chunks:x.chunks,zh:x.zh,say:pl(x.chunks.join("")),z:"點詞塊，排出正確的句子"}))];return shuf(a).slice(0,10)}
const GEN={vquiz:genV,particle:()=>genChoice(P.items.map(x=>({...x,opts:P.opts,z:"填入正確的助詞"})),"pa"),tvi:()=>genChoice(L.tvi.map(x=>({...x,z:x.z||"選出正確的答案"})),"tv"),pattern:genPattern};
let qt=0,items=[],qi=0,score=0,pk=null,placed=[],chk=null,qdone=false;
function newRound(){items=GEN[TYPES[qt][0]]();qi=0;score=0;pk=null;placed=[];chk=null;qdone=false;qshow()}
function answer(ok,it){if(ok)score++;RW.quiz(TYPES[qt][0],it.key,ok);if(it.say)TTS.play(it.say,rate);}
function qshow(){const box=$("qbox"),T=TYPES[qt][0];
 if(qi>=items.length){if(!qdone){qdone=true;RW.round(T,score,items.length)}const pct=Math.round(score/items.length*100);
  box.innerHTML=`<div class="big">${score} / ${items.length}</div><div class="sen ${pct>=80?"ok":"bad"}">${pct>=80?"🎉 通過！這項練習完成了":"再加油，需要 80% 以上才算完成"}</div><div class="mu">正確率 ${pct}%</div><button class="b p" id="qagain">再來一輪</button>`;$("qagain").onclick=newRound;return}
 const it=items[qi];let h=`<div class="mu">第 ${qi+1} / ${items.length} 題　答對 ${score}</div><div class="mu">${esc(it.z||"")}</div>`;
 if(it.k==="r"){h+=`<div class="zhq">${esc(it.zh)}</div><div class="ans-line" id="ansl"></div><div class="chips" id="chips"></div><div class="row"><button class="b" id="rclr">清除</button><button class="b p" id="rchk">檢查答案</button></div>`}
 else{h+=(it.sent?`<div class="sen">${rb(it.sent)}</div>`:it.q?`<div class="sen">${blankHTML(it.q,pk,pk&&pk===it.ans?"good":pk?"wrong":"")}</div>`:`<div class="sen${it.zhq?" zhf":""}">${esc(it.qtext)}</div>`);
  h+=`<div class="row" id="qo"></div>`}
 h+=`<div id="qr" class="qr"></div><button class="b p" id="qn" style="display:none">${qi+1>=items.length?"看結果":"下一題 ›"}</button><div class="pm">${bones(RW.pm(T,it.key))}</div>`;box.innerHTML=h;
 const fb=(ok)=>{$("qr").innerHTML=(ok?"✅ 答對了！":"❌ 再想想")+"<div class='why'>"+esc(it.why||"")+(!ok&&it.k==="c"?"　正確答案：「"+esc(it.ans)+"」":"")+"</div>";$("qr").style.color=ok?"var(--ok)":"var(--bad)";$("qn").style.display=""};
 if(it.k==="r"){const full=it.chunks;const sh=chk||(chk=shuf(full.map((c,k)=>k)));
  const draw=()=>{$("ansl").innerHTML=placed.length?placed.map((k,pi)=>`<button class="chip on" data-p="${pi}">${rb(full[k])}</button>`).join(""):'<span class="mu">（點下面的詞塊）</span>';
   $("chips").innerHTML=sh.map(k=>placed.includes(k)?`<button class="chip used" disabled>${rb(full[k])}</button>`:`<button class="chip" data-c="${k}">${rb(full[k])}</button>`).join("");
   $("ansl").querySelectorAll("[data-p]").forEach(b=>b.onclick=()=>{if(pk)return;placed.splice(+b.dataset.p,1);draw()});
   $("chips").querySelectorAll("[data-c]").forEach(b=>b.onclick=()=>{if(pk)return;placed.push(+b.dataset.c);draw()})};draw();
  $("rclr").onclick=()=>{if(pk)return;placed=[];draw()};
  $("rchk").onclick=()=>{if(pk||placed.length<full.length)return;const ok=placed.every((k,p)=>k===p);pk=ok?"ok":"ng";
   if(!ok){placed=full.map((c,k)=>k)}draw();answer(ok,it);it.why=ok?"":"正確順序如上方所示。";fb(ok)}}
 else{it.opts.forEach(o=>{const b=document.createElement("button");b.className="b";b.textContent=o;if(pk){if(o===it.ans){b.style.background="var(--ok)";b.style.color="#fff"}else if(o===pk)b.style.color="var(--bad)"}
  b.onclick=()=>{if(pk)return;pk=o;const ok=o===it.ans;answer(ok,it);qshow();$("qr").innerHTML="";fb(ok)};$("qo").appendChild(b)});
  if(pk){$("qr").innerHTML=(pk===it.ans?"✅ 答對了！":"❌ 再想想")+"<div class='why'>"+esc(it.why||"")+(pk!==it.ans?"　正確答案：「"+esc(it.ans)+"」":"")+"</div>";$("qr").style.color=pk===it.ans?"var(--ok)":"var(--bad)";$("qn").style.display=""}}
 $("qn").onclick=()=>{pk=null;placed=[];chk=null;qi++;qshow()}}
seg($("qseg"),TYPES.map(t=>t[1]),0,k=>{TTS.cancel();qt=k;newRound()});
/* ---------- 口說 ---------- */
const DECKS=[{name:"例文",items:L.sentences.map(s=>({q:s.zh,a:[pl(s.ja),...(s.re?[pl(s.re)]:[])],aj:[s.ja,...(s.re?["…"+s.re]:[])]}))},
 {name:"單字例句",items:ALL.map(c=>({q:c.exzh,a:[pl(c.ex)],aj:[c.ex],note:c.kanji+"＝"+c.zh}))},
 {name:"會話",items:L.dialogue.lines.map(l=>({q:l.r+"：「"+l.zh+"」",a:[pl(l.ja)],aj:[l.ja]}))}];
let dk=0,di=0;
function drill(){const d=DECKS[dk],it=d.items[di];$("dq").textContent=it.q;$("da").innerHTML=it.aj.map(rb).join("<br>");$("da").style.visibility="hidden";$("dnote").textContent=it.note||"";$("dnote").style.display="none";$("dpos").textContent=d.name+"　"+(di+1)+" / "+d.items.length}
$("dr").onclick=()=>{$("da").style.visibility="visible";$("dnote").style.display="";const it=DECKS[dk].items[di];RW.speak(it.a[0]);once(it.a)};
$("dn").onclick=()=>{stop();const n=DECKS[dk].items.length;di=n>1?(di+1+Math.floor(Math.random()*(n-1)))%n:0;drill()};
seg($("dkseg"),DECKS.map(x=>x.name),0,k=>{stop();dk=k;di=0;drill()});
/* ---------- 分頁 ---------- */
(function(){const nav=$("jump"),ids=["v","n","t","q","s"];
 function show(id,scroll){ids.forEach(s=>{const el=$("sec-"+s);if(el)el.hidden=s!==id});nav.querySelectorAll("button").forEach(b=>b.classList.toggle("on",b.dataset.sec===id));stop();if(scroll)window.scrollTo(0,0)}
 nav.addEventListener("click",e=>{const b=e.target.closest("button[data-sec]");if(!b)return;history.replaceState(null,"","#"+b.dataset.sec);show(b.dataset.sec,true)});
 const init=(location.hash||"").replace("#","").replace("sec-","");if(ids.includes(init))show(init,false)})();
if(!TTS.supported())$("nov").style.display="";
try{i=0;RW.page(L.uid,{cards:ALL.map(c=>c.key),alias:EXKEY,story:SENT});RW.onReset=()=>render();window.__renderCard=render;i=startIdx();render();newRound();drill();if(window.DOGS)DOGS.bar($("dogbar"));window.__unitReady=1}catch(e){console.error(e);document.body.insertAdjacentHTML("afterbegin","<div style='padding:12px;color:#d64545'>載入失敗："+e+"</div>")}
})();
