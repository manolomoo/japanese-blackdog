/* 黑狗王養成系統（取代原站 rpg.js）。監聽 rw.js 發出的 "rwx" 事件發獎勵。狀態存 localStorage "jpBlackDogKing1"。
   對外：DOGS.home(el) 首頁卡、DOGS.bar(el) 單元頁迷你狀態列、DOGS.kennel(el) 狗舍頁、DOGS.svg(dog,px) 畫狗 */
(function(){
const KEY="jpBlackDogKing1";let MEM=null,LSOK=true;try{localStorage.setItem("__t","1");localStorage.removeItem("__t")}catch(e){LSOK=false}
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
/* ===== 資料表 ===== */
const BREEDS=[
 {id:"lab",n:"黑拉布拉多",size:1.0,trait:["溫柔","貪吃","愛游泳"]},
 {id:"shiba",n:"黑柴",size:.9,trait:["傲嬌","固執","忠心"]},
 {id:"mix",n:"米克斯",size:.88,trait:["機靈","好奇","樂天"]},
 {id:"dobe",n:"黑杜賓",size:1.05,trait:["帥氣","警覺","忠誠"]},
 {id:"poodle",n:"黑貴賓",size:.8,trait:["優雅","愛撒嬌","聰明"]},
 {id:"frenchie",n:"黑法鬥",size:.78,trait:["愛睡覺","搞笑","黏人"]}];
const NAMES=[["クロ","くろ"],["ハチ","はち"],["ポチ","ぽち"],["モモ","もも"],["タロウ","たろう"],["コテツ","こてつ"],["ジロウ","じろう"],["ヤミ","やみ"],["スミ","すみ"],["クルミ","くるみ"],["ゴマ","ごま"],["ソラ","そら"],["ハナ","はな"],["ムギ","むぎ"],["レオ","れお"],["ケン","けん"],["ココ","ここ"],["マル","まる"],["ダイ","だい"],["サクラ","さくら"],["ユキ","ゆき"],["ブンタ","ぶんた"],["テツ","てつ"],["ラン","らん"]];
const TRAITS=["活潑","穩重","膽小","愛撒嬌","貪吃","聰明","愛吠叫","害羞","勇敢","愛偷襪子"];
const COLLARS=["#e74c3c","#f39c12","#2ecc71","#3498db","#9b59b6","#ec4899","#14b8a6","#facc15"];
const ACCS=["none","bandana","bow","glasses","tophat","partyhat","medal","scarf"];
const ACCN={none:"",bandana:"頭巾",bow:"蝴蝶結",glasses:"眼鏡",tophat:"紳士帽",partyhat:"派對帽",medal:"獎牌",scarf:"圍巾"};
const RANKS=[[1,"小黑"],[5,"黑狗"],[10,"精英黑犬"],[15,"黑狗騎士"],[20,"黑狗守護神"]];
const TITLES=[{n:"見習飼主",e:"🐾",dogs:1,lv:0},{n:"黑狗飼主",e:"🐕",dogs:2,lv:3},{n:"黑狗隊長",e:"🎖️",dogs:3,lv:12},{n:"黑狗團長",e:"🛡️",dogs:4,lv:30},{n:"黑狗大將",e:"⚔️",dogs:5,lv:55},{n:"黑狗將軍",e:"🏅",dogs:6,lv:90},{n:"黑狗王",e:"👑",dogs:8,lv:140},{n:"傳說黑狗王",e:"🌟👑",dogs:10,lv:260}];
const ACH=[["first_perfect","💯","初次滿分","一輪測驗全對"],["story","🗣️","會話全部跟讀","完成「會話・例文跟讀」"],["adopt3","🐕‍🦺","三犬同行","擁有 3 隻黑狗"],["adopt5","🐾","領養 5 隻","擁有 5 隻黑狗"],["streak3","🔥","連續 3 天","連續練習 3 天"],["streak7","🌋","連續 7 天","連續練習 7 天"],["lv10","🥈","精英黑犬","任一隻狗升到 Lv10"],["lv20","🥇","黑狗守護神","任一隻狗升到 Lv20"],["bones100","🦴","百骨收藏家","累積獲得 100 塊骨頭"],["feed20","🍖","餵食達人","餵食 20 次"],["king","👑","黑狗王","稱號達到黑狗王"],["all","🏆","全課制霸","完成一課的全部練習"]];
const rankOf=lv=>{let r=0;RANKS.forEach((x,k)=>{if(lv>=x[0])r=k});return r};
const lvNeed=lv=>10+4*lv, MAXLV=30;
const adoptCost=k=>k<=1?{b:30,x:0}:{b:30+(k-1)*30+(k-1)*(k-1)*5,x:(k-1)*30};
/* ===== 狀態 ===== */
const today=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
const yday=()=>{const d=new Date(Date.now()-864e5);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
const rnd=a=>a[Math.floor(Math.random()*a.length)];
function mkDog(id,over){const b=Math.floor(Math.random()*BREEDS.length),nm=rnd(NAMES);return Object.assign({id,name:nm[0],kana:nm[1],breed:b,trait:rnd(BREEDS[b].trait)+"・"+rnd(TRAITS),collar:rnd(COLLARS),acc:rnd(ACCS),lv:1,xp:0,aff:0},over||{})}
function fresh(){return {v:1,bones:5,meat:0,xp:0,tb:0,dogs:[mkDog(1,{name:"クロ",kana:"くろ",breed:2,collar:"#e74c3c",acc:"bandana",trait:"機靈・活潑"})],nid:2,streak:{last:"",n:0},ach:{},fed:0,cand:null}}
function load(){let s=null;if(LSOK){try{s=JSON.parse(localStorage.getItem(KEY))}catch(e){}}else s=MEM;if(!s||!Array.isArray(s.dogs)||!s.dogs.length)s=fresh();return s}
let S=load();
function save(quiet){MEM=S;if(LSOK)try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){LSOK=false}if(!quiet)try{window.dispatchEvent(new CustomEvent("dogs"))}catch(e){}}
const totalLv=()=>S.dogs.reduce((a,d)=>a+d.lv,0);
const titleIdx=()=>{let r=0;TITLES.forEach((t,k)=>{if(S.dogs.length>=t.dogs&&totalLv()>=t.lv)r=k});return r};
const ownerLv=(x=S.xp)=>Math.floor(Math.sqrt(x/25))+1;
/* ===== 音效／動畫 ===== */
let AC=null;
function bark(pitch){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==="suspended")AC.resume();const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain(),f=AC.createBiquadFilter();o.type="sawtooth";f.type="bandpass";f.frequency.value=900;f.Q.value=1.2;const p=pitch||1;o.frequency.setValueAtTime(420*p,t);o.frequency.exponentialRampToValueAtTime(190*p,t+.16);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.5,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+.2);o.connect(f);f.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+.22)}catch(e){}}
function confetti(emoji,n){for(let k=0;k<(n||26);k++){const e=document.createElement("div");e.className="dk-cf";e.textContent=emoji[k%emoji.length];e.style.left=Math.random()*100+"vw";e.style.animationDelay=Math.random()*.6+"s";e.style.fontSize=(18+Math.random()*16)+"px";document.body.appendChild(e);setTimeout(()=>e.remove(),3400)}}
function celebrate(title,sub,dog){const e=document.createElement("div");e.className="dk-cel";e.innerHTML=(dog?`<div class="dk-celdog">${svg(dog,96,true)}</div>`:"")+`<div class="dk-celt">${esc(title)}</div><div class="dk-cels">${esc(sub||"")}</div>`;document.body.appendChild(e);confetti(["🦴","🐾","🍖","⭐","✨"]);bark(1.1);setTimeout(()=>e.remove(),3200)}
function fly(txt){const e=document.createElement("div");e.className="dk-fly";e.textContent=txt;document.body.appendChild(e);setTimeout(()=>e.remove(),1300);document.querySelectorAll(".dk-bn").forEach(b=>{b.classList.remove("pulse");void b.offsetWidth;b.classList.add("pulse")})}
/* ===== 狗的 SVG ===== */
function lighten(c,a){return c}
function svg(d,px,wag){const b=BREEDS[d.breed%BREEDS.length].id,rk=rankOf(d.lv),sc=Math.min(1.05,Math.max(.7,BREEDS[d.breed%BREEDS.length].size*.85+d.lv*.006)),F="#24252b",F2="#33353d",ST="#5b6070";
 const tan="#b07a3a";let ears="",tail="",face="",extra="";
 if(b==="lab"){ears=`<ellipse cx="29" cy="44" rx="7" ry="13" transform="rotate(14 29 44)" fill="${F2}" stroke="${ST}"/><ellipse cx="71" cy="44" rx="7" ry="13" transform="rotate(-14 71 44)" fill="${F2}" stroke="${ST}"/>`;tail=`<path class="tail" d="M70 76 Q92 70 90 52" stroke="${F}" stroke-width="8" fill="none" stroke-linecap="round"/>`}
 else if(b==="shiba"){ears=`<path d="M31 34 L33 12 L47 27Z" fill="${F}" stroke="${ST}"/><path d="M69 34 L67 12 L53 27Z" fill="${F}" stroke="${ST}"/><path d="M34 29 L35 19 L42 27Z" fill="#8a5a5a" opacity=".7"/><path d="M66 29 L65 19 L58 27Z" fill="#8a5a5a" opacity=".7"/>`;tail=`<path class="tail" d="M70 78 Q96 78 88 56 Q82 50 78 58" stroke="${F}" stroke-width="9" fill="none" stroke-linecap="round"/>`;face=`<path d="M40 40 q3-4 6 0 M54 40 q3-4 6 0" stroke="#d8c39a" stroke-width="1.6" fill="none"/>`}
 else if(b==="mix"){ears=`<path d="M32 34 L34 12 L47 27Z" fill="${F}" stroke="${ST}"/><path d="M70 28 Q84 34 76 54 Q66 48 64 30Z" fill="${F2}" stroke="${ST}"/>`;tail=`<path class="tail" d="M70 76 Q88 76 92 60" stroke="${F}" stroke-width="7" fill="none" stroke-linecap="round"/>`;extra=`<circle cx="60" cy="33" r="4.5" fill="#6b6e78" opacity=".55"/>`}
 else if(b==="dobe"){ears=`<path d="M32 36 L30 6 L47 26Z" fill="${F}" stroke="${ST}"/><path d="M68 36 L70 6 L53 26Z" fill="${F}" stroke="${ST}"/>`;tail=`<path class="tail" d="M70 80 L88 70" stroke="${F}" stroke-width="5" fill="none" stroke-linecap="round"/>`;face=`<ellipse cx="41" cy="35" rx="3" ry="2" fill="${tan}"/><ellipse cx="59" cy="35" rx="3" ry="2" fill="${tan}"/><ellipse cx="50" cy="52" rx="9" ry="7" fill="${tan}" opacity=".85"/><path d="M40 70 L50 86 L60 70Z" fill="${tan}" opacity=".7"/>`}
 else if(b==="poodle"){ears=`<circle cx="28" cy="48" r="11" fill="${F2}" stroke="${ST}"/><circle cx="72" cy="48" r="11" fill="${F2}" stroke="${ST}"/><circle cx="50" cy="22" r="11" fill="${F2}" stroke="${ST}"/><circle cx="42" cy="26" r="7" fill="${F2}"/><circle cx="58" cy="26" r="7" fill="${F2}"/>`;tail=`<g class="tail"><path d="M70 80 Q84 78 86 64" stroke="${F}" stroke-width="4" fill="none"/><circle cx="87" cy="60" r="8" fill="${F2}" stroke="${ST}"/></g>`}
 else{ears=`<path d="M30 40 Q24 14 40 20 Q42 34 40 40Z" fill="${F2}" stroke="${ST}"/><path d="M70 40 Q76 14 60 20 Q58 34 60 40Z" fill="${F2}" stroke="${ST}"/><path d="M32 34 Q31 22 38 25" stroke="#8a5a5a" fill="none" opacity=".7"/>`;tail=`<path class="tail" d="M72 82 Q82 80 82 74" stroke="${F}" stroke-width="6" fill="none" stroke-linecap="round"/>`;face=`<path d="M42 56 Q50 62 58 56" stroke="#6b6e78" fill="none" opacity=".6"/>`}
 const head=b==="shiba"?`<ellipse cx="50" cy="42" rx="22" ry="19" fill="${F}" stroke="${ST}"/>`:b==="frenchie"?`<ellipse cx="50" cy="43" rx="21" ry="18" fill="${F}" stroke="${ST}"/>`:`<circle cx="50" cy="42" r="19" fill="${F}" stroke="${ST}"/>`;
 const muz=(b==="dobe"||b==="frenchie")?"":`<ellipse cx="50" cy="51" rx="10" ry="7.5" fill="${F2}"/>`;
 const cape=rk>=3?`<path d="M30 58 Q18 86 26 98 L74 98 Q82 86 70 58Z" fill="${rk>=4?"#7c3aed":"#b91c1c"}" opacity=".95"/>`:"";
 const halo=rk>=4?`<ellipse cx="50" cy="8" rx="13" ry="3.6" fill="none" stroke="#facc15" stroke-width="2.4"/><path d="M14 18 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z M86 24 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5z" fill="#facc15" opacity=".9"/>`:"";
 const helm=rk===3?`<path d="M31 30 Q50 6 69 30 L66 32 Q50 20 34 32Z" fill="#9aa4b5" stroke="#5b6070"/><rect x="48" y="12" width="4" height="10" fill="#cbd5e1"/>`:"";
 let acc="";const a=d.acc;
 if(a==="bandana")acc=`<path d="M33 60 L67 60 L50 82Z" fill="${d.collar}" stroke="rgba(0,0,0,.35)"/><circle cx="46" cy="66" r="1.5" fill="#fff"/><circle cx="54" cy="66" r="1.5" fill="#fff"/><circle cx="50" cy="73" r="1.5" fill="#fff"/>`;
 else if(a==="bow")acc=`<path d="M60 22 L72 16 L72 30Z M60 22 L48 16 L48 30Z" fill="${d.collar}" stroke="rgba(0,0,0,.3)"/><circle cx="60" cy="22" r="3" fill="${d.collar}" stroke="rgba(0,0,0,.3)"/>`;
 else if(a==="glasses")acc=`<circle cx="41" cy="40" r="6.5" fill="rgba(180,220,255,.25)" stroke="#e5e7eb" stroke-width="1.8"/><circle cx="59" cy="40" r="6.5" fill="rgba(180,220,255,.25)" stroke="#e5e7eb" stroke-width="1.8"/><path d="M47.5 40 h5" stroke="#e5e7eb" stroke-width="1.8"/>`;
 else if(a==="tophat")acc=`<rect x="36" y="9" width="28" height="18" rx="2" fill="#111" stroke="#5b6070"/><rect x="29" y="25" width="42" height="5" rx="2" fill="#111" stroke="#5b6070"/><rect x="36" y="20" width="28" height="4" fill="${d.collar}"/>`;
 else if(a==="partyhat")acc=`<path d="M50 3 L38 28 L62 28Z" fill="${d.collar}" stroke="rgba(0,0,0,.3)"/><circle cx="50" cy="3" r="3" fill="#facc15"/><path d="M43 20 h14 M46 12 h8" stroke="#fff" stroke-width="2" opacity=".8"/>`;
 else if(a==="medal")acc=`<path d="M44 62 L50 74 L56 62Z" fill="#ef4444"/><circle cx="50" cy="78" r="5" fill="#facc15" stroke="#b45309"/>`;
 else if(a==="scarf")acc=`<rect x="31" y="58" width="38" height="8" rx="4" fill="${d.collar}" stroke="rgba(0,0,0,.3)"/><rect x="58" y="62" width="8" height="18" rx="3" fill="${d.collar}" stroke="rgba(0,0,0,.3)"/>`;
 const collar=a==="bandana"||a==="scarf"?"":`<path d="M33 59 Q50 69 67 59" stroke="${d.collar}" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="50" cy="66" r="3.2" fill="#facc15" stroke="#b45309" stroke-width=".8"/>`;
 return `<svg viewBox="0 0 100 100" width="${px}" height="${px}" class="dg${wag?" wag":""}" role="img" aria-label="${esc(d.name)}"><g transform="translate(50 98) scale(${sc.toFixed(3)}) translate(-50 -98)">
 ${cape}${tail}<ellipse cx="50" cy="78" rx="24" ry="20" fill="${F}" stroke="${ST}"/><ellipse cx="38" cy="94" rx="8" ry="5" fill="${F2}" stroke="${ST}"/><ellipse cx="62" cy="94" rx="8" ry="5" fill="${F2}" stroke="${ST}"/>
 ${collar}${acc&&(a==="bandana"||a==="scarf"||a==="medal")?acc:""}
 ${ears}${head}${muz}${face}${extra}
 <circle cx="41" cy="40" r="3.8" fill="#fff"/><circle cx="59" cy="40" r="3.8" fill="#fff"/><circle cx="41.5" cy="40.5" r="2.3" fill="#111"/><circle cx="59.5" cy="40.5" r="2.3" fill="#111"/><circle cx="42.4" cy="39.4" r=".9" fill="#fff"/><circle cx="60.4" cy="39.4" r=".9" fill="#fff"/>
 <ellipse cx="50" cy="48.5" rx="4.4" ry="3.2" fill="#0b0b0e" stroke="#6b7080" stroke-width=".6"/><ellipse cx="48.6" cy="47.5" rx="1.3" ry=".8" fill="#9aa0b0"/>
 <path d="M50 52 v3 M44 56 Q50 61 56 56" stroke="#9aa0b0" stroke-width="1.2" fill="none" stroke-linecap="round"/><path d="M47 57.5 Q50 64 53 57.5Z" fill="#f472b6"/>
 ${a==="glasses"||a==="bow"||a==="tophat"||a==="partyhat"?acc:""}${helm}${halo}</g></svg>`}
