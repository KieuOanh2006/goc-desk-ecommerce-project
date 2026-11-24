/* Báo cáo frontend dùng dữ liệu mô phỏng; không gọi API quản trị. */
(() => {
  const D = window.GDAdminDashboardData;
  const root = document.getElementById('dashboard-report');
  if (!D || !root) return;
  const titles = { overview: ['Tổng quan cửa hàng','Một góc nhìn chung về kinh doanh, khách hàng và vận hành.'], traffic:['Lượt xem & traffic','Khách đến từ đâu và tương tác với cửa hàng như thế nào?'], conversion:['Giỏ hàng & chuyển đổi','Theo dõi hành trình từ ghé thăm đến tạo đơn hàng.'], customers:['Khách hàng','Tổng hợp hành vi mua hàng và giá trị khách hàng.'], support:['Phản hồi, khiếu nại & bảo hành','Theo dõi khả năng phản hồi và tiến độ xử lý yêu cầu.'], reviews:['Đánh giá khách hàng','Lắng nghe trải nghiệm sản phẩm và những phản hồi cần chú ý.'], products:['Tình hình bán sản phẩm & tồn kho','Sản phẩm bán chạy, doanh thu và tình trạng tồn kho hiện tại.'], sales:['Doanh thu & đơn hàng','Doanh thu chỉ tính đơn hoàn tất, loại trừ đơn đã hủy.'] };
  titles.traffic = ['Lượt xem & truy cập', 'Nguồn lưu lượng, lượt xem trang và thiết bị truy cập.'];
  titles.support = ['Hiệu quả phản hồi', 'Tỷ lệ phản hồi và thời gian giải quyết yêu cầu của khách hàng.'];
  titles.complaints = ['Phân tích khiếu nại', 'Theo dõi riêng các khiếu nại và tiến độ xử lý.'];
  titles.warranties = ['Phân tích bảo hành', 'Theo dõi riêng yêu cầu bảo hành và hiệu quả hỗ trợ sau bán hàng.'];
  const groups = [
    { name: 'Phân tích bán hàng', views: ['overview','products','sales','traffic','conversion'], labels: ['Tổng quan','Tình hình bán sản phẩm','Doanh thu & đơn hàng','Lượt xem & truy cập','Giỏ hàng & chuyển đổi'] },
    { name: 'Chăm sóc khách hàng', views: ['customers','support','reviews'], labels: ['Phân tích khách hàng','Hiệu quả phản hồi','Đánh giá khách hàng'] },
    { name: 'Dịch vụ sau bán hàng', views: ['complaints','warranties'], labels: ['Khiếu nại','Bảo hành'] }
  ];
  function scopeSupport(period, type) {
    const scoped = period.tickets.filter(ticket => ticket.type === type);
    const responded = scoped.filter(ticket => ticket.response !== null);
    return { ...period, tickets: scoped, metrics: { ...period.metrics,
      tickets: scoped.length,
      responseRate: D.rate(responded.length, scoped.length),
      responseTime: responded.length ? D.sum(responded, 'response') / responded.length : 0,
      resolution: D.rate(scoped.filter(ticket => ticket.status === 'Đã giải quyết').length, scoped.length),
      complaints: scoped.filter(ticket => ticket.type === 'Khiếu nại').length,
      warranties: scoped.filter(ticket => ticket.type === 'Bảo hành').length
    } };
  }
  const number = value => new Intl.NumberFormat('vi-VN',{ maximumFractionDigits:1 }).format(value);
  const money = value => new Intl.NumberFormat('vi-VN',{ style:'currency',currency:'VND',maximumFractionDigits:0 }).format(value);
  const date = value => value.split('-').reverse().join('/');
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let view = Object.hasOwn(titles, location.hash.slice(1)) ? location.hash.slice(1) : 'overview';
  let current, previous, table, search = '', status = '';
  const initialRange = D.period(30);
  let appliedRange = { start: initialRange.start, end: initialRange.end };
  let comparable = true;
  const metricDefinitions = {
    sessions:['Lượt truy cập','number','Tổng phiên truy cập; một khách có thể có nhiều phiên.'],pageviews:['Lượt xem trang','number','Tổng lượt xem, bao gồm xem lại.'],bounce:['Tỷ lệ thoát','percent','Tỷ lệ lượt truy cập chỉ xem một trang rồi rời đi. Cách tính trong dữ liệu mẫu: số phiên chỉ xem một trang chia cho tổng phiên, nhân 100.',true],carts:['Giỏ được tạo','number','Số giỏ được tạo trong kỳ.'],checkouts:['Bắt đầu thanh toán','number','Số giỏ chuyển sang bước thanh toán.'],abandoned:['Giỏ chưa tạo đơn','number','Giỏ được tạo trừ số giỏ đã tạo đơn trong bộ dữ liệu mẫu.',true],abandonRate:['Tỷ lệ bỏ giỏ','percent','Giỏ chưa tạo đơn / tổng giỏ được tạo. Không áp dụng thời gian chờ trong bản mẫu.',true],conversion:['Tỷ lệ tạo đơn','percent','Cứ 100 lượt truy cập có bao nhiêu đơn được tạo? Cách tính: tổng đơn được tạo chia cho tổng lượt truy cập, nhân 100. Bao gồm cả đơn chưa hoàn tất và đơn sau đó bị hủy.'],revenue:['Doanh thu hoàn tất','money','Tổng giá trị đơn Hoàn tất trong kỳ, theo ngày tạo đơn; loại trừ đơn hủy và chưa hoàn tất.'],completed:['Đơn hoàn tất','number','Đơn tạo trong kỳ có trạng thái Hoàn tất.'],orders:['Tổng đơn hàng','number','Số đơn được tạo trong kỳ, gồm cả đơn hủy.'],pending:['Đơn chờ giao','number','Đơn tạo trong kỳ đang ở trạng thái Chờ giao.'],customers:['Khách đã tạo đơn','number','Số mã khách hàng khác nhau có đơn tạo trong kỳ.'],responseRate:['Tỷ lệ phản hồi','percent','Trong các yêu cầu được tạo ở kỳ đang xem, bao nhiêu phần trăm đã được trả lời ít nhất một lần? Cách tính: số yêu cầu đã có phản hồi đầu tiên chia cho tổng yêu cầu, nhân 100.'],responseTime:['Thời gian phản hồi trung bình','minutes','Từ lúc khách gửi yêu cầu đến khi nhận được phản hồi đầu tiên, trung bình mất bao nhiêu phút? Cách tính: tổng thời gian chờ phản hồi đầu tiên chia cho số yêu cầu đã được phản hồi. Không tính yêu cầu chưa có phản hồi. Ví dụ: 120 phút tương đương khoảng 2 giờ.',true],resolution:['Tỷ lệ giải quyết','percent','Bao nhiêu phần trăm yêu cầu trong kỳ đã xử lý xong? Cách tính: số yêu cầu có trạng thái Đã giải quyết chia cho tổng yêu cầu, nhân 100.'],complaints:['Khiếu nại','number','Số yêu cầu loại Khiếu nại được tạo trong kỳ.',true],warranties:['Yêu cầu bảo hành','number','Số yêu cầu loại Bảo hành được tạo trong kỳ.'],tickets:['Yêu cầu hỗ trợ','number','Tổng yêu cầu tư vấn, khiếu nại và bảo hành tạo trong kỳ.'],rating:['Điểm đánh giá trung bình','rating','Tổng số sao / số đánh giá trong kỳ.'],reviews:['Lượt đánh giá','number','Số đánh giá được tạo trong kỳ.'],lowReviews:['Đánh giá 1–2 sao','number','Số đánh giá cần chú ý, có điểm từ 1 đến 2 sao.',true]
  };
  function format(value,kind) { return kind === 'money' ? money(value) : number(value) + (kind === 'percent' ? '%' : kind === 'minutes' ? ' phút' : kind === 'rating' ? ' / 5' : ''); }
  function cards(keys) { return '<div class="dashboard-kpis cols-'+keys.length+'">' + keys.map(key => {
    const [label,kind,formula,inverse] = metricDefinitions[key], value=current.metrics[key], before=previous.metrics[key];
    const delta = value-before, percentKind = kind==='percent';
    const diff = percentKind ? Math.abs(delta) : before ? Math.abs(delta/before*100) : 0;
    const change = !comparable ? 'Chưa đủ dữ liệu so sánh' : before || percentKind ? (delta > 0 ? '↑ ' : delta < 0 ? '↓ ' : '→ ') + number(diff) + (percentKind ? ' điểm %' : '%') : 'Chưa có cơ sở so sánh';
    const tone = !comparable || delta === 0 ? 'neutral' : ((delta>0)!==!!inverse ? 'positive':'negative');
    return '<article class="dashboard-kpi"><span class="metric-label">'+label+' <button type="button" class="metric-info" data-metric-info="'+escape(formula)+'" aria-label="Giải thích: '+escape(label)+'" aria-expanded="false">ⓘ</button></span><strong>'+format(value,kind)+'</strong><small class="'+tone+'">'+change+'<span>'+ (comparable ? ' so với kỳ trước' : '') +'</span></small></article>';
  }).join('')+'</div>'; }
  function panel(title,subtitle,body) { return '<section class="dashboard-panel"><div class="dashboard-panel-heading"><h2>'+title+'</h2><p>'+subtitle+'</p></div>'+body+'</section>'; }
  function bars(items,kind='number') { const max=Math.max(1,...items.map(item=>item.value)); return '<div class="dashboard-bars">'+items.map(item=>'<div class="dashboard-bar-row"><div><span>'+escape(item.name)+'</span><strong>'+format(item.value,kind)+'</strong></div><div class="dashboard-bar-track"><span style="width:'+Math.max(0,item.value/max*100)+'%"></span></div></div>').join('')+'</div>'; }
  function timeline(key,label,kind='number') {
    if (!current.daily.length) return '<p class="dashboard-empty-chart">Chưa có dữ liệu trong khoảng thời gian này.</p>';
    const daily=current.daily, size=Math.ceil(daily.length/10), buckets=[];
    for(let i=0;i<daily.length;i+=size) {const slice=daily.slice(i,i+size); let value;
      if(key==='revenue') value=D.sum(current.orders.filter(o=>o.status==='Hoàn tất'&&o.date>=slice[0].date&&o.date<=slice[slice.length-1].date),'total');
      else if(key==='abandoned') value=slice.reduce((n,d)=>n+d.carts-d.ordered,0);
      else value=D.sum(slice,key);
      buckets.push({name:date(slice[0].date).slice(0,5),end:date(slice[slice.length-1].date).slice(0,5),value});
    }
    const max=Math.max(1,...buckets.map(b=>b.value));
    return '<div class="dashboard-chart-wrap"><svg class="dashboard-chart" viewBox="0 0 700 240" role="img" aria-label="'+label+' theo thời gian"><title>'+label+' theo thời gian. Mỗi cột tổng hợp tối đa '+size+' ngày.</title>'+[0,1,2,3].map(i=>'<line x1="10" y1="'+(20+i*56)+'" x2="690" y2="'+(20+i*56)+'" stroke="#e7dacc"/>').join('')+buckets.map((b,i)=>{const width=660/buckets.length,x=20+i*width,h=b.value/max*160;return '<g><title>'+b.name+'–'+b.end+': '+format(b.value,kind)+'</title><rect x="'+x+'" y="'+(188-h)+'" width="'+(width-14)+'" height="'+h+'" rx="5" fill="'+(i===buckets.length-1?'#4c3221':'#956139')+'"/><text x="'+(x+(width-14)/2)+'" y="210" text-anchor="middle" fill="#79614b" font-size="11">'+b.name+'</text></g>';}).join('')+'</svg></div><p class="dashboard-chart-note">'+label+' · '+(size===1?'Mỗi cột là một ngày.':'Mỗi cột gộp tối đa '+size+' ngày.')+' Di chuột vào cột để xem giá trị.</p>';
  }
  function badge(value) {const tone=/Hoàn tất|Đã giải quyết|Đã phản hồi|Còn hàng/.test(value)?'green':/Chưa|Đã hủy|Hết hàng|1 sao|2 sao/.test(value)?'red':'amber';return '<span class="dashboard-status '+tone+'">'+escape(value)+'</span>';}
  function setTable(title,headers,rows,filterIndex=null) { table={title,headers,rows,filterIndex}; }
  function customerRows() {
    const map=new Map(); current.orders.forEach(o=>{if(!map.has(o.customer))map.set(o.customer,{id:o.customer,orders:0,complete:0,total:0,last:o.date});const c=map.get(o.customer);c.orders++;if(o.status==='Hoàn tất'){c.complete++;c.total+=o.total;}if(o.date>c.last)c.last=o.date;});
    return [...map.values()].sort((a,b)=>b.total-a.total).map(c=>[c.id,c.orders,c.complete,money(c.total),date(c.last)]);
  }
  function productRows() {return D.products.map(p=>{const orders=current.orders.filter(o=>o.product===p.id&&o.status==='Hoàn tất');return {p,units:D.sum(orders,'quantity'),revenue:D.sum(orders,'total')};}).sort((a,b)=>b.revenue-a.revenue);}
  function render() {
    hideMetricHelp();
    current = D.range(appliedRange.start, appliedRange.end);
    previous = D.range(appliedRange.start, appliedRange.end, true);
    const days = Math.round((Date.parse(appliedRange.end) - Date.parse(appliedRange.start)) / 86400000) + 1;
    comparable = current.daily.length === days && previous.daily.length === days;
    document.getElementById('dashboard-date-start').value = appliedRange.start;
    document.getElementById('dashboard-date-end').value = appliedRange.end;
    document.querySelector('.dashboard-comparison').textContent = 'So với ' + date(previous.start) + ' — ' + date(previous.end);
    const note = document.getElementById('dashboard-range-note');
    note.hidden = current.daily.length === days && comparable;
    note.textContent = current.daily.length === 0 ? 'Chưa có dữ liệu cho khoảng ngày đã chọn. Dữ liệu mẫu hiện có từ ' + date(D.daily[0].date) + ' đến ' + date(D.daily[D.daily.length-1].date) + '.' : current.daily.length < days ? 'Khoảng đã chọn chỉ có dữ liệu cho ' + current.daily.length + '/' + days + ' ngày. Chưa đủ dữ liệu để so sánh hai kỳ.' : 'Chưa đủ dữ liệu kỳ trước để so sánh. Số liệu kỳ đang chọn vẫn hiển thị đầy đủ.';
    search='';status='';
    if (view === 'complaints' || view === 'warranties') {
      const type = view === 'complaints' ? 'Khiếu nại' : 'Bảo hành';
      current = scopeSupport(current, type);
      previous = scopeSupport(previous, type);
    }
    const group = groups.find(group => group.views.includes(view));
    document.getElementById('dashboard-tabs').innerHTML = group.views.map((key, index) => '<button type="button" data-report-view="'+key+'" '+(key === view ? 'aria-current="page"' : '')+'>'+group.labels[index]+'</button>').join('');
    const active = document.querySelector('#dashboard-nav [data-view="'+view+'"]');
    if (active) active.closest('details').open = true;
    const [title,description]=titles[view]; document.getElementById('dashboard-title').textContent=title;document.getElementById('dashboard-description').textContent=description;document.getElementById('dashboard-breadcrumb').textContent=group.name+' / '+title;
    document.getElementById('dashboard-date-caption').textContent=date(current.start)+' — '+date(current.end);
    document.querySelectorAll('[data-view]').forEach(b=>{if(b.dataset.view===view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    const m=current.metrics; let body='';
    const orderRows=()=>[...current.orders].reverse().map(o=>[o.id,date(o.date),o.customer,o.name,money(o.total),o.status]);
    if(view==='overview') {
      body=cards(['revenue','orders','sessions','responseRate'])+'<div class="dashboard-two-col">'+panel('Nhịp kinh doanh','Doanh thu từ các đơn hoàn tất trong kỳ.',timeline('revenue','Doanh thu','money'))+panel('Cần theo dõi','Các vấn đề cần ưu tiên theo dõi.','<div class="dashboard-actions"><button data-go="conversion"><span>Giỏ chưa tạo đơn<small>'+number(m.abandonRate)+'% tổng giỏ</small></span><strong>'+number(m.abandoned)+' ↗</strong></button><button data-go="support"><span>Yêu cầu chưa phản hồi<small>Tư vấn, khiếu nại, bảo hành</small></span><strong>'+current.tickets.filter(t=>t.response===null).length+' ↗</strong></button><button data-go="reviews"><span>Đánh giá thấp<small>Các phản hồi từ 1–2 sao</small></span><strong>'+m.lowReviews+' ↗</strong></button><button data-go="products"><span>Tồn kho cần chú ý<small>Sản phẩm sắp hết hoặc hết hàng</small></span><strong>'+D.products.filter(p=>p.stock<=p.threshold).length+' ↗</strong></button></div>')+'</div>';
      setTable('Đơn hàng gần đây',['Mã đơn','Ngày tạo','Khách hàng','Sản phẩm','Giá trị đơn','Trạng thái'],orderRows(),5);
    } else if(view==='traffic') {
      const sourceNames=D.daily[0].sources.map(s=>s.name); const items=sourceNames.map(name=>({name,value:current.daily.reduce((n,d)=>n+d.sources.find(s=>s.name===name).value,0)}));
      body=cards(['sessions','pageviews','bounce','conversion'])+'<div class="dashboard-two-col">'+panel('Lượt truy cập theo thời gian','Tổng phiên truy cập trong khoảng đã chọn.',timeline('sessions','Lượt truy cập'))+panel('Nguồn truy cập','Số phiên theo nguồn giới thiệu.',bars(items))+'</div>'+panel('Thiết bị truy cập','Phân bổ các phiên truy cập trong kỳ.',bars([{name:'Di động',value:D.sum(current.daily,'mobile')},{name:'Máy tính',value:D.sum(current.daily,'desktop')} ]));
      setTable('Chi tiết traffic theo ngày',['Ngày','Lượt truy cập','Lượt xem','Tỷ lệ thoát','Di động','Máy tính'],[...current.daily].reverse().map(d=>[date(d.date),d.sessions,d.pageviews,number(D.rate(d.bounced,d.sessions))+'%',d.mobile,d.desktop]));
    } else if(view==='conversion') {
      body=cards(['carts','abandoned','abandonRate','conversion'])+'<div class="dashboard-two-col">'+panel('Phễu chuyển đổi','Mỗi bước là tổng số phát sinh trong kỳ.',bars([{name:'Ghé thăm',value:m.sessions},{name:'Tạo giỏ hàng',value:m.carts},{name:'Bắt đầu thanh toán',value:m.checkouts},{name:'Tạo đơn hàng',value:m.orders}]))+panel('Giỏ chưa tạo đơn','Không bao gồm giỏ đã tạo đơn rồi bị hủy.',timeline('abandoned','Giỏ chưa tạo đơn'))+'</div>';
      setTable('Giỏ hàng theo ngày',['Ngày','Giỏ được tạo','Bắt đầu thanh toán','Đã tạo đơn','Chưa tạo đơn','Tỷ lệ bỏ giỏ'],[...current.daily].reverse().map(d=>[date(d.date),d.carts,d.checkouts,d.ordered,d.carts-d.ordered,number(D.rate(d.carts-d.ordered,d.carts))+'%']));
    } else if(view==='customers') {
      const rows=customerRows(), repeats=rows.filter(c=>c[1]>1).length;
      body=cards(['customers','orders','completed','revenue'])+'<div class="dashboard-two-col">'+panel('Tần suất mua trong kỳ','Tính theo số lần tạo đơn; không suy ra khách mới của toàn cửa hàng.',bars([{name:'Tạo một đơn',value:rows.length-repeats},{name:'Tạo từ hai đơn',value:repeats}]))+panel('Giá trị khách hàng','Top 5 theo doanh thu đơn hoàn tất trong kỳ.',bars(rows.slice(0,5).map(r=>({name:r[0],value:current.orders.filter(o=>o.customer===r[0]&&o.status==='Hoàn tất').reduce((n,o)=>n+o.total,0)})),'money'))+'</div>';
      setTable('Khách hàng đã tạo đơn',['Mã khách hàng','Số đơn','Đơn hoàn tất','Doanh thu hoàn tất','Đơn gần nhất'],rows);
    } else if(['support','complaints','warranties'].includes(view)) {
      body=cards(['tickets','responseRate','responseTime','resolution'])+'<div class="dashboard-two-col">'+panel('Tình trạng yêu cầu',view==='support'?'Tổng hợp tư vấn, khiếu nại và bảo hành.':'Chỉ tính yêu cầu '+(view==='complaints'?'khiếu nại.':'bảo hành.'),bars(['Chưa phản hồi','Đang xử lý','Đã giải quyết'].map(name=>({name,value:current.tickets.filter(t=>t.status===name).length}))))+panel('Theo loại hỗ trợ','Phân bổ yêu cầu theo nhu cầu của khách.',bars(['Tư vấn','Khiếu nại','Bảo hành'].map(name=>({name,value:current.tickets.filter(t=>t.type===name).length}))))+'</div><p class="dashboard-inline-note">Tỷ lệ giải quyết: <strong>'+number(m.resolution)+'%</strong>. Thời gian phản hồi chỉ tính yêu cầu đã có phản hồi đầu tiên.</p>';
      setTable(view==='complaints'?'Chi tiết khiếu nại':view==='warranties'?'Chi tiết bảo hành':'Tất cả yêu cầu hỗ trợ',['Mã yêu cầu','Ngày tạo','Khách hàng','Loại','Nội dung','Phản hồi đầu tiên','Trạng thái'],[...current.tickets].reverse().map(t=>[t.id,date(t.date),t.customer,t.type,t.subject,t.response===null?'Chưa phản hồi':t.response+' phút',t.status]),6);
    } else if(view==='reviews') {
      body=cards(['rating','reviews','lowReviews'])+'<div class="dashboard-two-col">'+panel('Phân bổ số sao','Điểm đánh giá sản phẩm trong kỳ.',bars([5,4,3,2,1].map(star=>({name:star+' sao',value:current.reviews.filter(r=>r.rating===star).length}))))+panel('Phản hồi đánh giá','Trạng thái trả lời đánh giá của khách hàng.',bars(['Đã phản hồi','Chưa phản hồi'].map(name=>({name,value:current.reviews.filter(r=>r.status===name).length}))))+'</div>';
      setTable('Đánh giá sản phẩm',['Mã đánh giá','Ngày','Khách hàng','Sản phẩm','Điểm','Nội dung','Trạng thái'],[...current.reviews].reverse().sort((a,b)=>a.rating-b.rating).map(r=>[r.id,date(r.date),r.customer,r.name,r.rating+' sao',r.content,r.status]),6);
    } else if(view==='products') {
      const ranked=productRows(); body=cards(['revenue','completed','orders'])+'<div class="dashboard-two-col">'+panel('Sản phẩm bán chạy','Số lượng thuộc các đơn Hoàn tất trong kỳ.',bars(ranked.map(p=>({name:p.p.name,value:p.units}))))+panel('Doanh thu theo sản phẩm','Doanh thu từ các đơn đã hoàn tất.',bars(ranked.map(p=>({name:p.p.name,value:p.revenue})),'money'))+'</div><p class="dashboard-inline-note">Tồn kho là ảnh chụp dữ liệu mẫu tại 18/11/2026, không thay đổi theo bộ lọc kỳ. Cảnh báo khi tồn kho ≤ ngưỡng.</p>';
      setTable('Tình hình bán sản phẩm & tồn kho',['Sản phẩm','Danh mục','Đã bán','Doanh thu hoàn tất','Tồn kho hiện tại','Ngưỡng cảnh báo','Trạng thái'],ranked.map(p=>[p.p.name,p.p.category,p.units,money(p.revenue),p.p.stock,p.p.threshold,p.p.stock===0?'Hết hàng':p.p.stock<=p.p.threshold?'Sắp hết':'Còn hàng']),6);
    } else {
      body=cards(['revenue','orders','completed','pending'])+'<div class="dashboard-two-col">'+panel('Doanh thu theo thời gian','Chỉ cộng giá trị đơn Hoàn tất, theo ngày tạo đơn.',timeline('revenue','Doanh thu','money'))+panel('Trạng thái đơn hàng','Các đơn được tạo trong khoảng thời gian đã chọn.',bars(['Hoàn tất','Chờ giao','Đang giao','Đã hủy'].map(name=>({name,value:current.orders.filter(o=>o.status===name).length}))))+'</div>';
      setTable('Chi tiết đơn hàng',['Mã đơn','Ngày tạo','Khách hàng','Sản phẩm','Giá trị đơn','Trạng thái'],orderRows(),5);
    }
    root.innerHTML=body+'<section class="dashboard-panel dashboard-table-panel"><div class="dashboard-table-heading"><h2>'+table.title+'</h2><div class="dashboard-table-controls"><label><span class="sr-only">Tìm trong bảng</span><input id="dashboard-search" type="search" placeholder="Tìm trong bảng…"></label>'+(table.filterIndex!==null?'<label><span class="sr-only">Lọc trạng thái</span><select id="dashboard-status"><option value="">Tất cả trạng thái</option>'+[...new Set(table.rows.map(r=>r[table.filterIndex]))].map(s=>'<option>'+escape(s)+'</option>').join('')+'</select></label>':'')+'</div></div><div class="dashboard-table-scroll"><table><thead><tr>'+table.headers.map(h=>'<th scope="col">'+h+'</th>').join('')+'</tr></thead><tbody id="dashboard-table-body"></tbody></table></div><div id="dashboard-table-count" class="dashboard-table-count"></div></section>';
    document.getElementById('dashboard-search').addEventListener('input',event=>{search=event.target.value;renderTable();});document.getElementById('dashboard-status')?.addEventListener('change',event=>{status=event.target.value;renderTable();});
    root.querySelectorAll('[data-go]').forEach(button=>button.addEventListener('click',()=>navigate(button.dataset.go)));
    root.querySelectorAll('.dashboard-chart-note, .dashboard-inline-note').forEach(note => note.remove());
    renderTable();document.getElementById('dashboard-feedback').textContent='';
  }
  function filteredRows() {const q=search.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g,'');return table.rows.filter(row=>(!status||row[table.filterIndex]===status)&&row.join(' ').toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g,'').includes(q));}
  let page=1;
  function renderTable(reset=true) {if(reset)page=1;const rows=filteredRows(),pages=Math.max(1,Math.ceil(rows.length/12));page=Math.min(page,pages);const visible=rows.slice((page-1)*12,page*12);
    document.getElementById('dashboard-table-body').innerHTML=visible.length?visible.map(row=>'<tr>'+row.map((cell,i)=>'<td>'+(i===table.filterIndex?badge(cell):escape(cell))+'</td>').join('')+'</tr>').join(''):'<tr><td colspan="'+table.headers.length+'" class="dashboard-empty">Không có dữ liệu phù hợp. Thử đổi từ khóa hoặc trạng thái.</td></tr>';
    document.getElementById('dashboard-table-count').innerHTML='<span>'+number(rows.length)+' kết quả · Trang '+page+' / '+pages+'</span><div><button id="table-prev" type="button" '+(page===1?'disabled':'')+'>← Trước</button><button id="table-next" type="button" '+(page===pages?'disabled':'')+'>Sau →</button></div>';
    document.getElementById('table-prev').addEventListener('click',()=>{page--;renderTable(false);});document.getElementById('table-next').addEventListener('click',()=>{page++;renderTable(false);});
  }
  function navigate(next) {if(!Object.hasOwn(titles,next))return;view=next;history.replaceState(null,'','#'+view);render();document.getElementById('dashboard-title').scrollIntoView({block:'nearest'});}
  document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>navigate(button.dataset.view)));
  document.getElementById('dashboard-tabs').addEventListener('click', event => { const button = event.target.closest('[data-report-view]'); if (button) navigate(button.dataset.reportView); });
  const preset = document.getElementById('dashboard-period');
  const startInput = document.getElementById('dashboard-date-start');
  const endInput = document.getElementById('dashboard-date-end');
  const dateError = document.getElementById('dashboard-date-error');
  function clearDateError() { dateError.hidden = true; startInput.removeAttribute('aria-invalid'); endInput.removeAttribute('aria-invalid'); }
  preset.addEventListener('change', () => {
    clearDateError();
    if (preset.value === 'custom') { startInput.focus(); return; }
    const selected = D.period(Number(preset.value));
    appliedRange = { start: selected.start, end: selected.end };
    render();
  });
  for (const input of [startInput, endInput]) {
    input.addEventListener('input', () => { preset.value = 'custom'; clearDateError(); });
    input.addEventListener('click', () => { try { input.showPicker?.(); } catch {} });
  }
  document.getElementById('dashboard-filters').addEventListener('submit', event => {
    event.preventDefault(); clearDateError();
    try { D.range(startInput.value, endInput.value); }
    catch {
      dateError.textContent = !startInput.value || !endInput.value ? 'Vui lòng chọn đủ ngày bắt đầu và ngày kết thúc.' : 'Ngày kết thúc phải bằng hoặc sau ngày bắt đầu. Vui lòng kiểm tra lại khoảng thời gian.';
      dateError.hidden = false;
      const invalid = !startInput.value ? startInput : endInput;
      invalid.setAttribute('aria-invalid', 'true'); invalid.focus(); return;
    }
    preset.value = 'custom';
    appliedRange = { start: startInput.value, end: endInput.value };
    render();
  });
  document.getElementById('dashboard-export').addEventListener('click',()=>{
    const rows=filteredRows(); const csvCell=value=>{ const text=String(value); return '"'+(/^[=+@-]/.test(text)?"'":'')+text.replace(/"/g,'""')+'"'; };
    const csv='\uFEFF'+[table.headers,...rows].map(row=>row.map(csvCell).join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));const link=document.createElement('a');link.href=url;link.download='gocdesk-mau-'+view+'-'+current.start+'-'+current.end+'.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    document.getElementById('dashboard-feedback').textContent='Đã xuất '+rows.length+' dòng dữ liệu mẫu của bảng '+table.title+' theo bộ lọc hiện tại.';
  });
  // Một ô giải thích dùng chung, mở bằng chuột, bàn phím hoặc chạm.
  const help = document.createElement('div');
  help.id = 'dashboard-metric-tooltip';
  help.className = 'dashboard-metric-tooltip';
  help.setAttribute('role', 'tooltip');
  help.hidden = true;
  document.body.appendChild(help);
  let helpTrigger = null, helpTimer;
  function hideMetricHelp() {
    clearTimeout(helpTimer);
    help.hidden = true;
    if (helpTrigger) {
      helpTrigger.setAttribute('aria-expanded', 'false');
      helpTrigger.removeAttribute('aria-describedby');
    }
    helpTrigger = null;
  }
  function showMetricHelp(button) {
    hideMetricHelp();
    helpTrigger = button;
    help.textContent = button.dataset.metricInfo;
    help.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    button.setAttribute('aria-describedby', help.id);
    const rect = button.getBoundingClientRect();
    const width = help.offsetWidth, height = help.offsetHeight;
    help.style.left = Math.max(12, Math.min(rect.left - 15, window.innerWidth - width - 12)) + 'px';
    help.style.top = (rect.bottom + height + 18 <= window.innerHeight ? rect.bottom + 10 : Math.max(12, rect.top - height - 10)) + 'px';
  }
  root.addEventListener('pointerover', event => {
    const button = event.target.closest('.metric-info');
    if (button && event.pointerType !== 'touch' && !button.contains(event.relatedTarget)) showMetricHelp(button);
  });
  root.addEventListener('pointerout', event => {
    const button = event.target.closest('.metric-info');
    if (button && !button.contains(event.relatedTarget)) helpTimer = setTimeout(hideMetricHelp, 180);
  });
  help.addEventListener('pointerenter', () => clearTimeout(helpTimer));
  help.addEventListener('pointerleave', hideMetricHelp);
  root.addEventListener('focusin', event => {
    if (event.target.matches('.metric-info')) showMetricHelp(event.target);
  });
  root.addEventListener('focusout', event => {
    if (event.target.matches('.metric-info')) hideMetricHelp();
  });
  document.addEventListener('click', event => {
    const button = event.target.closest('.metric-info');
    if (button) showMetricHelp(button);
    else if (!help.contains(event.target)) hideMetricHelp();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') hideMetricHelp(); });
  window.addEventListener('resize', hideMetricHelp);
  window.addEventListener('scroll', hideMetricHelp, true);
  render();
})();