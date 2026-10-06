import { XMLParser, XMLValidator } from 'fast-xml-parser';
import sources from '../../config/sources.json' with {type:'json'};
import statuses from '../../config/source-status.json' with {type:'json'};
import seed from '../../config/seed.json' with {type:'json'};
import page from '../../web/index.html';

const parser=new XMLParser({ignoreAttributes:false,attributeNamePrefix:'@_',processEntities:true,trimValues:true});
const array=x=>!x?[]:Array.isArray(x)?x:[x];
const scalar=x=>typeof x==='object'?(x?.['#text']??''):String(x??'');
export function plain(x){return scalar(x).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<[^>]*>/g,' ').replace(/&(?:nbsp|amp|lt|gt|quot|apos);/g,x=>({'&nbsp;':' ','&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'"}[x])).replace(/\s+/g,' ').trim();}
export function safeUrl(s){try{const u=new URL(s);return u.protocol==='https:'?u.href:null;}catch{return null;}}
export function classify(title,url=''){
 const t=(title+' '+url).toLowerCase();
 if(/\bbag\b|\bbags\b|clubglider|backpack|divider/.test(t))return 'bags';
 if(/participation|demographic|rounds played|market research|industry facts/.test(t))return 'market';
 if(/usga|randa|equipment rules|equipment standards|rollback/.test(t))return 'rules';
 if(/walking|women|outfit|beginner|travel|par.?3|driving range/.test(t))return 'consumer';
 if(/acquir|merger|retail|ecommerce|partnership|youtube/.test(t))return 'industry';
 return 'equipment';
}
export function priority(title,url=''){
 const t=(title+' '+url).toLowerCase();
 if(/betting|odds:|tv schedule|tee times|hole.in.one|wins? |victory|heartbreak|shocking|fedexcup season/.test(t))return 0;
 if(/save \$|deals?|sale|discount|best .* of|buyer's guide|outfit/.test(t))return 1;
 if(/bag|clubglider|divider|participation|industry facts|rounds played/.test(t))return 3;
 return 2;
}
export function normalizeFeed(xml,source){
 if(XMLValidator.validate(xml)!==true)throw new Error('订阅源不是有效 XML');
 const doc=parser.parse(xml);const rss=doc.rss?.channel,atom=doc.feed;
 if(!rss&&!atom)throw new Error('无法识别 RSS / Atom');
 return array(rss?.item??atom?.entry).slice(0,40).flatMap(i=>{
  const link=atom?array(i.link).find(l=>!l['@_rel']||l['@_rel']==='alternate')?.['@_href']:scalar(i.link);
  const url=safeUrl(link),title=plain(i.title);if(!url||!title)return [];
  const dt=scalar(i.pubDate??i.published??i.updated),d=new Date(dt),rank=priority(title,url);if(!rank)return [];
  return [{url,title,titleZh:null,excerpt:plain(i.description??i.summary??i.content??i['content:encoded']).slice(0,160),publishedAt:Number.isFinite(+d)?d.toISOString():null,observedAt:new Date().toISOString(),sourceId:source.id,sourceName:source.name,tier:source.tier,category:classify(title,url),priority:rank,kind:'rss',provenance:'feed',businessImplication:null}];
 });
}

const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'};
const json=(x,status=200)=>new Response(JSON.stringify(x),{status,headers});
async function readPublication(db){
 const [a,r,m]=await Promise.all([db.prepare('SELECT payload FROM radar_articles').all(),db.prepare('SELECT payload FROM radar_feed_runs').all(),db.prepare('SELECT value FROM radar_meta WHERE key = ?').bind('last_refresh').first()]);
 const byUrl=new Map(seed.map(i=>[i.url,i]));for(const row of a.results){const incoming=JSON.parse(row.payload),old=byUrl.get(incoming.url);byUrl.set(incoming.url,{...old,...incoming,titleZh:old?.titleZh??incoming.titleZh,businessImplication:old?.businessImplication??incoming.businessImplication});}
 return {items:[...byUrl.values()].sort((a,b)=>b.priority-a.priority||String(b.publishedAt??'').localeCompare(a.publishedAt??'')),runs:r.results.map(x=>JSON.parse(x.payload)),lastRefresh:m?.value??null};
}
async function refresh(db){
 const now=Date.now();
 const lock=await db.prepare('INSERT INTO radar_meta (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value WHERE CAST(radar_meta.value AS INTEGER) < ? RETURNING value').bind('refresh_lock',String(now+120000),now).first();
 if(!lock)return {busy:true};
 try{
  const runs=await Promise.all(sources.sources.map(async source=>{
   let count=0,status='ok',error=null;
   try{
    const res=await fetch(source.config.feedUrl,{headers:{'User-Agent':'GolfRadar/0.1 (RSS reader)','Accept':'application/rss+xml,application/atom+xml,application/xml'},signal:AbortSignal.timeout(15000),redirect:'error'});
    if(!res.ok)throw new Error('HTTP '+res.status);
    const len=Number(res.headers.get('content-length'));if(len>2000000)throw new Error('订阅内容过大');
    const xml=await res.text();if(xml.length>2000000)throw new Error('订阅内容过大');
    const items=normalizeFeed(xml,source);count=items.length;
    if(!count){status='empty';error='有效订阅暂无符合规则的条目';}
    for(let n=0;n<items.length;n+=20)await db.batch(items.slice(n,n+20).map(i=>db.prepare('INSERT INTO radar_articles (url,payload) VALUES (?,?) ON CONFLICT(url) DO UPDATE SET payload=excluded.payload').bind(i.url,JSON.stringify(i))));
   }catch(e){status='error';error=String(e.message??e).slice(0,150);}
   const run={id:source.id,name:source.name,status,error,count,checkedAt:new Date().toISOString()};
   await db.prepare('INSERT INTO radar_feed_runs (id,payload) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload').bind(run.id,JSON.stringify(run)).run();return run;
  }));
  await db.prepare('INSERT INTO radar_meta (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind('last_refresh',new Date().toISOString()).run();
  return {busy:false,runs};
 }finally{await db.prepare('UPDATE radar_meta SET value=? WHERE key=?').bind(String(Date.now()+60000),'refresh_lock').run();}
}
const xmlEscape=s=>String(s??'').replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
export default {
 async fetch(req,env){
  const u=new URL(req.url);
  if(req.method==='GET'&&u.pathname==='/')return new Response(page,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','content-security-policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'self'; base-uri 'none'; object-src 'none'"}});
  if(req.method==='GET'&&u.pathname==='/api/health')return json({ok:true,name:'Golf Radar',version:'0.1',modelCalls:false,scheduledCollection:false,db:!!env.DB,redditEnabled:false,sorftimeConnected:false});
  if(!env.DB)return json({error:'内容库暂时不可用，请稍后重试。'},503);
  try{
   if(req.method==='POST'&&u.pathname==='/api/refresh'){
    if(req.headers.get('origin')!==u.origin)return json({error:'请求来源不匹配'},403);
    const out=await refresh(env.DB);return json(out,out.busy?429:200);
   }
   if(req.method==='GET'&&u.pathname==='/api/sources'){
    const pub=await readPublication(env.DB);return json({active:sources.sources,verification:statuses,runs:pub.runs,lastRefresh:pub.lastRefresh});
   }
   if(req.method==='GET'&&['/api/items','/api/v1/items','/feed.xml'].includes(u.pathname)){
    const pub=await readPublication(env.DB);let items=pub.items;
    const q=(u.searchParams.get('q')??'').toLowerCase(),cat=u.searchParams.get('category');
    if(cat)items=items.filter(x=>x.category===cat);
    if(q)items=items.filter(x=>(x.title+' '+x.titleZh+' '+x.excerpt+' '+x.sourceName).toLowerCase().includes(q));
    if(u.pathname==='/feed.xml')return new Response('<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Golf Radar</title><link>'+xmlEscape(u.origin)+'</link><description>高尔夫装备与产业情报索引</description>'+items.slice(0,30).map(i=>'<item><title>'+xmlEscape(i.titleZh??i.title)+'</title><link>'+xmlEscape(i.url)+'</link><guid>'+xmlEscape(i.url)+'</guid><description>'+xmlEscape(i.excerpt)+'</description>'+(i.publishedAt?'<pubDate>'+new Date(i.publishedAt).toUTCString()+'</pubDate>':'')+'</item>').join('')+'</channel></rss>',{headers:{'content-type':'application/rss+xml; charset=utf-8'}});
    return json({...pub,items,meta:{ranking:'规则相关性优先级，非 AI 评分',modelEnabled:false,scheduleEnabled:false,initialImportedAt:null,redditEnabled:false,sorftimeConnected:false}});
   }
   return json({error:'未找到此页面'},404);
  }catch(e){console.error('Golf Radar request failed',e.message);return json({error:'内容库读取失败，请稍后重试。'},503);}
 }
};