/* ===== 事件→獎勵 ===== */
function gain(b,x,meat){S.bones+=b;S.tb+=b;S.xp+=x;S.meat+=meat||0;const before=ownerLv(S.xp-x);if(ownerLv()>before)celebrate("主人升級！Lv"+ownerLv(),"累積 XP "+S.xp)}
function checkAch(){const got=[];const g=k=>{if(!S.ach[k]){S.ach[k]=today();got.push(k)}};if(S.dogs.length>=3)g("adopt3");if(S.dogs.length>=5)g("adopt5");if(S.streak.n>=3)g("streak3");if(S.streak.n>=7)g("streak7");if(S.dogs.some(d=>d.lv>=10))g("lv10");if(S.dogs.some(d=>d.lv>=20))g("lv20");if(S.tb>=100)g("bones100");if(S.fed>=20)g("feed20");if(titleIdx()>=6)g("king");return got}
function announce(got){got.forEach(k=>{const a=ACH.find(x=>x[0]===k);if(a)setTimeout(()=>celebrate("獲得徽章 "+a[1],a[2]+"："+a[3]),400)})}
function streakTick(){const t=today();if(S.streak.last===t)return;const was=S.streak.last===yday();S.streak.n=was?S.streak.n+1:1;S.streak.last=t;const bonus=Math.min(20,S.streak.n*2);S.bones+=bonus;S.tb+=bonus;setTimeout(()=>{fly("🔥 連續 "+S.streak.n+" 天 +"+bonus+"🦴")},500)}
let lastTitle=-1;
function onRwx(ev){const e=ev.detail||{};if(!e.ev)return;const ti0=titleIdx();streakTick();let b=0,x=0,m=0,msg="";
 if(e.ev==="hear"||e.ev==="speak"){b=e.isNew?2:1;x=e.isNew?3:1}
 else if(e.ev==="quiz"){if(e.ok){b=e.isNew?2:1;x=e.isNew?3:2}else x=1}
 else if(e.ev==="round"){b=Math.floor((e.score||0)/2);x=e.score||0;if(e.score===e.total&&e.total>=10&&!S.ach.first_perfect){S.ach.first_perfect=today();setTimeout(()=>celebrate("獲得徽章 💯","初次滿分！"),300)}}
 else if(e.ev==="crown"){m=1;x=20;if(e.t==="story"&&!S.ach.story){S.ach.story=today()}setTimeout(()=>{celebrate("🍖 完成一項練習！","獲得肉塊 +1，可以到狗舍大方餵狗");},700)}
 else if(e.ev==="king"){m=3;x=60;if(!S.ach.all)S.ach.all=today();setTimeout(()=>celebrate("👑 本課全部完成！","肉塊 +3"),1500)}
 gain(b,x,m);if(b||x)fly((b?"+"+b+"🦴 ":"")+(x?"+"+x+"XP":"")+(m?" +"+m+"🍖":""));
 announce(checkAch());const ti1=titleIdx();save();if(ti1>ti0)setTimeout(()=>celebrate("稱號晉升：「"+TITLES[ti1].n+"」"+TITLES[ti1].e,"狗 "+S.dogs.length+" 隻・總等級 "+totalLv()),900)}
