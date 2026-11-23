/* Dữ liệu mô phỏng nhất quán cho bản xem trước; không phải dữ liệu cửa hàng. */
(() => {
  const dayMs = 86400000;
  const end = Date.UTC(2026, 10, 18);
  const products = [
    { id: 'hyperone-gen-2', name: 'HyperOne Gen 2', category: 'Bàn phím', price: 680000, stock: 42, threshold: 10 },
    { id: 'silentium-gen-2', name: 'Silentium Gen 2', category: 'Chuột', price: 649000, stock: 8, threshold: 10 },
    { id: 'nova-dl02', name: 'Nova DL02', category: 'Đèn bàn', price: 790000, stock: 23, threshold: 8 },
    { id: 'lh01', name: 'Giá đỡ LH01', category: 'Giá đỡ laptop', price: 450000, stock: 0, threshold: 8 },
    { id: 'corepad', name: 'Corepad', category: 'Lót bàn', price: 290000, stock: 67, threshold: 12 },
    { id: 'ds02', name: 'Kệ bàn DS02', category: 'Kệ bàn', price: 590000, stock: 6, threshold: 8 },
  ];
  let seed = 3124102;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const int = (min, max) => Math.floor(random() * (max - min + 1)) + min;
  const daily = [], orders = [], tickets = [], reviews = [];
  const sources = ['Tìm kiếm tự nhiên', 'Mạng xã hội', 'Trực tiếp', 'Quảng cáo'];
  const types = ['Tư vấn', 'Khiếu nại', 'Bảo hành'];
  for (let offset = 179; offset >= 0; offset--) {
    const date = new Date(end - offset * dayMs).toISOString().slice(0, 10);
    const sessions = int(160, 350) + Math.round((180 - offset) * .5);
    const carts = int(28, 65), checkouts = int(17, 26), orderCount = int(8, 16);
    const bySource = [Math.floor(sessions * .4), Math.floor(sessions * .28), Math.floor(sessions * .2)];
    bySource.push(sessions - bySource.reduce((a,b) => a+b,0));
    const mobile = Math.floor(sessions * (.6 + random() * .1));
    daily.push({ date, sessions, pageviews: sessions * int(2, 4) + int(20, 90), bounced: Math.floor(sessions * (.3 + random() * .15)), mobile, desktop: sessions - mobile, carts, checkouts, ordered: orderCount, sources: sources.map((name,i) => ({ name, value: bySource[i] })) });
    for (let i = 0; i < orderCount; i++) {
      const product = products[int(0, products.length - 1)], quantity = int(1, 3), roll = random();
      const status = roll < .7 ? 'Hoàn tất' : roll < .84 ? 'Chờ giao' : roll < .93 ? 'Đang giao' : 'Đã hủy';
      orders.push({ id: 'GD' + String(orders.length + 1).padStart(5,'0'), date, customer: 'KH' + String(int(1,300)).padStart(4,'0'), product: product.id, name: product.name, quantity, total: product.price * quantity, status });
    }
    for (let i = 0, n = int(2,6); i < n; i++) {
      const type = types[int(0,2)], responded = random() > .16, resolved = responded && random() > .3;
      tickets.push({ id: 'HT' + String(tickets.length + 1).padStart(5,'0'), date, type, subject: type === 'Bảo hành' ? 'Kiểm tra tình trạng sản phẩm' : type === 'Khiếu nại' ? 'Hỗ trợ vấn đề đơn hàng' : 'Tư vấn phụ kiện phù hợp', status: resolved ? 'Đã giải quyết' : responded ? 'Đang xử lý' : 'Chưa phản hồi', response: responded ? int(5,240) : null, customer: 'KH' + String(int(1,300)).padStart(4,'0') });
    }
    for (let i = 0, n = int(2,6); i < n; i++) {
      const product = products[int(0,5)], rating = random() < .78 ? int(4,5) : int(1,3);
      reviews.push({ id: 'DG' + String(reviews.length+1).padStart(5,'0'), date, name: product.name, customer: 'KH' + String(int(1,300)).padStart(4,'0'), rating, content: rating >= 4 ? 'Sản phẩm phù hợp với góc làm việc, sử dụng thuận tiện.' : 'Cần hỗ trợ thêm về trải nghiệm sử dụng sản phẩm.', status: random() > .3 ? 'Đã phản hồi' : 'Chưa phản hồi' });
    }
  }
  const sum = (rows,key) => rows.reduce((total,row) => total + row[key],0);
  const rate = (part,total) => total ? part / total * 100 : 0;
  function period(days, previous = false, finishDate = null) {
    const anchor = finishDate ? Date.parse(finishDate + 'T00:00:00Z') : end;
    const last = anchor - (previous ? days * dayMs : 0);
    const first = last - (days - 1) * dayMs;
    const start = new Date(first).toISOString().slice(0,10), finish = new Date(last).toISOString().slice(0,10);
    const inRange = row => row.date >= start && row.date <= finish;
    const d = daily.filter(inRange), o = orders.filter(inRange), t = tickets.filter(inRange), r = reviews.filter(inRange);
    const completed = o.filter(row => row.status === 'Hoàn tất'), responded = t.filter(row => row.response !== null);
    return { start, end: finish, daily:d, orders:o, tickets:t, reviews:r,
      metrics: { sessions:sum(d,'sessions'), pageviews:sum(d,'pageviews'), bounce:rate(sum(d,'bounced'),sum(d,'sessions')), carts:sum(d,'carts'), checkouts:sum(d,'checkouts'), abandoned:sum(d,'carts')-o.length, abandonRate:rate(sum(d,'carts')-o.length,sum(d,'carts')), conversion:rate(o.length,sum(d,'sessions')), revenue:sum(completed,'total'), completed:completed.length, orders:o.length, pending:o.filter(row=>row.status==='Chờ giao').length, customers:new Set(o.map(row=>row.customer)).size, responseRate:rate(responded.length,t.length), responseTime:responded.length ? sum(responded,'response')/responded.length : 0, resolution:rate(t.filter(row=>row.status==='Đã giải quyết').length,t.length), complaints:t.filter(row=>row.type==='Khiếu nại').length, warranties:t.filter(row=>row.type==='Bảo hành').length, tickets:t.length, rating:r.length ? sum(r,'rating')/r.length : 0, reviews:r.length, lowReviews:r.filter(row=>row.rating<=2).length } };
  }
  function range(start, finish, previous = false) {
    const valid = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value + 'T00:00:00Z')) && new Date(value + 'T00:00:00Z').toISOString().slice(0,10) === value;
    if (!valid(start) || !valid(finish) || start > finish) throw new RangeError('Khoảng ngày không hợp lệ');
    const days = Math.round((Date.parse(finish + 'T00:00:00Z') - Date.parse(start + 'T00:00:00Z')) / dayMs) + 1;
    return period(days, previous, finish);
  }
  window.GDAdminDashboardData = { range, products, daily, orders, tickets, reviews, period, sum, rate };
})();