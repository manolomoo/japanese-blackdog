/* 練習紀錄與 🦴（localStorage key: jpMinnaRW1）。rw.js 發出 "rwx" CustomEvent，dogs.js 監聽並發放獎勵。
   事件 detail：{uid,t:練習類型,ev:"hear"|"quiz"|"speak"|"round"|"crown"|"king", isNew, ok, score,total} */
(function(){
/* 每課加一個單元：複製下面一行、改 id / n / file / name / title / count 即可（id 一旦上線不要改，練習紀錄靠它） */
const UNITS=[
 {id:"l23",n:23,file:"lesson23.html",name:"第 23 課",title:"どうやって行きますか（要怎麼去呢？）",count:"單字 28 張・文型 2・例文 9・會話 8 句",types:["cards","vquiz","particle","tvi","pattern","story","speak"]}];
const TN={cards:"單字卡（回音法）",vquiz:"單字測驗",particle:"助詞練習",tvi:"自動詞／他動詞",pattern:"句型練習「と／とき」",story:"會話・例文跟讀",speak:"口說練習"};
const RULE={cards:"每張單字卡都聽過一次（點卡、念單字、念例句或回音法都算）",vquiz:"一輪 10 題，正確率 ≥ 80%",particle:"一輪 10 題，正確率 ≥ 80%",tvi:"一輪 10 題，正確率 ≥ 80%",pattern:"一輪 10 題（選擇／判斷／重組），正確率 ≥ 80%",story:"會話每一句、例文每一句都聽過（每段全文連播一次即可；「我扮」模式輪到自己時，等待時間跑完也算）",speak:"在 5 個不同的題目上按「看答案＋聽」並跟著說"};
const KEY="jpMinnaRW1";let MEM=null,LSOK=true;try{localStorage.setItem("__t","1");localStorage.removeItem("__t")}catch(e){LSOK=false}
const ld=()=>{if(!LSOK)return MEM||(MEM={});try{return JSON.parse(localStorage.getItem(KEY))||{}}catch(e){return MEM||{}}};
const sv=d=>{MEM=d;if(LSOK)try{localStorage.setItem(KEY,JSON.stringify(d))}catch(e){LSOK=false}};
const BONE=n=>n?"🦴".repeat(Math.min(n,4)):"";const pget=k=>((ld().pm||{})[k])||0;
const last={};function emit(o){try{window.dispatchEvent(new CustomEvent("rwx",{detail:o}))}catch(e){}}
function pinc(k,force){const t=Date.now();if(!force&&last[k]&&t-last[k]<2500)return 0;last[k]=t;const d=ld();d.pm=d.pm||{};const was=d.pm[k]||0;d.pm[k]=Math.min(was+1,4);sv(d);return was?2:1}
function toast(m){let e=document.getElementById("rw-t");if(!e){e=document.createElement("div");e.id="rw-t";document.body.appendChild(e)}e.textContent=m;e.className="";void e.offsetWidth;e.className="on"}
function verCheck(){const pv=window.PAGEVER;if(!pv)return;fetch("version.txt?"+Date.now(),{cache:"no-store"}).then(r=>r.ok?r.text():"").then(v=>{v=(v||"").trim();if(v&&v!==pv){const b=document.createElement("div");b.className="rw-ban";b.innerHTML="有新版本 ✨ <button>點我更新</button>";b.querySelector("button").onclick=()=>location.replace(location.pathname+"?v="+v);document.body.prepend(b)}}).catch(()=>{})}
function tst(u,t){const x=((ld()[u]||{})[t])||{};return x.c?2:x.s?1:0}
function ust(U){const a=U.types.map(t=>tst(U.id,t));return a.every(v=>v===2)?2:a.some(v=>v)?1:0}
const css=document.createElement("style");css.textContent=`#rw-t{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);font-size:22px;opacity:0;pointer-events:none;z-index:97;background:var(--cd,#fff);border:1px solid var(--ln,#ddd);border-radius:20px;padding:4px 14px}#rw-t.on{animation:rwt 1.1s ease}@keyframes rwt{0%{opacity:0;transform:translate(-50%,10px) scale(.6)}30%{opacity:1;transform:translate(-50%,0) scale(1.2)}100%{opacity:0;transform:translate(-50%,-40px)}}
.pm{font-size:15px;min-height:18px;letter-spacing:1px}.ca .pm{position:absolute;left:8px;top:6px;font-size:12px}
.rw-ban{position:sticky;top:0;z-index:99;background:#f5b301;color:#111;padding:10px;text-align:center;font-weight:700}.rw-ban button{margin-left:8px;padding:6px 12px;border-radius:8px;border:0;background:#111;color:#fff}
.rwr{font-size:12px;color:var(--mu);line-height:1.6}`;document.head.appendChild(css);
window.RW={LSOK:()=>LSOK,toast,emit,UNITS,ust,tst,TN,RULE,pget,ld,sv,KEY,BONE,verCheck,
/* page(uid,cfg)：cfg.cards=單字卡 key 陣列；cfg.alias={例句:卡片key}；cfg.story=跟讀句子 key 陣列。回傳並掛在 RW 上的方法：heard/speak/quiz/round/pm */
page(uid,cfg){
const U=UNITS.find(x=>x.id===uid);const box=document.getElementById("rw");RW.uid=uid;
function upd(t,fn){const d=ld();d[uid]=d[uid]||{};const x=d[uid][t]=d[uid][t]||{};const before=ust(U),bt=x.c?2:x.s?1:0;fn(x);x.s=1;sv(d);const at=x.c?2:1,after=ust(U);if(at===2&&bt!==2)emit({uid,t,ev:"crown"});if(after===2&&before!==2)emit({uid,t:"all",ev:"king"});draw()}
function draw(){if(!box)return;box.innerHTML=`${LSOK?"":'<div style="color:#d64545;font-size:13px">⚠️ 這個瀏覽器無法儲存進度（可能是私密瀏覽），離開頁面後練習紀錄和🦴會消失。</div>'}<div class="rwr">🦴＝每個單字／句子練過幾次（最多 4 塊）。完成一項練習得 🍖。版本 ${window.PAGEVER||""}</div><details class="rwr"><summary>完成規則</summary>${U.types.map(t=>"・"+(tst(uid,t)===2?"✔ ":"")+TN[t]+"："+RULE[t]).join("<br>")}<br><a href="#" id="rwreset" style="color:var(--mu)">重設本單元進度</a></details>`;
 const r=document.getElementById("rwreset");if(r)r.onclick=e=>{e.preventDefault();if(confirm("確定重設本單元的練習進度？（狗狗與骨頭不受影響）")){const d=ld();delete d[uid];for(const k of Object.keys(d.pm||{}))if(k.indexOf(uid+"|")===0)delete d.pm[k];sv(d);draw();if(window.RW.onReset)RW.onReset()}}}
const P=t=>uid+"|"+t+"|";
function listDone(t,list,k){if(!list.includes(k))return;upd(t,x=>{x.h=x.h||[];if(!x.h.includes(k))x.h.push(k);if(list.every(z=>x.h.includes(z)))x.c=1})}
RW.heard=function(k){let n=0;const ck=(cfg.cards||[]).includes(k)?k:(cfg.alias&&cfg.alias[k]);
 if(ck){listDone("cards",cfg.cards,ck);const r=pinc(P("cards")+ck);if(r){emit({uid,t:"cards",ev:"hear",isNew:r===1});n++}}
 if((cfg.story||[]).includes(k)){listDone("story",cfg.story,k);const r=pinc(P("story")+k);if(r){emit({uid,t:"story",ev:"hear",isNew:r===1});n++}}
 return n};
RW.speak=function(k){upd("speak",x=>{x.h=x.h||[];if(!x.h.includes(k))x.h.push(k);if(x.h.length>=5)x.c=1});const r=pinc(P("speak")+k);if(r)emit({uid,t:"speak",ev:"speak",isNew:r===1});return r};
RW.quiz=function(t,k,ok){const r=pinc(P(t)+k,1);emit({uid,t,ev:"quiz",isNew:r===1,ok});return r};
RW.round=function(t,score,total){upd(t,x=>{const pct=Math.round(score/total*100);if(total>=10&&(!x.b||pct>parseInt(x.b)))x.b=pct+"%";if(total>=10&&score/total>=.8)x.c=1});emit({uid,t,ev:"round",score,total})};
RW.pm=(t,k)=>pget(P(t)+k);
draw();verCheck()},
home(el){verCheck();
el.innerHTML=UNITS.slice().sort((a,b)=>b.n-a.n).map(U=>{const s=ust(U);return`<a class="card" href="${U.file}"><div class="t"><span class="wk">${U.name}</span></div><div class="s">${U.title}</div><div class="s" style="font-size:14px;margin-top:6px">${U.count}</div><div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px;align-items:center">${U.types.map(t=>`<span style="font-size:12px;color:var(--mu)">${tst(U.id,t)===2?"✔ ":""}${TN[t]}</span>`).join("")}</div><div class="go">${s===2?"再練一次 →":"開始練習 →"}</div></a>`}).join("")}};
})();