window.addEventListener("rwx",onRwx);
/* ===== 餵食／領養 ===== */
function addDogXp(d,n){d.xp+=n;let up=0;while(d.lv<MAXLV&&d.xp>=lvNeed(d.lv)){d.xp-=lvNeed(d.lv);d.lv++;up++}if(d.lv>=MAXLV)d.xp=0;return up}
function feed(id,kind,times){const d=S.dogs.find(x=>x.id===id);if(!d)return false;times=times||1;const r0=rankOf(d.lv),ti0=titleIdx();let up=0;
 if(kind==="meat"){if(S.meat<1)return false;S.meat--;up=addDogXp(d,40);d.aff=Math.min(100,d.aff+10);S.fed+=2}
 else{if(S.bones<times)return false;S.bones-=times;up=addDogXp(d,5*times);d.aff=Math.min(100,d.aff+2*times);S.fed+=times}
 bark(1.2);const got=checkAch();save();
 if(up){const r1=rankOf(d.lv);celebrate(d.name+" 升到 Lv"+d.lv+"！",r1>r0?"晉升階級：「"+RANKS[r1][1]+"」":RANKS[rankOf(d.lv)][1]);}
 announce(got);const ti1=titleIdx();if(ti1>ti0)setTimeout(()=>celebrate("稱號晉升：「"+TITLES[ti1].n+"」"+TITLES[ti1].e,""),900);return true}
