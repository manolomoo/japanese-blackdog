/* 日文標記工具：資料中用 {漢字|かな} 標記讀音。
   R(s)=轉成 <ruby> HTML　P(s)=純文字（給語音用，去掉標記）　K(s)=全假名（把 {漢字|かな} 換成 かな） */
(function(){
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const RE=/\{([^|{}]+)\|([^{}]+)\}/g;
window.JP={
 esc,
 R:s=>esc(s).replace(RE,"<ruby>$1<rt>$2</rt></ruby>"),
 P:s=>String(s).replace(RE,"$1").replace(/\s+/g," ").trim(),
 K:s=>String(s).replace(RE,"$2").replace(/\s+/g," ").trim()
};
})();
