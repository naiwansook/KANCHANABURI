import Head from 'next/head'
import { useEffect, useRef } from 'react'

// API helper — replaces all google.script.run calls
async function api(fn, ...params) {
  const res = await fetch(`/api/${fn}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ params })
  })
  return res.json()
}

export default function Home() {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    // Inject the original JS logic after mount
    initApp()
  }, [])

  return (
    <>
      <Head>
        <title>Resort Manager Pro</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        :root{--p1:#1e3a5f;--p2:#2563eb;--p3:#3b82f6;--p4:#60a5fa;--p5:#dbeafe;--p6:#eff6ff;--ok:#10b981;--err:#ef4444;--warn:#f59e0b;--bg:#f1f5f9;--cd:#fff;--tx:#1e293b;--sb:#64748b;--bd:#e2e8f0;--sw:250px;--sc:68px}
        *{box-sizing:border-box;margin:0;padding:0}body{font-family:'Prompt',sans-serif;background:var(--bg);color:var(--tx);font-size:13.5px}
        ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:3px}
        .sd{position:fixed;left:0;top:0;bottom:0;width:var(--sw);background:linear-gradient(180deg,var(--p1),#0f2942);color:#fff;z-index:1000;transition:.3s;overflow:hidden;display:flex;flex-direction:column}.sd.c{width:var(--sc)}.sd-h{padding:18px 16px;display:flex;align-items:center;gap:10px;border-bottom:1px solid rgba(255,255,255,.08)}.sd-h i{font-size:1.3rem;min-width:36px;text-align:center;color:var(--p4)}.sd-h span{font-weight:600;font-size:1rem;white-space:nowrap}.sd.c .sd-h span,.sd.c .nl,.sd.c .ui span{display:none}.sd-n{flex:1;overflow-y:auto;padding:8px 0}.sn{padding:9px 14px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:.15s;border-radius:8px;margin:1px 6px;white-space:nowrap;font-size:.87rem;color:rgba(255,255,255,.7)}.sn:hover{background:rgba(255,255,255,.07);color:#fff}.sn.on{background:rgba(37,99,235,.5);color:#fff}.sn i{min-width:36px;text-align:center;font-size:1rem}.nl{font-size:.84rem}.sd-f{padding:14px;border-top:1px solid rgba(255,255,255,.08)}.ui{display:flex;align-items:center;gap:8px}.ui .av{width:34px;height:34px;border-radius:10px;background:var(--p2);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.85rem;flex-shrink:0}
        .mn{margin-left:var(--sw);transition:.3s;min-height:100vh;padding:20px 24px}.sd.c~.mn{margin-left:var(--sc)}.tb2{display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;flex-wrap:wrap;gap:10px}.tb2 h4{margin:0;font-weight:700;font-size:1.15rem;color:var(--p1)}.tbtn{background:none;border:none;font-size:1.2rem;cursor:pointer;color:var(--sb);padding:4px 8px;border-radius:6px}.tbtn:hover{background:var(--p5);color:var(--p2)}
        .kp{background:var(--cd);border-radius:14px;padding:18px;border:1px solid var(--bd)}.kp:hover{box-shadow:0 4px 16px rgba(0,0,0,.06)}.kv{font-size:1.4rem;font-weight:700}.kl{font-size:.76rem;color:var(--sb);margin-top:2px}.cs{background:var(--cd);border-radius:14px;padding:20px;border:1px solid var(--bd);margin-bottom:18px}.cs h5{font-weight:600;font-size:.95rem;margin-bottom:14px;color:var(--p1)}
        table.t1{font-size:.84rem;margin:0}table.t1 th{background:var(--p6);font-weight:600;color:var(--p1);padding:10px 12px;white-space:nowrap;border-bottom:2px solid var(--p5);position:sticky;top:0;z-index:1}table.t1 td{padding:10px 12px;vertical-align:middle;border-bottom:1px solid #f1f5f9}
        .st{padding:4px 10px;border-radius:6px;font-size:.72rem;font-weight:600;display:inline-block}.st-pe{background:#fef3c7;color:#92400e}.st-co{background:#d1fae5;color:#065f46}.st-ci{background:var(--p5);color:var(--p1)}.st-cx{background:#f1f5f9;color:#475569}.st-ca{background:#fee2e2;color:#991b1b}.st-pa{background:#d1fae5;color:#065f46}.st-un{background:#fee2e2;color:#991b1b}.st-dp{background:#fef3c7;color:#92400e}
        .bp{background:var(--p2);color:#fff;border:none;border-radius:10px;padding:8px 20px;font-weight:500;font-size:.87rem}.bp:hover{background:var(--p1);color:#fff}.bi{width:30px;height:30px;padding:0;display:inline-flex;align-items:center;justify-content:center;border-radius:8px;font-size:.78rem}
        .modal-content{border-radius:14px;border:none}.modal-header{background:var(--p1);color:#fff;border-radius:14px 14px 0 0;padding:16px 20px}.modal-header .btn-close{filter:invert(1)}.modal-header h5{font-size:1rem;font-weight:600}
        .form-control,.form-select{border-radius:8px;border:1.5px solid var(--bd);padding:9px 12px;font-size:.87rem}.form-control:focus,.form-select:focus{border-color:var(--p3);box-shadow:0 0 0 3px rgba(59,130,246,.12)}.form-label{font-weight:500;font-size:.82rem;margin-bottom:3px;color:var(--p1)}
        .bk{background:var(--cd);border:1px solid var(--bd);border-radius:12px;padding:16px;margin-bottom:10px}.bk:hover{border-color:var(--p4);box-shadow:0 2px 12px rgba(37,99,235,.08)}.bk.hd{border-left:4px solid var(--warn)}.bk-r{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}.bk-t{background:var(--p5);color:var(--p1);padding:3px 10px;border-radius:6px;font-size:.78rem;font-weight:500}.bk-d{background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:6px 12px;font-size:.8rem;margin-top:8px;display:flex;align-items:center;gap:6px}.bk-a{display:flex;gap:4px;align-items:center}
        .rt{display:inline-flex;align-items:center;gap:5px;padding:7px 14px;border-radius:8px 8px 0 0;cursor:pointer;font-size:.83rem;font-weight:500;background:#f1f5f9;border:1.5px solid var(--bd);border-bottom:none}.rt.on{background:#fff;border-color:var(--p3);color:var(--p2)}.rt .tc{width:16px;height:16px;border-radius:50%;background:var(--err);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:.55rem;margin-left:3px}.rp{display:none;border:1.5px solid var(--p3);border-radius:0 10px 10px 10px;padding:14px;background:#fff}.rp.on{display:block}
        .bt{font-size:.77rem}.bt th{background:var(--p6);padding:4px 8px;color:var(--p1)}.bt td{padding:4px 8px}.bt input{width:76px;text-align:right;padding:2px 5px;border:1px solid var(--bd);border-radius:5px;font-size:.77rem}
        .gt{background:linear-gradient(135deg,var(--p1),var(--p2));color:#fff;border-radius:10px;padding:14px;margin-top:10px}
        .iz{border:2px dashed var(--bd);border-radius:10px;padding:24px;text-align:center;cursor:pointer}.iz:hover{border-color:var(--p3);background:var(--p6)}.im{width:90px;height:70px;object-fit:cover;border-radius:8px;border:1.5px solid var(--bd)}
        .sh{position:relative}.sh input{padding-left:34px;border-radius:18px;font-size:.84rem}.sh i{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:#94a3b8}
        .es{text-align:center;padding:36px 20px;color:var(--sb)}.es i{font-size:2.5rem;margin-bottom:8px;opacity:.4}
        .ps{display:none}.ps.active{display:block}
        #LO{position:fixed;inset:0;background:linear-gradient(135deg,var(--p1),var(--p2));z-index:9999;display:flex;align-items:center;justify-content:center}
        #AL{position:fixed;inset:0;background:#fff;z-index:8888;display:flex;flex-direction:column;align-items:center;justify-content:center}
        .cg{display:grid;grid-template-columns:repeat(7,1fr);gap:2px}.ch{text-align:center;font-weight:600;font-size:.78rem;padding:6px 0;color:var(--p1)}.cd2{min-height:70px;background:#fff;border:1px solid var(--bd);border-radius:6px;padding:4px;font-size:.75rem;cursor:pointer;position:relative}.cd2:hover{border-color:var(--p3)}.cd2.ot{opacity:.3;pointer-events:none}.cd2.td{border:2px solid var(--p2)}.dn{font-weight:600;font-size:.82rem}.cd2.hl .dn{color:var(--err)}.cd2.sa .dn{color:var(--p2)}.cd2.su .dn{color:var(--err)}.ca{font-size:.65rem;margin-top:2px}.cf{color:var(--err);font-weight:600}.cv{color:var(--ok);font-weight:600}.hn{font-size:.6rem;color:var(--err);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .dr{padding:4px 8px;border-radius:6px;margin:2px 0;font-size:.82rem;display:flex;justify-content:space-between}.dr.fr{background:#d1fae5;color:#065f46}.dr.oc{background:#fee2e2;color:#991b1b}
        @media(max-width:768px){.sd{width:var(--sc)}.sd .nl,.sd .sd-h span,.sd .ui span{display:none}.mn{margin-left:var(--sc);padding:14px}.cd2{min-height:50px}}
      `}</style>

      {/* LOGIN */}
      <div id="LO">
        <div style={{background:'#fff',borderRadius:'18px',boxShadow:'0 20px 60px rgba(0,0,0,.25)',padding:'36px',width:'360px',maxWidth:'90vw'}}>
          <div style={{width:'70px',height:'70px',background:'var(--p2)',borderRadius:'16px',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',color:'#fff',fontSize:'1.8rem'}}><i className="fas fa-hotel"></i></div>
          <h4 className="text-center fw-bold mb-1" style={{color:'var(--p1)'}}>Resort Manager</h4>
          <p className="text-center mb-4" style={{color:'var(--sb)',fontSize:'.85rem'}}>เข้าสู่ระบบ</p>
          <div className="mb-3"><input type="text" id="lu" className="form-control" placeholder="Username" onKeyPress={(e)=>{if(e.key==='Enter')window.LI&&window.LI()}} /></div>
          <div className="mb-3"><input type="password" id="lp" className="form-control" placeholder="Password" onKeyPress={(e)=>{if(e.key==='Enter')window.LI&&window.LI()}} /></div>
          <button className="btn bp w-100 py-2" onClick={()=>window.LI&&window.LI()} id="lb">เข้าสู่ระบบ</button>
          <div id="le" className="text-danger text-center small mt-2" style={{display:'none'}}></div>
        </div>
      </div>

      {/* LOADING */}
      <div id="AL" style={{display:'none'}}>
        <div className="spinner-border text-primary mb-3" style={{width:'2.5rem',height:'2.5rem'}}></div>
        <p style={{color:'var(--sb)'}}>กำลังโหลด...</p>
      </div>

      {/* SIDEBAR */}
      <div className="sd" id="SD">
        <div className="sd-h"><i className="fas fa-hotel"></i><span>Resort Manager</span></div>
        <div className="sd-n">
          <div className="sn on" onClick={(e)=>window.NV&&window.NV('da',e.currentTarget)}><i className="fas fa-chart-pie"></i><span className="nl">แดชบอร์ด</span></div>
          <div className="sn" onClick={(e)=>window.NV&&window.NV('bk',e.currentTarget)}><i className="fas fa-calendar-check"></i><span className="nl">การจอง</span></div>
          <div className="sn" onClick={(e)=>window.NV&&window.NV('cl',e.currentTarget)}><i className="fas fa-calendar-alt"></i><span className="nl">ปฏิทินห้องพัก</span></div>
          <div className="sn" onClick={(e)=>window.NV&&window.NV('rm',e.currentTarget)}><i className="fas fa-bed"></i><span className="nl">ห้องพัก</span></div>
          <div className="sn" onClick={(e)=>window.NV&&window.NV('tx',e.currentTarget)}><i className="fas fa-exchange-alt"></i><span className="nl">รายรับ-รายจ่าย</span></div>
          <div className="sn" onClick={(e)=>window.NV&&window.NV('ct',e.currentTarget)}><i className="fas fa-tags"></i><span className="nl">หมวดหมู่</span></div>
          <div className="sn" onClick={(e)=>window.NV&&window.NV('bu',e.currentTarget)}><i className="fas fa-wallet"></i><span className="nl">งบประมาณ</span></div>
          <div className="sn" onClick={(e)=>window.NV&&window.NV('pc',e.currentTarget)}><i className="fas fa-file-pdf"></i><span className="nl">จัดการใบจอง</span></div>
          <div className="sn pm" onClick={(e)=>window.NV&&window.NV('us',e.currentTarget)}><i className="fas fa-users-cog"></i><span className="nl">จัดการผู้ใช้</span></div>
          <div className="sn" onClick={(e)=>window.NV&&window.NV('st',e.currentTarget)}><i className="fas fa-cog"></i><span className="nl">ตั้งค่า</span></div>
        </div>
        <div className="sd-f"><div className="ui"><div className="av" id="uA">A</div><span id="uN" style={{fontSize:'.83rem'}}>Admin</span></div></div>
      </div>

      {/* MAIN */}
      <div className="mn">
        <div className="tb2">
          <div className="d-flex align-items-center gap-2">
            <button className="tbtn" onClick={()=>document.getElementById('SD').classList.toggle('c')}><i className="fas fa-bars"></i></button>
            <h4 id="pT">แดชบอร์ด</h4>
          </div>
          <div className="d-flex gap-2 align-items-center">
            <span style={{color:'var(--sb)',fontSize:'.82rem'}} id="dL"></span>
            <button className="btn btn-outline-danger btn-sm rounded-pill" style={{fontSize:'.8rem'}} onClick={()=>location.reload()}><i className="fas fa-sign-out-alt me-1"></i>ออก</button>
          </div>
        </div>

        {/* DASHBOARD */}
        <div className="ps active" id="p-da">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0" style={{color:'var(--p1)'}}><i className="fas fa-chart-pie me-2"></i>แดชบอร์ด</h5>
            <div className="d-flex gap-2 align-items-center">
              <label className="small fw-bold mb-0" style={{color:'var(--p1)'}}>เดือน:</label>
              <input type="month" id="dMo" className="form-control form-control-sm" style={{width:'auto'}} onChange={()=>window.RD&&window.RD()} />
            </div>
          </div>
          <div className="row g-3 mb-3">
            <div className="col-6 col-lg-2"><div className="kp"><div className="kv" id="sR">0</div><div className="kl">ห้องพัก</div></div></div>
            <div className="col-6 col-lg-2"><div className="kp"><div className="kv" id="sB">0</div><div className="kl">จองเดือนนี้</div></div></div>
            <div className="col-6 col-lg-2"><div className="kp"><div className="kv text-success" id="sI">฿0</div><div className="kl">รายได้</div></div></div>
            <div className="col-6 col-lg-2"><div className="kp"><div className="kv text-danger" id="sE">฿0</div><div className="kl">รายจ่าย</div></div></div>
            <div className="col-6 col-lg-2"><div className="kp"><div className="kv" id="sP" style={{color:'var(--p2)'}}>฿0</div><div className="kl">กำไรสุทธิ</div></div></div>
            <div className="col-6 col-lg-2"><div className="kp"><div className="kv" id="sO" style={{color:'var(--warn)'}}>฿0</div><div className="kl">ค้างชำระ</div></div></div>
          </div>
          <div className="row g-3 mb-3">
            <div className="col-md-6"><div className="cs" style={{minHeight:'280px'}}><h5><i className="fas fa-arrow-circle-down me-2 text-success"></i>รายรับตามหมวดหมู่</h5><canvas id="chI" height="200"></canvas><div id="chIL" className="mt-2" style={{fontSize:'.78rem'}}></div></div></div>
            <div className="col-md-6"><div className="cs" style={{minHeight:'280px'}}><h5><i className="fas fa-arrow-circle-up me-2 text-danger"></i>รายจ่ายตามหมวดหมู่</h5><canvas id="chE" height="200"></canvas><div id="chEL" className="mt-2" style={{fontSize:'.78rem'}}></div></div></div>
          </div>
          <div className="row g-3">
            <div className="col-lg-8"><div className="cs"><h5><i className="fas fa-clock me-2" style={{color:'var(--p3)'}}></i>จองล่าสุด</h5><div className="table-responsive"><table className="t1 table"><thead><tr><th>#</th><th>ลูกค้า</th><th>ห้อง</th><th>เช็คอิน</th><th>สถานะ</th><th>ราคา</th></tr></thead><tbody id="dR"></tbody></table></div></div></div>
            <div className="col-lg-4">
              <div className="cs"><h5><i className="fas fa-link me-2" style={{color:'var(--p3)'}}></i>ลิงก์จอง</h5><div className="input-group"><input type="text" id="bU" className="form-control form-control-sm" readOnly style={{fontSize:'.8rem'}} /><button className="btn btn-outline-primary btn-sm" onClick={()=>{navigator.clipboard.writeText(document.getElementById('bU').value);alert('คัดลอก!')}}><i className="fas fa-copy"></i></button></div></div>
              <div className="cs mt-3"><h5><i className="fas fa-door-open me-2" style={{color:'var(--ok)'}}></i>สถานะห้อง</h5><div id="dS"></div></div>
            </div>
          </div>
        </div>

        {/* BOOKINGS */}
        <div className="ps" id="p-bk">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <div className="d-flex gap-2 align-items-center">
              <div className="sh"><i className="fas fa-search"></i><input type="text" className="form-control form-control-sm" placeholder="ค้นหา..." id="bS" onInput={()=>window.RB&&window.RB()} /></div>
              <select className="form-select form-select-sm" style={{width:'auto'}} id="bF" onChange={()=>window.RB&&window.RB()}><option value="all">ทั้งหมด</option><option value="pending">รอยืนยัน</option><option value="confirmed">ยืนยัน</option><option value="checked_in">เช็คอิน</option><option value="checked_out">เช็คเอาท์</option><option value="cancelled">ยกเลิก</option></select>
            </div>
            <button className="btn bp" onClick={()=>window.OB&&window.OB()}><i className="fas fa-plus me-2"></i>สร้างการจอง</button>
          </div>
          <div id="bL"></div>
        </div>

        {/* CALENDAR */}
        <div className="ps" id="p-cl">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center gap-2">
              <button className="btn btn-outline-secondary btn-sm" onClick={()=>window.CN&&window.CN(-1)}><i className="fas fa-chevron-left"></i></button>
              <h5 className="mb-0 mx-3" id="cT" style={{color:'var(--p1)',minWidth:'160px',textAlign:'center'}}></h5>
              <button className="btn btn-outline-secondary btn-sm" onClick={()=>window.CN&&window.CN(1)}><i className="fas fa-chevron-right"></i></button>
            </div>
            <div className="d-flex gap-1"><span className="st st-co">ว่าง</span><span className="st st-ca">เต็ม</span><span className="st st-pe">หยุด</span></div>
          </div>
          <div className="cs p-2">
            <div className="cg"><div className="ch">จ</div><div className="ch">อ</div><div className="ch">พ</div><div className="ch">พฤ</div><div className="ch">ศ</div><div className="ch we">ส</div><div className="ch we">อา</div></div>
            <div className="cg" id="cG"></div>
          </div>
        </div>

        {/* ROOMS */}
        <div className="ps" id="p-rm">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="sh"><i className="fas fa-search"></i><input type="text" className="form-control form-control-sm" placeholder="ค้นหาห้อง..." id="rS" onInput={()=>window.RR&&window.RR()} /></div>
            <button className="btn bp" onClick={()=>window.OR&&window.OR()}><i className="fas fa-plus me-2"></i>เพิ่มห้อง</button>
          </div>
          <div className="row g-3" id="rC"></div>
        </div>

        {/* TRANSACTIONS */}
        <div className="ps" id="p-tx">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <div className="d-flex gap-2">
              <select className="form-select form-select-sm" style={{width:'auto'}} id="tM" onChange={()=>window.RT&&window.RT()}></select>
              <select className="form-select form-select-sm" style={{width:'auto'}} id="tP" onChange={()=>window.RT&&window.RT()}><option value="all">ทั้งหมด</option><option value="income">รายรับ</option><option value="expense">รายจ่าย</option></select>
            </div>
            <button className="btn bp" onClick={()=>window.OT&&window.OT()}><i className="fas fa-plus me-2"></i>เพิ่ม</button>
          </div>
          <div className="row g-3 mb-3">
            <div className="col-md-4"><div className="kp"><div className="kl">รายรับ</div><div className="kv text-success" id="tI">฿0</div></div></div>
            <div className="col-md-4"><div className="kp"><div className="kl">รายจ่าย</div><div className="kv text-danger" id="tE">฿0</div></div></div>
            <div className="col-md-4"><div className="kp"><div className="kl">คงเหลือ</div><div className="kv" id="tN">฿0</div></div></div>
          </div>
          <div className="cs p-0"><div className="table-responsive" style={{maxHeight:'55vh',overflowY:'auto'}}><table className="t1 table"><thead><tr><th>วันที่</th><th>หมวด</th><th>ประเภท</th><th>จำนวน</th><th>รายละเอียด</th><th>โดย</th><th></th></tr></thead><tbody id="tB"></tbody></table></div></div>
        </div>

        {/* CATEGORIES */}
        <div className="ps" id="p-ct">
          <div className="d-flex justify-content-between align-items-center mb-3"><h6 className="mb-0" style={{color:'var(--p1)'}}>หมวดหมู่</h6><button className="btn bp btn-sm" onClick={()=>window.OC&&window.OC()}><i className="fas fa-plus me-2"></i>เพิ่ม</button></div>
          <div className="row g-3" id="cC"></div>
        </div>

        {/* BUDGETS */}
        <div className="ps" id="p-bu">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex gap-2 align-items-center"><label className="form-label mb-0 small fw-bold">เดือน:</label><input type="month" id="bM" className="form-control form-control-sm" style={{width:'auto'}} onChange={()=>window.RU&&window.RU()} /></div>
            <button className="btn bp btn-sm" onClick={()=>window.AB&&window.AB()}><i className="fas fa-plus me-2"></i>เพิ่ม</button>
          </div>
          <div className="cs"><div className="table-responsive"><table className="t1 table"><thead><tr><th>หมวด</th><th>งบ</th><th>ใช้จริง</th><th>เหลือ</th><th>%</th><th></th></tr></thead><tbody id="uB"></tbody></table></div><button className="btn btn-success btn-sm mt-3" onClick={()=>window.SU&&window.SU()}><i className="fas fa-save me-2"></i>บันทึก</button></div>
        </div>

        {/* PDF */}
        <div className="ps" id="p-pc">
          <div className="cs">
            <h5><i className="fas fa-file-pdf me-2" style={{color:'var(--err)'}}></i>จัดการใบยืนยันจอง (PDF)</h5>
            <div className="row g-3">
              <div className="col-md-6"><label className="form-label">ชื่อกิจการ</label><input type="text" id="pN" className="form-control" /></div>
              <div className="col-md-6"><label className="form-label">Prefix เลขเอกสาร</label><input type="text" id="pX" className="form-control" defaultValue="RCI" /></div>
              <div className="col-12"><label className="form-label">ที่อยู่</label><textarea id="pA" className="form-control" rows="2"></textarea></div>
              <div className="col-md-4"><label className="form-label">เบอร์โทร</label><input type="text" id="pH" className="form-control" /></div>
              <div className="col-md-4"><label className="form-label">Facebook</label><input type="text" id="pF" className="form-control" /></div>
              <div className="col-md-4"><label className="form-label">Email</label><input type="text" id="pE" className="form-control" /></div>
              <div className="col-6"><label className="form-label">โลโก้</label><div className="iz" style={{height:'70px',padding:'10px'}} onClick={()=>document.getElementById('pLF').click()}><img id="pLP" src="" style={{maxHeight:'100%',maxWidth:'100%',display:'none'}} /><span id="pLH"><i className="fas fa-image"></i></span></div><input type="file" id="pLF" accept="image/*" style={{display:'none'}} onChange={(e)=>window.LF&&window.LF(e.target,'pL')} /></div>
              <div className="col-6"><label className="form-label">ลายเซ็น</label><div className="iz" style={{height:'70px',padding:'5px'}} onClick={()=>document.getElementById('pSF').click()}><img id="pSP" src="" style={{maxHeight:'100%',maxWidth:'100%',display:'none'}} /><span id="pSH"><i className="fas fa-signature"></i></span></div><input type="file" id="pSF" accept="image/*" style={{display:'none'}} onChange={(e)=>window.LF&&window.LF(e.target,'pS')} /></div>
              <div className="col-md-6"><label className="form-label">ผู้ลงนาม</label><input type="text" id="pG" className="form-control" /></div>
              <div className="col-md-6"><label className="form-label">ช่องทางชำระ</label><input type="text" id="pY" className="form-control" /></div>
              <div className="col-12"><label className="form-label">หมายเหตุในใบจอง</label><textarea id="pO" className="form-control" rows="2"></textarea></div>
              <div className="col-12"><label className="form-label">เงื่อนไข</label><textarea id="pQ" className="form-control" rows="3"></textarea></div>
            </div>
            <button className="btn bp mt-3" onClick={()=>window.SP&&window.SP()}><i className="fas fa-save me-2"></i>บันทึก</button>
            <button className="btn btn-outline-primary mt-3 ms-2" onClick={()=>window.PP&&window.PP()}><i className="fas fa-eye me-2"></i>ตัวอย่าง</button>
            <div id="pV" className="mt-3" style={{display:'none'}}><iframe id="pI" style={{width:'100%',height:'500px',border:'2px solid var(--bd)',borderRadius:'10px'}}></iframe></div>
          </div>
        </div>

        {/* USERS */}
        <div className="ps" id="p-us">
          <div className="d-flex justify-content-between align-items-center mb-3"><h6 className="mb-0">จัดการผู้ใช้</h6><button className="btn bp btn-sm" onClick={()=>window.OU&&window.OU()}><i className="fas fa-plus me-2"></i>เพิ่ม</button></div>
          <div className="cs p-0"><div className="table-responsive"><table className="t1 table"><thead><tr><th>Username</th><th>ชื่อ</th><th>บทบาท</th><th>สิทธิ์</th><th></th></tr></thead><tbody id="uT"></tbody></table></div></div>
        </div>

        {/* SETTINGS */}
        <div className="ps" id="p-st">
          <div className="cs"><h5><i className="fas fa-user-circle me-2" style={{color:'var(--p2)'}}></i>โปรไฟล์</h5><div className="row g-3"><div className="col-md-6"><label className="form-label">ชื่อรีสอร์ท</label><input type="text" id="fN" className="form-control" /></div><div className="col-md-6"><label className="form-label">โลโก้ URL</label><input type="text" id="fI" className="form-control" /></div></div><button className="btn bp mt-3" onClick={()=>window.SF&&window.SF()}><i className="fas fa-save me-2"></i>บันทึก</button></div>
          <div className="cs mt-3"><h5><i className="fas fa-link me-2" style={{color:'var(--p3)'}}></i>ลิงก์จอง</h5><div className="input-group"><input type="text" id="sU" className="form-control" readOnly /><button className="btn btn-outline-primary" onClick={()=>{navigator.clipboard.writeText(document.getElementById('sU').value);alert('คัดลอก!')}}><i className="fas fa-copy"></i></button></div></div>
        </div>
      </div>

      {/* MODALS - booking */}
      <div className="modal fade" id="mB" tabIndex="-1"><div className="modal-dialog modal-xl"><div className="modal-content"><div className="modal-header"><h5 className="modal-title" id="mBT"><i className="fas fa-calendar-plus me-2"></i>สร้างการจอง</h5><button type="button" className="btn-close" data-bs-dismiss="modal"></button></div><div className="modal-body" style={{maxHeight:'75vh',overflowY:'auto'}}><input type="hidden" id="mBI" /><div className="row g-3 mb-3"><div className="col-md-4"><label className="form-label">ชื่อลูกค้า *</label><input type="text" id="mBN" className="form-control" /></div><div className="col-md-3"><label className="form-label">เบอร์โทร *</label><input type="tel" id="mBP" className="form-control" /></div><div className="col-md-3"><label className="form-label">ช่องทาง</label><select id="mBS" className="form-select" onChange={()=>{const v=document.getElementById('mBS').value;document.getElementById('mBX').style.display=v==='other'?'':'none'}}><option value="facebook">Facebook</option><option value="line">Line</option><option value="walkin">Walk-in</option><option value="other">อื่นๆ</option></select></div><div className="col-md-2"><label className="form-label">ผู้เข้าพัก</label><input type="number" id="mBG" className="form-control" defaultValue="2" min="1" /></div></div><input type="text" id="mBX" className="form-control mb-2" placeholder="ระบุช่องทาง..." style={{display:'none'}} /><div className="row g-3 mb-3"><div className="col-md-4"><label className="form-label">เช็คอิน *</label><input type="date" id="mBC" className="form-control" onChange={()=>window.DC&&window.DC()} /></div><div className="col-md-4"><label className="form-label">เช็คเอาท์ *</label><input type="date" id="mBD" className="form-control" onChange={()=>window.DC&&window.DC()} /></div><div className="col-md-4"><label className="form-label">มัดจำ (฿)</label><input type="number" id="mBE" className="form-control" defaultValue="0" min="0" onChange={()=>window.UG&&window.UG()} /></div></div><div className="mb-2"><label className="form-label">หมายเหตุ</label><textarea id="mBF" className="form-control" rows="2"></textarea></div><hr /><div className="d-flex align-items-end flex-wrap gap-1 mb-0" id="rTB"></div><div id="rTP"></div><div className="gt"><div className="row text-center"><div className="col-3"><small className="opacity-75">ห้อง</small><div className="fw-bold fs-5" id="gR">฿0</div></div><div className="col-3"><small className="opacity-75">เตียงเสริม</small><div className="fw-bold fs-5" id="gB">฿0</div></div><div className="col-3"><small className="opacity-75">ส่วนลด</small><div className="fw-bold fs-5" id="gD">-฿0</div></div><div className="col-3"><small className="opacity-75">สุทธิ</small><div className="fw-bold fs-4" id="gT">฿0</div></div></div><div className="row text-center mt-2"><div className="col-6"><small className="opacity-75">มัดจำ</small><div className="fw-bold" id="gP">฿0</div></div><div className="col-6"><small className="opacity-75">คงเหลือ</small><div className="fw-bold" id="gM">฿0</div></div></div></div></div><div className="modal-footer"><button className="btn btn-secondary" data-bs-dismiss="modal">ยกเลิก</button><button className="btn bp" id="mBV" onClick={()=>window.SB&&window.SB()}><i className="fas fa-save me-2"></i>บันทึก</button></div></div></div></div>

      {/* MODALS - room */}
      <div className="modal fade" id="mR" tabIndex="-1"><div className="modal-dialog modal-lg"><div className="modal-content"><div className="modal-header"><h5 className="modal-title" id="mRT"><i className="fas fa-bed me-2"></i>เพิ่มห้อง</h5><button type="button" className="btn-close" data-bs-dismiss="modal"></button></div><div className="modal-body"><input type="hidden" id="mRI" /><div className="row g-3"><div className="col-md-6"><label className="form-label">ชื่อห้อง *</label><input type="text" id="rN" className="form-control" /></div><div className="col-md-3"><label className="form-label">ป้าย</label><input type="text" id="rL" className="form-control" /></div><div className="col-md-3"><label className="form-label">ห้องน้ำ</label><select id="rB" className="form-select"><option value="private">ในตัว</option><option value="separate">แยก</option><option value="shared">รวม</option></select></div><div className="col-md-4"><label className="form-label">ราคา/คืน</label><input type="number" id="r0" className="form-control" min="0" /></div><div className="col-md-4"><label className="form-label">ศุกร์</label><input type="number" id="r1" className="form-control" min="0" /></div><div className="col-md-4"><label className="form-label">เสาร์</label><input type="number" id="r2" className="form-control" min="0" /></div><div className="col-md-4"><label className="form-label">อาทิตย์</label><input type="number" id="r3" className="form-control" min="0" /></div><div className="col-md-4"><label className="form-label">วันหยุด</label><input type="number" id="r4" className="form-control" min="0" /></div><div className="col-md-4"><label className="form-label">ผู้เข้าพักสูงสุด</label><input type="number" id="r5" className="form-control" defaultValue="2" min="1" /></div><div className="col-md-3"><label className="form-label">เตียงผู้ใหญ่</label><input type="number" id="r6" className="form-control" min="0" defaultValue="0" /></div><div className="col-md-3"><label className="form-label">เตียงเด็ก</label><input type="number" id="r7" className="form-control" min="0" defaultValue="0" /></div><div className="col-md-3"><label className="form-label">เตียงผญ.(หยุด)</label><input type="number" id="r8" className="form-control" min="0" defaultValue="0" /></div><div className="col-md-3"><label className="form-label">เตียงเด็ก(หยุด)</label><input type="number" id="r9" className="form-control" min="0" defaultValue="0" /></div><div className="col-md-6"><label className="form-label">สิ่งอำนวย</label><input type="text" id="rA" className="form-control" /></div><div className="col-md-6"><label className="form-label">สถานะ</label><select id="rX" className="form-select"><option value="available">พร้อม</option><option value="maintenance">ซ่อม</option><option value="unavailable">ปิด</option></select></div><div className="col-12"><label className="form-label">รายละเอียด</label><textarea id="rD" className="form-control" rows="2"></textarea></div><div className="col-12"><label className="form-label">รูปภาพ</label><div className="iz" onClick={()=>document.getElementById('rF').click()}><i className="fas fa-cloud-upload-alt fa-2x" style={{color:'var(--p4)'}}></i><br /><small style={{color:'var(--sb)'}}>อัพโหลด</small></div><input type="file" id="rF" accept="image/*" multiple style={{display:'none'}} onChange={(e)=>window.HI&&window.HI(e.target)} /><div className="d-flex flex-wrap gap-2 mt-2" id="rP"></div></div></div></div><div className="modal-footer"><button className="btn btn-secondary" data-bs-dismiss="modal">ยกเลิก</button><button className="btn bp" onClick={()=>window.SR&&window.SR()}><i className="fas fa-save me-2"></i>บันทึก</button></div></div></div></div>

      {/* MODALS - transaction */}
      <div className="modal fade" id="mT" tabIndex="-1"><div className="modal-dialog"><div className="modal-content"><div className="modal-header"><h5 className="modal-title"><i className="fas fa-plus-circle me-2"></i>เพิ่มรายการ</h5><button type="button" className="btn-close" data-bs-dismiss="modal"></button></div><div className="modal-body"><div className="mb-3"><label className="form-label">วันที่</label><input type="date" id="xD" className="form-control" /></div><div className="mb-3"><label className="form-label">ประเภท</label><select id="xT" className="form-select" onChange={()=>window.FC&&window.FC()}><option value="income">รายรับ</option><option value="expense">รายจ่าย</option></select></div><div className="mb-3"><label className="form-label">หมวด</label><select id="xC" className="form-select"></select></div><div className="mb-3"><label className="form-label">จำนวน</label><input type="number" id="xA" className="form-control" min="0" /></div><div className="mb-3"><label className="form-label">รายละเอียด</label><input type="text" id="xS" className="form-control" /></div></div><div className="modal-footer"><button className="btn btn-secondary" data-bs-dismiss="modal">ยกเลิก</button><button className="btn bp" onClick={()=>window.ST&&window.ST()}><i className="fas fa-save me-2"></i>บันทึก</button></div></div></div></div>

      {/* MODALS - category */}
      <div className="modal fade" id="mC" tabIndex="-1"><div className="modal-dialog modal-sm"><div className="modal-content"><div className="modal-header"><h5 className="modal-title"><i className="fas fa-tag me-2"></i>หมวดหมู่</h5><button type="button" className="btn-close" data-bs-dismiss="modal"></button></div><div className="modal-body"><div className="mb-3"><label className="form-label">ชื่อ</label><input type="text" id="cN" className="form-control" /></div><div className="mb-3"><label className="form-label">ประเภท</label><select id="cY" className="form-select"><option value="income">รายรับ</option><option value="expense">รายจ่าย</option></select></div><div className="mb-3"><label className="form-label">สี</label><input type="color" id="cL" className="form-control form-control-color" defaultValue="#2563eb" /></div></div><div className="modal-footer"><button className="btn btn-secondary" data-bs-dismiss="modal">ยกเลิก</button><button className="btn bp" onClick={()=>window.SC&&window.SC()}><i className="fas fa-save me-2"></i>บันทึก</button></div></div></div></div>

      {/* MODALS - user */}
      <div className="modal fade" id="mU" tabIndex="-1"><div className="modal-dialog"><div className="modal-content"><div className="modal-header"><h5 className="modal-title" id="mUT"><i className="fas fa-user-plus me-2"></i>ผู้ใช้</h5><button type="button" className="btn-close" data-bs-dismiss="modal"></button></div><div className="modal-body"><input type="hidden" id="uR" /><div className="mb-3"><label className="form-label">Username</label><input type="text" id="uU" className="form-control" /></div><div className="mb-3"><label className="form-label">Password</label><input type="password" id="uP" className="form-control" /></div><div className="mb-3"><label className="form-label">ชื่อ</label><input type="text" id="uD" className="form-control" /></div><div className="mb-3"><label className="form-label">บทบาท</label><select id="uL" className="form-select"><option value="owner">เจ้าของ</option><option value="admin">แอดมิน</option><option value="staff">พนักงาน</option></select></div><div className="mb-3"><label className="form-label">สิทธิ์</label><input type="text" id="uM" className="form-control" /></div></div><div className="modal-footer"><button className="btn btn-secondary" data-bs-dismiss="modal">ยกเลิก</button><button className="btn bp" onClick={()=>window.SV&&window.SV()}><i className="fas fa-save me-2"></i>บันทึก</button></div></div></div></div>

      {/* MODALS - calendar day */}
      <div className="modal fade" id="mD" tabIndex="-1"><div className="modal-dialog"><div className="modal-content"><div className="modal-header"><h5 className="modal-title"><i className="fas fa-calendar-day me-2"></i><span id="mDT"></span></h5><button type="button" className="btn-close" data-bs-dismiss="modal"></button></div><div className="modal-body" id="mDB"></div></div></div></div>

      {/* MODALS - payment */}
      <div className="modal fade" id="mP" tabIndex="-1"><div className="modal-dialog modal-sm"><div className="modal-content"><div className="modal-header"><h5 className="modal-title"><i className="fas fa-money-bill-wave me-2"></i>ชำระเงิน</h5><button type="button" className="btn-close" data-bs-dismiss="modal"></button></div><div className="modal-body"><input type="hidden" id="pI2" /><div className="text-center mb-3"><div className="small" style={{color:'var(--sb)'}}>ยอดรวม</div><div className="fw-bold fs-4" style={{color:'var(--p2)'}} id="p1">฿0</div><div className="small mt-1" style={{color:'var(--sb)'}}>ชำระแล้ว: <span id="p2">฿0</span></div><div className="small fw-bold">คงเหลือ: <span style={{color:'var(--err)'}} id="p3">฿0</span></div></div><div className="d-grid gap-2"><button className="btn btn-warning" onClick={()=>window.DP&&window.DP(50)}><i className="fas fa-percentage me-2"></i>ชำระ 50%</button><button className="btn btn-success" onClick={()=>window.DP&&window.DP(100)}><i className="fas fa-check-circle me-2"></i>เต็มจำนวน</button><button className="btn btn-outline-secondary" onClick={()=>window.DPC&&window.DPC()}><i className="fas fa-edit me-2"></i>ระบุจำนวน</button></div></div></div></div></div>

      {/* Scripts */}
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    </>
  )
}

// ---- APP LOGIC (converted from js.html) ----
// replaces all google.script.run with fetch('/api/fn')
function initApp() {
  if (typeof window === 'undefined') return

  // API helper
  window._api = async function(fn, ...params) {
    const res = await fetch(`/api/${fn}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ params })
    })
    return res.json()
  }

  var D={tx:[],cat:[],bud:{},pf:{},rm:[],bk:[],us:[],cu:null,ri:[],pc:{}};
  var td=new Date().toISOString().split('T')[0],tM=td.substring(0,7);
  var BM={rp:[],at:0},cY=new Date().getFullYear(),cM=new Date().getMonth();
  function G(i){return document.getElementById(i);}
  function E(s){return s?String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'):'';}
  function NF(v){return(Number(v)||0).toLocaleString();}
  function TH(yr){var h={};function a(m,d,n){h[yr+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0')]=n;}a(1,1,'ปีใหม่');a(4,6,'จักรี');a(4,13,'สงกรานต์');a(4,14,'สงกรานต์');a(4,15,'สงกรานต์');a(5,1,'แรงงาน');a(5,4,'ฉัตรมงคล');a(6,3,'เฉลิมฯราชินี');a(7,28,'เฉลิมฯร.10');a(8,12,'วันแม่');a(10,13,'นวมินทร์');a(10,23,'ปิยมหาราช');a(12,5,'วันพ่อ');a(12,10,'รัฐธรรมนูญ');a(12,31,'สิ้นปี');var lu={2024:{m:'02-24',v:'05-22',a:'07-20',k:'07-21',o:'10-17'},2025:{m:'02-12',v:'05-11',a:'07-10',k:'07-11',o:'10-07'},2026:{m:'03-03',v:'05-31',a:'07-29',k:'07-30',o:'10-25'},2027:{m:'02-20',v:'05-20',a:'07-18',k:'07-19',o:'10-14'},2028:{m:'02-09',v:'05-08',a:'07-06',k:'07-07',o:'10-02'}};var l=lu[yr];if(l){h[yr+'-'+l.m]='มาฆบูชา';h[yr+'-'+l.v]='วิสาขบูชา';h[yr+'-'+l.a]='อาสาฬหบูชา';h[yr+'-'+l.k]='เข้าพรรษา';h[yr+'-'+l.o]='ออกพรรษา';}return h;}
  function sB(s){var m={pending:'st-pe',confirmed:'st-co',checked_in:'st-ci',checked_out:'st-cx',cancelled:'st-ca'};return '<span class="st '+(m[s]||'')+'">'+sL(s)+'</span>';}
  function sL(s){return{pending:'รอยืนยัน',confirmed:'ยืนยัน',checked_in:'เช็คอิน',checked_out:'เช็คเอาท์',cancelled:'ยกเลิก'}[s]||s;}
  function pB(s){var m={paid:'st-pa',unpaid:'st-un',deposit:'st-dp'},l={paid:'ชำระแล้ว',unpaid:'ยังไม่ชำระ',deposit:'มัดจำ'};return '<span class="st '+(m[s]||'')+'">'+(l[s]||s)+'</span>';}

  window.LI=function(){var u=G('lu').value.trim(),p=G('lp').value.trim();if(!u||!p){G('le').textContent='กรุณากรอก';G('le').style.display='block';return;}G('lb').disabled=true;G('lb').innerHTML='<i class="fas fa-spinner fa-spin me-2"></i>...';window._api('checkLogin',u,p).then(function(r){if(r&&r.success){D.cu=r;G('LO').style.display='none';G('AL').style.display='flex';LD();}else{G('le').textContent='ข้อมูลไม่ถูกต้อง';G('le').style.display='block';G('lb').disabled=false;G('lb').innerHTML='เข้าสู่ระบบ';}}).catch(function(e){alert(e.message);G('lb').disabled=false;G('lb').innerHTML='เข้าสู่ระบบ';});}

  function LD(){window._api('getAppData').then(function(d){if(d.error){alert(d.error);return;}D.tx=d.transactions||[];D.cat=d.categories||[];D.bud=d.budgets||{};D.pf=d.profile||{};D.rm=d.rooms||[];D.bk=d.bookings||[];D.us=d.users||[];IA();G('AL').style.display='none';});var bookUrl=window.location.origin+'/booking';G('bU').value=bookUrl;G('sU').value=bookUrl;}

  function IA(){var u=D.cu;G('uN').textContent=u.displayName||u.username;G('uA').textContent=(u.displayName||u.username).charAt(0).toUpperCase();if(u.role!=='owner'&&u.role!=='admin')document.querySelectorAll('.pm').forEach(function(e){e.style.display='none';});G('dL').textContent=new Date().toLocaleDateString('th-TH',{weekday:'long',day:'numeric',month:'long',year:'numeric'});IM();RA();G('fN').value=D.pf.name||'';G('fI').value=D.pf.image||'';LP();}

  window.NV=function(p,el){document.querySelectorAll('.ps').forEach(function(s){s.classList.remove('active');});G('p-'+p).classList.add('active');document.querySelectorAll('.sn').forEach(function(n){n.classList.remove('on');});if(el)el.classList.add('on');var t={da:'แดชบอร์ด',bk:'การจอง',cl:'ปฏิทินห้องพัก',rm:'ห้องพัก',tx:'รายรับ-รายจ่าย',ct:'หมวดหมู่',bu:'งบประมาณ',pc:'จัดการใบจอง',us:'จัดการผู้ใช้',st:'ตั้งค่า'};G('pT').textContent=t[p]||p;if(p==='cl')window.RC();}

  function RA(){window.RD();window.RB();window.RR();window.RT();RCT();window.RU();RUS();}

  function RL(){window._api('getAppData').then(function(d){if(d.error)return;D.tx=d.transactions||[];D.cat=d.categories||[];D.bud=d.budgets||{};D.pf=d.profile||{};D.rm=d.rooms||[];D.bk=d.bookings||[];D.us=d.users||[];IM();RA();});}

  function LP(){try{var s=localStorage.getItem('pc3');if(s)D.pc=JSON.parse(s);}catch(e){}D.pc=D.pc||{};G('pN').value=D.pc.name||'';G('pX').value=D.pc.prefix||'RCI';G('pA').value=D.pc.addr||'';G('pH').value=D.pc.phone||'';G('pF').value=D.pc.fb||'';G('pE').value=D.pc.email||'';G('pG').value=D.pc.signer||'';G('pY').value=D.pc.payMethod||'';G('pO').value=D.pc.notes||'';G('pQ').value=D.pc.terms||'';if(D.pc.logo){G('pLP').src=D.pc.logo;G('pLP').style.display='block';G('pLH').style.display='none';}if(D.pc.sig){G('pSP').src=D.pc.sig;G('pSP').style.display='block';G('pSH').style.display='none';}}

  window.SP=function(){D.pc={name:G('pN').value,prefix:G('pX').value||'RCI',addr:G('pA').value,phone:G('pH').value,fb:G('pF').value,email:G('pE').value,signer:G('pG').value,payMethod:G('pY').value,notes:G('pO').value,terms:G('pQ').value,logo:G('pLP').src||'',sig:G('pSP').src||''};try{localStorage.setItem('pc3',JSON.stringify(D.pc));}catch(e){}alert('บันทึกแล้ว');}

  window.LF=function(inp,k){var f=inp.files[0];if(!f)return;var r=new FileReader();r.onload=function(e){G(k+'P').src=e.target.result;G(k+'P').style.display='block';G(k+'H').style.display='none';};r.readAsDataURL(f);inp.value='';}

  var _chI=null,_chE=null;
  window.RD=function(){var mo=G('dMo')?G('dMo').value:'';if(!mo)mo=tM;if(G('dMo'))G('dMo').value=mo;G('sR').textContent=D.rm.length;var mb=D.bk.filter(function(b){return(b.checkIn||'').startsWith(mo);});G('sB').textContent=mb.length;var mt=D.tx.filter(function(t){return(t.date||'').startsWith(mo);});var ic=mt.filter(function(t){return t.type==='income';}).reduce(function(s,t){return s+t.amount;},0);var ex=mt.filter(function(t){return t.type==='expense';}).reduce(function(s,t){return s+t.amount;},0);var pf=ic-ex;var ot=mb.filter(function(b){return b.paymentStatus!=='paid';}).reduce(function(s,b){return s+(Number(b.remainingBalance)||0);},0);G('sI').textContent='฿'+ic.toLocaleString();G('sE').textContent='฿'+ex.toLocaleString();G('sP').textContent='฿'+pf.toLocaleString();G('sP').style.color=pf>=0?'var(--ok)':'var(--err)';G('sO').textContent='฿'+ot.toLocaleString();var iCat={};mt.filter(function(t){return t.type==='income';}).forEach(function(t){iCat[t.category]=(iCat[t.category]||0)+t.amount;});var eCat={};mt.filter(function(t){return t.type==='expense';}).forEach(function(t){eCat[t.category]=(eCat[t.category]||0)+t.amount;});var catColors={};D.cat.forEach(function(c){catColors[c.name]=c.color||'#2563eb';});renderPie('chI',iCat,catColors,_chI,function(c){_chI=c;},'chIL');renderPie('chE',eCat,catColors,_chE,function(c){_chE=c;},'chEL');var rc=D.bk.slice().sort(function(a,b){return(b.id||0)-(a.id||0);}).slice(0,6);G('dR').innerHTML=rc.length?rc.map(function(b){return '<tr><td>'+b.id+'</td><td>'+E(b.customerName)+'</td><td>'+E(b.roomName)+'</td><td>'+b.checkIn+'</td><td>'+sB(b.status)+'</td><td class="fw-bold">฿'+NF(b.totalPrice)+'</td></tr>';}).join(''):'<tr><td colspan="6" class="text-center py-3">-</td></tr>';G('dS').innerHTML=D.rm.map(function(r){var o=D.bk.some(function(b){return b.status!=='cancelled'&&b.status!=='checked_out'&&b.roomId==r.id&&td>=b.checkIn&&td<b.checkOut;});return '<div class="d-flex justify-content-between py-1 border-bottom"><span style="font-size:.83rem">'+E(r.name)+'</span><span class="st '+(r.status!=='available'?'st-ca':o?'st-pe':'st-co')+'">'+(r.status!=='available'?'ปิด':o?'เข้าพัก':'ว่าง')+'</span></div>';}).join('');}

  function renderPie(canvasId,dataObj,colors,oldChart,setChart,legendId){var labels=Object.keys(dataObj),vals=labels.map(function(k){return dataObj[k];});var bg=labels.map(function(k){return colors[k]||('#'+Math.floor(Math.random()*16777215).toString(16).padStart(6,'0'));});if(oldChart){try{oldChart.destroy();}catch(e){}}var ctx=G(canvasId);if(!ctx)return;if(!labels.length){ctx.getContext('2d').clearRect(0,0,ctx.width,ctx.height);G(legendId).innerHTML='<span style="color:var(--sb)">ไม่มีข้อมูล</span>';setChart(null);return;}var ch=new Chart(ctx,{type:'doughnut',data:{labels:labels,datasets:[{data:vals,backgroundColor:bg,borderWidth:1,borderColor:'#fff'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}}}});setChart(ch);G(legendId).innerHTML=labels.map(function(l,i){return '<span style="display:inline-flex;align-items:center;gap:4px;margin:2px 8px 2px 0"><span style="width:10px;height:10px;border-radius:50%;background:'+bg[i]+';display:inline-block"></span>'+E(l)+' <strong>฿'+NF(vals[i])+'</strong></span>';}).join('');}

  window.RC=function(){var mn=['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];G('cT').textContent=mn[cM]+' '+(cY+543);var f=new Date(cY,cM,1),la=new Date(cY,cM+1,0),sd=(f.getDay()+6)%7;var tr=D.rm.filter(function(r){return r.status==='available';}).length;var ho=TH(cY);var h='';for(var i=0;i<sd;i++){var pd=new Date(cY,cM,0-sd+i+1);h+='<div class="cd2 ot"><span class="dn">'+pd.getDate()+'</span></div>';}for(var d=1;d<=la.getDate();d++){var dt=new Date(cY,cM,d),ds=cY+'-'+String(cM+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');var dw=dt.getDay(),iS=dw===6,iU=dw===0,hn=ho[ds]||'',iT=ds===td;var oc=D.rm.filter(function(r){if(r.status!=='available')return false;return D.bk.some(function(b){return b.status!=='cancelled'&&b.status!=='checked_out'&&b.roomId==r.id&&ds>=b.checkIn&&ds<b.checkOut;});}).length;var fr=tr-oc;var cl='cd2';if(iT)cl+=' td';if(hn)cl+=' hl';if(iS)cl+=' sa';if(iU)cl+=' su';h+='<div class="'+cl+'" onclick="window.SD(\''+ds+'\')"><span class="dn">'+d+'</span>';if(hn)h+='<div class="hn" title="'+E(hn)+'">'+E(hn)+'</div>';if(tr>0){if(fr===0)h+='<div class="ca cf">เต็ม</div>';else if(oc===0)h+='<div class="ca cv">ว่างทั้งหมด</div>';else h+='<div class="ca"><span class="cv">ว่าง '+fr+'</span>/<span class="cf">จอง '+oc+'</span></div>';}h+='</div>';}var ed=(la.getDay()+6)%7;for(var i=ed+1;i<7;i++){h+='<div class="cd2 ot"><span class="dn">'+(i-ed)+'</span></div>';}G('cG').innerHTML=h;}

  window.CN=function(d){cM+=d;if(cM<0){cM=11;cY--;}if(cM>11){cM=0;cY++;}window.RC();}

  window.SD=function(ds){var ho=TH(parseInt(ds)),hn=ho[ds]||'';var dt=new Date(ds+'T00:00:00'),dn=['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];G('mDT').textContent=ds+' ('+dn[dt.getDay()]+')'+(hn?' - '+hn:'');var av=D.rm.filter(function(r){return r.status==='available';});var h='<div class="mb-2"><strong>ห้องพักทั้งหมด:</strong> '+av.length+'</div>';av.forEach(function(r){var o=D.bk.find(function(b){return b.status!=='cancelled'&&b.status!=='checked_out'&&b.roomId==r.id&&ds>=b.checkIn&&ds<b.checkOut;});h+='<div class="dr '+(o?'oc':'fr')+'"><span><i class="fas fa-bed me-1"></i>'+E(r.name)+'</span><span>'+(o?'จอง: '+E(o.customerName):'<i class="fas fa-check-circle me-1"></i>ว่าง')+'</span></div>';});G('mDB').innerHTML=h;new bootstrap.Modal(G('mD')).show();}

  window.RB=function(){var f=G('bF').value,s=(G('bS').value||'').toLowerCase();var fl=D.bk.filter(function(b){if(f!=='all'&&b.status!==f)return false;if(s&&!(b.customerName||'').toLowerCase().includes(s)&&!(b.customerPhone||'').includes(s)&&!(b.roomName||'').toLowerCase().includes(s))return false;return true;}).sort(function(a,b){return(b.id||0)-(a.id||0);});var grp={},ord=[];fl.forEach(function(b){var k=(b.customerName||'')+'|'+(b.customerPhone||'')+'|'+(b.checkIn||'')+'|'+(b.checkOut||'');if(!grp[k]){grp[k]=[];ord.push(k);}grp[k].push(b);});var h='';ord.forEach(function(k){var it=grp[k],f=it[0],ml=it.length>1;var tp=it.reduce(function(s,b){return s+(Number(b.totalPrice)||0);},0),td2=it.reduce(function(s,b){return s+(Number(b.depositAmount)||0);},0),tr=tp-td2;var rm=it.map(function(b){return b.roomName;}),db=tr>0&&it.some(function(b){return b.paymentStatus!=='paid';});var ids=it.map(function(b){return b.id;}).join(',');h+='<div class="bk'+(db?' hd':'')+'"><div class="d-flex justify-content-between align-items-start"><div style="flex:1"><div class="d-flex align-items-center gap-2 mb-1"><strong style="font-size:.95rem;color:var(--p1)">'+E(f.customerName)+'</strong>';if(ml)h+='<span class="st" style="background:var(--p5);color:var(--p2)">'+it.length+' ห้อง</span>';h+='<span class="st '+(f.status==='confirmed'?'st-co':f.status==='pending'?'st-pe':f.status==='checked_in'?'st-ci':'st-cx')+'">'+sL(f.status)+'</span></div>';h+='<div style="color:var(--sb);font-size:.82rem"><i class="fas fa-phone me-1"></i>'+E(f.customerPhone)+' &nbsp;<i class="fas fa-calendar me-1"></i>'+f.checkIn+' → '+f.checkOut+' ('+f.nights+' คืน)</div>';h+='<div class="bk-r">';rm.forEach(function(r){h+='<span class="bk-t"><i class="fas fa-bed me-1"></i>'+E(r)+'</span>';});h+='</div>';if(db)h+='<div class="bk-d"><i class="fas fa-exclamation-triangle" style="color:var(--warn)"></i>ค้างชำระ <strong style="color:var(--err)">฿'+NF(tr)+'</strong></div>';h+='</div><div class="text-end" style="min-width:170px"><div class="fw-bold" style="font-size:1.1rem;color:var(--p1)">฿'+NF(tp)+'</div>';if(td2>0)h+='<div style="font-size:.78rem;color:var(--ok)">มัดจำ ฿'+NF(td2)+'</div>';h+='<div class="bk-a mt-2 justify-content-end">';h+='<button class="btn btn-outline-success bi" title="ชำระ" onclick="window.OP(\''+ids+'\')"><i class="fas fa-money-bill-wave"></i></button>';h+='<button class="btn btn-outline-warning bi" title="PDF" onclick="window.GP(\''+ids+'\')"><i class="fas fa-file-pdf"></i></button>';h+='<button class="btn btn-outline-primary bi" title="แก้ไข" onclick="window.EB(\''+ids+'\')"><i class="fas fa-edit"></i></button>';h+='<button class="btn btn-outline-danger bi" title="ลบ" onclick="window.DB(\''+ids+'\')"><i class="fas fa-trash"></i></button>';h+='</div></div></div></div>';});G('bL').innerHTML=h||'<div class="es"><i class="fas fa-calendar-check"></i><p>ไม่มีข้อมูล</p></div>';}

  function _g(ids){return ids.split(',').map(function(s){return Number(s.trim());}).map(function(id){return D.bk.find(function(b){return Number(b.id)==id;});}).filter(Boolean);}

  window.OP=function(ids){var it=_g(ids);if(!it.length){alert('ไม่พบข้อมูล');return;}var t=it.reduce(function(s,b){return s+(Number(b.totalPrice)||0);},0),d=it.reduce(function(s,b){return s+(Number(b.depositAmount)||0);},0);G('pI2').value=ids;G('p1').textContent='฿'+NF(t);G('p2').textContent='฿'+NF(d);G('p3').textContent='฿'+NF(t-d);new bootstrap.Modal(G('mP')).show();}

  window.DP=function(pct){var ids=G('pI2').value.split(','),dn=0,tt=ids.length;ids.forEach(function(id){var b=D.bk.find(function(x){return Number(x.id)==Number(id);});if(!b){dn++;return;}var a=pct===100?(Number(b.totalPrice)||0):Math.round((Number(b.totalPrice)||0)*0.5);window._api('updateDeposit',Number(id),a).then(function(){dn++;if(dn>=tt){bootstrap.Modal.getInstance(G('mP')).hide();if(pct===50)alert('ชำระ 50% แล้ว — ยังค้างอยู่');RL();}});});}

  window.DPC=function(){var a=prompt('ระบุจำนวน (฿):');if(!a)return;a=Number(a);if(isNaN(a)||a<=0)return;var ids=G('pI2').value.split(','),pr=Math.round(a/ids.length),dn=0;ids.forEach(function(id){window._api('updateDeposit',Number(id),pr).then(function(){dn++;if(dn>=ids.length){bootstrap.Modal.getInstance(G('mP')).hide();RL();}});});}

  window.GP=function(ids){var it=_g(ids);if(!it.length){alert('ไม่พบข้อมูล');return;}MP(it,false);}
  window.PP=function(){window.SP();var sam=[{id:999,customerName:'ตัวอย่าง',customerPhone:'081-234-5678',roomName:'ห้อง A1',checkIn:'2026-03-14',checkOut:'2026-03-15',nights:1,guests:2,totalPrice:2600,depositAmount:1300,status:'confirmed'}];if(D.bk.length>0)sam=[D.bk[0]];MP(sam,true);}

  function MP(items,isPv){var h=BH(items);var w=document.createElement('div');w.style.cssText='position:fixed;left:-9999px;top:0';w.innerHTML=h;document.body.appendChild(w);var el=w.querySelector('#_pd');html2canvas(el,{scale:2,useCORS:true,backgroundColor:'#fff'}).then(function(cv){document.body.removeChild(w);var img=cv.toDataURL('image/jpeg',0.95);var doc=new window.jspdf.jsPDF('p','mm','a4');var pw=210,iw=pw-20,ih=cv.height*iw/cv.width;if(ih>277){ih=277;iw=cv.width*ih/cv.height;}doc.addImage(img,'JPEG',10,10,iw,ih);if(isPv){G('pI').src=URL.createObjectURL(doc.output('blob'));G('pV').style.display='block';G('pV').scrollIntoView({behavior:'smooth'});}else{doc.save('Booking_'+items.map(function(b){return b.id;}).join('_')+'.pdf');}}).catch(function(e){alert('PDF: '+e.message);try{document.body.removeChild(w);}catch(x){}});}

  function BH(it){var c=D.pc||{},f=it[0];var t=it.reduce(function(s,b){return s+(Number(b.totalPrice)||0);},0),dp=it.reduce(function(s,b){return s+(Number(b.depositAmount)||0);},0),rm=t-dp;var dn=(c.prefix||'RCI')+(10000+(Number(f.id)||0));var ci=f.checkIn?f.checkIn.split('-'):['','',''],co=f.checkOut?f.checkOut.split('-'):['','',''];var by=Number(ci[0]||0)+543,by2=by%100;var lg=c.logo&&c.logo.startsWith('data:')?'<img src="'+c.logo+'" style="max-height:55px;max-width:75px">':'';var sg=c.sig&&c.sig.startsWith('data:')?'<img src="'+c.sig+'" style="max-height:35px">':'';var s='<div id="_pd" style="width:680px;padding:28px 36px;font-family:Prompt,sans-serif;font-size:11.5px;color:#1e3a5f;background:#fff">';s+='<table style="width:100%;border-collapse:collapse"><tr><td style="width:90px;vertical-align:top">'+lg+'</td><td style="text-align:center"><div style="font-size:18px;font-weight:700">ใบยืนยันจองห้องพัก</div><div style="font-size:9px;color:#999">ต้นฉบับ</div></td><td style="width:170px;text-align:right;font-size:10px"><table style="border-collapse:collapse;margin-left:auto"><tr><td style="padding:1px 6px;font-weight:600">เลขที่เอกสาร</td><td>'+dn+'</td></tr><tr><td style="padding:1px 6px;font-weight:600">วันที่</td><td>'+ci[2]+'/'+ci[1]+'/'+by2+'</td></tr><tr><td style="padding:1px 6px;font-weight:600">ชำระโดย</td><td>'+(c.payMethod||'-')+'</td></tr></table></td></tr></table>';s+='<div style="margin-top:6px;font-size:10.5px"><strong>'+(c.name||D.pf.name||'')+'</strong></div>';if(c.addr)s+='<div style="font-size:9.5px;color:#555">'+E(c.addr)+'</div>';if(c.phone)s+='<div style="font-size:9.5px;color:#555">'+E(c.phone)+'</div>';if(c.fb)s+='<div style="font-size:9.5px;color:#2563eb">'+E(c.fb)+'</div>';if(c.email)s+='<div style="font-size:9.5px;color:#2563eb">'+E(c.email)+'</div>';s+='<div style="margin-top:10px;border-top:2px solid #2563eb;padding-top:8px"><table style="width:100%;font-size:10.5px"><tr><td><b>ลูกค้า</b></td><td style="text-align:right"><b>จำนวน ผู้เข้าพัก</b> '+(f.guests||2)+'</td></tr><tr><td>'+E(f.customerName||'')+'</td><td style="text-align:right">วันที่ Check in '+ci[2]+'/'+ci[1]+'/'+by2+'</td></tr><tr><td>'+E(f.customerPhone||'')+'</td><td style="text-align:right">วันที่ Check out '+co[2]+'/'+co[1]+'/'+by2+'</td></tr></table></div>';s+='<table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:10.5px"><thead><tr style="background:#1e3a5f;color:#fff"><th style="padding:5px 8px;text-align:left;border:1px solid #1e3a5f">No.</th><th style="padding:5px 8px;text-align:left;border:1px solid #1e3a5f">รายการ</th><th style="padding:5px 8px;text-align:center;border:1px solid #1e3a5f">ระยะเวลา</th><th style="padding:5px 8px;text-align:right;border:1px solid #1e3a5f">ราคารวม</th></tr></thead><tbody>';it.forEach(function(b,i){s+='<tr style="background:'+(i%2===0?'#eff6ff':'#fff')+'"><td style="padding:5px 8px;border:1px solid #e2e8f0">'+(i+1)+'</td><td style="padding:5px 8px;border:1px solid #e2e8f0">ห้อง '+E(b.roomName||'')+' ('+ci[2]+'/'+ci[1]+'/'+by+' – '+co[2]+'/'+co[1]+'/'+by+')</td><td style="padding:5px 8px;text-align:center;border:1px solid #e2e8f0">'+(b.nights||1)+' คืน</td><td style="padding:5px 8px;text-align:right;border:1px solid #e2e8f0">'+NF(b.totalPrice)+'</td></tr>';});s+='</tbody></table>';if(c.notes)s+='<div style="margin-top:12px;font-size:9.5px"><b>หมายเหตุ</b><div style="white-space:pre-line;color:#555;margin-top:3px">'+E(c.notes)+'</div></div>';s+='<table style="width:100%;margin-top:10px;font-size:11px"><tr><td style="width:55%"></td><td><table style="width:100%;border-collapse:collapse"><tr><td style="padding:3px 6px;text-align:right;font-weight:600">รวมเป็นเงิน</td><td style="padding:3px 6px;text-align:right;font-weight:700">'+NF(t)+'</td></tr><tr><td style="padding:3px 6px;text-align:right;font-weight:600">มัดจำ</td><td style="padding:3px 6px;text-align:right">'+NF(dp)+'</td></tr><tr><td style="padding:3px 6px;text-align:right;font-weight:600">ยอดจ่าย วันเข้าพัก</td><td style="padding:3px 6px;text-align:right;color:#ef4444;font-weight:700">'+NF(rm)+'</td></tr><tr style="background:#1e3a5f;color:#fff"><td style="padding:5px 6px;text-align:right;font-weight:600">จำนวนเงินรวมทั้งสิ้น</td><td style="padding:5px 6px;text-align:right;font-weight:700;font-size:13px">'+NF(t)+'</td></tr></table></td></tr></table>';if(c.terms)s+='<div style="margin-top:10px;font-size:8.5px;border-top:1px solid #e2e8f0;padding-top:6px"><b>เงื่อนไขการจอง</b><div style="white-space:pre-line;color:#555;margin-top:3px">'+E(c.terms)+'</div></div>';s+='<div style="margin-top:28px;display:flex;justify-content:space-between;font-size:9.5px"><div style="text-align:center;width:38%"><div>ในนาม '+E(f.customerName||'')+'</div><div style="height:35px"></div><div style="border-top:1px solid #999;padding-top:3px">ผู้จ่ายเงิน &nbsp;&nbsp; วันที่</div></div><div style="text-align:center;width:38%"><div>'+(c.signer?E(c.signer):'')+'</div><div style="margin-top:3px">'+sg+'</div><div style="border-top:1px solid #999;padding-top:3px">ผู้รับเงิน &nbsp;&nbsp; วันที่</div></div></div></div>';return s;}

  window.EB=function(ids){var it=_g(ids);if(!it.length)return;var f=it[0];window.OB();G('mBI').value=ids;G('mBN').value=f.customerName||'';G('mBP').value=f.customerPhone||'';G('mBG').value=f.guests||2;G('mBC').value=f.checkIn;G('mBD').value=f.checkOut;var td3=it.reduce(function(s,b){return s+(Number(b.depositAmount)||0);},0);G('mBE').value=td3;G('mBF').value=(f.notes||'').replace(/\s*\[กลุ่ม.*?\]/g,'');G('mBT').innerHTML='<i class="fas fa-edit me-2"></i>แก้ไข #'+it.map(function(b){return b.id;}).join(',#');BM.rp=it.map(function(b){return{roomId:b.roomId,ea:b.extraBedsAdult||0,ec:b.extraBedsChild||0,dc:0,bd:[],rT:0,bT:0,np:[],ne:[],oi:b.id};});BM.at=0;TB();AP();}

  window.DB=function(ids){var it=_g(ids);if(!it.length)return;if(!confirm('ลบ #'+it.map(function(b){return b.id;}).join(',#')+' ?'))return;var dn=0,tt=it.length;it.forEach(function(b){window._api('deleteBooking',b.id).then(function(){dn++;if(dn>=tt)RL();});});}

  function NR(){return{roomId:'',ea:0,ec:0,dc:0,bd:[],rT:0,bT:0,np:[],ne:[]};}
  window.OB=function(){G('mBI').value='';G('mBN').value='';G('mBP').value='';G('mBG').value='2';G('mBC').value=td;G('mBD').value='';G('mBE').value='0';G('mBF').value='';G('mBS').value='facebook';G('mBX').style.display='none';G('mBT').innerHTML='<i class="fas fa-calendar-plus me-2"></i>สร้างการจอง';G('mBV').disabled=false;G('mBV').innerHTML='<i class="fas fa-save me-2"></i>บันทึก';BM.rp=[NR()];BM.at=0;TB();AP();window.UG();new bootstrap.Modal(G('mB')).show();}

  function TB(){var h=BM.rp.map(function(p,i){var rm=D.rm.find(function(r){return r.id==p.roomId;});var lb=rm?rm.name:('ห้อง '+(i+1));var cl=BM.rp.length>1?'<span class="tc" onclick="event.stopPropagation();window.XT('+i+')"><i class="fas fa-times"></i></span>':'';return '<div class="rt'+(i===BM.at?' on':'')+'" onclick="window.ST2('+i+')"><i class="fas fa-bed"></i> '+E(lb)+cl+'</div>';}).join('');h+='<button class="btn btn-outline-success btn-sm rounded-pill" style="margin-bottom:2px" onclick="window.AT()"><i class="fas fa-plus me-1"></i>เพิ่มห้อง</button>';G('rTB').innerHTML=h;}

  window.ST2=function(i){VT();BM.at=i;TB();AP();}
  window.AT=function(){VT();BM.rp.push(NR());BM.at=BM.rp.length-1;TB();AP();}
  window.XT=function(i){if(BM.rp.length<=1)return;BM.rp.splice(i,1);if(BM.at>=BM.rp.length)BM.at=BM.rp.length-1;TB();AP();window.UG();}

  function VT(){var p=BM.rp[BM.at];if(!p)return;var e;e=G('rp_r');if(e)p.roomId=e.value;e=G('rp_a');if(e)p.ea=parseInt(e.value)||0;e=G('rp_c');if(e)p.ec=parseInt(e.value)||0;e=G('rp_d');if(e)p.dc=parseFloat(e.value)||0;document.querySelectorAll('.xp').forEach(function(inp,i){if(p.np[i]!==undefined)p.np[i]=parseFloat(inp.value)||0;});document.querySelectorAll('.xe').forEach(function(inp,i){if(p.ne&&p.ne[i]!==undefined)p.ne[i]=parseFloat(inp.value)||0;});}

  function AP(){var p=BM.rp[BM.at];var opts=D.rm.map(function(r){var us=BM.rp.some(function(rp,i){return i!==BM.at&&rp.roomId==r.id;});return '<option value="'+r.id+'"'+(p.roomId==r.id?' selected':'')+(us?' disabled':'')+'>'+E(r.name)+' (฿'+r.pricePerNight.toLocaleString()+')'+(us?' [ใช้แล้ว]':'')+'</option>';}).join('');G('rTP').innerHTML='<div class="rp on"><div class="row g-3 mb-3"><div class="col-md-5"><label class="form-label">ห้อง *</label><select id="rp_r" class="form-select" onchange="window.RC2()"><option value="">-- เลือก --</option>'+opts+'</select></div><div class="col-md-2"><label class="form-label">เตียงผู้ใหญ่</label><input type="number" id="rp_a" class="form-control" value="'+(p.ea||0)+'" min="0" onchange="window.RC2()"></div><div class="col-md-2"><label class="form-label">เตียงเด็ก</label><input type="number" id="rp_c" class="form-control" value="'+(p.ec||0)+'" min="0" onchange="window.RC2()"></div><div class="col-md-3"><label class="form-label">ส่วนลด (฿)</label><input type="number" id="rp_d" class="form-control" value="'+(p.dc||0)+'" min="0" onchange="window.UG()"></div></div><div id="rp_b"></div></div>';if(p.roomId&&G('mBC').value&&G('mBD').value){if(p.bd.length)BD(p);else CP();}}

  window.DC=function(){BM.rp.forEach(function(p){p.np=[];p.ne=[];});VT();CP();}
  window.RC2=function(){VT();var p=BM.rp[BM.at];p.np=[];p.ne=[];p.bd=[];CP();TB();}

  function CP(){var p=BM.rp[BM.at];var ci=G('mBC').value,co=G('mBD').value;if(!p.roomId||!ci||!co){G('rp_b').innerHTML='<p class="small text-center py-2" style="color:var(--sb)">เลือกห้อง+วันที่</p>';return;}G('rp_b').innerHTML='<div class="text-center py-2"><i class="fas fa-spinner fa-spin" style="color:var(--p3)"></i></div>';window._api('calcBookingPrice',p.roomId,ci,co,p.ea||0,p.ec||0).then(function(r){if(!r||!r.success){G('rp_b').innerHTML='';return;}p.bd=r.breakdown||[];p.rT=r.roomTotal;p.bT=r.extraBedTotal;if(!p.np.length)p.np=p.bd.map(function(b){return b.price;});var eA=r.ebAdultPrice||0,eC=r.ebChildPrice||0,eAH=r.ebAdultHolPrice||0,eCH=r.ebChildHolPrice||0;if(!p.ne.length)p.ne=p.bd.map(function(b){var sp=b.label&&b.label!=='ปกติ';return(p.ea||0)*(sp&&eAH?eAH:eA)+(p.ec||0)*(sp&&eCH?eCH:eC);});BD(p);window.UG();});}

  function BD(p){if(!p.bd.length)return;var dn=['อา','จ','อ','พ','พฤ','ศ','ส'],h='<div class="table-responsive mt-2"><table class="bt table table-sm table-bordered mb-0"><thead><tr><th>วันที่</th><th>วัน</th><th>ประเภท</th><th>ราคาห้อง</th><th>เตียงเสริม</th><th>รวม</th></tr></thead><tbody>',tR=0,tB=0;p.bd.forEach(function(b,i){var pr=p.np[i]!==undefined?p.np[i]:b.price,eb=p.ne&&p.ne[i]!==undefined?p.ne[i]:0;tR+=pr;tB+=eb;h+='<tr><td>'+b.date+'</td><td>'+dn[b.dow]+'</td><td class="'+(b.label==='ปกติ'?'':'fw-bold text-danger')+'">'+E(b.label)+'</td><td><input type="number" class="xp" value="'+pr+'" min="0" onchange="window.BE()"></td><td><input type="number" class="xe" value="'+eb+'" min="0" onchange="window.BE()"></td><td class="fw-bold">฿'+(pr+eb).toLocaleString()+'</td></tr>';});h+='</tbody><tfoot><tr style="background:var(--p6)"><td colspan="3" class="fw-bold text-end">รวม</td><td class="fw-bold">฿'+tR.toLocaleString()+'</td><td class="fw-bold">฿'+tB.toLocaleString()+'</td><td class="fw-bold">฿'+(tR+tB).toLocaleString()+'</td></tr></tfoot></table></div>';G('rp_b').innerHTML=h;p.rT=tR;p.bT=tB;}

  window.BE=function(){var p=BM.rp[BM.at];p.np=[];p.ne=[];document.querySelectorAll('.xp').forEach(function(i){p.np.push(parseFloat(i.value)||0);});document.querySelectorAll('.xe').forEach(function(i){p.ne.push(parseFloat(i.value)||0);});BD(p);window.UG();}

  window.UG=function(){var tR=0,tB=0,tD=0;var dc=G('rp_d');if(dc)BM.rp[BM.at].dc=parseFloat(dc.value)||0;BM.rp.forEach(function(p){tR+=(p.rT||0);tB+=(p.bT||0);tD+=(p.dc||0);});var g=tR+tB-tD,dp=parseInt(G('mBE').value)||0;G('gR').textContent='฿'+tR.toLocaleString();G('gB').textContent='฿'+tB.toLocaleString();G('gD').textContent='-฿'+tD.toLocaleString();G('gT').textContent='฿'+g.toLocaleString();G('gP').textContent='฿'+dp.toLocaleString();G('gM').textContent='฿'+(g-dp).toLocaleString();}

  window.SB=function(){VT();var nm=G('mBN').value.trim(),ph=G('mBP').value.trim(),ci=G('mBC').value,co=G('mBD').value;if(!nm||!ph||!ci||!co){alert('กรอกข้อมูล');return;}for(var i=0;i<BM.rp.length;i++){if(!BM.rp[i].roomId){alert('เลือกห้อง #'+(i+1));return;}}G('mBV').disabled=true;G('mBV').innerHTML='<i class="fas fa-spinner fa-spin me-2"></i>...';var src=G('mBS').value==='other'?(G('mBX').value.trim()||'อื่นๆ'):G('mBS').value;var dp=parseInt(G('mBE').value)||0,nt=G('mBF').value,gs=parseInt(G('mBG').value)||2,eid=G('mBI').value;var dn=0,tt=BM.rp.length,rs=[];var ei=eid?eid.split(',').map(Number):[];BM.rp.forEach(function(p,idx){var pr=p.rT+p.bT-(p.dc||0);var d={customerName:nm,customerPhone:ph,roomId:p.roomId,guests:gs,checkIn:ci,checkOut:co,extraBedsAdult:p.ea||0,extraBedsChild:p.ec||0,depositAmount:idx===0?dp:0,totalPrice:pr,notes:nt+(tt>1?' [กลุ่ม '+tt+' ห้อง #'+(idx+1)+']':''),bookingSource:src,status:'confirmed',paymentStatus:(idx===0&&dp>0)?'deposit':'unpaid'};var tid=p.oi||ei[idx];if(tid){d.id=tid;window._api('updateBookingRecord',d).then(function(r){dn++;if(r&&r.success)rs.push(r);if(dn>=tt)OS(rs);});}else{window._api('createBooking',d,D.cu?D.cu.username:'').then(function(r){dn++;if(r&&r.success)rs.push(r);if(dn>=tt)OS(rs);});}});}

  function OS(rs){bootstrap.Modal.getInstance(G('mB')).hide();G('mBV').disabled=false;G('mBV').innerHTML='<i class="fas fa-save me-2"></i>บันทึก';if(rs.length)alert('สำเร็จ: '+rs.map(function(r){return '#'+r.id;}).join(', '));RL();}

  window.RR=function(){var s=(G('rS').value||'').toLowerCase();var l=D.rm.filter(function(r){return!s||(r.name||'').toLowerCase().includes(s);});var c=G('rC');if(!l.length){c.innerHTML='<div class="col-12 es"><i class="fas fa-bed"></i><p>ไม่มีห้อง</p></div>';return;}c.innerHTML=l.map(function(r){var im=r.images||[];var ih=im.length?'<img src="'+im[0].url+'" class="w-100" style="height:150px;object-fit:cover;border-radius:12px 12px 0 0">':'<div style="height:110px;background:var(--p6);border-radius:12px 12px 0 0;display:flex;align-items:center;justify-content:center"><i class="fas fa-image fa-2x" style="color:var(--p4)"></i></div>';return '<div class="col-md-6 col-lg-4"><div class="cs p-0" style="overflow:hidden">'+ih+'<div class="p-3"><h6 class="fw-bold mb-1" style="font-size:.9rem">'+E(r.name)+'</h6><div class="d-flex justify-content-between small mt-1"><span style="color:var(--sb)"><i class="fas fa-user me-1"></i>'+r.maxGuests+'</span><span class="fw-bold" style="color:var(--p2)">฿'+r.pricePerNight.toLocaleString()+'/คืน</span></div><div class="d-flex gap-1 mt-2"><button class="btn btn-outline-primary btn-sm flex-fill" onclick="window.ER('+r.id+')"><i class="fas fa-edit"></i></button><button class="btn btn-outline-danger btn-sm" onclick="window.DR('+r.id+')"><i class="fas fa-trash"></i></button></div></div></div></div>';}).join('');}

  window.OR=function(){G('mRI').value='';['rN','rL','rD','rA'].forEach(function(i){G(i).value='';});['r0','r1','r2','r3','r4','r6','r7','r8','r9'].forEach(function(i){G(i).value='0';});G('r5').value='2';G('rB').value='private';G('rX').value='available';G('rP').innerHTML='';D.ri=[];G('mRT').innerHTML='<i class="fas fa-bed me-2"></i>เพิ่มห้อง';new bootstrap.Modal(G('mR')).show();}

  window.ER=function(id){var r=D.rm.find(function(x){return x.id==id;});if(!r)return;window.OR();G('mRI').value=r.id;G('rN').value=r.name;G('rL').value=r.roomLabel||'';G('rB').value=r.bathroomType||'private';G('r0').value=r.pricePerNight;G('r1').value=r.weekendPriceFri;G('r2').value=r.weekendPriceSat;G('r3').value=r.weekendPriceSun;G('r4').value=r.holidayPrice;G('r5').value=r.maxGuests;G('r6').value=r.extraBedAdultPrice;G('r7').value=r.extraBedChildPrice;G('r8').value=r.extraBedAdultHolidayPrice;G('r9').value=r.extraBedChildHolidayPrice;G('rA').value=r.amenities||'';G('rX').value=r.status;G('rD').value=r.description||'';D.ri=(r.images||[]).slice();RP();}

  function RP(){G('rP').innerHTML=D.ri.map(function(img,i){return '<div class="position-relative"><img src="'+img.url+'" class="im"><button class="btn btn-danger btn-sm position-absolute top-0 end-0" style="width:18px;height:18px;padding:0;font-size:.55rem;border-radius:50%" onclick="window.XI('+i+')"><i class="fas fa-times"></i></button></div>';}).join('');}

  window.HI=function(inp){Array.from(inp.files).forEach(function(f){var r=new FileReader();r.onload=function(e){var b64=e.target.result.split(',')[1];window._api('uploadRoomImage',b64,f.name,f.type).then(function(res){if(res&&res.success){D.ri.push({url:res.url,fileId:res.fileId});RP();}});};r.readAsDataURL(f);});inp.value='';}

  window.XI=function(i){var im=D.ri[i];if(im&&im.fileId)window._api('deleteRoomImage',im.fileId);D.ri.splice(i,1);RP();}

  window.SR=function(){var d={id:G('mRI').value||null,name:G('rN').value.trim(),roomLabel:G('rL').value.trim(),bathroomType:G('rB').value,pricePerNight:parseInt(G('r0').value)||0,weekendPriceFri:parseInt(G('r1').value)||0,weekendPriceSat:parseInt(G('r2').value)||0,weekendPriceSun:parseInt(G('r3').value)||0,holidayPrice:parseInt(G('r4').value)||0,maxGuests:parseInt(G('r5').value)||2,extraBedAdultPrice:parseInt(G('r6').value)||0,extraBedChildPrice:parseInt(G('r7').value)||0,extraBedAdultHolidayPrice:parseInt(G('r8').value)||0,extraBedChildHolidayPrice:parseInt(G('r9').value)||0,amenities:G('rA').value.trim(),status:G('rX').value,description:G('rD').value.trim(),images:D.ri};if(!d.name){alert('กรอกชื่อ');return;}if(d.id)d.id=Number(d.id);window._api('saveRoom',d).then(function(r){if(r&&r.success){bootstrap.Modal.getInstance(G('mR')).hide();RL();}else alert(r?r.error:'Error');});}

  window.DR=function(id){if(!confirm('ลบ?'))return;window._api('deleteRoom',id).then(function(r){if(r&&r.success)RL();});}

  function IM(){var ms=new Set();D.tx.forEach(function(t){if(t.date)ms.add(t.date.substring(0,7));});ms.add(tM);G('tM').innerHTML=Array.from(ms).sort().reverse().map(function(m){return '<option value="'+m+'"'+(m===tM?' selected':'')+'>'+m+'</option>';}).join('');}

  window.RT=function(){var mo=G('tM').value,tp=G('tP').value;var l=D.tx.filter(function(t){if(mo&&!(t.date||'').startsWith(mo))return false;if(tp!=='all'&&t.type!==tp)return false;return true;});var ic=l.filter(function(t){return t.type==='income';}).reduce(function(s,t){return s+t.amount;},0),ex=l.filter(function(t){return t.type==='expense';}).reduce(function(s,t){return s+t.amount;},0);G('tI').textContent='฿'+ic.toLocaleString();G('tE').textContent='฿'+ex.toLocaleString();var n=ic-ex;G('tN').textContent='฿'+n.toLocaleString();G('tN').className='kv '+(n>=0?'text-success':'text-danger');G('tB').innerHTML=l.length?l.sort(function(a,b){return b.id-a.id;}).map(function(t){return '<tr><td>'+t.date+'</td><td>'+E(t.category)+'</td><td><span class="st '+(t.type==='income'?'st-co':'st-ca')+'">'+(t.type==='income'?'รายรับ':'รายจ่าย')+'</span></td><td class="fw-bold">฿'+t.amount.toLocaleString()+'</td><td style="color:var(--sb);font-size:.82rem">'+E(t.description)+'</td><td style="color:var(--sb);font-size:.82rem">'+E(t.createdBy)+'</td><td><button class="btn btn-outline-danger bi" onclick="window.DT('+t.id+')"><i class="fas fa-trash"></i></button></td></tr>';}).join(''):'<tr><td colspan="7" class="text-center py-3">-</td></tr>';}

  window.OT=function(){G('xD').value=td;G('xT').value='income';G('xA').value='';G('xS').value='';window.FC();new bootstrap.Modal(G('mT')).show();}
  window.FC=function(){G('xC').innerHTML=D.cat.filter(function(c){return c.type===G('xT').value;}).map(function(c){return '<option>'+E(c.name)+'</option>';}).join('')||'<option>-</option>';}
  window.ST=function(){var t={date:G('xD').value,category:G('xC').value,type:G('xT').value,amount:parseFloat(G('xA').value)||0,description:G('xS').value};if(!t.date||!t.amount)return;window._api('saveMultipleTransactions',[t],D.cu?D.cu.username:'').then(function(r){if(r&&r.success){bootstrap.Modal.getInstance(G('mT')).hide();RL();}});}
  window.DT=function(id){if(!confirm('ลบ?'))return;window._api('deleteTransaction',id).then(function(r){if(r&&r.success)RL();});}

  function RCT(){G('cC').innerHTML=D.cat.length?D.cat.map(function(c){return '<div class="col-md-4 col-lg-3"><div class="cs text-center"><div style="width:36px;height:36px;border-radius:10px;background:'+(c.color||'#2563eb')+';margin:0 auto 8px;display:flex;align-items:center;justify-content:center"><i class="fas fa-tag text-white" style="font-size:.85rem"></i></div><h6 class="fw-bold" style="font-size:.88rem">'+E(c.name)+'</h6><span class="st '+(c.type==='income'?'st-co':'st-ca')+'">'+(c.type==='income'?'รายรับ':'รายจ่าย')+'</span><br><button class="btn btn-outline-danger btn-sm mt-2" onclick="window.DCT('+c.id+')"><i class="fas fa-trash"></i></button></div></div>';}).join(''):'<div class="col-12 es"><i class="fas fa-tags"></i><p>-</p></div>';}
  window.OC=function(){G('cN').value='';G('cY').value='income';G('cL').value='#2563eb';new bootstrap.Modal(G('mC')).show();}
  window.SC=function(){var d={name:G('cN').value.trim(),type:G('cY').value,color:G('cL').value};if(!d.name)return;window._api('saveCategory',d).then(function(r){if(r&&r.success){bootstrap.Modal.getInstance(G('mC')).hide();RL();}});}
  window.DCT=function(id){if(!confirm('ลบ?'))return;window._api('deleteCategory',id).then(function(r){if(r&&r.success)RL();});}

  window.RU=function(){var m=G('bM').value||tM;G('bM').value=m;var items=D.bud[m]||[];var tx=D.tx.filter(function(t){return(t.date||'').startsWith(m)&&t.type==='expense';});G('uB').innerHTML=items.length?items.map(function(b,i){var u=tx.filter(function(t){return t.category===b.name;}).reduce(function(s,t){return s+t.amount;},0),r=b.amount-u,p=b.amount>0?Math.min(Math.round(u/b.amount*100),100):0,c=p>90?'danger':p>70?'warning':'success';return '<tr><td><input type="text" class="form-control form-control-sm bn" value="'+E(b.name)+'"></td><td><input type="number" class="form-control form-control-sm ba" value="'+b.amount+'"></td><td>฿'+u.toLocaleString()+'</td><td class="text-'+c+' fw-bold">฿'+r.toLocaleString()+'</td><td><div class="progress" style="height:5px"><div class="progress-bar bg-'+c+'" style="width:'+p+'%"></div></div><small>'+p+'%</small></td><td><button class="btn btn-outline-danger bi" onclick="window.XB('+i+')"><i class="fas fa-trash"></i></button></td></tr>';}).join(''):'<tr><td colspan="6" class="text-center py-3">-</td></tr>';}
  window.AB=function(){var m=G('bM').value||tM;if(!D.bud[m])D.bud[m]=[];D.bud[m].push({categoryId:0,name:'',amount:0});window.RU();}
  window.XB=function(i){var m=G('bM').value||tM;if(D.bud[m])D.bud[m].splice(i,1);window.RU();}
  window.SU=function(){var m=G('bM').value||tM;var ns=document.querySelectorAll('.bn'),as=document.querySelectorAll('.ba');var items=[];ns.forEach(function(e,i){var n=e.value.trim(),a=parseFloat(as[i].value)||0;if(n)items.push({categoryId:0,name:n,amount:a});});window._api('saveBudget',m,items).then(function(r){if(r&&r.success){D.bud[m]=items;alert('บันทึกแล้ว');window.RU();}});}

  function RUS(){G('uT').innerHTML=D.us.map(function(u){var rb={'owner':'<span class="st" style="background:#fee2e2;color:#991b1b">เจ้าของ</span>','admin':'<span class="st st-dp">แอดมิน</span>','staff':'<span class="st st-ci">พนักงาน</span>'};return '<tr><td>'+E(u.username)+'</td><td>'+E(u.displayName)+'</td><td>'+(rb[u.role]||u.role)+'</td><td style="color:var(--sb);font-size:.82rem">'+E(u.permissions||'all')+'</td><td><div class="d-flex gap-1"><button class="btn btn-outline-primary bi" onclick="window.EU('+u.id+')"><i class="fas fa-edit"></i></button><button class="btn btn-outline-danger bi" onclick="window.DU('+u.id+')"><i class="fas fa-trash"></i></button></div></td></tr>';}).join('');}
  window.OU=function(){G('uR').value='';G('uU').value='';G('uP').value='';G('uD').value='';G('uL').value='staff';G('uM').value='';G('mUT').innerHTML='<i class="fas fa-user-plus me-2"></i>ผู้ใช้';new bootstrap.Modal(G('mU')).show();}
  window.EU=function(id){var u=D.us.find(function(x){return x.id==id;});if(!u)return;window.OU();G('uR').value=u.id;G('uU').value=u.username;G('uD').value=u.displayName;G('uL').value=u.role;G('uM').value=u.permissions||'';}
  window.SV=function(){var d={username:G('uU').value.trim(),password:G('uP').value,displayName:G('uD').value.trim(),role:G('uL').value,permissions:G('uM').value.trim()};var er=G('uR').value;if(er)d.editRow=er;if(!d.username)return;if(!er&&!d.password){alert('กรอก Password');return;}window._api('saveUser',d).then(function(r){if(r&&r.success){bootstrap.Modal.getInstance(G('mU')).hide();RL();}else alert(r?r.error:'Error');});}
  window.DU=function(id){if(!confirm('ลบ?'))return;window._api('deleteUser',id).then(function(r){if(r&&r.success)RL();});}
  window.SF=function(){window._api('saveUserProfile',{name:G('fN').value,image:G('fI').value}).then(function(r){if(r&&r.success)alert('บันทึกแล้ว');});}
}