function cand(){if(!S.cand){S.cand=mkDog(S.nid)}return S.cand}
function adopt(name){const k=S.dogs.length,c=adoptCost(k);if(S.bones<c.b||S.xp<c.x||k>=24)return false;const d=cand();S.bones-=c.b;name=(name||"").trim().slice(0,8);if(name&&name!==d.name){d.name=name;d.kana=""}S.dogs.push(d);S.nid++;S.cand=null;const ti0=titleIdx();const got=checkAch();save();celebrate("領養了新夥伴 "+d.name+"！",BREEDS[d.breed].n+"・"+d.trait,d);announce(got);const ti1=titleIdx();if(ti1>ti0)setTimeout(()=>celebrate("稱號晉升：「"+TITLES[ti1].n+"」"+TITLES[ti1].e,""),1500);return true}
function pet(id){bark(.8+Math.random()*.5);const d=S.dogs.find(x=>x.id===id);if(!d)return;const now=Date.now();if(!pet.t||now-pet.t>3000){pet.t=now;d.aff=Math.min(100,d.aff+1);save(true)}}
/* ===== 畫面 ===== */
const css=document.createElement("style");css.textContent=`
.dg{display:block;overflow:visible}.dg .tail{transform-box:fill-box;transform-origin:0% 100%;animation:dgw 2.4s ease-in-out infinite}.dg.wag .tail,.dkt.wagging .dg .tail{animation:dgw .18s ease-in-out infinite}
@keyframes dgw{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(12deg)}}
@media(prefers-reduced-motion:reduce){.dg .tail{animation:none!important}}
.dk-card{display:block;background:var(--cd);border:1px solid var(--ln);border-radius:16px;padding:16px;margin-bottom:14px;color:inherit;text-decoration:none}
.dk-top{display:flex;align-items:center;gap:10px;justify-content:space-between}.dk-ti{font-size:20px;font-weight:800}.dk-sub{color:var(--mu);font-size:14px;margin-top:2px}
.dk-bar{height:10px;background:var(--ln);border-radius:6px;overflow:hidden;margin:8px 0 4px}.dk-bar i{display:block;height:100%;background:linear-gradient(90deg,#f59e0b,#fb7185);border-radius:6px}
.dk-row{display:flex;gap:6px;overflow-x:auto;padding:6px 0 2px;align-items:flex-end}.dk-row .dkt{flex:0 0 auto}
.dk-st{display:flex;gap:12px;flex-wrap:wrap;font-size:15px;font-weight:700;margin-top:4px}
.dk-mini{display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:var(--cd);border:1px solid var(--ln);border-radius:12px;padding:6px 10px;font-size:14px;font-weight:700;text-decoration:none;color:inherit}.dk-mini .dk-bar{flex:1;min-width:70px;margin:0}
.dk-bn.pulse{animation:dkp .6s ease}@keyframes dkp{50%{transform:scale(1.35)}}
.dk-fly{position:fixed;left:50%;bottom:110px;transform:translateX(-50%);z-index:97;font-size:20px;font-weight:800;background:var(--cd);border:2px solid #f59e0b;border-radius:22px;padding:4px 14px;pointer-events:none;animation:dkf 1.2s ease forwards;white-space:nowrap}
@keyframes dkf{0%{opacity:0;transform:translate(-50%,16px) scale(.6)}25%{opacity:1;transform:translate(-50%,0) scale(1.15)}100%{opacity:0;transform:translate(-50%,-70px)}}
.dk-cf{position:fixed;top:-30px;z-index:98;animation:dkc 2.6s linear forwards;pointer-events:none}@keyframes dkc{to{transform:translateY(108vh) rotate(540deg)}}
.dk-cel{position:fixed;left:50%;top:14%;transform:translate(-50%,-50%);z-index:99;background:var(--cd);border:3px solid #f59e0b;border-radius:20px;padding:16px 24px;text-align:center;pointer-events:none;animation:dkcel 3.1s ease forwards;box-shadow:0 10px 40px rgba(0,0,0,.35);max-width:86vw}
.dk-celt{font-size:20px;font-weight:800}.dk-cels{font-size:14px;color:var(--mu);margin-top:4px}.dk-celdog{display:flex;justify-content:center}
@keyframes dkcel{0%{opacity:0;transform:translate(-50%,-50%) scale(.5)}12%{opacity:1;transform:translate(-50%,-50%) scale(1.08)}20%{transform:translate(-50%,-50%) scale(1)}85%{opacity:1}100%{opacity:0;transform:translate(-50%,-60%)}}
.dkt{position:relative;text-align:center;cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent}.dkt .bub{position:absolute;top:-6px;left:50%;transform:translateX(-50%);background:#fff;color:#111;border:2px solid #111;border-radius:12px;padding:1px 8px;font-size:13px;font-weight:800;opacity:0;pointer-events:none;white-space:nowrap;z-index:2}.dkt.wagging .bub{animation:dkb 1s ease}
@keyframes dkb{0%{opacity:0;transform:translate(-50%,6px)}20%,70%{opacity:1;transform:translate(-50%,-8px)}100%{opacity:0;transform:translate(-50%,-14px)}}
.dkt.wagging .dg{animation:dkj .45s ease}@keyframes dkj{30%{transform:translateY(-8px)}60%{transform:translateY(0)}}
.dkg{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:10px}.dkc{background:var(--cd);border:1px solid var(--ln);border-radius:14px;padding:8px 4px 8px;display:flex;flex-direction:column;align-items:center;gap:2px}.dkc.sel{border-color:#f59e0b;box-shadow:0 0 0 2px #f59e0b inset}
.dkc .nm{font-weight:800;font-size:15px}.dkc .rk{font-size:12px;color:var(--mu)}.dkc .lvb{width:80%;height:6px;background:var(--ln);border-radius:4px;overflow:hidden}.dkc .lvb i{display:block;height:100%;background:#f59e0b}
.dk-sec{background:var(--cd);border:1px solid var(--ln);border-radius:14px;padding:14px;margin-bottom:12px;display:flex;flex-direction:column;gap:8px}.dk-sec h2{margin:0;font-size:18px;border:0;padding:0}
.dk-sec .b{flex:1 1 90px;padding:10px;font-size:15px}.dk-sec .b:disabled{opacity:.4}.dk-sec input[type=text],.dk-sec textarea{width:100%;padding:10px;font-size:16px;border-radius:10px;border:1px solid var(--ln);background:var(--bg);color:var(--fg)}
.dk-ach{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px}.dk-ach div{border:1px solid var(--ln);border-radius:10px;padding:8px;font-size:13px;text-align:center}.dk-ach .off{opacity:.35;filter:grayscale(1)}.dk-ach b{display:block;font-size:22px}
.dk-lad{font-size:14px;line-height:1.9}.dk-lad .cur{font-weight:800;color:#f59e0b}.hearts{letter-spacing:1px}`;document.head.appendChild(css);
function thumb(d,px){return `<div class="dkt" data-id="${d.id}">${svg(d,px)}</div>`}
function status(){const ti=titleIdx(),T=TITLES[ti],nx=TITLES[ti+1],ol=ownerLv(),lo=25*(ol-1)*(ol-1),hi=25*ol*ol;return {ti,T,nx,ol,pct:Math.round((S.xp-lo)/(hi-lo)*100),lo,hi}}
function wire(el){el.querySelectorAll(".dkt").forEach(t=>t.addEventListener("click",e=>{e.preventDefault();pet(+t.dataset.id);t.classList.remove("wagging");void t.offsetWidth;t.classList.add("wagging");if(!t.querySelector(".bub")){const bb=document.createElement("div");bb.className="bub";bb.textContent="ワン！";t.prepend(bb)}setTimeout(()=>t.classList.remove("wagging"),1000)}))}
function homeHTML(){const s=status();return `<div class="dk-card"><div class="dk-top"><div><div class="dk-ti">${s.T.e} ${s.T.n}</div><div class="dk-sub">主人 Lv${s.ol}・${S.dogs.length} 隻黑狗・總等級 ${totalLv()}</div></div><a href="kennel.html" class="go" style="margin:0;color:var(--ac);font-weight:700;text-decoration:none">🐕 狗舍 →</a></div>
 <div class="dk-st"><span class="dk-bn">🦴 ${S.bones}</span><span>🍖 ${S.meat}</span><span>🔥 ${S.streak.n} 天</span><span>🏅 ${Object.keys(S.ach).length}/${ACH.length}</span></div>
 <div class="dk-bar"><i style="width:${s.pct}%"></i></div><div class="dk-sub">XP ${S.xp}／${s.hi}　${s.nx?"下一稱號「"+s.nx.n+"」：狗 "+s.nx.dogs+" 隻＋總等級 "+s.nx.lv:"已是最高稱號！"}</div>
 <div class="dk-row">${S.dogs.slice(0,14).map(d=>thumb(d,46)).join("")}${S.dogs.length>14?`<span class="dk-sub">+${S.dogs.length-14}</span>`:""}</div></div>`}
