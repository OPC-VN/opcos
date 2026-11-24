import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { blogPosts, newsIssues } from './content.mjs';
const root=resolve('docs/sites');
const blog=readFileSync(resolve(root,'blog/index.html'),'utf8'),news=readFileSync(resolve(root,'news/index.html'),'utf8');
assert.equal((blog.match(/class="blog-tile blog-entry"/g)||[]).length,blogPosts.length);
assert.equal((news.match(/class="video-source"/g)||[]).length,newsIssues.length);
assert.equal((news.match(/data-video-card/g)||[]).length,new Set(newsIssues.map(n=>n.issueKey)).size);
for(const p of blogPosts){assert.equal(p.approved,true);const page=readFileSync(resolve(root,'blog',p.slug,'index.html'),'utf8');assert(page.includes(p.title));assert(!page.includes('Bản xem thử'));}
for(const n of newsIssues){assert.equal(n.approved,true);assert(news.includes('watch?v='+n.id));assert(news.includes('data-id=\"'+n.id+'\"'));}
for(const issue of new Set(newsIssues.map(n=>n.issueKey))){const group=newsIssues.filter(n=>n.issueKey===issue);assert.equal(new Set(group.map(n=>n.kind)).size,group.length);assert(group.every(n=>n.issueDate===group[0].issueDate));}
function walk(dir){for(const item of readdirSync(dir,{withFileTypes:true})){const path=resolve(dir,item.name);if(item.isDirectory())walk(path);else if(item.name.endsWith('.html')){const s=readFileSync(path,'utf8');for(const nav of s.matchAll(/<nav aria-label="(?:Điều hướng chính|Điều hướng trên màn hình nhỏ)">([\s\S]*?)<\/nav>/g)){for(const label of ['Orbit','Tính năng','Blog','Tin tức'])assert(nav[1].includes('>'+label+'</a>'),path+' missing '+label);assert(!nav[1].includes('<summary>Nội dung</summary>'));assert(!nav[1].includes('<summary>Sản phẩm</summary>'));}}}}
walk(root);console.log(`Checked ${blogPosts.length} posts, ${newsIssues.length} videos and navigation`);
