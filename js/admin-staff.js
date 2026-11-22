(() => {
  'use strict';
  const api = (path) => new URL(`/api/${path}`, window.GOCDESK_API_BASE_URL || `${location.protocol}//${location.hostname}:3000`);
  const state = document.getElementById('staff-auth-state');
  const login = document.getElementById('staff-login');
  const app = document.getElementById('staff-app');
  const feedback = document.getElementById('staff-feedback');
  async function request(path, options = {}) {
    const response = await fetch(api(path), { credentials: 'include', ...options, headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers } });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || `Yêu cầu thất bại (${response.status}).`);
    return payload.data;
  }
  function say(message, error = false) { feedback.textContent = message; feedback.className = error ? 'staff-error' : 'staff-success'; }
  async function checkAdmin() {
    try { const result = await request('auth/me'); if (result.user?.role !== 'admin') throw new Error('Chỉ Admin mới được quản lý nhân viên.'); login.hidden = true; app.hidden = false; state.textContent = `Đang đăng nhập: ${result.user.fullName}`; await loadStaff(); }
    catch { login.hidden = false; app.hidden = true; state.textContent = 'Đăng nhập bằng tài khoản Admin để tiếp tục.'; }
  }
  async function loadStaff() {
    try {
      const { staff } = await request('admin/staff'); const root = document.getElementById('staff-rows'); root.replaceChildren();
      for (const person of staff || []) {
        const tr = document.createElement('tr');
        const cell = (value) => { const td = document.createElement('td'); td.textContent = value || ''; tr.append(td); return td; };
        cell(person.fullName); cell(person.email);
        const roleCell = cell(person.role); const role = document.createElement('select');
        for (const [value,label] of [['member','Member'],['product_content_staff','Product Content Staff'],['order_support_staff','Order Support Staff']]) { const option = document.createElement('option'); option.value=value; option.textContent=label; option.selected=person.role===value; role.append(option); }
        roleCell.append(role); const statusCell = cell(person.accountStatus);
        const actions = cell('');
        const saveRole = document.createElement('button'); saveRole.type='button'; saveRole.textContent='Lưu quyền'; saveRole.addEventListener('click', async()=>{ try { await request(`admin/users/${encodeURIComponent(person.id)}/role`,{method:'PATCH',body:JSON.stringify({role:role.value})}); say('Đã cập nhật quyền.'); await loadStaff(); } catch(e){say(e.message,true);} }); actions.append(saveRole);
        const statusButton = document.createElement('button'); statusButton.type='button'; statusButton.textContent=person.accountStatus==='locked'?'Mở khóa':'Khóa'; statusButton.addEventListener('click',async()=>{try{await request(`admin/users/${encodeURIComponent(person.id)}/status`,{method:'PATCH',body:JSON.stringify({accountStatus:person.accountStatus==='locked'?'active':'locked'})});say('Đã cập nhật trạng thái.');await loadStaff();}catch(e){say(e.message,true);}}); actions.append(statusButton);
        if (person.accountStatus === 'pending') { const resend=document.createElement('button');resend.type='button';resend.textContent='Gửi lại lời mời';resend.addEventListener('click',async()=>{try{await request(`admin/staff/${encodeURIComponent(person.id)}/invitation/resend`,{method:'POST'});say('Đã gửi lại lời mời nếu tài khoản đủ điều kiện.');}catch(e){say(e.message,true);}});actions.append(resend); }
        root.append(tr);
      }
    } catch (error) { say(error.message,true); }
  }
  login.addEventListener('submit', async (event) => { event.preventDefault(); const form=event.currentTarget; const password=form.elements.password.value; try { await request('auth/login',{method:'POST',body:JSON.stringify({identity:form.elements.identity.value.trim(),password,rememberMe:false})}); form.elements.password.value=''; await checkAdmin(); } catch(error){form.elements.password.value='';state.textContent=error.message;} });
  document.getElementById('staff-create').addEventListener('submit',async(event)=>{event.preventDefault();const form=event.currentTarget;try{await request('admin/staff',{method:'POST',body:JSON.stringify({fullName:form.elements.fullName.value.trim(),email:form.elements.email.value.trim(),role:form.elements.role.value})});say('Đã tạo tài khoản và gửi lời mời.');form.reset();await loadStaff();}catch(error){say(error.message,true);}});
  checkAdmin();
})();
