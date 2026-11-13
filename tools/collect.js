// node tools/collect.js lesson23 > /tmp/lesson23.json
// 輸出所有會被唸出來的字串 [{t:文字, v:聲音}]（在網站根目錄執行）
const fs=require("fs");global.window=global;
eval(fs.readFileSync("jp.js","utf8"));eval(fs.readFileSync(process.argv[2]+"-data.js","utf8"));
const L=window.LESSON,P=window.JP.P,N="ja-JP-NanamiNeural",K="ja-JP-KeitaNeural",M=new Map();
const add=(t,v)=>{if(t&&typeof t==="string"&&!M.has(t))M.set(t,v||N)};
[...L.vocab,...(L.related||[])].forEach(c=>{add(c.say||P(c.w));add(P(c.ex))});
L.notes.forEach(n=>n.lines.forEach(l=>add(P(l.ja))));
L.grammar.forEach(g=>g.ex.forEach(l=>add(P(l.ja))));
L.sentences.forEach(s=>{add(P(s.ja));if(s.re)add(P(s.re),K)});
const vo={};L.dialogue.roles.forEach(r=>vo[r.n]=r.voice);
L.dialogue.lines.forEach(l=>add(P(l.ja),vo[l.r]));
L.particle.items.forEach(x=>add(P(x.q.replace("＿",x.ans))));
L.tvi.forEach(x=>add(x.say||P(x.q.replace("＿",x.ans))));
const pt=L.pattern;pt.choice.forEach(x=>add(P(x.q.replace("＿",x.ans))));pt.judge.forEach(x=>add(P(x.s)));pt.reorder.forEach(x=>add(P(x.chunks.join(""))));
console.log(JSON.stringify([...M].map(([t,v])=>({t,v}))));
