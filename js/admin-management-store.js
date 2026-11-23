/* Dữ liệu và thao tác quản trị mẫu, chỉ lưu localStorage. API thật phải kiểm tra quyền ở máy chủ. */
(() => {
 const key='gocdesk.management.demo.v1';
 const catalog=globalThis.GocDeskCatalog, demo=window.GDAdminDashboardData;
 if(!catalog||!demo)return;
 const clone=value=>JSON.parse(JSON.stringify(value));
 const clean=(value,max=1000)=>String(value??'').trim().slice(0,max);
 const money=value=>{const n=Number(value);if(!Number.isSafeInteger(n)||n<0||n>1e12)throw Error('Giá phải là số nguyên từ 0 đến 1.000 tỷ đồng.');return n;};
 const count=value=>{const n=Number(value);if(!Number.isSafeInteger(n)||n<0||n>1e7)throw Error('Số lượng phải là số nguyên không âm, tối đa 10 triệu.');return n;};
 function seed(){
  const orders=clone(demo.orders.filter(o=>o.date>='2026-10-01'));
  const ids=[...new Set(orders.map(o=>o.customer))].sort();
  return {version:1,categories:clone(catalog.categories),products:catalog.products.map((p,i)=>({...clone(p),sku:'GD-'+String(i+1).padStart(4,'0'),stock:[42,8,23,0,67,6,18,35][i%8],threshold:10,status:i===catalog.products.length-1?'Đang ẩn':'Đang bán'})),customers:ids.map((id,i)=>({id,name:'Khách hàng '+id.slice(2),email:'khach'+id.slice(2)+'@example.test',phone:'',status:i%19===0?'Tạm ngưng':'Đang hoạt động',note:'',joined:'2026-09-'+String(i%28+1).padStart(2,'0')})),orders,tickets:clone(demo.tickets.filter(t=>t.date>='2026-10-01')).map(t=>({...t,messages:t.response===null?[]:[{date:t.date,text:'Góc Desk đã tiếp nhận và đang hỗ trợ yêu cầu của bạn.'}]})),reviews:clone(demo.reviews.filter(r=>r.date>='2026-10-01')).map(r=>({...r,reply:r.status==='Đã phản hồi'?'Cảm ơn bạn đã chia sẻ trải nghiệm với Góc Desk.':''})),history:[]};
 }
 let state;
 try{const raw=localStorage.getItem(key);if(raw){const parsed=JSON.parse(raw);if(parsed.version===1&&['categories','products','customers','orders','tickets','reviews','history'].every(k=>Array.isArray(parsed[k])))state=parsed;}}catch{}
 if(!state)state=seed();
 function change(allowed,action){if(!window.GDAdminAuth?.canManage(allowed))throw Error('Vai trò hiện tại không được thực hiện thao tác này.');const next=clone(state);const result=action(next);try{localStorage.setItem(key,JSON.stringify(next));}catch{throw Error('Không thể lưu trên trình duyệt. Kiểm tra dung lượng hoặc quyền lưu trữ rồi thử lại.');}state=next;return result;}
 function find(rows,id){const row=rows.find(r=>r.id===id);if(!row)throw Error('Không tìm thấy dữ liệu.');return row;}
 function audit(s,action,target,detail){s.history.unshift({id:'LOG-'+Date.now()+'-'+s.history.length,date:new Date().toISOString(),action,target,detail});}
 const api={read:()=>clone(state),
 saveProduct(id,fields){return change('products',s=>{
  const name=clean(fields.name,160),brand=clean(fields.brand,80),category=clean(fields.category,80),description=clean(fields.description,2000),image=clean(fields.image,500);
  if(name.length<3)throw Error('Tên sản phẩm cần ít nhất 3 ký tự.');
  if(!s.categories.some(c=>c.id===category))throw Error('Vui lòng chọn danh mục hợp lệ.');
  if(!/^images\/[A-Za-z0-9_./% -]+$/i.test(image)||image.includes('..'))throw Error('Ảnh cần là đường dẫn trong thư mục images, không chứa dấu ..');
  if(!['Đang bán','Đang ẩn'].includes(fields.status))throw Error('Trạng thái sản phẩm không hợp lệ.');
  const values={name,fullName:name,brand,category,description,image,price:money(fields.price),status:fields.status};
  if(id){Object.assign(find(s.products,id),values);audit(s,'Cập nhật sản phẩm',name,'Cập nhật thông tin và giá bán.');}
  else{const newId='gd-product-'+Date.now();s.products.unshift({...values,id:newId,sku:'GD-'+Date.now().toString().slice(-7),stock:count(fields.stock??0),threshold:10,colors:[],features:[],specs:[]});audit(s,'Thêm sản phẩm',name,'Tạo sản phẩm mới.');}
 });},
 setVisibility(id){return change('products',s=>{const p=find(s.products,id);p.status=p.status==='Đang bán'?'Đang ẩn':'Đang bán';audit(s,p.status==='Đang ẩn'?'Ẩn sản phẩm':'Hiển thị sản phẩm',p.name,p.status);});},
 saveCategory(id,name){return change('products',s=>{name=clean(name,80);if(name.length<2)throw Error('Tên danh mục cần ít nhất 2 ký tự.');if(s.categories.some(c=>c.id!==id&&c.name.toLocaleLowerCase('vi')===name.toLocaleLowerCase('vi')))throw Error('Tên danh mục đã tồn tại.');if(id)find(s.categories,id).name=name;else s.categories.push({id:'category-'+Date.now(),name});audit(s,'Cập nhật danh mục',name,id?'Đổi tên danh mục.':'Thêm danh mục mới.');});},
 adjustStock(id,fields){return change('products',s=>{const p=find(s.products,id),stock=count(fields.stock),threshold=count(fields.threshold),reason=clean(fields.reason,500);if(reason.length<5)throw Error('Vui lòng nhập lý do điều chỉnh ít nhất 5 ký tự.');audit(s,'Điều chỉnh tồn kho',p.name,p.stock+' → '+stock+' sản phẩm. '+reason);p.stock=stock;p.threshold=threshold;});},
 saveCustomer(id,fields){return change('customers',s=>{const c=find(s.customers,id),name=clean(fields.name,100),email=clean(fields.email,120),phone=clean(fields.phone,20);if(name.length<2)throw Error('Vui lòng nhập tên khách hàng.');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Email không hợp lệ.');if(phone&&!/^[+0-9 ()-]{8,20}$/.test(phone))throw Error('Số điện thoại không hợp lệ.');Object.assign(c,{name,email,phone,note:clean(fields.note,1000)});});},
 saveTicket(id,fields){return change('customers',s=>{const t=find(s.tickets,id),text=clean(fields.reply,2000),status=fields.status;if(!['Chưa phản hồi','Đang xử lý','Đã giải quyết'].includes(status))throw Error('Trạng thái yêu cầu không hợp lệ.');if(status!=='Chưa phản hồi'&&!text&&!t.messages.length)throw Error('Cần có phản hồi trước khi chuyển sang xử lý hoặc giải quyết.');if(status==='Chưa phản hồi'&&t.messages.length)throw Error('Yêu cầu đã trả lời không thể chuyển về Chưa phản hồi.');if(text){t.messages.push({date:new Date().toISOString(),text});if(t.response===null)t.response=Math.max(0,Math.round((Date.now()-Date.parse(t.date+'T00:00:00+07:00'))/60000));}t.status=text&&status==='Chưa phản hồi'?'Đang xử lý':status;});},
 saveReview(id,reply){return change('customers',s=>{const r=find(s.reviews,id);reply=clean(reply,2000);if(reply.length<5)throw Error('Phản hồi cần ít nhất 5 ký tự.');r.reply=reply;r.status='Đã phản hồi';});}
 };
 window.GDAdminManagement=api;
})();
