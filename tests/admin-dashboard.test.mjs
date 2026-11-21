import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const ctx = vm.createContext({window:{}});
vm.runInContext(await fs.readFile(new URL('../js/admin-dashboard-data.js',import.meta.url),'utf8'),ctx);
const D=ctx.window.GDAdminDashboardData;
for(const days of [7,30,90]) {
 const p=D.period(days), before=D.period(days,true);
 assert.equal(p.daily.length,days);assert.equal(before.daily.length,days);
 assert.ok(before.end<p.start);
 assert.equal(p.metrics.orders,p.orders.length);
 assert.equal(p.metrics.revenue,p.orders.filter(o=>o.status==='Hoàn tất').reduce((n,o)=>n+o.total,0));
 assert.equal(p.metrics.abandoned,p.metrics.carts-p.metrics.orders);
 assert.equal(p.metrics.responseRate,D.rate(p.tickets.filter(t=>t.response!==null).length,p.tickets.length));
 assert.equal(p.metrics.rating,p.reviews.reduce((n,r)=>n+r.rating,0)/p.reviews.length);
 for(const d of p.daily){assert.equal(d.sources.reduce((n,s)=>n+s.value,0),d.sessions);assert.equal(d.mobile+d.desktop,d.sessions);assert.ok(d.sessions>=d.carts&&d.carts>=d.checkouts&&d.checkouts>=d.ordered);}
}
assert.ok(D.products.some(p=>p.stock===0));assert.ok(D.products.some(p=>p.stock>0&&p.stock<=p.threshold));
console.log('Passed: 3 time ranges, prior periods, revenue, funnel, response, ratings, traffic/device reconciliation and stock alerts.');

assert.equal(D.range('2026-11-01','2026-11-18').daily.length,18);
assert.equal(D.range('2026-11-18','2026-11-18').daily.length,1);
assert.equal(D.range('2026-11-01','2026-11-18',true).end,'2026-10-31');
assert.equal(D.range('2027-01-01','2027-01-05').daily.length,0);
assert.throws(()=>D.range('2026-11-18','2026-11-01'));
assert.throws(()=>D.range('2026-02-30','2026-03-01'));
console.log('Passed: custom date ranges, one-day range, prior period, empty data and invalid dates.');
