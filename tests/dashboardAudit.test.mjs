import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { build } from 'esbuild';
import React, { act } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
for (const key of ['window','document','navigator','HTMLElement','HTMLInputElement','HTMLButtonElement','Element','Node','NodeFilter','MutationObserver','CustomEvent','Event','MouseEvent','KeyboardEvent','getComputedStyle']) {
  Object.defineProperty(globalThis,key,{value: key === 'getComputedStyle' ? dom.window.getComputedStyle.bind(dom.window) : dom.window[key], configurable:true,writable:true});
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
window.matchMedia = () => ({ matches:false, addEventListener(){}, removeEventListener(){} });
globalThis.requestAnimationFrame = window.requestAnimationFrame.bind(window);
globalThis.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
globalThis.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} };
const { createRoot } = await import('react-dom/client');
const require = createRequire(import.meta.url);
const { QueryClient, QueryClientProvider } = require('@tanstack/react-query');
const { outputFiles } = await build({
  stdin:{contents:`export {default as DatePicker} from './src/components/dashboard/DateRangePicker';
export {default as Pagination} from './src/components/TablePagination';
export {default as SortHead} from './src/components/SortableTableHead';
export {useScopedPage} from './src/hooks/useScopedPage';
export {default as Dashboard} from './src/pages/Dashboard';
export {StatsProvider} from './src/contexts/StatsContext';
export {DateFilterProvider, useDateFilter} from './src/contexts/DateFilterContext';
export {default as TrendChart} from './src/components/dashboard/TrendChart';
export * as api from './src/services/api';`,resolveDir:process.cwd(),loader:'tsx'},
  bundle:true,write:false,format:'cjs',platform:'node',jsx:'automatic',alias:{'@':'./src'},
  plugins:[{name:'config',setup(b){b.onResolve({filter:/config\/environment$/},()=>({path:fileURLToPath(new URL('./configFixture.ts',import.meta.url))}));}}],
  external:['react','react/*','react-dom','react-dom/*','react-router-dom','@tanstack/react-query'],
});
const mod={exports:{}};new Function('module','exports','require',outputFiles[0].text)(mod,mod.exports,require);
const { DatePicker, Pagination, SortHead, useScopedPage, Dashboard, StatsProvider, DateFilterProvider, useDateFilter, TrendChart, api }=mod.exports;
const h=React.createElement;
async function mount(element){const div=document.createElement('div');document.body.append(div);const root=createRoot(div);await act(async()=>root.render(element));return {div,root,async close(){await act(async()=>root.unmount());div.remove();}};}
async function click(el){assert.ok(el,'control exists');await act(async()=>el.click());}
const button=(label)=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===label);
const initial={from:new Date(2026,9,1),to:new Date(2026,9,7)};

test('custom dates are draft until Apply; Escape cancels; Clear restores last seven days',async()=>{
 let applied=initial,changes=0;
 function Harness(){const [range,setRange]=React.useState(initial);return h(DatePicker,{dateRange:range,setDateRange:r=>{changes++;applied=r;setRange(r);}});}
 const app=await mount(h(Harness));
 try{
  await click(button('Oct 01 - Oct 07, 2026'));
  const day=n=>[...document.querySelectorAll('button[name="day"]')].find(b=>b.textContent===String(n)&&!b.className.includes('day-outside'));
  await click(day(10));await click(day(14));assert.equal(changes,0);
  await act(async()=>document.activeElement.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
  assert.equal(document.querySelector('[role="dialog"]'),null);assert.equal(applied,initial);assert.ok(button('Last 7 days'));
  await click(button('Oct 01 - Oct 07, 2026'));await click(day(10));await click(day(14));await click(button('Apply'));
  assert.equal(changes,1);assert.equal(applied.to.getDate(),14);assert.ok(button('Custom'));
  await click([...app.div.querySelectorAll('button')][0]);await click(button('Clear'));
  assert.ok(button('Last 7 days'));const delta=(applied.to-applied.from)/86400000;assert.ok(delta>6&&delta<7);assert.equal(applied.from.getHours(),0);assert.equal(applied.to.getHours(),23);
 }finally{await app.close();}
});

test('the Custom preset keeps the calendar open when the menu closes',async()=>{
 function Harness(){const [range,setRange]=React.useState(initial);return h(DatePicker,{dateRange:range,setDateRange:setRange});}
 const app=await mount(h(Harness));try{
  const trigger=button('Last 7 days');
  await act(async()=>trigger.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true})));
  const custom=[...document.querySelectorAll('[role="menuitem"]')].find(x=>x.textContent==='Custom');
  await click(custom);await act(async()=>{await new Promise(r=>setTimeout(r,30));});
  assert.ok(button('Apply'));assert.equal(document.querySelector('[role="dialog"]')?.getAttribute('data-state'),'open');
  assert.ok(button('Last 7 days'),'the applied preset label is unchanged');
 }finally{await app.close();}
});

test('a new filter or API scope requests page one immediately',async()=>{
 let setPage;const renders=[];
 function Probe({scope}){const [page,set]=useScopedPage(scope);setPage=set;renders.push({scope,page});return h('p',null,page);}
 const app=await mount(h(Probe,{scope:'dates-A/api-A'}));try{
  await act(async()=>setPage(5));assert.equal(app.div.textContent,'5');
  await act(async()=>app.root.render(h(Probe,{scope:'dates-B/api-A'})));assert.equal(app.div.textContent,'1');
  await act(async()=>setPage(4));await act(async()=>app.root.render(h(Probe,{scope:'dates-B/api-B'})));
  assert.equal(app.div.textContent,'1');assert.ok(renders.filter(x=>x.scope==='dates-B/api-B').every(x=>x.page===1));
 }finally{await app.close();}
});

