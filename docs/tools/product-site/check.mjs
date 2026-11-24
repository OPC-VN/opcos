import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { blogPosts, newsIssues } from './content.mjs';
const root=resolve('docs/sites');
const blog=readFileSync(resolve(root,'blog/index.html'),'utf8'),news=readFileSync(resolve(root,'news/index.html'),'utf8');
assert.equal((blog.match(/class="card blog-entry"/g)||[]).length,blogPosts.length);
assert.equal((news.match(/Xem trên YouTube/g)||[]).length,newsIssues.length);
for(const p of blogPosts){assert.equal(p.approved,true);const page=readFileSync(resolve(root,'blog',p.slug,'index.html'),'utf8');assert(page.includes(p.title));assert(!page.includes('Bản xem thử'));}
for(const n of newsIssues){assert.equal(n.approved,true);assert(news.includes('watch?v='+n.id));}
function walk(dir){for(const item of readdirSync(dir,{withFileTypes:true})){const path=resolve(dir,item.name);if(item.isDirectory())walk(path);else if(item.name.endsWith('.html')){const s=readFileSync(path,'utf8');for(const nav of s.matchAll(/<nav aria-label="(?:Điều hướng chính|Điều hướng trên màn hình nhỏ)">([\s\S]*?)<\/nav>/g)){for(const label of ['Orbit','Tính năng','Blog','Tin tức'])assert(nav[1].includes('>'+label+'</a>'),path+' missing '+label);assert(!nav[1].includes('<summary>Nội dung</summary>'));assert(!nav[1].includes('<summary>Sản phẩm</summary>'));}}}}
walk(root);console.log(`Checked ${blogPosts.length} posts, ${newsIssues.length} videos and navigation`);
