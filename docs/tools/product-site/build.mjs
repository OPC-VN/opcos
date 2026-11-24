import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { blogPosts, newsIssues } from './content.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../sites');
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const unique = (items, key) => new Set(items.map(item => item[key])).size === items.length;
if (!unique(blogPosts, 'slug') || !unique(newsIssues, 'id')) throw new Error('Duplicate content ID');
for (const p of blogPosts) {
 if (p.approved !== true || !p.title || !p.slug || !p.description || !p.topic || !p.body || !p.image || !/^[a-z0-9-]+$/.test(p.slug)) throw new Error('Blog chưa đủ dữ liệu hoặc chưa duyệt');
 if (!existsSync(resolve(root, 'blog', p.slug, 'thumbnail.webp'))) throw new Error('Thiếu ảnh thu nhỏ: '+p.slug);
 if (!existsSync(resolve(root, 'blog', p.slug, p.image))) throw new Error('Thiếu ảnh Blog: '+p.slug);
}
for (const n of newsIssues) {
 if (n.approved !== true || !/^[\w-]{11}$/.test(n.id) || !/^\d{4}-\d\d-\d\d$/.test(n.date) || !n.title || !n.description || !/^\d{4}-\d\d-\d\d$/.test(n.issueDate) || !n.issueTitle || !n.summary || !Number.isFinite(Date.parse(n.publishedAt))) throw new Error('Video chưa đủ dữ liệu hoặc chưa duyệt');
}
const render = (template, main) => template.replace(/<main id="main"[\s\S]*?<\/main>/, main).replace('<meta name="robots" content="noindex,follow">','');
const blogPath=resolve(root,'blog/index.html'), newsPath=resolve(root,'news/index.html');
const blogTemplate=readFileSync(blogPath,'utf8'), newsTemplate=readFileSync(newsPath,'utf8');
const ordered=[...blogPosts].sort((a,b)=>(b.date||'').localeCompare(a.date||'') || a.title.localeCompare(b.title,'vi'));
const topicNames = {'ai-concepts':'Kiến thức AI','ai-workflows':'Ứng dụng AI','opc-community':'Cộng đồng OPC','opc-mindset':'Tư duy OPC'};
const label = t => topicNames[t] || t;
const options=[...new Set(ordered.map(p=>p.topic))].sort().map(t=>`<option value="${escape(t)}">${escape(label(t))}</option>`).join('');
const cards=ordered.map(p=>`<article class="blog-tile blog-entry" data-topic="${escape(p.topic)}" data-search="${escape((p.title+' '+p.description).toLocaleLowerCase('vi'))}"><a class="blog-tile-link" href="${p.slug}/"><span class="blog-tile-image"><img src="${p.slug}/thumbnail.webp" alt="" loading="lazy" width="1920" height="1080"></span><div class="blog-tile-body"><span class="blog-tile-tag">${escape(label(p.topic))}</span><h3>${escape(p.title)}</h3><span class="blog-tile-excerpt">${escape(p.description)}</span><span class="blog-tile-more">Đọc bài viết <span aria-hidden="true">↗</span></span></div></a></article>`).join('');
const blogMain=`<main id="main" class="wrap editorial-page" tabindex="-1"><div class="intro editorial-intro"><p class="eyebrow">OPCOS / BLOG</p><h1>Ý tưởng hay, việc thật.</h1><p class="lede">Những góc nhìn và kinh nghiệm thực hành giúp bạn làm việc cùng AI mỗi ngày.</p></div><section class="block" aria-labelledby="blog-latest"><div class="editorial-section-head"><div><p class="eyebrow">THƯ VIỆN BÀI VIẾT</p><h2 id="blog-latest">Khám phá Blog</h2></div><span class="editorial-count" id="blog-count" aria-live="polite">${ordered.length} bài viết</span></div><div class="blog-controls"><label for="blog-search">Tìm bài viết <input id="blog-search" type="search" placeholder="Tìm theo nội dung"></label><label for="blog-topic">Chủ đề <select id="blog-topic"><option value="">Tất cả chủ đề</option>${options}</select></label></div><div class="blog-grid">${cards}</div><p id="blog-empty" hidden>Không tìm thấy bài viết.</p></section><script>const q=document.querySelector('#blog-search'),f=document.querySelector('#blog-topic'),items=[...document.querySelectorAll('.blog-entry')];function update(){let n=0;items.forEach(x=>{let ok=x.dataset.search.includes(q.value.toLocaleLowerCase('vi'))&&(!f.value||x.dataset.topic===f.value);x.hidden=!ok;if(ok)n++});document.querySelector('#blog-empty').hidden=n>0;document.querySelector('#blog-count').textContent=n+' bài viết'}function save(){update();const url=new URL(location.href);for(const [key,val] of [['q',q.value],['topic',f.value]]) val?url.searchParams.set(key,val):url.searchParams.delete(key);history.replaceState(null,'',url)}const params=new URLSearchParams(location.search);q.value=params.get('q')||'';f.value=params.get('topic')||'';q.addEventListener('input',save);f.addEventListener('change',save);update()</script></main>`;
writeFileSync(blogPath,render(blogTemplate,blogMain));
for(const p of ordered){
 const folder=resolve(root,'blog',p.slug);mkdirSync(folder,{recursive:true});
 let template=blogTemplate.replaceAll('../assets/','../../assets/').replaceAll('../index.html','../../index.html').replaceAll('../features/','../../features/').replaceAll('../orbit/','../../orbit/').replaceAll('../plugins/','../../plugins/').replaceAll('../docs/','../../docs/').replaceAll('../install/','../../install/').replaceAll('../news/','../../news/').replaceAll('href="index.html"','href="../index.html"');
 const main=`<main id="main" class="wrap article-page" tabindex="-1"><a class="article-back" href="../index.html">← Tất cả bài viết</a><header class="article-header"><p class="eyebrow">BLOG / ${escape(label(p.topic))}</p><h1>${escape(p.title)}</h1><p class="lede">${escape(p.description)}</p></header><figure class="article-figure"><a href="${escape(p.image)}" aria-label="Mở ảnh minh họa: ${escape(p.title)}"><img src="${escape(p.image)}" alt="Infographic: ${escape(p.title)}" width="1920" height="1080"></a><figcaption>Ảnh minh họa · Bấm để xem kích thước đầy đủ</figcaption></figure><article class="article-prose">${p.body}</article><a class="article-back" href="../index.html">← Quay lại Blog</a></main>`;
 writeFileSync(resolve(folder,'index.html'),render(template,main).replace(/<title>.*?<\/title>/,`<title>${escape(p.title)} · OpcOS</title>`).replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="${escape(p.description)}">`));
}
const grouped = new Map();
for (const n of newsIssues) {
 const key=n.issueKey; if(!key) throw new Error('Thiếu liên kết số tin: '+n.id);
 const group=grouped.get(key)||[]; if(group.some(v=>v.kind===n.kind)) throw new Error('Trùng định dạng: '+key);
 group.push(n); grouped.set(key,group);
}
const issues=[...grouped.values()].map(items=>items.sort((a,b)=>(a.kind==='Video'?-1:1)-(b.kind==='Video'?-1:1))).sort((a,b)=>b[0].issueDate.localeCompare(a[0].issueDate) || Math.max(...b.map(v=>Date.parse(v.publishedAt)))-Math.max(...a.map(v=>Date.parse(v.publishedAt))));
const cleanTitle = n => n.title.replace(/^OPC News \| [^|]+\|\s*/, '').replace(/^⚡ 60 giây \|\s*/, '').replace(/\s*#Shorts$/, '');
const card=(items, featured=false)=>{
 const first=items[0]; const title=cleanTitle(first);
 const displayTitle=first.issueTitle || title;
 const buttons=items.map((v,i)=>`<button type="button" class="video-format" data-id="${v.id}" data-kind="${escape(v.kind)}" aria-pressed="${i===0}">${v.kind==='Video'?'Bản đầy đủ':'Short'}</button>`).join('');
 const links=items.map((v,i)=>`<a class="video-source" href="https://www.youtube.com/watch?v=${v.id}" ${i?'hidden':''}>Xem ${v.kind==='Video'?'bản đầy đủ':'Short'} trên YouTube <span aria-hidden="true">↗</span><span class="sr-only">: ${escape(cleanTitle(v))}</span></a>`).join('');
 const fallback=items.map(v=>`<a href="https://www.youtube.com/watch?v=${v.id}">${escape(v.kind)}: ${escape(cleanTitle(v))}</a>`).join(' · ');
 return `<article class="video-card${featured?' video-card-featured':''}" data-video-card><div class="video-stage${first.kind==='Short'?' is-short':''}"><button class="video-poster" type="button" data-video-play data-id="${first.id}" aria-label="Phát ${escape(displayTitle)}"><img src="https://i.ytimg.com/vi/${first.id}/hqdefault.jpg" alt="" loading="lazy" width="480" height="360"><span class="video-play-icon" aria-hidden="true">▶</span><span class="video-play-caption">Phát video</span></button></div><div class="video-card-body"><div class="video-meta"><span>OPC NEWS</span><time datetime="${first.issueDate || first.date}">${(first.issueDate || first.date).split('-').reverse().join('/')}</time></div><h3>${escape(displayTitle)}</h3><div class="video-formats" aria-label="Chọn định dạng video">${buttons}</div><details class="video-details"><summary> Xem chi tiết </summary><p>${escape(first.summary || first.description)}</p></details><div class="video-links">${links}<noscript>${fallback}</noscript></div></div></article>`;
};
const years=[...new Set(issues.slice(1).map(g=>g[0].date.slice(0,4)))];
const archive=years.map(year=>`<section class="news-year"><h3>${year}</h3><div class="news-grid">${issues.slice(1).filter(g=>g[0].date.startsWith(year)).map(g=>card(g)).join('')}</div></section>`).join('');
const newsMain=`<main id="main" class="wrap editorial-page" tabindex="-1"><div class="intro editorial-intro"><p class="eyebrow">OPCOS / NEWS</p><h1>Tin tức, nhìn từ việc thật.</h1><p class="lede">Khám phá những câu chuyện mới về AI và One-Person Company. Chọn bản đầy đủ hoặc Short để xem ngay.</p></div>${issues.length?`<section class="block" aria-labelledby="news-latest"><div class="editorial-section-head"><div><p class="eyebrow">MỚI NHẤT</p><h2 id="news-latest">Xem ngay</h2></div></div>${card(issues[0],true)}</section><section class="block" aria-labelledby="news-archive"><div class="editorial-section-head"><div><p class="eyebrow">KHÁM PHÁ THÊM</p><h2 id="news-archive">Kho bản tin</h2></div><span class="editorial-count">${issues.length-1} câu chuyện</span></div>${archive}</section>`:'<section class="block"><p>Chưa có bản tin được xuất bản.</p></section>'}<script defer src="../assets/news-video.js"></script></main>`;
writeFileSync(newsPath,render(newsTemplate,newsMain));
console.log(`Built ${ordered.length} blog posts and ${newsIssues.length} videos`);
