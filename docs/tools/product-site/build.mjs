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
 if (!existsSync(resolve(root, 'blog', p.slug, p.image))) throw new Error('Thiếu ảnh Blog: '+p.slug);
}
for (const n of newsIssues) {
 if (n.approved !== true || !/^[\w-]{11}$/.test(n.id) || !/^\d{4}-\d\d-\d\d$/.test(n.date) || !n.title || !n.description || !Number.isFinite(Date.parse(n.publishedAt))) throw new Error('Video chưa đủ dữ liệu hoặc chưa duyệt');
}
const render = (template, main) => template.replace(/<main id="main"[\s\S]*?<\/main>/, main).replace('<meta name="robots" content="noindex,follow">','');
const blogPath=resolve(root,'blog/index.html'), newsPath=resolve(root,'news/index.html');
const blogTemplate=readFileSync(blogPath,'utf8'), newsTemplate=readFileSync(newsPath,'utf8');
const ordered=[...blogPosts].sort((a,b)=>(b.date||'').localeCompare(a.date||'') || a.title.localeCompare(b.title,'vi'));
const options=[...new Set(ordered.map(p=>p.topic))].sort().map(t=>`<option value="${escape(t)}">${escape(t)}</option>`).join('');
const cards=ordered.map(p=>`<article class="card blog-entry" data-topic="${escape(p.topic)}" data-search="${escape((p.title+' '+p.description).toLocaleLowerCase('vi'))}"><p class="eyebrow">${escape(p.topic)}${p.date?' · '+escape(p.date):''}</p><h2><a href="${p.slug}/">${escape(p.title)}</a></h2><p>${escape(p.description)}</p></article>`).join('');
const blogMain=`<main id="main" class="wrap" tabindex="-1"><div class="intro"><p class="eyebrow">Blog</p><h1>Kinh nghiệm làm việc với AI agent.</h1><p class="lede">Đọc cách tổ chức công việc, chọn công cụ và kiểm tra kết quả khi dùng agent.</p></div><section class="block"><label for="blog-search">Tìm bài viết</label> <input id="blog-search" type="search" placeholder="Tìm theo nội dung"> <label for="blog-topic">Chủ đề</label> <select id="blog-topic"><option value="">Tất cả chủ đề</option>${options}</select><div style="display:grid;gap:1rem;margin-top:1rem">${cards}</div><p id="blog-empty" hidden>Không tìm thấy bài viết.</p></section><script>const q=document.querySelector('#blog-search'),f=document.querySelector('#blog-topic'),items=[...document.querySelectorAll('.blog-entry')];function update(){let n=0;items.forEach(x=>{let ok=x.dataset.search.includes(q.value.toLocaleLowerCase('vi'))&&(!f.value||x.dataset.topic===f.value);x.hidden=!ok;if(ok)n++});document.querySelector('#blog-empty').hidden=n>0}q.addEventListener('input',update);f.addEventListener('change',update)</script></main>`;
writeFileSync(blogPath,render(blogTemplate,blogMain));
for(const p of ordered){
 const folder=resolve(root,'blog',p.slug);mkdirSync(folder,{recursive:true});
 let template=blogTemplate.replaceAll('../assets/','../../assets/').replaceAll('../index.html','../../index.html').replaceAll('../features/','../../features/').replaceAll('../orbit/','../../orbit/').replaceAll('../plugins/','../../plugins/').replaceAll('../docs/','../../docs/').replaceAll('../install/','../../install/').replaceAll('../news/','../../news/').replaceAll('href="index.html"','href="../index.html"');
 const main=`<main id="main" class="wrap" tabindex="-1"><div class="intro"><p class="eyebrow">${escape(p.topic)}</p><h1>${escape(p.title)}</h1><p class="lede">${escape(p.description)}</p></div><img src="${escape(p.image)}" alt="" style="max-width:100%;height:auto;border-radius:12px"><article class="block" style="max-width:780px;line-height:1.8">${p.body}</article></main>`;
 writeFileSync(resolve(folder,'index.html'),render(template,main).replace(/<title>.*?<\/title>/,`<title>${escape(p.title)} · OpcOS</title>`));
}
const sorted=[...newsIssues].sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)||a.title.localeCompare(b.title,'vi'));
const card=n=>`<article class="card"><p class="eyebrow">${escape(n.kind)} · <time datetime="${n.date}">${n.date.split('-').reverse().join('/')}</time></p><h3>${escape(n.title)}</h3><p>${escape(n.description)}</p><a href="https://www.youtube.com/watch?v=${n.id}">Xem trên YouTube ↗</a></article>`;
const years=[...new Set(sorted.slice(1).map(n=>n.date.slice(0,4)))];
const archive=years.map(year=>`<section class="block"><h2>${year}</h2><div style="display:grid;gap:1rem">${sorted.slice(1).filter(n=>n.date.startsWith(year)).map(card).join('')}</div></section>`).join('');
const newsMain=`<main id="main" class="wrap" tabindex="-1"><div class="intro"><p class="eyebrow">Tin tức</p><h1>Tin tức từ OPC News.</h1><p class="lede">Xem bản tin mới và tra cứu các số đã phát hành.</p></div>${sorted.length?`<section class="block"><h2>Mới nhất</h2>${card(sorted[0])}</section><h2>Lưu trữ bản tin</h2>${archive}`:'<section class="block"><p>Chưa có bản tin được xuất bản.</p></section>'}</main>`;
writeFileSync(newsPath,render(newsTemplate,newsMain));
console.log(`Built ${ordered.length} blog posts and ${sorted.length} videos`);
