import Head from 'next/head'

export default function Booking() {
  return (
    <>
      <Head>
        <title>จองห้องพักออนไลน์</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        body{font-family:'Prompt',sans-serif;background:#f5f6fa;min-height:100vh}
        .hero{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:40px 0 30px;text-align:center}
        .hero h2{font-weight:700}.hero p{opacity:.85}
        .step-indicator{display:flex;justify-content:center;gap:15px;margin:30px 0}
        .step-dot{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.9rem;transition:.3s}
        .step-dot.active{background:#fff;color:#764ba2;box-shadow:0 4px 15px rgba(0,0,0,.2)}
        .step-dot.done{background:#2ecc71;color:#fff}
        .step-dot.inactive{background:rgba(255,255,255,.3);color:rgba(255,255,255,.7)}
        .step-line{width:40px;height:2px;background:rgba(255,255,255,.3);align-self:center}
        .booking-card{background:#fff;border-radius:16px;box-shadow:0 8px 30px rgba(0,0,0,.08);padding:30px;margin-top:-30px;position:relative;z-index:10}
        .room-option{border:2px solid #eee;border-radius:12px;padding:15px;cursor:pointer;transition:.2s;position:relative}
        .room-option:hover{border-color:#667eea;box-shadow:0 4px 15px rgba(102,126,234,.15)}
        .room-option.selected{border-color:#667eea;background:#f8f9ff}
        .room-option.unavailable{opacity:.6;cursor:not-allowed;background:#f8f8f8}
        .room-option.unavailable::after{content:'ไม่ว่าง';position:absolute;top:10px;right:10px;background:#e63946;color:#fff;padding:2px 10px;border-radius:20px;font-size:.75rem}
        .room-option.available::after{content:'ว่าง';position:absolute;top:10px;right:10px;background:#2ecc71;color:#fff;padding:2px 10px;border-radius:20px;font-size:.75rem}
        .price-tag{font-size:1.2rem;font-weight:700;color:#667eea}
        .summary-box{background:linear-gradient(135deg,#667eea,#764ba2);border-radius:12px;padding:20px;color:#fff}
        .deposit-info{background:#fff3cd;border:1px solid #ffc107;border-radius:12px;padding:15px;margin-top:15px}
        .success-box{text-align:center;padding:40px 20px}
        .success-box i{font-size:4rem;color:#2ecc71;margin-bottom:20px}
        .remaining-alert{background:#ffe0e0;border:1px solid #e63946;border-radius:12px;padding:15px;margin-top:15px}
      `}</style>

      <div className="hero">
        <h2><i className="fas fa-hotel me-2"></i>จองห้องพักออนไลน์</h2>
        <p>เลือกวันที่ → เลือกห้อง → กรอกข้อมูล → ยืนยัน</p>
        <div className="step-indicator">
          <div className="step-dot active" id="dot1">1</div><div className="step-line"></div>
          <div className="step-dot inactive" id="dot2">2</div><div className="step-line"></div>
          <div className="step-dot inactive" id="dot3">3</div><div className="step-line"></div>
          <div className="step-dot inactive" id="dot4">✓</div>
        </div>
      </div>

      <div className="container pb-5">
        <div className="row justify-content-center"><div className="col-lg-8">
          <div className="booking-card">
            {/* STEP 1 */}
            <div id="step1">
              <h4 className="fw-bold mb-4"><i className="fas fa-calendar-alt text-primary me-2"></i>ขั้นตอนที่ 1: เลือกวันเข้าพัก</h4>
              <div className="row g-3 mb-4">
                <div className="col-md-6"><label className="form-label fw-bold">วันเช็คอิน *</label><input type="date" id="bCheckIn" className="form-control form-control-lg" onChange={()=>window._calcPreview&&window._calcPreview()} /></div>
                <div className="col-md-6"><label className="form-label fw-bold">วันเช็คเอาท์ *</label><input type="date" id="bCheckOut" className="form-control form-control-lg" onChange={()=>window._calcPreview&&window._calcPreview()} /></div>
              </div>
              <div id="datePreview" className="text-center text-muted mb-3"></div>
              <div className="text-end"><button className="btn btn-primary btn-lg rounded-pill px-5" onClick={()=>window._goStep2&&window._goStep2()}>ดูห้องว่าง <i className="fas fa-arrow-right ms-2"></i></button></div>
            </div>
            {/* STEP 2 */}
            <div id="step2" className="d-none">
              <h4 className="fw-bold mb-2"><i className="fas fa-bed text-primary me-2"></i>ขั้นตอนที่ 2: เลือกห้องพัก</h4>
              <p className="text-muted mb-3" id="dateRangeLabel"></p>
              <div id="roomOptions" className="row g-3 mb-4"></div>
              <div className="d-flex justify-content-between">
                <button className="btn btn-outline-secondary rounded-pill" onClick={()=>window._goStep&&window._goStep(1)}><i className="fas fa-arrow-left me-2"></i>เปลี่ยนวัน</button>
                <button className="btn btn-primary btn-lg rounded-pill px-5" id="btnStep3" onClick={()=>window._goStep3&&window._goStep3()} disabled>ถัดไป <i className="fas fa-arrow-right ms-2"></i></button>
              </div>
            </div>
            {/* STEP 3 */}
            <div id="step3" className="d-none">
              <h4 className="fw-bold mb-4"><i className="fas fa-user text-primary me-2"></i>ขั้นตอนที่ 3: กรอกข้อมูล</h4>
              <div className="summary-box mb-4">
                <div className="row text-center">
                  <div className="col-4"><small className="opacity-75">ห้อง</small><div className="fw-bold" id="sumRoom">-</div></div>
                  <div className="col-4"><small className="opacity-75">จำนวนคืน</small><div className="fw-bold" id="sumNights">-</div></div>
                  <div className="col-4"><small className="opacity-75">ราคารวม</small><div className="fw-bold" id="sumTotal">-</div></div>
                </div>
              </div>
              <div className="row g-3 mb-3">
                <div className="col-md-6"><label className="form-label">ชื่อ-นามสกุล *</label><input type="text" id="bName" className="form-control" required /></div>
                <div className="col-md-6"><label className="form-label">เบอร์โทรศัพท์ *</label><input type="tel" id="bPhone" className="form-control" required /></div>
                <div className="col-md-6"><label className="form-label">Email</label><input type="email" id="bEmail" className="form-control" /></div>
                <div className="col-md-6"><label className="form-label">LINE ID</label><input type="text" id="bLine" className="form-control" /></div>
                <div className="col-md-6"><label className="form-label">จำนวนผู้เข้าพัก</label><input type="number" id="bGuests" className="form-control" defaultValue="2" min="1" /></div>
                <div className="col-12"><label className="form-label">หมายเหตุ</label><textarea id="bNotes" className="form-control" rows="2"></textarea></div>
              </div>
              <div id="extraBedSection" className="mb-3 p-3 border rounded" style={{display:'none'}}>
                <h6 className="fw-bold"><i className="fas fa-bed me-2 text-info"></i>เตียงเสริม</h6>
                <div className="row g-2 align-items-center">
                  <div className="col-md-4"><label className="form-label small">จำนวนเตียง</label><input type="number" id="bExtraBeds" className="form-control" defaultValue="0" min="0" onChange={()=>window._calcExtraBed&&window._calcExtraBed()} onInput={()=>window._calcExtraBed&&window._calcExtraBed()} /></div>
                  <div className="col-md-4"><label className="form-label small">ราคา/คืน</label><div id="ebPriceLabel" className="fw-bold text-info">฿0</div></div>
                  <div className="col-md-4"><div id="ebCalcInfo" className="small text-info"></div></div>
                </div>
              </div>
              <div className="deposit-info">
                <h6 className="fw-bold"><i className="fas fa-hand-holding-usd me-2 text-warning"></i>เงินมัดจำ (ถ้ามี)</h6>
                <p className="small text-muted mb-2">สามารถจ่ายมัดจำบางส่วนก่อน ส่วนที่เหลือชำระวันเช็คอิน</p>
                <div className="row g-2 align-items-end">
                  <div className="col-md-6"><label className="form-label small">จำนวนเงินมัดจำ (บาท)</label><input type="number" id="bDeposit" className="form-control" defaultValue="0" min="0" onChange={()=>window._calcDeposit&&window._calcDeposit()} /></div>
                  <div className="col-md-6"><div id="depositCalc" className="small text-muted"></div></div>
                </div>
              </div>
              <div className="d-flex justify-content-between mt-4">
                <button className="btn btn-outline-secondary rounded-pill" onClick={()=>window._goStep&&window._goStep(2)}><i className="fas fa-arrow-left me-2"></i>เลือกห้องใหม่</button>
                <button className="btn btn-success btn-lg rounded-pill px-5" onClick={()=>window._submitBooking&&window._submitBooking()}><i className="fas fa-check-circle me-2"></i>ยืนยันการจอง</button>
              </div>
            </div>
            {/* STEP 4 */}
            <div id="step4" className="d-none">
              <div className="success-box">
                <i className="fas fa-check-circle"></i>
                <h3 className="fw-bold text-success">จองสำเร็จ!</h3>
                <p className="text-muted">หมายเลขการจอง</p>
                <h2 className="fw-bold text-primary mb-3" id="bookingNumber">#0</h2>
                <div className="card bg-light border-0 p-3 mb-3 text-start" id="bookingSummary"></div>
                <div id="remainingAlert"></div>
                <div className="mt-4 d-flex justify-content-center gap-3">
                  <button className="btn btn-primary rounded-pill px-4" onClick={()=>window._downloadReceipt&&window._downloadReceipt()}><i className="fas fa-file-pdf me-2"></i>ดาวน์โหลดใบจอง</button>
                  <button className="btn btn-outline-secondary rounded-pill px-4" onClick={()=>location.reload()}><i className="fas fa-redo me-2"></i>จองใหม่</button>
                </div>
              </div>
            </div>
          </div>
        </div></div>
      </div>

      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
      <script dangerouslySetInnerHTML={{__html:`
        var selectedRoom=null,selectedRoomData=null,bookingResult=null,nightsCount=0,totalPrice=0;

        async function _api(fn,...params){
          const res=await fetch('/api/'+fn,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({params})});
          return res.json();
        }

        window._calcPreview=function(){
          var ci=document.getElementById('bCheckIn').value,co=document.getElementById('bCheckOut').value;
          if(ci&&co){var d=Math.ceil((new Date(co)-new Date(ci))/86400000);
          document.getElementById('datePreview').innerHTML=d>0?'<span class="badge bg-primary fs-6">'+d+' คืน</span>':'<span class="text-danger">วันเช็คเอาท์ต้องหลังเช็คอิน</span>';}
        };

        window._goStep=function(n){
          document.querySelectorAll('[id^="step"]').forEach(function(el){if(el.id.match(/^step\\d$/))el.classList.add('d-none');});
          document.getElementById('step'+n).classList.remove('d-none');
          for(var i=1;i<=4;i++){var dot=document.getElementById('dot'+i);dot.className='step-dot '+(i<n?'done':i===n?'active':'inactive');}
        };

        window._goStep2=function(){
          var ci=document.getElementById('bCheckIn').value,co=document.getElementById('bCheckOut').value;
          if(!ci||!co){alert('กรุณาเลือกวันเช็คอิน/เช็คเอาท์');return;}
          nightsCount=Math.ceil((new Date(co)-new Date(ci))/86400000);
          if(nightsCount<=0){alert('วันเช็คเอาท์ต้องหลังวันเช็คอิน');return;}
          document.getElementById('dateRangeLabel').textContent=new Date(ci).toLocaleDateString('th-TH',{day:'numeric',month:'long',year:'numeric'})+' — '+new Date(co).toLocaleDateString('th-TH',{day:'numeric',month:'long',year:'numeric'})+' ('+nightsCount+' คืน)';
          document.getElementById('roomOptions').innerHTML='<div class="col-12 text-center py-4"><i class="fas fa-spinner fa-spin fa-2x text-primary"></i><p class="mt-2">กำลังตรวจสอบห้องว่าง...</p></div>';
          window._goStep(2);
          _api('getAvailableRoomsForDates',ci,co).then(function(rooms){renderRoomOptions(rooms);});
        };

        function renderRoomOptions(rooms){
          var ct=document.getElementById('roomOptions');ct.innerHTML='';selectedRoom=null;selectedRoomData=null;
          document.getElementById('btnStep3').disabled=true;
          var bn={private:'<i class="fas fa-bath me-1"></i>ห้องน้ำในตัว',separate:'<i class="fas fa-door-open me-1"></i>ห้องน้ำแยก',shared:'<i class="fas fa-users me-1"></i>ห้องน้ำรวม'};
          if(!rooms||!rooms.length){ct.innerHTML='<div class="col-12 text-center text-muted py-4">ไม่พบห้องพัก</div>';return;}
          rooms.forEach(function(r){
            var amenHTML='';if(r.amenities)amenHTML=r.amenities.split(',').map(function(a){return'<span class="badge bg-light text-dark border me-1" style="font-size:.65rem">'+a.trim()+'</span>';}).join('');
            var cls=r.available?'room-option available':'room-option unavailable';
            var total=r.pricePerNight*nightsCount,bt=r.bathroomType||'private';
            var imgs=r.images||[];
            var imgHTML=imgs.length?'<div style="display:flex;gap:5px;overflow-x:auto;margin-bottom:10px;padding-bottom:5px">'+imgs.map(function(img){return'<img src="'+img.url+'" style="height:100px;min-width:120px;object-fit:cover;border-radius:8px;flex-shrink:0" loading="lazy">';}).join('')+'</div>':'<div style="height:80px;background:#f0f0f0;border-radius:8px;display:flex;align-items:center;justify-content:center;margin-bottom:10px"><i class="fas fa-image fa-2x text-muted"></i></div>';
            var ebHTML=r.extraBedPrice?'<div class="small text-muted mt-1"><i class="fas fa-bed me-1"></i>เตียงเสริม ฿'+r.extraBedPrice.toLocaleString()+'/คืน</div>':'';
            ct.innerHTML+='<div class="col-md-6"><div class="'+cls+'" data-id="'+r.id+'" data-ebprice="'+(r.extraBedPrice||0)+'" data-price="'+r.pricePerNight+'" data-name="'+r.name+'" onclick="'+(r.available?'selectRoom('+r.id+',this)':'')+'">'
              +imgHTML+'<div class="d-flex justify-content-between mb-1"><span class="badge bg-info bg-opacity-10 text-info border border-info" style="font-size:.65rem">'+(bn[bt]||bt)+'</span><span class="text-muted small"><i class="fas fa-user"></i> '+r.maxGuests+'</span></div>'
              +'<h5 class="fw-bold mt-1">'+r.name+'</h5><p class="text-muted small mb-1">'+(r.description||'')+'</p><div class="mb-1">'+amenHTML+'</div>'+ebHTML
              +'<div class="d-flex justify-content-between align-items-end mt-2"><div><span class="text-muted small">฿'+r.pricePerNight.toLocaleString()+'/คืน × '+nightsCount+'</span><br><span class="price-tag">฿'+total.toLocaleString()+'</span></div>'
              +(r.available?'':'<span class="text-danger small fw-bold">'+(r.reason||'ไม่ว่าง')+'</span>')+'</div></div></div>';
          });
        }

        function selectRoom(id,el){
          document.querySelectorAll('.room-option').forEach(function(e){e.classList.remove('selected');});
          el.classList.add('selected');selectedRoom=id;
          selectedRoomData={name:el.dataset.name,price:parseInt(el.dataset.price),ebPrice:parseInt(el.dataset.ebprice)||0};
          document.getElementById('btnStep3').disabled=false;
        }

        window._goStep3=function(){
          if(!selectedRoom||!selectedRoomData){alert('กรุณาเลือกห้อง');return;}
          totalPrice=selectedRoomData.price*nightsCount;
          document.getElementById('sumRoom').textContent=selectedRoomData.name;
          document.getElementById('sumNights').textContent=nightsCount+' คืน';
          document.getElementById('sumTotal').textContent='฿'+totalPrice.toLocaleString();
          var ebSec=document.getElementById('extraBedSection');
          if(selectedRoomData.ebPrice>0){ebSec.style.display='';document.getElementById('ebPriceLabel').textContent='฿'+selectedRoomData.ebPrice.toLocaleString()+'/คืน';}
          else{ebSec.style.display='none';}
          document.getElementById('bExtraBeds').value=0;
          window._calcDeposit();window._calcExtraBed();window._goStep(3);
        };

        window._calcExtraBed=function(){
          var eb=parseInt(document.getElementById('bExtraBeds').value)||0,ebPrice=selectedRoomData?selectedRoomData.ebPrice:0;
          var ebTotal=eb*ebPrice*nightsCount,newTotal=selectedRoomData.price*nightsCount+ebTotal;
          totalPrice=newTotal;document.getElementById('sumTotal').textContent='฿'+newTotal.toLocaleString();
          var info=document.getElementById('ebCalcInfo');
          if(eb>0&&ebPrice>0)info.innerHTML='เตียงเสริม '+eb+' × ฿'+ebPrice.toLocaleString()+' × '+nightsCount+' คืน = <strong>฿'+ebTotal.toLocaleString()+'</strong>';
          else info.innerHTML='';
          window._calcDeposit();
        };

        window._calcDeposit=function(){
          var dep=parseInt(document.getElementById('bDeposit').value)||0,remaining=totalPrice-dep,el=document.getElementById('depositCalc');
          if(dep>0)el.innerHTML='<strong class="text-success">มัดจำ: ฿'+dep.toLocaleString()+'</strong><br>คงเหลือชำระวันเช็คอิน: <strong class="text-danger">฿'+remaining.toLocaleString()+'</strong>';
          else el.innerHTML='<span class="text-muted">ไม่มีมัดจำ — ชำระเต็มจำนวนวันเช็คอิน</span>';
        };

        window._submitBooking=function(){
          var name=document.getElementById('bName').value.trim(),phone=document.getElementById('bPhone').value.trim();
          if(!name||!phone){alert('กรุณากรอกชื่อและเบอร์โทร');return;}
          var dep=parseInt(document.getElementById('bDeposit').value)||0,extraBeds=parseInt(document.getElementById('bExtraBeds').value)||0;
          var booking={customerName:name,customerPhone:phone,customerEmail:document.getElementById('bEmail').value,customerLine:document.getElementById('bLine').value,roomId:selectedRoom,checkIn:document.getElementById('bCheckIn').value,checkOut:document.getElementById('bCheckOut').value,guests:parseInt(document.getElementById('bGuests').value)||2,notes:document.getElementById('bNotes').value,depositAmount:dep,extraBeds:extraBeds,totalPrice:totalPrice,status:'pending',paymentStatus:dep>0?'deposit':'unpaid'};
          var btn=document.querySelector('#step3 .btn-success');btn.disabled=true;btn.innerHTML='<i class="fas fa-spinner fa-spin me-2"></i>กำลังจอง...';
          _api('submitPublicBooking',booking).then(function(result){
            if(result&&result.success){bookingResult=result;showSuccess(result);}
            else{alert(result?result.error:'เกิดข้อผิดพลาด');btn.disabled=false;btn.innerHTML='<i class="fas fa-check-circle me-2"></i>ยืนยันการจอง';}
          });
        };

        function showSuccess(result){
          document.getElementById('bookingNumber').textContent='#'+result.id;
          var ci=document.getElementById('bCheckIn').value,co=document.getElementById('bCheckOut').value;
          document.getElementById('bookingSummary').innerHTML='<div class="row g-2"><div class="col-6"><small class="text-muted">ห้อง</small><div class="fw-bold">'+(result.roomName||'')+'</div></div><div class="col-6"><small class="text-muted">ราคารวม</small><div class="fw-bold text-primary">฿'+(result.totalPrice||0).toLocaleString()+'</div></div><div class="col-6"><small class="text-muted">เช็คอิน</small><div>'+new Date(ci).toLocaleDateString('th-TH')+'</div></div><div class="col-6"><small class="text-muted">เช็คเอาท์</small><div>'+new Date(co).toLocaleDateString('th-TH')+'</div></div><div class="col-6"><small class="text-muted">มัดจำ</small><div class="fw-bold text-success">฿'+(result.depositAmount||0).toLocaleString()+'</div></div><div class="col-6"><small class="text-muted">คงเหลือ</small><div class="fw-bold text-danger">฿'+(result.remainingBalance||0).toLocaleString()+'</div></div></div>';
          var rem=result.remainingBalance||0;
          if(rem>0)document.getElementById('remainingAlert').innerHTML='<div class="remaining-alert"><i class="fas fa-exclamation-triangle text-danger me-2"></i><strong>แจ้งเตือน:</strong> กรุณาชำระเงินส่วนที่เหลือ <strong>฿'+rem.toLocaleString()+'</strong> ในวันเช็คอิน</div>';
          window._goStep(4);
        }

        window._downloadReceipt=function(){
          try{
            var jsPDF=window.jspdf.jsPDF,doc=new jsPDF();
            doc.setFont('helvetica','bold');doc.setFontSize(20);doc.text('BOOKING RECEIPT',105,25,{align:'center'});
            doc.setFontSize(12);doc.setFont('helvetica','normal');doc.text('Booking #'+(bookingResult?bookingResult.id:''),105,35,{align:'center'});
            doc.line(20,40,190,40);var y=50;
            doc.setFont('helvetica','bold');doc.text('Guest:',25,y);doc.setFont('helvetica','normal');doc.text(document.getElementById('bName').value,70,y);y+=10;
            doc.setFont('helvetica','bold');doc.text('Phone:',25,y);doc.setFont('helvetica','normal');doc.text(document.getElementById('bPhone').value,70,y);y+=10;
            doc.setFont('helvetica','bold');doc.text('Room:',25,y);doc.setFont('helvetica','normal');doc.text(bookingResult?bookingResult.roomName:'',70,y);y+=10;
            doc.setFont('helvetica','bold');doc.text('Check-in:',25,y);doc.setFont('helvetica','normal');doc.text(document.getElementById('bCheckIn').value,70,y);y+=10;
            doc.setFont('helvetica','bold');doc.text('Check-out:',25,y);doc.setFont('helvetica','normal');doc.text(document.getElementById('bCheckOut').value,70,y);y+=15;
            doc.line(20,y,190,y);y+=10;
            doc.setFont('helvetica','bold');doc.text('Total:',25,y);doc.text(''+(bookingResult?bookingResult.totalPrice:0)+' THB',70,y);y+=10;
            doc.setFont('helvetica','bold');doc.text('Deposit:',25,y);doc.setFont('helvetica','normal');doc.text(''+(bookingResult?bookingResult.depositAmount:0)+' THB',70,y);y+=10;
            doc.setFont('helvetica','bold');doc.setTextColor(220,50,50);doc.text('Remaining:',25,y);doc.text(''+(bookingResult?bookingResult.remainingBalance:0)+' THB',70,y);
            doc.setTextColor(0,0,0);doc.save('Booking_'+(bookingResult?bookingResult.id:'receipt')+'.pdf');
          }catch(e){alert('PDF error: '+e.message);}
        };

        document.addEventListener('DOMContentLoaded',function(){
          var today=new Date().toISOString().split('T')[0];
          document.getElementById('bCheckIn').min=today;document.getElementById('bCheckOut').min=today;document.getElementById('bCheckIn').value=today;
          document.getElementById('bCheckIn').addEventListener('change',function(){document.getElementById('bCheckOut').min=this.value;});
        });
      `}} />
    </>
  )
}