function bindDogs(el,render){const h=()=>{if(document.body.contains(el))render();else window.removeEventListener("dogs",h)};window.addEventListener("dogs",h)}
const DOGS={svg,bark,celebrate,state:()=>S,
 home(el){const r=()=>{el.innerHTML=homeHTML();wire(el)};r();bindDogs(el,r)},
 bar(el){const r=()=>{const s=status();el.innerHTML=`<a class="dk-mini" href="kennel.html"><span>${s.T.e} ${s.T.n}</span><span class="dk-bn">🦴 ${S.bones}</span><span>🍖 ${S.meat}</span><span>🐕 ${S.dogs.length}</span><span>🔥 ${S.streak.n}</span><span class="dk-bar"><i style="width:${s.pct}%"></i></span><span style="font-size:12px;color:var(--mu)">XP ${S.xp}</span></a>`};r();bindDogs(el,r)},
 kennel(el){let sel=S.dogs[0].id,msg="";
  const r=()=>{const s=status(),d=S.dogs.find(x=>x.id===sel)||S.dogs[0];sel=d.id;const B=BREEDS[d.breed%BREEDS.length],rk=rankOf(d.lv),need=lvNeed(d.lv),k=S.dogs.length,c=adoptCost(k),cd=cand(),can=S.bones>=c.b&&S.xp>=c.x&&k<24;
   el.innerHTML=`<div class="dk-sec"><div class="dk-top"><div><div class="dk-ti">${s.T.e} ${s.T.n}</div><div class="dk-sub">主人 Lv${s.ol}・${k} 隻黑狗・總等級 ${totalLv()}</div></div></div><div class="dk-st"><span class="dk-bn">🦴 ${S.bones}</span><span>🍖 ${S.meat}</span><span>🔥 連續 ${S.streak.n} 天</span></div><div class="dk-bar"><i style="width:${s.pct}%"></i></div><div class="dk-sub">XP ${S.xp}／${s.hi}　${s.nx?"下一稱號「"+s.nx.n+"」需要：狗 "+s.nx.dogs+" 隻＋總等級 "+s.nx.lv:"已是最高稱號！"}</div></div>
   <div class="dk-sec"><h2>🏠 狗舍（點狗狗摸摸牠）</h2><div class="dkg">${S.dogs.map(x=>`<div class="dkc${x.id===sel?" sel":""}" data-sel="${x.id}">${thumb(x,84)}<div class="nm">${esc(x.name)}</div><div class="rk">Lv${x.lv}・${RANKS[rankOf(x.lv)][1]}</div><div class="lvb"><i style="width:${x.lv>=MAXLV?100:Math.round(x.xp/lvNeed(x.lv)*100)}%"></i></div></div>`).join("")}</div></div>
   <div class="dk-sec"><h2>🐶 ${esc(d.name)}${d.kana?`（${esc(d.kana)}）`:""}</h2><div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap"><div class="dkt" data-id="${d.id}" style="margin:0 auto">${svg(d,150)}</div><div style="flex:1;min-width:150px;font-size:15px;line-height:1.7"><div>品種：${B.n}</div><div>個性：${esc(d.trait)}</div><div>配件：${ACCN[d.acc]||"無"}</div><div>階級：<b>${RANKS[rk][1]}</b>　Lv${d.lv}${d.lv>=MAXLV?"（滿級）":""}</div><div>經驗：${d.lv>=MAXLV?"MAX":d.xp+"／"+need}</div><div>親密度：<span class="hearts">${"❤️".repeat(Math.floor(d.aff/20))}${"🤍".repeat(5-Math.floor(d.aff/20))}</span> ${d.aff}/100</div></div></div>
   <div class="row"><button class="b" id="f1" ${S.bones<1?"disabled":""}>餵 1 🦴</button><button class="b" id="f5" ${S.bones<5?"disabled":""}>餵 5 🦴</button><button class="b p" id="fm" ${S.meat<1?"disabled":""}>餵 🍖（+40）</button></div><div class="dk-sub">骨頭 +5 經驗；肉塊 +40 經驗。階級：小黑 Lv1 → 黑狗 Lv5 → 精英黑犬 Lv10 → 黑狗騎士 Lv15 → 黑狗守護神 Lv20（最高 Lv${MAXLV}）。</div>
   <div class="row"><input type="text" id="rn" maxlength="8" value="${esc(d.name)}" aria-label="狗狗名字" style="flex:2 1 120px"><button class="b" id="rnb">改名</button></div></div>
   <div class="dk-sec"><h2>➕ 領養新黑狗</h2>${k>=24?'<div class="dk-sub">狗舍已滿（24 隻）。</div>':`<div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap"><div class="dkt" data-id="${cd.id}">${svg(cd,110)}</div><div style="flex:1;min-width:150px;font-size:15px;line-height:1.7"><div>${B_n(cd)}・${esc(cd.trait)}</div><div>費用：<b>${c.b} 🦴</b>${c.x?`＋XP 需達 ${c.x}`:""}</div><div class="dk-sub">${can?"可以領養！":"還差 "+(S.bones<c.b?(c.b-S.bones)+" 🦴 ":"")+(S.xp<c.x?(c.x-S.xp)+" XP":"")}</div></div></div><input type="text" id="an" maxlength="8" value="${esc(cd.name)}" aria-label="新狗狗名字"><div class="row"><button class="b" id="ar">🔄 換一隻看看</button><button class="b p" id="ad" ${can?"":"disabled"}>領養！</button></div>`}</div>
   <div class="dk-sec"><h2>👑 主人稱號</h2><div class="dk-lad">${TITLES.map((t,j)=>`<div class="${j===s.ti?"cur":""}">${j<=s.ti?"✔":"・"} ${t.e} ${t.n}　（狗 ${t.dogs} 隻＋總等級 ${t.lv}）</div>`).join("")}</div></div>
   <div class="dk-sec"><h2>🏅 成就徽章（${Object.keys(S.ach).length}/${ACH.length}）</h2><div class="dk-ach">${ACH.map(a=>`<div class="${S.ach[a[0]]?"":"off"}"><b>${a[1]}</b>${a[2]}<br><span class="mu">${a[3]}</span></div>`).join("")}</div></div>
   <div class="dk-sec"><h2>💾 進度備份</h2><div class="dk-sub">匯出：複製下方文字保存。匯入：貼上文字再按「匯入」。</div><textarea id="ex" rows="4" aria-label="進度 JSON"></textarea><div class="row"><button class="b" id="eb">匯出進度</button><button class="b" id="ib">匯入進度</button><button class="b" id="rs" style="color:var(--bad)">重置全部</button></div><div class="dk-sub" id="exm">${esc(msg)}</div></div>`;
   wire(el);const q=id=>el.querySelector("#"+id);
   el.querySelectorAll("[data-sel]").forEach(c=>c.addEventListener("click",()=>{if(sel!==+c.dataset.sel){sel=+c.dataset.sel;setTimeout(r,0)}}));
   q("f1").onclick=()=>feed(d.id,"b",1);q("f5").onclick=()=>feed(d.id,"b",5);q("fm").onclick=()=>feed(d.id,"meat");
   q("rnb").onclick=()=>{const v=q("rn").value.trim().slice(0,8);if(v){d.name=v;d.kana="";save()}};
   if(q("ar"))q("ar").onclick=()=>{S.cand=null;save()};if(q("ad"))q("ad").onclick=()=>{adopt(q("an").value);sel=S.dogs[S.dogs.length-1].id;};
   q("eb").onclick=()=>{q("ex").value=JSON.stringify({dogs:S,rw:window.RW?RW.ld():{}});q("ex").select();msg="已匯出，請複製上面的文字。";q("exm").textContent=msg};
   q("ib").onclick=()=>{try{const o=JSON.parse(q("ex").value);const ds=o.dogs||o;if(!ds||!Array.isArray(ds.dogs)||!ds.dogs.length)throw 0;S=ds;if(o.rw&&window.RW)RW.sv(o.rw);save();msg="匯入成功！"}catch(e){msg="匯入失敗：格式不正確。";q("exm").textContent=msg}};
   q("rs").onclick=()=>{if(confirm("確定要重置全部進度（狗、骨頭、XP、練習紀錄）？這無法復原。")){S=fresh();if(window.RW)RW.sv({});save();msg="已重置。"}}};
  function B_n(d){return BREEDS[d.breed%BREEDS.length].n}
  r();bindDogs(el,()=>{const tx=el.querySelector("textarea");const keep=tx?tx.value:"";r();const t2=el.querySelector("#ex");if(t2&&keep)t2.value=keep})}};
window.DOGS=DOGS;
})();