test('sorting and pagination expose native keyboard controls and disabled states',async()=>{
 let sorted=0;const pages=[];const app=await mount(h('div',null,h('table',null,h('thead',null,h('tr',null,h(SortHead,{direction:'asc',onClick:()=>sorted++},'Date')))),h(Pagination,{currentPage:1,totalPages:8,onPageChange:p=>pages.push(p)})));
 try{const sort=button('Date');assert.equal(sort.tagName,'BUTTON');sort.focus();assert.equal(document.activeElement,sort);await click(sort);assert.equal(sorted,1);assert.equal(sort.closest('th').getAttribute('aria-sort'),'ascending');
 const prev=document.querySelector('[aria-label="Go to previous page"]');assert.equal(prev.disabled,true);await click(prev);assert.deepEqual(pages,[]);
 const next=document.querySelector('[aria-label="Go to next page"]');assert.equal(next.tagName,'BUTTON');await click(next);assert.deepEqual(pages,[2]);assert.equal(document.querySelector('[aria-current="page"]').textContent,'1');
 }finally{await app.close();}
});

test('failed report requests reject rather than return successful zero totals or empty graphs',async(t)=>{
 t.mock.method(globalThis,'fetch',async()=>({ok:false,status:503,text:async()=> 'Unavailable'}));
 for(const name of ['fetchUsers','fetchUserByUsername','fetchUserStats','fetchBasicSessionStats','fetchFeedbackStats','fetchSessionStats','fetchQuestionStats','fetchComprehensiveFeedbackStats','fetchDashboardStats','fetchQuestionsGraph','fetchSessionsGraph','fetchFeedbackGraph','fetchErrors','fetchErrorStats','fetchErrorGraph','fetchUsersGraph']){
  await assert.rejects(api[name](name==='fetchUserByUsername'?'test-user':{}),/503/,name);
 }
 globalThis.fetch=async()=>({ok:false,status:404});assert.equal(await api.fetchUserByUsername('missing'),null);
});

test('dashboard failures display errors without presenting zero totals or an empty-success chart',async(t)=>{
 t.mock.method(globalThis,'fetch',async()=>({ok:false,status:503,text:async()=> 'Unavailable'}));
 const client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0}}});
 function Dates(){const {setDateRange}=useDateFilter();React.useEffect(()=>setDateRange(initial),[setDateRange]);return h(StatsProvider,null,h(Dashboard));}
 const app=await mount(h(QueryClientProvider,{client},h(DateFilterProvider,null,h(Dates))));
 try{await act(async()=>{await new Promise(r=>setTimeout(r,900));});await act(async()=>{await new Promise(r=>setTimeout(r,20));});
  assert.match(app.div.textContent,/Could not load dashboard totals/);assert.match(app.div.textContent,/Could not load chart data/);assert.doesNotMatch(app.div.textContent,/No data available for selected time period|Count of unique users/);
 }finally{await app.close();client.clear();}
});

test('report HTML keeps formatting while removing active markup',async()=>{
 const {default:Markdown}=await import('react-markdown');const {default:raw}=await import('rehype-raw');const {default:sanitize}=await import('rehype-sanitize');
 const html=renderToStaticMarkup(h(Markdown,{rehypePlugins:[raw,sanitize]},'<strong>Useful answer</strong><table><tr><td>Value</td></tr></table><iframe src="https://example.invalid"></iframe><script>unsafe()</script><a href="javascript:unsafe()">bad</a><span onclick="unsafe()" style="position:fixed">text</span>'));
 assert.match(html,/<strong>Useful answer<\/strong>/);assert.match(html,/<table>/);assert.doesNotMatch(html,/iframe|script|onclick|javascript:|position:fixed/);
 for(const name of ['QuestionsDetails','FeedbackDetails'])assert.match(readFileSync(`src/pages/${name}.tsx`,'utf8'),/rehypePlugins=\{\[rehypeRaw, rehypeSanitize\]\}/);
});

// Check the actual palette values used by the repaired small labels.
test('chart and feedback text meet 4.5:1 contrast in light and dark themes',()=>{
 const css=readFileSync('src/index.css','utf8');
 const hsl=(value)=>{const [h,s,l]=value.trim().split(/\s+/).map(parseFloat);const a=s/100*Math.min(l/100,1-l/100);return [0,8,4].map(n=>{const k=(n+h/30)%12;return l/100-a*Math.max(-1,Math.min(k-3,9-k,1));});};
 const luminance=rgb=>rgb.map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((sum,x,i)=>sum+x*[.2126,.7152,.0722][i],0);
 const contrast=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
 for(const selector of [':root','.dark']){const block=css.slice(css.indexOf(selector+' {')).split('}')[0];const variable=name=>hsl(block.match(new RegExp('--'+name+': ([^;]+)'))[1]);
  for(const surface of ['background','card','secondary'])assert.ok(contrast(variable('foreground'),variable(surface))>=4.5);
  const rgb=selector===':root'?[21,128,61]:[74,222,128];assert.ok(contrast(rgb.map(x=>x/255),variable('background'))>=4.5);
  const errorRgb=selector===':root'?[185,28,28]:[252,165,165];assert.ok(contrast(errorRgb.map(x=>x/255),variable('background'))>=4.5);
 }
 assert.ok(readFileSync('src/components/dashboard/TrendChart.tsx','utf8').includes('stroke="hsl(var(--foreground))"'));
});
