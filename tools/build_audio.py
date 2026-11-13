# python3 tools/build_audio.py lesson23   （在網站根目錄執行；需先 node tools/collect.js lesson23 > /tmp/lesson23.json）
# 用 /workspace/venv-tts/bin/python 執行（需要 edge_tts、ffmpeg）。已存在的 mp3 會跳過，可重複執行補檔。
import asyncio,hashlib,json,os,subprocess,sys,edge_tts
wk=sys.argv[1];items=json.load(open(f"/tmp/{wk}.json"));RATE="-8%"
os.makedirs(f"{wk}-audio",exist_ok=True)
def fn(it):return f"{wk}-audio/ja_"+hashlib.sha1((it["v"]+"|"+it["t"]).encode()).hexdigest()[:16]+".mp3"
fails=[]
async def one(it,sem):
    out=fn(it)
    if os.path.exists(out):return
    async with sem:
        for n in range(4):
            try:
                await asyncio.wait_for(edge_tts.Communicate(it["t"],it["v"],rate=RATE).save(out+".raw"),30);break
            except (Exception,asyncio.TimeoutError) as e:
                if n==3:fails.append(it["t"]);print("FAIL",it["t"],e);return
                await asyncio.sleep(2)
    subprocess.run(["ffmpeg","-y","-loglevel","error","-i",out+".raw","-ac","1","-ar","24000","-b:a","64k",out],check=True);os.remove(out+".raw")
async def main():
    sem=asyncio.Semaphore(4);await asyncio.gather(*[one(it,sem) for it in items])
asyncio.run(main())
ok=[it for it in items if os.path.exists(fn(it))]
with open(f"{wk}-audio.js","w") as f:
    f.write("window.UNIT_C=window.UNIT_C||{};\nObject.assign(window.UNIT_C,{\n"+",\n".join(f"  {json.dumps(it['t'],ensure_ascii=False)}: {json.dumps(fn(it))}" for it in ok)+"\n});\n")
print(len(ok),"/",len(items),"fails:",len(fails))
