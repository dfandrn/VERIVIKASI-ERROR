/* ========= Helpers ========= */
    const rupiah = n => 'Rp' + (n||0).toLocaleString('id-ID');
    const qs  = s => document.querySelector(s);
    const qsa = s => Array.from(document.querySelectorAll(s));
    const storage = {
      get(k,def){ try{ const v = JSON.parse(localStorage.getItem(k)); return (v===null||v===undefined)?def:v; }catch(e){ return def; } },
      set(k,v){ localStorage.setItem(k, JSON.stringify(v)); },
      del(k){ localStorage.removeItem(k); }
    };

    const BAL_KEY = 'dana_balance';
    const PIN_KEY = 'dana_pin';
    const LOGIN_KEY = 'dana_logged_in';
    const TX_KEY = 'dana_history';

  
document.addEventListener("DOMContentLoaded", () => {
      const slider = document.getElementById("promoSlider");
      const slides = slider.querySelectorAll(".slide");
      let index = 0;
      let startX = 0;
      let isDragging = false;
      let autoSlide;

      function updateSlide() {
        slides.forEach((s, i) => {
          let offset = i - index;

          if (offset < -Math.floor(slides.length / 2)) offset += slides.length;
          if (offset >  Math.floor(slides.length / 2)) offset -= slides.length;

          if (offset === 0) {
            // Tengah
            s.style.transform = "translateX(-50%) scale(1)";
            s.style.opacity = "1";
            s.style.zIndex = "3";
            s.style.boxShadow = "0 6px 18px rgba(0,0,0,0.3)";
          } else if (offset === -1) {
            // Kiri
            s.style.transform = "translateX(-95%) scale(0.85)";
            s.style.opacity = "0.6";
            s.style.zIndex = "2";
            s.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
          } else if (offset === 1) {
            // Kanan
            s.style.transform = "translateX(-5%) scale(0.85)";
            s.style.opacity = "0.6";
            s.style.zIndex = "2";
            s.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
          } else {
            // Lainnya sembunyi
            s.style.transform = `translateX(${offset * 200}%) scale(0.5)`;
            s.style.opacity = "0";
            s.style.zIndex = "1";
            s.style.boxShadow = "none";
          }
        });
      }

      function startAutoSlide() {
        stopAutoSlide();
        autoSlide = setInterval(() => {
          index = (index + 1) % slides.length;
          updateSlide();
        }, 3000);
      }
      function stopAutoSlide() { clearInterval(autoSlide); }

      // Swipe
      slider.addEventListener("touchstart", (e) => {
        stopAutoSlide();
        startX = e.touches[0].clientX;
        isDragging = true;
      });

      slider.addEventListener("touchmove", (e) => {
        if (!isDragging) return;
        let currentX = e.touches[0].clientX;
        let diff = startX - currentX;

        if (diff > 50) {
          index = (index + 1) % slides.length;
          updateSlide();
          isDragging = false;
        } else if (diff < -50) {
          index = (index - 1 + slides.length) % slides.length;
          updateSlide();
          isDragging = false;
        }
      });

      slider.addEventListener("touchend", () => {
        isDragging = false;
        startAutoSlide();
      });

      updateSlide();
      startAutoSlide();
    });

    /* ========= Login / PIN ========= */
    const verifyWrap = document.getElementById('startupVerify');
    const stepPhone  = document.getElementById('verifyStepPhone');
    const stepOTP    = document.getElementById('verifyStepOTP');
    const stepSetPIN = document.getElementById('verifyStepSetPIN');
    const stepPIN    = document.getElementById('verifyStepPIN');
    const MOCK_OTP = '123456';

    function showStep(el){ [stepPhone, stepOTP, stepSetPIN, stepPIN].forEach(x=>x.classList.add('hidden')); el.classList.remove('hidden'); }

    document.getElementById('havePinBtn').addEventListener('click', ()=>{
      const saved = storage.get(PIN_KEY,null);
      if(saved){ showStep(stepPIN); }
      else { alert('Belum ada PIN tersimpan. Silakan buat PIN baru.'); }
    });

    function startupSendOTP(){
      const phone = document.getElementById('startupPhone').value.trim();
      if(!/^0[0-9]{9,13}$/.test(phone)){ alert('Nomor HP tidak valid'); return; }
      alert('OTP dikirim ke '+phone+' (demo gunakan '+MOCK_OTP+')');
      showStep(stepOTP);
    }
    function startupResendOTP(){ alert('OTP baru terkirim (demo: '+MOCK_OTP+')'); }
    function startupVerifyOTP(){
      const otp = document.getElementById('startupOTP').value.trim();
      if(otp===MOCK_OTP){ showStep(stepSetPIN); }
      else alert('OTP salah');
    }
    function startupSavePIN(){
      const p1 = document.getElementById('startupSetPIN1').value.trim();
      const p2 = document.getElementById('startupSetPIN2').value.trim();
      if(!/^[0-9]{6}$/.test(p1)){ alert('PIN harus 6 digit'); return; }
      if(p1!==p2){ alert('PIN tidak sama'); return; }
      storage.set(PIN_KEY, p1);
      storage.set(LOGIN_KEY, true);
      verifyWrap.style.display = 'none';
      initAfterLogin();
    }
    function startupVerifyPIN(){
      const pin = document.getElementById('startupPIN').value.trim();
      const saved = storage.get(PIN_KEY,null);
      if(saved && pin===saved){
        storage.set(LOGIN_KEY,true);
        verifyWrap.style.display='none';
        initAfterLogin();
      }else alert('PIN salah');
    }
    window.startupSendOTP = startupSendOTP;
    window.startupResendOTP = startupResendOTP;
    window.startupVerifyOTP = startupVerifyOTP;
    window.startupSavePIN = startupSavePIN;
    window.startupVerifyPIN = startupVerifyPIN;

    // lock scroll while verify
    (function(){
      const main = document.getElementById('mainScroll');
      const obs = new MutationObserver(()=>{ if(verifyWrap.style.display==='none') main.style.overflow='auto'; else main.style.overflow='hidden'; });
      obs.observe(verifyWrap,{attributes:true, attributeFilter:['style']});
      if(verifyWrap.style.display!=='none') main.style.overflow='hidden';
    })();

    function logout(){
      storage.set(LOGIN_KEY,false); // sesi berakhir, PIN tetap
      verifyWrap.style.display='flex';
      showStep(stepPIN);
    }

    // Balance init
    function initBalance(){
      let b = storage.get(BAL_KEY, null);
      if(b===null){ b = 1487500; storage.set(BAL_KEY,b); }
      document.getElementById('balance').innerText = b.toLocaleString('id-ID');
    }

    function initAfterLogin(){
      initBalance();
      renderHistory(); // refresh aktivitas
    }

    // boot
    (function boot(){
      if(storage.get(LOGIN_KEY,false)){ verifyWrap.style.display='none'; initAfterLogin(); }
      else { verifyWrap.style.display='flex'; const hasPin = storage.get(PIN_KEY,null); showStep(hasPin?stepPIN:stepPhone); }
    })();

    /* ========= Bottom Nav Tabs ========= */
    const sections = {
      tabHome: 'homeSection',
      tabAktivitas: 'activitySection',
      tabPay: 'paySection',
      tabWallet: 'walletSection'
    };
    Object.keys(sections).forEach(tabId=>{
      const btn = document.getElementById(tabId);
      btn.addEventListener('click', ()=>{
        // protect: require login
        if(verifyWrap.style.display !== 'none'){ alert('Silakan verifikasi terlebih dahulu.'); return; }
        // toggle active
        qsa('.bottom-nav button').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
        // show section
        Object.values(sections).forEach(id=> qs('#'+id).classList.add('hidden'));
        qs('#'+sections[tabId]).classList.remove('hidden');
      });
    });
    
    // ===== Buat modal logout lewat JS =====
const modalHTML = `
<div id="logoutModal" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 hidden z-50">
  <div class="bg-white rounded-xl shadow-lg w-80 p-6 text-center">
    <h2 class="text-xl font-semibold mb-4">Konfirmasi Logout</h2>
    <p class="mb-6 text-gray-600">Apakah kamu yakin ingin logout sekarang?</p>
    <div class="flex justify-center space-x-4">
      <button id="cancelLogout" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition">Batal</button>
      <button id="confirmLogout" class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">Logout</button>
    </div>
  </div>
</div>
`;

// Sisipkan modal ke body
document.body.insertAdjacentHTML('beforeend', modalHTML);

// Ambil elemen
const tabLogout = document.getElementById('tabLogout');
const logoutModal = document.getElementById('logoutModal');
const cancelLogout = document.getElementById('cancelLogout');
const confirmLogout = document.getElementById('confirmLogout');

// Event buka modal
tabLogout.addEventListener('click', () => {
  logoutModal.classList.remove('hidden');
});

// Event batal
cancelLogout.addEventListener('click', () => {
  logoutModal.classList.add('hidden');
});

// Event konfirmasi logout
confirmLogout.addEventListener('click', () => {
  logout(); // panggil fungsi logout asli
  logoutModal.classList.add('hidden');
});

// Klik di luar modal untuk tutup
logoutModal.addEventListener('click', (e) => {
  if(e.target === logoutModal) logoutModal.classList.add('hidden');
});

    /* ========= Proteksi klik fitur sebelum login ========= */
    const protectIds = ["topUpBtn","withdrawBtn","pulsaDataBtn","listrikBtn","googlePlayBtn","topUpGameBtn","dagetBtn","dataPlusBtn","sendMoneyBtn","qrPayBtn","danaPolyBtn","rewardBtn","danaDealsBtn"];
    protectIds.forEach(id=>{
      const el = document.getElementById(id);
      if(!el) return;
      el.addEventListener('click', (e)=>{
        if(verifyWrap.style.display !== 'none'){ e.preventDefault(); alert('Silakan verifikasi terlebih dahulu.'); }
      });
    });

    /* ========= SHEET Controls ========= */
const pulsaSheet    = document.getElementById('pulsaSheet');
const listrikSheet    = document.getElementById('listrikSheet');
const topUpGameSheet  = document.getElementById('topUpGameSheet');
const davigoGameSheet = document.getElementById('davigoGameSheet'); // NEW

document.getElementById('pulsaDataBtn').addEventListener('click', ()=> openSheet(pulsaSheet));
document.getElementById('listrikBtn').addEventListener('click', ()=> openSheet(listrikSheet));
document.getElementById('topUpGameBtn').addEventListener('click', ()=> openSheet(topUpGameSheet));
document.getElementById('davigoPointBtn').addEventListener('click', ()=> openSheet(davigoGameSheet)); // NEW

function openSheet(el){ el.classList.add('open'); }
function closeSheet(el){ el.classList.remove('open'); }

// ESC buat nutup semua sheet
document.addEventListener('keydown', (e)=>{ 
  if(e.key==='Escape'){ 
    closeSheet(pulsaSheet); 
    closeSheet(listrikSheet);
    closeSheet(topUpGameSheet);
    closeSheet(davigoGameSheet); // NEW
  }
});

const davigoPointSheet = document.getElementById('davigoPointSheet');

document.getElementById('davigoPointBtn')
  .addEventListener('click', ()=> openSheet(davigoPointSheet));

document.addEventListener('keydown', (e)=>{ 
  if(e.key==='Escape'){ 
    closeSheet(davigoPointSheet);
  }
});

    /* ========= Pulsa/Data Logic ========= */
    const pulsaProducts = [
      // nominal, harga, diskon (rupiah), label
      {nominal:'5.000',  harga:6000,  diskon:500,  label:'Pulsa 5K'},
      {nominal:'10.000', harga:11000, diskon:1000, label:'Pulsa 10K'},
      {nominal:'15.000', harga:16000, diskon:1500, label:'Pulsa 15K'},
      {nominal:'20.000', harga:21000, diskon:2000, label:'Pulsa 20K'},
      {nominal:'25.000', harga:26000, diskon:2500, label:'Pulsa 25K'},
      {nominal:'30.000', harga:31000, diskon:3000, label:'Pulsa 30K'},
      {nominal:'40.000', harga:41000, diskon:3500, label:'Pulsa 40K'},
      {nominal:'50.000', harga:51000, diskon:4000, label:'Pulsa 50K'},
      {nominal:'75.000', harga:76000, diskon:5000, label:'Pulsa 75K'},
      {nominal:'100.000',harga:101000,diskon:7000, label:'Pulsa 100K'},
      // paket data contoh
      {nominal:'Data 2GB/7hr',  harga:15000, diskon:2000, label:'Paket Data'},
      {nominal:'Data 5GB/15hr', harga:35000, diskon:5000, label:'Paket Data'},
      {nominal:'Data 10GB/30hr',harga:65000, diskon:8000, label:'Paket Data'},
    ];

    const pulsaGrid = document.getElementById('pulsaGrid');
    let pulsaSelected = null;

    function renderPulsaGrid(){
      pulsaGrid.innerHTML = '';
      pulsaProducts.forEach((p,i)=>{
        const div = document.createElement('div');
        div.className = 'price-card';
        div.innerHTML = `
          <div class="text-sm font-semibold">${p.label.includes('Data')?p.label:('Pulsa')}</div>
          <div class="text-xs text-gray-600">${p.nominal}</div>
          <div class="flex items-center justify-between mt-1">
            <div class="text-sm font-semibold">${rupiah(p.harga - p.diskon)}</div>
            <span class="pill">- ${rupiah(p.diskon)}</span>
          </div>`;
        div.addEventListener('click',()=>{
          pulsaSelected = i;
          qsa('#pulsaGrid .price-card').forEach(x=>x.classList.remove('active'));
          div.classList.add('active');
          updatePulsaSummary();
        });
        pulsaGrid.appendChild(div);
      });
    }
    renderPulsaGrid();

    function updatePulsaSummary(){
      const sum = document.getElementById('pulsaSummary');
      if(pulsaSelected===null){ sum.classList.add('hidden'); return; }
      const p = pulsaProducts[pulsaSelected];
      document.getElementById('pulsaHarga').innerText  = rupiah(p.harga);
      document.getElementById('pulsaDiskon').innerText = '- ' + rupiah(p.diskon);
      document.getElementById('pulsaTotal').innerText  = rupiah(p.harga - p.diskon);
      sum.classList.remove('hidden');
    }

    document.getElementById('pulsaReset').addEventListener('click', ()=>{
      pulsaSelected=null; qsa('#pulsaGrid .price-card').forEach(x=>x.classList.remove('active'));
      document.getElementById('pulsaSummary').classList.add('hidden');
      document.getElementById('pulsaPhone').value='';
    });

    document.getElementById('pulsaBayar').addEventListener('click', ()=>{
      const phone = document.getElementById('pulsaPhone').value.trim();
      if(!/^0[0-9]{9,13}$/.test(phone)){ alert('Nomor HP tidak valid'); return; }
      if(pulsaSelected===null){ alert('Pilih nominal dulu'); return; }
      const p = pulsaProducts[pulsaSelected];
      const total = p.harga - p.diskon;
      let bal = storage.get(BAL_KEY,0);
      if(bal < total){ alert('Saldo tidak cukup'); return; }
      bal -= total; storage.set(BAL_KEY,bal); document.getElementById('balance').innerText = bal.toLocaleString('id-ID');

      // tambah history
      const tx = storage.get(TX_KEY,[]);
      tx.unshift({
        id:'TXN'+Date.now(),
        ts: new Date().toISOString(),
        type:'pulsa',
        target: phone,
        nominal: p.nominal,
        harga: p.harga,
        diskon: p.diskon,
        total: total,
        status:'Sukses'
      });
      storage.set(TX_KEY, tx);
      renderHistory();

      alert('Pembelian '+p.label+' '+p.nominal+' untuk '+phone+' berhasil.\nTotal: '+rupiah(total));
      closeSheet(pulsaSheet);
      // reset pilihan
      document.getElementById('pulsaReset').click();
    });
document.querySelectorAll('.closeSheetBtn, .close-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const sheet = btn.closest('.sheet');
    closeSheet(sheet);
  });
});

    /* ========= Listrik Logic ========= */
    const plnProducts = [
      {nominal:'Token 5.000',      harga:5000,     admin:2000, diskon:500},
  {nominal:'Token 10.000',     harga:10000,    admin:2000, diskon:800},
  {nominal:'Token 20.000',     harga:20000,    admin:2500, diskon:1000},
  {nominal:'Token 50.000',     harga:50000,    admin:2500, diskon:2000},
  {nominal:'Token 100.000',    harga:100000,   admin:2500, diskon:3000},
  {nominal:'Token 200.000',    harga:200000,   admin:3000, diskon:5000},
  {nominal:'Token 250.000',    harga:250000,   admin:3000, diskon:6000},
  {nominal:'Token 300.000',    harga:300000,   admin:3000, diskon:7000},
  {nominal:'Token 500.000',    harga:500000,   admin:3000, diskon:10000},
  {nominal:'Token 750.000',    harga:750000,   admin:4000, diskon:15000},
  {nominal:'Token 1.000.000',  harga:1000000,  admin:5000, diskon:20000},
  {nominal:'Token 1.500.000',  harga:1500000,  admin:6000, diskon:30000},
  {nominal:'Token 2.000.000',  harga:2000000,  admin:7000, diskon:40000},
  {nominal:'Token 5.000.000',  harga:5000000,  admin:10000, diskon:100000}, 
    ];
    const plnGrid = document.getElementById('plnGrid');
    let plnSelected = null;

    function renderPlnGrid(){
      plnGrid.innerHTML='';
      plnProducts.forEach((p,i)=>{
        const div = document.createElement('div');
        div.className='price-card';
        div.innerHTML = `
          <div class="text-sm font-semibold">Prabayar</div>
          <div class="text-xs text-gray-600">${p.nominal}</div>
          <div class="flex items-center justify-between mt-1">
            <div class="text-sm font-semibold">${rupiah(p.harga + p.admin - p.diskon)}</div>
            <span class="pill">- ${rupiah(p.diskon)}</span>
          </div>`;
        div.addEventListener('click',()=>{
          plnSelected=i;
          qsa('#plnGrid .price-card').forEach(x=>x.classList.remove('active'));
          div.classList.add('active');
          updatePlnSummary();
        });
        plnGrid.appendChild(div);
      });
    }
    renderPlnGrid();

    function fakePlnInquiry(id){
      // Demo data
      const names = ['BUDI','SITI','ANDI','NUR','INTAN','RIZKY'];
      const dayaList = ['900 VA','1300 VA','2200 VA','3500 VA'];
      return {
        nama: names[id.length % names.length] + ' ' + id.slice(-3),
        daya: dayaList[id.length % dayaList.length]
      };
    }

    document.getElementById('plnId').addEventListener('input', (e)=>{
      const id = e.target.value.trim();
      const info = document.getElementById('plnInfo');
      if(/^[0-9]{10,13}$/.test(id)){
        const res = fakePlnInquiry(id);
        document.getElementById('plnNama').innerText = res.nama;
        document.getElementById('plnDaya').innerText = res.daya;
        info.classList.remove('hidden');
      }else{
        info.classList.add('hidden');
      }
    });

    function updatePlnSummary(){
      const sum = document.getElementById('plnSummary');
      if(plnSelected===null){ sum.classList.add('hidden'); return; }
      const p = plnProducts[plnSelected];
      const total = p.harga + p.admin - p.diskon;
      document.getElementById('plnHarga').innerText  = rupiah(p.harga);
      document.getElementById('plnAdmin').innerText  = rupiah(p.admin);
      document.getElementById('plnDiskon').innerText = '- ' + rupiah(p.diskon);
      document.getElementById('plnTotal').innerText  = rupiah(total);
      sum.classList.remove('hidden');
    }

    document.getElementById('plnReset').addEventListener('click', ()=>{
      plnSelected=null; qsa('#plnGrid .price-card').forEach(x=>x.classList.remove('active'));
      document.getElementById('plnSummary').classList.add('hidden');
      document.getElementById('plnId').value=''; document.getElementById('plnInfo').classList.add('hidden');
    });

    document.getElementById('plnBayar').addEventListener('click', ()=>{
      const idpel = document.getElementById('plnId').value.trim();
      if(!/^[0-9]{10,13}$/.test(idpel)){ alert('ID pelanggan / No. meter tidak valid'); return; }
      if(plnSelected===null){ alert('Pilih nominal token dahulu'); return; }
      const p = plnProducts[plnSelected];
      const total = p.harga + p.admin - p.diskon;
      let bal = storage.get(BAL_KEY,0);
      if(bal < total){ alert('Saldo tidak cukup'); return; }
      bal -= total; storage.set(BAL_KEY,bal); document.getElementById('balance').innerText = bal.toLocaleString('id-ID');

      const inq = fakePlnInquiry(idpel);

      // simpan history
      const tx = storage.get(TX_KEY,[]);
      tx.unshift({
        id:'TXN'+Date.now(),
        ts: new Date().toISOString(),
        type:'listrik',
        target: idpel,
        nama: inq.nama,
        daya: inq.daya,
        nominal: p.nominal,
        harga: p.harga,
        admin: p.admin,
        diskon: p.diskon,
        total: total,
        status:'Sukses',
        token: 'TKN-'+Math.random().toString(36).slice(2,10).toUpperCase()
      });
      storage.set(TX_KEY, tx);
      renderHistory();

      alert('Pembelian '+p.nominal+' untuk '+idpel+' berhasil.\nToken akan ditampilkan di Aktivitas.\nTotal: '+rupiah(total));
      closeSheet(listrikSheet);
      // reset
      document.getElementById('plnReset').click();
    });
document.querySelectorAll('.closeSheetBtn, .close-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const sheet = btn.closest('.sheet');
    closeSheet(sheet);
  });
});





document.addEventListener('DOMContentLoaded', () => {

  /* ========= Game Data ========= */
  const gameProducts = [
    // Free Fire
    {game:'ff', nominal:'Diamond 50', harga:10000, diskon:1000, label:'Free Fire', icon:'💎'},
    {game:'ff', nominal:'Diamond 100', harga:20000, diskon:2000, label:'Free Fire', icon:'💎'},
    {game:'ff', nominal:'Diamond 310', harga:60000, diskon:5000, label:'Free Fire', icon:'💎'},
    {game:'ff', nominal:'Diamond 520', harga:95000, diskon:8000, label:'Free Fire', icon:'💎'},
    {game:'ff', nominal:'Diamond 1060', harga:185000, diskon:15000, label:'Free Fire', icon:'💎'},
    {game:'ff', nominal:'Elite Pass', harga:120000, diskon:10000, label:'Free Fire', icon:'🎫'},
    {game:'ff', nominal:'Membership Mingguan', harga:25000, diskon:3000, label:'Free Fire', icon:'⭐'},
    {game:'ff', nominal:'Membership Bulanan', harga:60000, diskon:5000, label:'Free Fire', icon:'⭐'},
    {game:'ff', nominal:'Special Bundle', harga:150000, diskon:12000, label:'Free Fire', icon:'🎁'},
    // Mobile Legends, PUBG, COD, COC, Among Us, Roblox...
// ========== MOBILE LEGENDS ==========
{game:'ml', nominal:'Diamond 86',   harga:16000,  diskon:1500, label:'MLBB', icon:'💎'},
{game:'ml', nominal:'Diamond 172',  harga:32000,  diskon:3000, label:'MLBB', icon:'💎'},
{game:'ml', nominal:'Diamond 257',  harga:48000,  diskon:4000, label:'MLBB', icon:'💎'},
{game:'ml', nominal:'Diamond 344',  harga:64000,  diskon:5500, label:'MLBB', icon:'💎'},
{game:'ml', nominal:'Diamond 429',  harga:80000,  diskon:7000, label:'MLBB', icon:'💎'},
{game:'ml', nominal:'Diamond 514',  harga:96000,  diskon:8500, label:'MLBB', icon:'💎'},
{game:'ml', nominal:'Diamond 706',  harga:132000, diskon:12000,label:'MLBB', icon:'💎'},
{game:'ml', nominal:'Starlight Member', harga:150000, diskon:12000,label:'MLBB', icon:'🌟'},
{game:'ml', nominal:'Twilight Pass',    harga:200000, diskon:20000,label:'MLBB', icon:'🎟️'},

// ========== PUBG ==========
{game:'pubg', nominal:'UC 60',     harga:12000,   diskon:1000, label:'PUBG', icon:'🎯'},
{game:'pubg', nominal:'UC 325',    harga:65000,   diskon:5000, label:'PUBG', icon:'🎯'},
{game:'pubg', nominal:'UC 660',    harga:125000,  diskon:9000, label:'PUBG', icon:'🎯'},
{game:'pubg', nominal:'UC 1800',   harga:330000,  diskon:25000,label:'PUBG', icon:'🎯'},
{game:'pubg', nominal:'UC 3850',   harga:660000,  diskon:50000,label:'PUBG', icon:'🎯'},
{game:'pubg', nominal:'UC 8100',   harga:1320000, diskon:90000,label:'PUBG', icon:'🎯'},
{game:'pubg', nominal:'Elite Pass Plus', harga:200000, diskon:15000,label:'PUBG', icon:'🎟️'},

// ========== CALL OF DUTY MOBILE ==========
{game:'cod', nominal:'CP 80',    harga:15000,   diskon:1500, label:'CODM', icon:'💣'},
{game:'cod', nominal:'CP 420',   harga:75000,   diskon:6000, label:'CODM', icon:'💣'},
{game:'cod', nominal:'CP 880',   harga:155000,  diskon:12000,label:'CODM', icon:'💣'},
{game:'cod', nominal:'CP 2400',  harga:420000,  diskon:30000,label:'CODM', icon:'💣'},
{game:'cod', nominal:'CP 5000',  harga:850000,  diskon:60000,label:'CODM', icon:'💣'},
{game:'cod', nominal:'CP 10000', harga:1650000, diskon:120000,label:'CODM', icon:'💣'},
{game:'cod', nominal:'Battle Pass', harga:170000, diskon:12000,label:'CODM', icon:'🎟️'},

// ========== CLASH OF CLANS ==========
{game:'coc', nominal:'Gem 500',   harga:50000,  diskon:4000, label:'COC', icon:'💎'},
{game:'coc', nominal:'Gem 1200',  harga:120000, diskon:9000, label:'COC', icon:'💎'},
{game:'coc', nominal:'Gem 2500',  harga:250000, diskon:20000,label:'COC', icon:'💎'},
{game:'coc', nominal:'Gem 6500',  harga:650000, diskon:50000,label:'COC', icon:'💎'},
{game:'coc', nominal:'Gem 14000', harga:1350000,diskon:100000,label:'COC', icon:'💎'},
{game:'coc', nominal:'Gold Pass', harga:75000,  diskon:6000, label:'COC', icon:'🎟️'},

// ========== AMONG US ==========
{game:'among', nominal:'Stars 20',  harga:10000,  diskon:800,  label:'Among Us', icon:'⭐'},
{game:'among', nominal:'Stars 50',  harga:25000,  diskon:2000, label:'Among Us', icon:'⭐'},
{game:'among', nominal:'Stars 100', harga:48000,  diskon:4000, label:'Among Us', icon:'⭐'},
{game:'among', nominal:'Stars 250', harga:115000, diskon:9000, label:'Among Us', icon:'⭐'},
{game:'among', nominal:'Stars 500', harga:230000, diskon:18000,label:'Among Us', icon:'⭐'},

// ========== ROBLOX ==========
{game:'roblox', nominal:'Robux 400',  harga:60000,  diskon:5000,  label:'Roblox', icon:'🟦'},
{game:'roblox', nominal:'Robux 800',  harga:115000, diskon:9000,  label:'Roblox', icon:'🟦'},
{game:'roblox', nominal:'Robux 1700', harga:240000, diskon:18000, label:'Roblox', icon:'🟦'},
{game:'roblox', nominal:'Robux 4500', harga:630000, diskon:48000, label:'Roblox', icon:'🟦'},
{game:'roblox', nominal:'Robux 10000',harga:1350000,diskon:100000,label:'Roblox', icon:'🟦'},
{game:'roblox', nominal:'Premium 1 Bulan', harga:120000, diskon:10000,label:'Roblox', icon:'⭐'},
{game:'roblox', nominal:'Premium 3 Bulan', harga:350000, diskon:30000,label:'Roblox', icon:'⭐'},
];
  const gameLogos = {
    ff:     {label: "Free Fire", logo: "https://raw.githubusercontent.com/dfandrn/Gambar/main/Screenshot_2025-09-06-21-02-28-07_680d03679600f7af0b4c700c6b270fe7.jpg"},
    ml:     {label: "Mobile Legends", logo: "https://raw.githubusercontent.com/dfandrn/danar/main/Screenshot_2025-09-06-16-31-08-05_680d03679600f7af0b4c700c6b270fe7.jpg"},
    pubg:   {label: "PUBG", logo: "https://raw.githubusercontent.com/dfandrn/Gambar/main/Picsart_25-09-07_09-47-15-149.jpg"},
    cod:    {label: "Call of Duty", logo: "https://raw.githubusercontent.com/dfandrn/danar/main/Screenshot_2025-09-06-16-29-51-71_680d03679600f7af0b4c700c6b270fe7.jpg"},
    coc:    {label: "Clash of Clans", logo: "https://raw.githubusercontent.com/dfandrn/danar/main/Screenshot_2025-09-06-16-27-30-40_680d03679600f7af0b4c700c6b270fe7.jpg"},
    among:  {label: "Among Us", logo: "https://raw.githubusercontent.com/dfandrn/danar/main/Screenshot_2025-09-06-16-28-25-32_680d03679600f7af0b4c700c6b270fe7.jpg"},
    roblox: {label: "Roblox", logo: "https://raw.githubusercontent.com/dfandrn/danar/main/Screenshot_2025-09-06-16-27-02-38_680d03679600f7af0b4c700c6b270fe7.jpg"}
  };
  /* ========= DOM Elements ========= */
  const gameGrid = document.getElementById('gameGrid');
  const gameSummary = document.getElementById('gameSummary');
  let gameSelected = null; // produk yang dipilih
  let selectedGame = null; // gameKey

  /* ========= Utility ========= */
  function rupiah(n){ return 'Rp'+n.toLocaleString('id-ID'); }
  function qsa(sel){ return document.querySelectorAll(sel); }

  /* ========= Render Game List ========= */
  function renderGameList(){
    const list = document.getElementById('gameList');
    list.innerHTML = '';
    Object.entries(gameLogos).forEach(([key, g])=>{
      const card = document.createElement('div');
      card.className = 'game-card cursor-pointer';
      card.dataset.game = key;
      card.innerHTML = `
        <img src="${g.logo}" alt="${g.label}" 
             class="w-12 h-12 mx-auto rounded-full object-cover border border-gray-200 shadow-sm">
        <span class="text-sm font-medium block text-center mt-1">${g.label}</span>
      `;
      card.addEventListener('click', ()=>{
        selectedGame = key;
        document.getElementById('selectedGame').classList.remove('hidden');
        document.getElementById('gameLogo').src = g.logo;
        renderGameGrid(selectedGame);
      });
      list.appendChild(card);
    });
  }

  /* ========= Render Game Grid ========= */
  function renderGameGrid(gameKey){
    gameGrid.innerHTML = '';
    gameProducts.filter(p=>p.game===gameKey).forEach(p=>{
      const div = document.createElement('div');
      div.className = 'price-card';
      div.innerHTML = `
        <div class="text-sm font-semibold flex items-center gap-1">
          <span>${p.icon}</span> ${p.label}
        </div>
        <div class="text-xs text-gray-600">${p.nominal}</div>
        <div class="flex items-center justify-between mt-1">
          <div class="text-sm font-semibold">${rupiah(p.harga - p.diskon)}</div>
          <span class="pill">- ${rupiah(p.diskon)}</span>
        </div>`;
      div.addEventListener('click', ()=>{
        gameSelected = p;
        qsa('#gameGrid .price-card').forEach(x=>x.classList.remove('active'));
        div.classList.add('active');
        updateGameSummary();
      });
      gameGrid.appendChild(div);
    });
  }

  function updateGameSummary(){
    if(!gameSelected){ gameSummary.classList.add('hidden'); return; }
    document.getElementById('gameHarga').innerText  = rupiah(gameSelected.harga);
    document.getElementById('gameDiskon').innerText = '- ' + rupiah(gameSelected.diskon);
    document.getElementById('gameTotal').innerText  = rupiah(gameSelected.harga - gameSelected.diskon);
    gameSummary.classList.remove('hidden');
  }

  /* ========= Buttons ========= */
  document.getElementById('gameReset').addEventListener('click', ()=>{
    gameSelected=null;
    qsa('#gameGrid .price-card').forEach(x=>x.classList.remove('active'));
    gameSummary.classList.add('hidden');
    document.getElementById('gameUserId').value='';
  });


  document.getElementById('gameBayar').addEventListener('click', ()=>{
    const userId = document.getElementById('gameUserId').value.trim();
    if(userId.length < 3){ alert('User ID tidak valid'); return; }
    if(!gameSelected){ alert('Pilih paket dulu'); return; }
    const total = gameSelected.harga - gameSelected.diskon;
    let bal = storage.get(BAL_KEY,0);
    if(bal < total){ alert('Saldo tidak cukup'); return; }
    bal -= total; 
    storage.set(BAL_KEY,bal); 
    document.getElementById('balance').innerText = bal.toLocaleString('id-ID');

    const tx = storage.get(TX_KEY,[]);
    tx.unshift({
      id:'TXN'+Date.now(),
      ts: new Date().toISOString(),
      type:'game',
      target: userId,
      nominal: gameSelected.nominal,
      label: gameSelected.label,
      harga: gameSelected.harga,
      diskon: gameSelected.diskon,
      total: total,
      status:'Sukses'
    });
    storage.set(TX_KEY, tx);
    renderHistory();

    alert('Top Up '+gameSelected.label+' '+gameSelected.nominal+' untuk ID '+userId+' berhasil.\nTotal: '+rupiah(total));
    closeSheet(document.getElementById('topUpGameSheet'));
    document.getElementById('gameReset').click();
  });

  // tombol close sheet
  qsa('.closeSheetBtn, .close-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const sheet = btn.closest('.sheet');
      closeSheet(sheet);
    });
  });

  /* ========= Init ========= */
  renderGameList();
  // render default game, misal Free Fire
  renderGameGrid('kosongin aja');

});

/* riwayat trx */
function renderHistory(){
  const list = document.getElementById('txnList');
  const empty = document.getElementById('emptyTxn');
  const summary = document.getElementById('txnSummary');
  const txs = storage.get(TX_KEY,[]);

  list.innerHTML = '';
  summary.innerHTML = '';

  if(!txs.length){ 
    empty.classList.remove('hidden'); 
    summary.innerHTML = '';
    return; 
  }
  empty.classList.add('hidden');

  // Hitung total pengeluaran bulan ini
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const txsThisMonth = txs.filter(tx=>{
    const d = new Date(tx.ts);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalThisMonth = txsThisMonth.reduce((acc,tx)=>acc+tx.total,0);
  summary.innerHTML = `Bulan ini habis <span class="text-green-600 font-bold">${rupiah(totalThisMonth)}</span> dari ${txsThisMonth.length} transaksi`;

  // Group transaksi berdasarkan tanggal (yyyy-mm-dd)
  const grouped = {};
  txs.slice(0,100).forEach(tx=>{
    const d = new Date(tx.ts);
    const key = d.toISOString().slice(0,10);
    if(!grouped[key]) grouped[key] = [];
    grouped[key].push(tx);
  });

  // Sort tanggal descending
  const sortedDates = Object.keys(grouped).sort((a,b)=>b.localeCompare(a));

  sortedDates.forEach(dateStr=>{
    const dateObj = new Date(dateStr);
    const isToday = isSameDate(dateObj, now);
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate()-1);
    const isYesterday = isSameDate(dateObj, yesterday);

    let labelDate = '';
    if(isToday) labelDate = 'Hari ini';
    else if(isYesterday) labelDate = 'Kemarin';
    else labelDate = dateObj.toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

    const dateHeader = document.createElement('div');
    dateHeader.className = 'date-header sticky top-0 bg-white py-2 px-4 font-semibold text-gray-700 border-b border-gray-300';
    dateHeader.textContent = labelDate;
    list.appendChild(dateHeader);

    grouped[dateStr].forEach(tx=>{
      const row = document.createElement('div');
      row.className='txn-item cursor-pointer p-4 flex items-center justify-between border-b border-gray-100 hover:bg-gray-50 transition';

      const icon = document.createElement('div');
      icon.className = 'txn-icon flex-shrink-0 mr-4 flex items-center justify-center rounded-full w-12 h-12 bg-gray-100';
      icon.innerHTML = getIconSVG(tx.type);
      row.appendChild(icon);

      const left = document.createElement('div');
      left.className = 'flex-grow';
      left.innerHTML = `
        <div class="font-semibold text-gray-900 text-base">${
          tx.type==='pulsa'   ? 'Pulsa/Data' :
          tx.type==='listrik' ? 'Listrik' :
          tx.type==='game'    ? 'Top Up Game' :
          tx.type==='gplay'   ? 'Google Play Voucher' :
          'Transaksi'
        }</div>
        <div class="text-xs text-gray-500 mt-1">${tx.target}</div>
        <div class="text-xs text-gray-400 mt-0.5">${tx.nominal}${tx.token ? ' • Token: <span class="font-mono">'+tx.token+'</span>':''}</div>
      `;

      const right = document.createElement('div');
      right.className='text-right flex flex-col items-end justify-center min-w-[110px]';
      right.innerHTML = `
        <div class="font-semibold text-green-600 text-base">${rupiah(tx.total)}</div>
        <div class="badge mt-1 px-3 py-0.5 rounded-full text-xs font-semibold ${
          tx.status.toLowerCase() === 'berhasil' ? 'bg-green-100 text-green-800' :
          tx.status.toLowerCase() === 'gagal' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }">${tx.status}</div>
      `;

      row.appendChild(left);
      row.appendChild(right);

      row.addEventListener('click', ()=>showTxnDetail(tx));

      list.appendChild(row);
    });
  });
}

function isSameDate(d1, d2){
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

function showTxnDetail(tx){
  const modal = document.createElement('div');
  modal.className = "fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm";
  modal.innerHTML = `
    <div class="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 relative font-sans">
      <button class="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold" id="closeModal" aria-label="Close modal">×</button>
      <h2 class="text-2xl font-bold mb-6 text-gray-900">Detail Transaksi</h2>
      <div class="space-y-4 text-gray-700 text-sm">
        <div><span class="font-semibold">Jenis:</span> ${
          tx.type==='pulsa'   ? 'Pulsa/Data' :
          tx.type==='listrik' ? 'Listrik' :
          tx.type==='game'    ? 'Top Up Game' :
          tx.type==='gplay'   ? 'Google Play Voucher' :
          'Transaksi'
        }</div>
        <div><span class="font-semibold">Tanggal:</span> ${new Date(tx.ts).toLocaleString('id-ID')}</div>
        <div><span class="font-semibold">Nomor/Target:</span> ${tx.target}</div>
        <div><span class="font-semibold">Nominal:</span> ${tx.nominal}</div>
        ${tx.token ? `<div><span class="font-semibold">Token:</span> <span class="font-mono bg-gray-100 px-2 py-1 rounded">${tx.token}</span></div>` : ''}
        <div><span class="font-semibold">Total:</span> <span class="text-green-600 font-bold">${rupiah(tx.total)}</span></div>
        <div><span class="font-semibold">Status:</span> <span class="badge px-3 py-1 rounded-full text-sm font-semibold ${
          tx.status.toLowerCase() === 'berhasil' ? 'bg-green-100 text-green-800' :
          tx.status.toLowerCase() === 'gagal' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }">${tx.status}</span></div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);

  modal.querySelector('#closeModal').addEventListener('click', ()=>modal.remove());
  modal.addEventListener('click', e=>{
    if(e.target===modal) modal.remove();
  });
}


// Optional: function to return SVG icons based on tx.type
function getIconSVG(type){
  switch(type){
    case 'pulsa': return `<svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1v22M5 12h14"/></svg>`;
    case 'listrik': return `<svg class="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
    case 'game': return `<svg class="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg>`;
    case 'gplay': return `<svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12l-18 7V5l18 7z"/></svg>`;
    default: return `<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>`;
  }
}


/* ========= TopUp ========= */
/* ========= Overlay Elements ========= */
const overlayPay = qs('#overlaySuma');
const closePay   = qs('#close');

/* ========= Buka Overlay ========= */
function openOverlay(type){
  overlayPay.classList.remove('hidden');
  overlayPay.classList.add('flex');
  overlayPay.dataset.action = type; // simpan info (topup/withdraw)
}

/* ========= Tutup Overlay ========= */
closePay.addEventListener('click', () => {
  overlayPay.classList.add('hidden');
  overlayPay.classList.remove('flex');
});

/* ========= Trigger khusus ========= */
qs('#topUpBtn').addEventListener('click', ()=> openOverlay('topup'));
qs('#withdrawBtn').addEventListener('click', ()=> openOverlay('withdraw'));

/* ========= Klik Metode Pembayaran ========= */
qsa('.pay-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const method = btn.innerText;
    const action = overlayPay.dataset.action;

    const v = prompt(`Masukkan nominal untuk ${action.toUpperCase()} via ${method}:`, "50000");
    const n = parseInt((v||'').replace(/\D/g,''),10);
    if(!n) return;

    let bal = storage.get(BAL_KEY, 0);

    if(action === 'topup'){
      bal += n;
      storage.set(BAL_KEY, bal);
      qs('#balance').innerText = bal.toLocaleString('id-ID');
      alert(`Top up berhasil via ${method}: ${rupiah(n)}`);
    } else {
      if(bal < n){
        alert('Saldo tidak cukup');
        return;
      }
      bal -= n;
      storage.set(BAL_KEY, bal);
      qs('#balance').innerText = bal.toLocaleString('id-ID');
      alert(`Tarik saldo berhasil via ${method}: ${rupiah(n)}`);
    }

    overlayPay.classList.add('hidden');
    overlayPay.classList.remove('flex');
  });
});



/*style silent Saldo*/
const balanceEl = document.getElementById("balance");
  const toggleBtn = document.getElementById("toggleSaldoBtn");
  const eyeIcon = document.getElementById("eyeIcon");

  let hidden = false;

  toggleBtn.addEventListener("click", () => {
    hidden = !hidden;
    if (hidden) {
      balanceEl.dataset.real = balanceEl.textContent;
      balanceEl.textContent = "•••••••";
      eyeIcon.innerHTML =
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.94 17.94A10.94 10.94 0 0 1 12 20C5 20 1 12 1 12a21.8 21.8 0 0 1 5.06-6.94M22.94 12a21.8 21.8 0 0 0-5.06-6.94M14.12 14.12A3 3 0 0 1 9.88 9.88"/>';
    } else {
      balanceEl.textContent = balanceEl.dataset.real || "130.500";
      eyeIcon.innerHTML =
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />';
    }
  });

// ===== Utils (khusus saldo) =====
const SALDO_KEY = "app_saldo_value"; 
const saldoStorage = {
  get: (key, def = 0) => parseInt(localStorage.getItem(key) || def, 199), // sengaja 199
  set: (key, val) => localStorage.setItem(key, val)
};

document.addEventListener("DOMContentLoaded", () => {
  const balanceEl = document.getElementById("balance");
  const refreshBtn = document.getElementById("refreshSaldoBtn");

  // sinkronisasi awal
  if (!localStorage.getItem(SALDO_KEY)) {
    const initialBal = parseInt(balanceEl.textContent.replace(/\./g, ''), 10);
    saldoStorage.set(SALDO_KEY, initialBal);
  }

  refreshBtn.addEventListener("click", () => {
    const currentBal = saldoStorage.get(SALDO_KEY);

    // fade out saldo lama
    balanceEl.style.transition = "all 0.3s ease";
    balanceEl.style.opacity = 0;
    balanceEl.style.transform = "translateY(-10px)";

    setTimeout(() => {
      // teks loading
      balanceEl.textContent = "Memperbarui saldo...";
      balanceEl.style.opacity = 1;
      balanceEl.style.transform = "translateY(0)";

      // animasi angka acak sengaja “aneh” bertambah perlahan
      let fakeBal = 0;
      const fakeTarget = Math.floor(Math.random() * 300000) + 900000; // 900k - 1,2jt
      const increment = Math.ceil(fakeTarget / 30);
      const interval = setInterval(() => {
        fakeBal += increment;
        if (fakeBal >= fakeTarget) fakeBal = fakeTarget;
        balanceEl.textContent = fakeBal.toLocaleString("id-ID");

        if (fakeBal >= fakeTarget) {
          clearInterval(interval);

          // tampilkan saldo asli permanen
          setTimeout(() => {
            balanceEl.style.opacity = 0;
            balanceEl.style.transform = "translateY(-10px)";
            setTimeout(() => {
              balanceEl.textContent = currentBal.toLocaleString("id-ID");
              balanceEl.style.opacity = 1;
              balanceEl.style.transform = "translateY(0)";
            }, 300);
          }, 300);
        }
      }, 30);
    }, 300);
  });
});




/*tombol on/of*/
const btn = document.getElementById("toggleThemeBtn");
  btn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    btn.textContent = document.body.classList.contains("dark-mode")
      ? "☀️ Light Mode"
      : "🌙 Dark Mode";
  });

document.addEventListener('DOMContentLoaded', () => {
const canvas = document.getElementById("carGame");
if(!canvas) {
// halaman ini tidak punya canvas -> nothing to do
return;
}
const ctx = canvas.getContext("2d");

// elemen kontrol (bisa null jika belum ada)
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const redeemBtn = document.getElementById("redeemBtn");
const scoreEl = document.getElementById("score");
const coinsEl = document.getElementById("coins");
const sheet = document.getElementById("davigoPointSheet"); // pastikan id ini sesuai HTML

// game state (dibungkus agar tidak polusi global)
const CarGame = {
car: { x: (canvas.width-40)/2, y: canvas.height-60, width: 40, height: 60, color: "#0b63d6" },
obstacles: [],
coins: [],
score: 0,
coinCount: 0,
animId: null,
obstacleTimer: null,
coinTimer: null,
obstacleInterval: 1800,
coinInterval: 3000,
gameOver: false,
holdIntervalLeft: null,
holdIntervalRight: null,

reset() {  
  this.obstacles = [];  
  this.coins = [];  
  this.score = 0;  
  this.coinCount = 0;  
  this.gameOver = false;  
  this.car.x = (canvas.width - this.car.width) / 2;  
  updateUI();  
},  

start() {  
  // jangan start kalau sudah jalan  
  if (this.animId) return;  
  this.reset();  
  // spawn timers  
  this.obstacleTimer = setInterval(() => this.spawnObstacle(), this.obstacleInterval);  
  this.coinTimer = setInterval(() => this.spawnCoin(), this.coinInterval);  
  // start loop  
  const loop = () => this.loop();  
  this.animId = requestAnimationFrame(loop);  
},  

stop() {  
  if (this.animId) cancelAnimationFrame(this.animId);  
  this.animId = null;  
  if (this.obstacleTimer){ clearInterval(this.obstacleTimer); this.obstacleTimer = null; }  
  if (this.coinTimer){ clearInterval(this.coinTimer); this.coinTimer = null; }  
},  

spawnObstacle() {  
  const w = 36 + Math.random()*24;  
  const x = Math.random() * (canvas.width - w);  
  this.obstacles.push({ x, y: -80, width: w, height: 50 + Math.random()*40, color: "#ef4444" });  
  // keep array small  
  if (this.obstacles.length > 20) this.obstacles.shift();  
},  

spawnCoin() {  
  const x = 12 + Math.random() * (canvas.width - 24);  
  this.coins.push({ x, y: -20, radius: 10, color: "#f59e0b" });  
  if (this.coins.length > 20) this.coins.shift();  
},  

moveLeft(step = 20) {  
  this.car.x = Math.max(6, this.car.x - step);  
},  

moveRight(step = 20) {  
  this.car.x = Math.min(canvas.width - this.car.width - 6, this.car.x + step);  
},  

loop() {  
  if (this.gameOver) {  
    this.stop();  
    // beri kesempatan user restart: bisa diganti sesuai UX  
    setTimeout(()=>{ alert("Game Over! Skor: " + this.score + " • Coin: " + this.coinCount); }, 50);  
    return;  
  }  

  // update  
  ctx.clearRect(0,0,canvas.width,canvas.height);  

  // draw road / background subtle  
  ctx.fillStyle = "#e6eefc";  
  ctx.fillRect(0,0,canvas.width,canvas.height);  

  // draw car  
  ctx.fillStyle = this.car.color;  
  roundRect(ctx, this.car.x, this.car.y, this.car.width, this.car.height, 6, true, false);  

  // obstacles  
  for (let i = this.obstacles.length-1; i >= 0; i--) {  
    const obs = this.obstacles[i];  
    obs.y += 3 + Math.min(4, this.score/1000); // makin cepat  
    ctx.fillStyle = obs.color;  
    roundRect(ctx, obs.x, obs.y, obs.width, obs.height, 6, true, false);  

    // collision  
    if (this.rectIntersect(this.car, obs)) {  
      this.gameOver = true;  
    }  

    if (obs.y > canvas.height + 100) this.obstacles.splice(i,1);  
  }  

  // coins  
  for (let i = this.coins.length-1; i >= 0; i--) {  
    const c = this.coins[i];  
    c.y += 2.2;  
    ctx.beginPath();  
    ctx.fillStyle = c.color;  
    ctx.arc(c.x, c.y, c.radius, 0, Math.PI*2);  
    ctx.fill();  
    ctx.closePath();  

    // collision coin pickup (simple box test)  
    if (this.circleRectIntersect(c, this.car)) {  
      this.coinCount++;  
      this.coins.splice(i,1);  
      updateUI();  
    }  
    if (c.y > canvas.height + 50) this.coins.splice(i,1);  
  }  

  // score  
  this.score++;  
  updateUI();  

  // continue  
  this.animId = requestAnimationFrame(()=>this.loop());  
},  

rectIntersect(a,b){  
  return a.x < b.x + b.width &&  
         a.x + a.width > b.x &&  
         a.y < b.y + b.height &&  
         a.y + a.height > b.y;  
},  

circleRectIntersect(circle, rect){  
  const distX = Math.abs(circle.x - rect.x - rect.width/2);  
  const distY = Math.abs(circle.y - rect.y - rect.height/2);  
  if (distX > (rect.width/2 + circle.radius)) return false;  
  if (distY > (rect.height/2 + circle.radius)) return false;  
  if (distX <= (rect.width/2)) return true;  
  if (distY <= (rect.height/2)) return true;  
  const dx = distX - rect.width/2;  
  const dy = distY - rect.height/2;  
  return (dx*dx + dy*dy <= (circle.radius * circle.radius));  
},  

redeemCoins() {  
  if (this.coinCount <= 0) { alert('Belum punya coin. Kumpulkan dulu!'); return; }  
  // jika ada storage object (dari kode utama), pakai; kalau tidak, beri info  
  if (typeof storage !== 'undefined' && typeof BAL_KEY !== 'undefined') {  
    const valuePerCoin = 100; // contoh: 1 coin = Rp100  
    const add = this.coinCount * valuePerCoin;  
    let bal = storage.get(BAL_KEY,0); bal += add; storage.set(BAL_KEY, bal);  
    document.getElementById('balance') && (document.getElementById('balance').innerText = bal.toLocaleString('id-ID'));  
    alert('Berhasil tukar ' + this.coinCount + ' coin → ' + rupiah(add) + ' ke saldo.');  
    this.coinCount = 0;  
    updateUI();  
  } else {  
    alert('Fitur tukar belum tersedia (storage tidak ditemukan).');  
  }  
}

}; // end CarGame

// helper draw rounded rect
function roundRect(ctx, x, y, w, h, r, fill, stroke){
if (typeof r === 'undefined') r = 5;
ctx.beginPath();
ctx.moveTo(x + r, y);
ctx.arcTo(x + w, y, x + w, y + h, r);
ctx.arcTo(x + w, y + h, x, y + h, r);
ctx.arcTo(x, y + h, x, y, r);
ctx.arcTo(x, y, x + w, y, r);
ctx.closePath();
if (fill){ ctx.fill(); }
if (stroke){ ctx.stroke(); }
}

function updateUI(){
if(scoreEl) scoreEl.innerText = CarGame.score;
if(coinsEl) coinsEl.innerText = CarGame.coinCount;
}

// keyboard control
document.addEventListener('keydown', (e) => {
if (e.key === 'ArrowLeft') CarGame.moveLeft();
if (e.key === 'ArrowRight') CarGame.moveRight();
// WASD support (optional)
if (e.key === 'a' || e.key === 'A') CarGame.moveLeft();
if (e.key === 'd' || e.key === 'D') CarGame.moveRight();
});

// button click (safely attach)
if (leftBtn) {
// quick click
leftBtn.addEventListener('click', ()=> CarGame.moveLeft());
// hold behaviour
leftBtn.addEventListener('pointerdown', () => {
if (CarGame.holdIntervalLeft) clearInterval(CarGame.holdIntervalLeft);
CarGame.holdIntervalLeft = setInterval(()=>CarGame.moveLeft(8), 80);
});
['pointerup','pointercancel','pointerleave','mouseout'].forEach(ev=>{
leftBtn.addEventListener(ev, ()=> { if (CarGame.holdIntervalLeft) { clearInterval(CarGame.holdIntervalLeft); CarGame.holdIntervalLeft = null; }});
});
}
if (rightBtn) {
rightBtn.addEventListener('click', ()=> CarGame.moveRight());
rightBtn.addEventListener('pointerdown', () => {
if (CarGame.holdIntervalRight) clearInterval(CarGame.holdIntervalRight);
CarGame.holdIntervalRight = setInterval(()=>CarGame.moveRight(8),80);
});
['pointerup','pointercancel','pointerleave','mouseout'].forEach(ev=>{
rightBtn.addEventListener(ev, ()=> { if (CarGame.holdIntervalRight) { clearInterval(CarGame.holdIntervalRight); CarGame.holdIntervalRight = null; }});
});
}

// redeem
if (redeemBtn) redeemBtn.addEventListener('click', ()=> CarGame.redeemCoins());

// start/stop when sheet open/close -> pakai MutationObserver sehingga tidak bergantung pada trigger
if (sheet) {
const mo = new MutationObserver((mutations)=>{
mutations.forEach(m=>{
if (m.attributeName === 'class') {
if (sheet.classList.contains('open')) {
// delay kecil agar animasi sheet selesai
setTimeout(()=> CarGame.start(), 120);
} else {
CarGame.stop();
}
}
});
});
mo.observe(sheet, { attributes: true });
} else {
// bila sheet tidak ada, start langsung (fallback)
CarGame.start();
}

// safe cleanup when page unload
window.addEventListener('beforeunload', ()=> {
CarGame.stop();
});
});




  // Data notifikasi kecil
  const notifSmallData = [
    {
      left: '📣 Beberapa orang 👉 🎁 <strong>DAVIGO Deals</strong> oleh 👩‍👩‍👦',
      right: '🔥'
    },
    {
      left: '📣 Temanmu baru saja mendapatkan <strong>Voucher Diskon</strong>!',
      right: '🎉'
    },
    {
      left: '📣 Jangan lewatkan <strong>Promo Cashback</strong> hari ini!',
      right: '💰'
    },
    {
      left: '📣 Ada <strong>Event Spesial</strong> di aplikasi DANA!',
      right: '✨'
    }
  ];

  // Data chat untuk notif card 1 dan 2
  const notifCard1Data = [
    {
      icon: 'https://placehold.co/36x36/00AEEF/FFFFFF?text=%F0%9F%91%A5',
      text: '<strong>Temanmu</strong> 👉 🎁 dari 👥',
      time: '7d'
    },
    {
      icon: 'https://placehold.co/36x36/FF4500/FFFFFF?text=%F0%9F%8E%89',
      text: '<strong>Event</strong> Spesial: Menangkan hadiah menarik!',
      time: '1h'
    },
    {
      icon: 'https://placehold.co/36x36/008000/FFFFFF?text=%F0%9F%92%B0',
      text: '<strong>Promo</strong> Cashback hingga 50%!',
      time: '30m'
    }
  ];

  const notifCard2Data = [
    {
      icon: 'https://placehold.co/36x36/0044CC/FFFFFF?text=%F0%9F%9A%9A',
      text: '<strong>DANA</strong> Bayar STNK praktis via e-Samsat di DANA',
      time: '9m'
    },
    {
      icon: 'https://placehold.co/36x36/800080/FFFFFF?text=%F0%9F%8E%81',
      text: '<strong>Voucher</strong> Diskon 20% untuk pengguna baru!',
      time: '2h'
    },
    {
      icon: 'https://placehold.co/36x36/FFA500/FFFFFF?text=%F0%9F%8E%81',
      text: '<strong>Event</strong> Terbatas: Klaim hadiahmu sekarang!',
      time: '45m'
    }
  ];

  let notifSmallIndex = 0;
  let notifCard1Index = 0;
  let notifCard2Index = 0;

  // Referensi elemen notif kecil
  const notifSmall = document.getElementById('notifSmall');
  const leftWrapper = notifSmall.querySelector('.left .notif-text-wrapper');
  const rightWrapper = notifSmall.querySelector('.right .notif-text-wrapper');

  // Referensi notif card 1
  const notifCard1 = document.getElementById('notifCard1');
  const notifCard1Icon = document.getElementById('notifCard1Icon');
  const notifCard1Text = document.getElementById('notifCard1Text');
  const notifCard1Time = document.getElementById('notifCard1Time');

  // Referensi notif card 2
  const notifCard2 = document.getElementById('notifCard2');
  const notifCard2Icon = document.getElementById('notifCard2Icon');
  const notifCard2Text = document.getElementById('notifCard2Text');
  const notifCard2Time = document.getElementById('notifCard2Time');

  // Fungsi animasi slide up keluar
  function slideUpOut(element) {
    return new Promise(resolve => {
      element.classList.add('slide-up-out');
      element.addEventListener('animationend', function handler() {
        element.removeEventListener('animationend', handler);
        element.classList.remove('slide-up-out');
        resolve();
      });
    });
  }

  // Fungsi animasi slide up masuk
  function slideUpIn(element) {
    return new Promise(resolve => {
      element.classList.add('slide-up-in');
      element.addEventListener('animationend', function handler() {
        element.removeEventListener('animationend', handler);
        element.classList.remove('slide-up-in');
        resolve();
      });
    });
  }

  // Fungsi update notif kecil
  async function updateNotifSmall() {
    notifSmallIndex = (notifSmallIndex + 1) % notifSmallData.length;

    await Promise.all([
      slideUpOut(leftWrapper),
      slideUpOut(rightWrapper)
    ]);

    leftWrapper.innerHTML = notifSmallData[notifSmallIndex].left;
    leftWrapper.setAttribute('data-text', leftWrapper.textContent);
    rightWrapper.innerHTML = notifSmallData[notifSmallIndex].right;
    rightWrapper.setAttribute('data-text', rightWrapper.textContent);

    await Promise.all([
      slideUpIn(leftWrapper),
      slideUpIn(rightWrapper)
    ]);
  }

  // Fungsi update notif card 1
  async function updateNotifCard1() {
    notifCard1Index = (notifCard1Index + 1) % notifCard1Data.length;

    await slideUpOut(notifCard1);
    notifCard1Icon.src = notifCard1Data[notifCard1Index].icon;
    notifCard1Text.innerHTML = notifCard1Data[notifCard1Index].text;
    notifCard1Time.textContent = notifCard1Data[notifCard1Index].time;
    await slideUpIn(notifCard1);
  }

  // Fungsi update notif card 2
  async function updateNotifCard2() {
    notifCard2Index = (notifCard2Index + 1) % notifCard2Data.length;

    await slideUpOut(notifCard2);
    notifCard2Icon.src = notifCard2Data[notifCard2Index].icon;
    notifCard2Text.innerHTML = notifCard2Data[notifCard2Index].text;
    notifCard2Time.textContent = notifCard2Data[notifCard2Index].time;
    await slideUpIn(notifCard2);
  }

  // Set data-text awal supaya glitch animasi jalan
  leftWrapper.setAttribute('data-text', leftWrapper.textContent);
  rightWrapper.setAttribute('data-text', rightWrapper.textContent);

  // Interval update
  setInterval(updateNotifSmall, 5000);
  setInterval(updateNotifCard1, 7000);
  setInterval(updateNotifCard2, 9000);


// logika promo google play
  const openBtn = document.getElementById('gplayPromoBtn');
  const modal = document.getElementById('gplayModal');
  const closeBtn = document.getElementById('closeModal');
  const spinner = document.getElementById('loadingSpinner');
  const modalContent = document.getElementById('modalContent');

  openBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
    spinner.classList.remove('hidden');
    modalContent.classList.add('hidden');

    // simulasi loading
    setTimeout(() => {
      spinner.classList.add('hidden');
      modalContent.classList.remove('hidden');
      modalContent.classList.remove('animate-slide-down');
      modalContent.classList.add('animate-slide-up');
    }, 4000);
  });

  function closeModal() {
    // kasih animasi slide-down
    modalContent.classList.remove('animate-slide-up');
    modalContent.classList.add('animate-slide-down');

    // tunggu animasi selesai baru hilangkan modal
    setTimeout(() => {
      modal.classList.add('hidden');
      modalContent.classList.remove('animate-slide-down');
    }, 300);
  }

  closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

(function(){
  // elemen
  const tabs = Array.from(document.querySelectorAll('.tab'));
  const voucherList = document.getElementById('voucherList');
  const voucherCards = Array.from(document.querySelectorAll('.coupon-card'));
  const tabLoading = document.getElementById('tabLoading');
  const openFullBtn = document.getElementById('openVoucherFull');
  const mainPage = document.getElementById('mainPage');
  const voucherPage = document.getElementById('voucherPage');
  const voucherPageContent = document.getElementById('voucherPageContent');
  const backBtn = document.getElementById('backBtn');
  const voucherPageTitle = document.getElementById('voucherPageTitle');

  let currentCategory = 'googleplay'; // default awal > Google Play sesuai permintaan

  // helper: set active tab visual
  function setActiveTabVisual(cat){
    tabs.forEach(t => {
      if(t.dataset.category === cat) t.classList.add('active'); else t.classList.remove('active');
      if(cat==='all' && t.dataset.category==='all') t.classList.add('active');
    });
  }

  // helper: show filtered vouchers with loading + animation
  function showCategory(cat){
    currentCategory = cat;
    setActiveTabVisual(cat);

    // show loading
    tabLoading.classList.add('active');
    // hide all cards immediately (smooth)
    voucherCards.forEach(c => {
      c.classList.remove('show');
      c.classList.add('hidden');
    });

    // after loading, reveal matching
    setTimeout(() => {
      tabLoading.classList.remove('active');
      voucherCards.forEach((c, i) => {
        const catList = c.dataset.category ? c.dataset.category.split(' ') : [];
        if(cat === 'all' || catList.includes(cat)){
          // show with small stagger
          setTimeout(() => {
            c.classList.remove('hidden');
            c.classList.add('show');
          }, i * 60);
        } else {
          // keep hidden
          c.classList.remove('show');
          c.classList.add('hidden');
        }
      });
    }, 650); // loading durasi
  }

  // init tab listeners
  tabs.forEach(t => {
    t.addEventListener('click', () => {
      const cat = t.dataset.category || 'all';
      showCategory(cat);
    });
  });

  // Claim button behavior (delegation so clones work too)
  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest('.claim-btn');
    if(!btn) return;
    // disable + loading
    btn.classList.add('loading');
    const originalText = btn.textContent;
    btn.textContent = '';
    // simulate request
    setTimeout(() => {
      btn.classList.remove('loading');
      btn.classList.add('disabled');
      btn.textContent = 'Voucher telah habis';
      btn.style.background = '#bdbdbd';
    }, 1700);
  });

  // Open fullscreen voucher page: clone current filtered vouchers into voucherPageContent
  openFullBtn.addEventListener('click', () => {
    // show fullscreen page with small loading then populate with currently-visible vouchers
    voucherPageContent.innerHTML = '<div style="text-align:center;color:#6b7280;padding:28px 0">Loading voucher...</div>';
    mainPage.classList.remove('active'); // hide main
    voucherPage.classList.add('active');
    voucherPage.setAttribute('aria-hidden','false');

    // show title based on currentCategory
    voucherPageTitle.textContent = (currentCategory==='all' ? 'Semua Voucher' : currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1));

    setTimeout(()=> {
      // clear content
      voucherPageContent.innerHTML = '';
      // find matching cards from main list and clone them
      voucherCards.forEach(c => {
        const catList = c.dataset.category ? c.dataset.category.split(' ') : [];
        if(currentCategory === 'all' || catList.includes(currentCategory)){
          const clone = c.cloneNode(true);
          // remove hidden/show classes to animate in
          clone.classList.remove('hidden');
          clone.classList.add('show');
          voucherPageContent.appendChild(clone);
        }
      });

      // if none found, show message
      if(!voucherPageContent.children.length){
        voucherPageContent.innerHTML = '<div style="text-align:center;color:#6b7280;padding:28px 0">Tidak ada voucher untuk kategori ini.</div>';
      }
    }, 500); // small delay for UX
  });

  // Back to main
  backBtn.addEventListener('click', () => {
    voucherPage.classList.remove('active');
    voucherPage.setAttribute('aria-hidden','true');
    mainPage.classList.add('active');
    // ensure main shows current filtered view
    showCategory(currentCategory);
    // scroll to top of main
    window.scrollTo({top:0,behavior:'smooth'});
  });
  // initialize default view
  // mark tab active (try to find matching tab, fallback to 'all)
  const hasTab = tabs.some(t => t.dataset.category === currentCategory);
  if(!hasTab) currentCategory = 'all';
  setTimeout(()=> showCategory(currentCategory), 60);
})();
// logika promo googleplay sampe atas sini 


// JS: Loading bar menu titik-titik + teks, kecuali tombol Logout
(function() {
  const OVERLAY_ID = "app-loading-overlay-2025";
  
  function ensureOverlay() {
    let el = document.getElementById(OVERLAY_ID);
    if (!el) {
      el = document.createElement("div");
      el.id = OVERLAY_ID;
      el.innerHTML = `
        <div class="content">
          <div class="dots"><span></span><span></span><span></span></div>
          <div class="loading-text"></div>
        </div>
      `;
      Object.assign(el.style, {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
        zIndex: "99999",
        opacity: "0",
        pointerEvents: "none",
        transition: "opacity 0.2s ease",
        flexDirection: "column",
        textAlign: "center"
      });
      
      const style = document.createElement("style");
      style.textContent = `
        #${OVERLAY_ID} .content { display:flex; flex-direction:column; align-items:center; gap:16px; }
        #${OVERLAY_ID} .dots { display:flex; gap:8px; }
        #${OVERLAY_ID} .dots span {
          width:12px; height:12px; background:#3b82f6; border-radius:50%;
          display:inline-block; animation:app-bounce-2025 0.6s infinite alternate;
        }
        #${OVERLAY_ID} .dots span:nth-child(2){animation-delay:0.2s;}
        #${OVERLAY_ID} .dots span:nth-child(3){animation-delay:0.4s;}
        @keyframes app-bounce-2025 { from{transform:translateY(0);opacity:0.5;} to{transform:translateY(-8px);opacity:1;} }

        #${OVERLAY_ID} .loading-text {
          font-size:16px; color:#1e40af; font-weight:500;
          overflow:hidden; white-space:nowrap; width:0;
        }
        @keyframes typing-2025 { from { width: 0; } to { width: 100%; } }
      `;
      document.head.appendChild(style);
      document.body.appendChild(el);
    }
    return el;
  }
  
  function show(ms = 1500) {
    const overlay = ensureOverlay();
    overlay.style.opacity = "1";
    overlay.style.pointerEvents = "auto";
    
    const text = overlay.querySelector(".loading-text");
    text.style.borderRight = "none";
    text.style.width = "0";
    text.style.animation = "none";
    text.offsetWidth;
    text.style.animation = `typing-2025 0.8s steps(${text.textContent.length}) forwards`;
    
    window.setTimeout(() => {
      overlay.style.opacity = "0";
      overlay.style.pointerEvents = "none";
    }, ms);
  }
  
  window.appShowLoading = show;
  
  // Klik tombol bottom-nav
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".bottom-nav button");
    if (!btn) return;
    
    // Abaikan tombol Logout
    if (btn.id === "tabLogout") return;
show(1500);
});
})();



  
// ========== Storage Helper (Memory Storage untuk Iframe) ==========
let gofoodMemory = {};
const gofoodStorage = {
  get(k, def) { 
    try { 
      const v = gofoodMemory[k]; 
      return v === null || v === undefined ? def : v; 
    } catch(e) { 
      return def; 
    } 
  },
  set(k, v) { 
    gofoodMemory[k] = v; 
  },
  del(k) { 
    delete gofoodMemory[k]; 
  }
};

// ==================== CAROUSEL LOGIC ====================
let currentSlide = 0;
const totalSlides = 3;

function createCarouselIndicators() {
  const indicators = document.getElementById('carousel-indicators');
  indicators.innerHTML = '';
  
  for (let i = 0; i < totalSlides; i++) {
    const dot = document.createElement('div');
    dot.className = `carousel-dot ${i === 0 ? 'active' : ''}`;
    dot.addEventListener('click', () => goToSlide(i));
    indicators.appendChild(dot);
  }
}

function updateCarouselIndicators() {
  const dots = document.querySelectorAll('.carousel-dot');
  dots.forEach((dot, index) => {
    dot.classList.toggle('active', index === currentSlide);
  });
}

function goToSlide(slideIndex) {
  currentSlide = slideIndex;
  const carousel = document.getElementById('promo-carousel');
  carousel.style.transform = `translateX(-${currentSlide * 100}%)`;
  updateCarouselIndicators();
}

function nextSlide() {
  currentSlide = (currentSlide + 1) % totalSlides;
  goToSlide(currentSlide);
}

function startCarousel() {
  createCarouselIndicators();
  setInterval(nextSlide, 4000);
}

// ==================== ELEMENTS ====================
const gfBtn = document.getElementById("gf-btn");
const gfLoading = document.getElementById("gf-loading");
const gfLayout = document.getElementById("gf-layout");
const gfClose = document.getElementById("gf-close");
const menuList = document.getElementById("menu-list");
const searchInput = document.getElementById("search-menu");
const searchWrapper = document.getElementById("search-wrapper");
const categoryBar = document.getElementById("category-bar");
const cartLayout = document.getElementById("cart-layout");
const cartList = document.getElementById("cart-list");
const cartTotalEl = document.getElementById("cart-total");

const aktivitasBtn = document.getElementById("aktivitas-btn");
const aktivitasLayout = document.getElementById("aktivitas-layout");
const aktivitasClose = document.getElementById("aktivitas-close");
const txList = document.getElementById("tx-list");

const txDetailLayout = document.getElementById("tx-detail-layout");
const txDetailList = document.getElementById("tx-detail-list");
const txDetailClose = document.getElementById("tx-detail-close");

let cart = [];
const TX2_KEY = "tx2_history";

// ==================== DATA ====================
const menus = [
  // BUBUR AYAM CATEGORY
  { name:"Bubur Ayam Spesial", desc:"Bubur dengan topping ayam, cakwe, dan telur.", price:15000, img:"https://source.unsplash.com/300x200/?porridge", category:"Bubur Ayam", discount:0, time:"20-30min", rating:4.5 },
  { name:"Bubur Ayam Biasa", desc:"Bubur dengan topping ayam, free kerupuk.", price:12000, img:"https://source.unsplash.com/300x200/?rice-porridge", category:"Bubur Ayam", discount:0, time:"20-30min", rating:4.3 },
  { name:"Bubur Ayam Jakarta", desc:"Bubur khas Jakarta dengan suwiran ayam dan kerupuk.", price:16000, img:"https://source.unsplash.com/300x200/?chicken-porridge", category:"Bubur Ayam", discount:15, time:"20-30min", rating:4.4 },
  { name:"Bubur Ayam Kampung", desc:"Bubur ayam dengan rasa tradisional kampung.", price:14000, img:"https://source.unsplash.com/300x200/?traditional-porridge", category:"Bubur Ayam", discount:0, time:"25-35min", rating:4.2 },
  { name:"Bubur Ayam Cakwe", desc:"Bubur ayam dengan cakwe crispy dan telur.", price:17000, img:"https://source.unsplash.com/300x200/?porridge-egg", category:"Bubur Ayam", discount:10, time:"20-30min", rating:4.6 },

  // MIE AYAM CATEGORY
  { name:"Mie Ayam Bakso", desc:"Mie ayam lengkap dengan bakso kenyal.", price:20000, img:"https://source.unsplash.com/300x200/?noodles", category:"Mie Ayam", discount:0, time:"15-25min", rating:4.3 },
  { name:"Mie Ayam Pangsit", desc:"Mie ayam dengan pangsit goreng dan rebus.", price:22000, img:"https://source.unsplash.com/300x200/?chicken-noodles", category:"Mie Ayam", discount:0, time:"20-30min", rating:4.5 },
  { name:"Mie Ayam Ceker", desc:"Mie ayam dengan ceker yang empuk dan gurih.", price:18000, img:"https://source.unsplash.com/300x200/?noodle-soup", category:"Mie Ayam", discount:0, time:"25-35min", rating:4.1 },
  { name:"Mie Ayam Jamur", desc:"Mie ayam dengan jamur segar dan sayuran.", price:19000, img:"https://source.unsplash.com/300x200/?mushroom-noodles", category:"Mie Ayam", discount:20, time:"20-30min", rating:4.4 },
  { name:"Mie Ayam Spesial", desc:"Mie ayam lengkap dengan semua topping.", price:25000, img:"https://source.unsplash.com/300x200/?special-noodles", category:"Mie Ayam", discount:0, time:"20-30min", rating:4.7 },
  { name:"Mie Ayam Yamin", desc:"Mie kering dengan ayam dan sayuran segar.", price:21000, img:"https://source.unsplash.com/300x200/?dry-noodles", category:"Mie Ayam", discount:15, time:"15-25min", rating:4.3 },

  // NASI GORENG CATEGORY  
  { name:"Nasi Goreng Spesial", desc:"Nasi goreng dengan ayam, sosis, dan telur.", price:22000, img:"https://source.unsplash.com/300x200/?fried-rice", category:"Nasi Goreng", discount:20, time:"25-35min", rating:4.6 },
  { name:"Nasi Goreng Seafood", desc:"Nasi goreng dengan udang, cumi, dan kerang.", price:28000, img:"https://source.unsplash.com/300x200/?seafood-rice", category:"Nasi Goreng", discount:0, time:"30-40min", rating:4.5 },
  { name:"Nasi Goreng Kampung", desc:"Nasi goreng pedas dengan ikan asin dan pete.", price:20000, img:"https://source.unsplash.com/300x200/?village-fried-rice", category:"Nasi Goreng", discount:10, time:"20-30min", rating:4.4 },
  { name:"Nasi Goreng Jawa", desc:"Nasi goreng manis khas Jawa dengan kecap.", price:19000, img:"https://source.unsplash.com/300x200/?javanese-rice", category:"Nasi Goreng", discount:0, time:"25-35min", rating:4.2 },
  { name:"Nasi Goreng Ayam", desc:"Nasi goreng dengan potongan ayam yang banyak.", price:21000, img:"https://source.unsplash.com/300x200/?chicken-fried-rice", category:"Nasi Goreng", discount:15, time:"20-30min", rating:4.3 },
  { name:"Nasi Goreng Gila", desc:"Nasi goreng pedas dengan level kepedasan tinggi.", price:23000, img:"https://source.unsplash.com/300x200/?spicy-fried-rice", category:"Nasi Goreng", discount:0, time:"25-35min", rating:4.6 },

  // SUSHI CATEGORY
  { name:"Sushi Salmon", desc:"Sushi segar dengan topping salmon premium.", price:30000, img:"https://source.unsplash.com/300x200/?sushi", category:"Sushi", discount:0, time:"20-30min", rating:4.5 },
  { name:"Sushi Tuna", desc:"Sushi dengan tuna segar berkualitas tinggi.", price:32000, img:"https://source.unsplash.com/300x200/?tuna-sushi", category:"Sushi", discount:0, time:"20-30min", rating:4.6 },
  { name:"Sushi California Roll", desc:"California roll dengan alpukat dan kepiting.", price:28000, img:"https://source.unsplash.com/300x200/?california-roll", category:"Sushi", discount:15, time:"15-25min", rating:4.4 },
  { name:"Sushi Combo", desc:"Paket sushi beragam dengan 12 pieces.", price:45000, img:"https://source.unsplash.com/300x200/?sushi-combo", category:"Sushi", discount:20, time:"25-35min", rating:4.7 },
  { name:"Sushi Ebi Tempura", desc:"Sushi dengan udang tempura yang crispy.", price:35000, img:"https://source.unsplash.com/300x200/?tempura-sushi", category:"Sushi", discount:0, time:"20-30min", rating:4.5 },

  // MINUMAN CATEGORY
  { name:"Es Teh Manis", desc:"Minuman segar pelepas dahaga.", price:5000, img:"https://pfst.cf2.poecdn.net/base/image/3d806838cff2a7260d080f59a5c26ee9235b84fea4559800046f6cc67e20af1a?w=4096&h=3803", category:"Minuman", discount:25, time:"5-10min", rating:4.2 },
  { name:"Es Jeruk Segar", desc:"Jeruk peras segar dengan es batu.", price:8000, img:"https://source.unsplash.com/300x200/?orange-juice", category:"Minuman", discount:0, time:"5-10min", rating:4.3 },
  { name:"Es Campur", desc:"Es campur dengan berbagai topping manis.", price:12000, img:"https://source.unsplash.com/300x200/?mixed-ice", category:"Minuman", discount:10, time:"10-15min", rating:4.4 },
  { name:"Jus Alpukat", desc:"Jus alpukat creamy dengan susu kental manis.", price:10000, img:"https://source.unsplash.com/300x200/?avocado-juice", category:"Minuman", discount:0, time:"5-10min", rating:4.5 },
  { name:"Es Kelapa Muda", desc:"Air kelapa muda segar langsung dari buah.", price:9000, img:"https://source.unsplash.com/300x200/?coconut-water", category:"Minuman", discount:15, time:"5-10min", rating:4.1 },
  { name:"Kopi Hitam", desc:"Kopi hitam pekat untuk yang suka pahit.", price:7000, img:"https://source.unsplash.com/300x200/?black-coffee", category:"Minuman", discount:0, time:"5-10min", rating:4.0 },
  { name:"Kopi Susu", desc:"Kopi dengan campuran susu yang creamy.", price:10000, img:"https://source.unsplash.com/300x200/?milk-coffee", category:"Minuman", discount:0, time:"5-10min", rating:4.4 },
  { name:"Teh Tarik", desc:"Teh susu yang ditarik dengan teknik khusus.", price:8000, img:"https://source.unsplash.com/300x200/?pulled-tea", category:"Minuman", discount:0, time:"10-15min", rating:4.3 },

  // SATE CATEGORY
  { name:"Sate Ayam Madura", desc:"Sate ayam dengan bumbu kacang khas Madura.", price:25000, img:"https://source.unsplash.com/300x200/?satay", category:"Sate", discount:0, time:"30-40min", rating:4.7 },
  { name:"Sate Kambing", desc:"Sate kambing empuk dengan bumbu kacang pedas.", price:30000, img:"https://source.unsplash.com/300x200/?goat-satay", category:"Sate", discount:0, time:"35-45min", rating:4.6 },
  { name:"Sate Padang", desc:"Sate dengan kuah gulai khas Padang.", price:28000, img:"https://source.unsplash.com/300x200/?padang-satay", category:"Sate", discount:10, time:"30-40min", rating:4.5 },
  { name:"Sate Lilit Bali", desc:"Sate lilit ikan khas Bali yang harum.", price:26000, img:"https://source.unsplash.com/300x200/?balinese-satay", category:"Sate", discount:0, time:"25-35min", rating:4.4 },

  // GADO-GADO CATEGORY
  { name:"Gado-Gado Jakarta", desc:"Salad Indonesia dengan bumbu kacang.", price:18000, img:"https://source.unsplash.com/300x200/?gado-gado", category:"Gado-Gado", discount:0, time:"15-25min", rating:4.3 },
  { name:"Gado-Gado Betawi", desc:"Gado-gado khas Betawi dengan lontong.", price:20000, img:"https://source.unsplash.com/300x200/?betawi-salad", category:"Gado-Gado", discount:15, time:"15-25min", rating:4.5 },
  { name:"Pecel Madiun", desc:"Pecel sayuran dengan sambal pecel pedas.", price:16000, img:"https://source.unsplash.com/300x200/?pecel", category:"Gado-Gado", discount:0, time:"15-25min", rating:4.2 },

  // SOTO CATEGORY
  { name:"Soto Ayam", desc:"Sup ayam bening dengan suwiran ayam dan tauge.", price:17000, img:"https://source.unsplash.com/300x200/?chicken-soup", category:"Soto", discount:0, time:"20-30min", rating:4.4 },
  { name:"Soto Betawi", desc:"Soto khas Betawi dengan santan dan kentang.", price:19000, img:"https://source.unsplash.com/300x200/?betawi-soup", category:"Soto", discount:0, time:"25-35min", rating:4.5 },
  { name:"Soto Kudus", desc:"Soto dengan kuah bening dan kerupuk karak.", price:18000, img:"https://source.unsplash.com/300x200/?kudus-soup", category:"Soto", discount:10, time:"20-30min", rating:4.3 },
  { name:"Coto Makassar", desc:"Sup daging khas Makassar yang kaya rempah.", price:22000, img:"https://source.unsplash.com/300x200/?makassar-soup", category:"Soto", discount:0, time:"30-40min", rating:4.6 },

  // BAKSO CATEGORY
  { name:"Bakso Malang", desc:"Bakso khas Malang dengan berbagai varian.", price:16000, img:"https://source.unsplash.com/300x200/?meatball", category:"Bakso", discount:0, time:"20-30min", rating:4.4 },
  { name:"Bakso Urat", desc:"Bakso dengan urat yang kenyal dan gurih.", price:18000, img:"https://source.unsplash.com/300x200/?tendon-meatball", category:"Bakso", discount:0, time:"20-30min", rating:4.3 },
  { name:"Bakso Keju", desc:"Bakso dengan isian keju mozzarella.", price:20000, img:"https://source.unsplash.com/300x200/?cheese-meatball", category:"Bakso", discount:15, time:"20-30min", rating:4.5 },
  { name:"Bakso Jumbo", desc:"Bakso berukuran jumbo dengan isian telur.", price:22000, img:"https://source.unsplash.com/300x200/?jumbo-meatball", category:"Bakso", discount:0, time:"25-35min", rating:4.6 },

  // AYAM CATEGORY
  { name:"Ayam Bakar Taliwang", desc:"Ayam bakar pedas khas Lombok yang menggugah selera.", price:25000, img:"https://source.unsplash.com/300x200/?grilled-chicken", category:"Ayam", discount:0, time:"30-40min", rating:4.6 },
  { name:"Ayam Geprek", desc:"Ayam crispy yang digeprek dengan sambal pedas.", price:20000, img:"https://source.unsplash.com/300x200/?smashed-chicken", category:"Ayam", discount:10, time:"20-30min", rating:4.5 },
  { name:"Ayam Kremes", desc:"Ayam goreng dengan kremesan yang crispy.", price:23000, img:"https://source.unsplash.com/300x200/?crispy-chicken", category:"Ayam", discount:0, time:"25-35min", rating:4.4 },
  { name:"Ayam Penyet", desc:"Ayam goreng yang dipenyet dengan sambal terasi.", price:21000, img:"https://source.unsplash.com/300x200/?penyet-chicken", category:"Ayam", discount:15, time:"20-30min", rating:4.3 },

  // SEAFOOD CATEGORY
  { name:"Udang Saus Padang", desc:"Udang dengan saus pedas khas Padang.", price:35000, img:"https://source.unsplash.com/300x200/?shrimp-sauce", category:"Seafood", discount:0, time:"25-35min", rating:4.5 },
  { name:"Ikan Bakar Jimbaran", desc:"Ikan bakar dengan bumbu khas Jimbaran Bali.", price:32000, img:"https://source.unsplash.com/300x200/?grilled-fish", category:"Seafood", discount:0, time:"30-40min", rating:4.6 },
  { name:"Cumi Saus Tiram", desc:"Cumi-cumi dengan saus tiram yang gurih.", price:28000, img:"https://source.unsplash.com/300x200/?squid-oyster", category:"Seafood", discount:10, time:"20-30min", rating:4.4 },
  { name:"Kepiting Saus Padang", desc:"Kepiting dengan saus pedas yang menggoda.", price:45000, img:"https://source.unsplash.com/300x200/?crab-sauce", category:"Seafood", discount:0, time:"35-45min", rating:4.7 },

  // CEMILAN CATEGORY
  { name:"Pisang Goreng", desc:"Cemilan manis renyah di luar, lembut di dalam.", price:10000, img:"https://source.unsplash.com/300x200/?banana-fritters", category:"Cemilan", discount:10, time:"10-15min", rating:4.4 },
  { name:"Tahu Isi", desc:"Tahu goreng dengan isian sayuran segar.", price:8000, img:"https://source.unsplash.com/300x200/?stuffed-tofu", category:"Cemilan", discount:0, time:"10-15min", rating:4.2 },
  { name:"Risoles Mayo", desc:"Risoles crispy dengan isian sayuran dan mayo.", price:12000, img:"https://source.unsplash.com/300x200/?risoles", category:"Cemilan", discount:15, time:"15-20min", rating:4.3 },
  { name:"Siomay Bandung", desc:"Siomay dengan bumbu kacang khas Bandung.", price:15000, img:"https://source.unsplash.com/300x200/?siomay", category:"Cemilan", discount:0, time:"15-25min", rating:4.5 },
  { name:"Kerupuk Udang", desc:"Kerupuk udang crispy untuk pelengkap.", price:5000, img:"https://source.unsplash.com/300x200/?shrimp-crackers", category:"Cemilan", discount:20, time:"5-10min", rating:4.1 },
  { name:"Martabak Mini", desc:"Martabak ukuran mini dengan berbagai rasa.", price:18000, img:"https://source.unsplash.com/300x200/?mini-martabak", category:"Cemilan", discount:0, time:"20-30min", rating:4.6 },

  // DESSERT CATEGORY
  { name:"Es Krim Vanilla", desc:"Es krim vanilla premium yang creamy.", price:15000, img:"https://source.unsplash.com/300x200/?vanilla-ice-cream", category:"Dessert", discount:0, time:"5-10min", rating:4.3 },
  { name:"Pudding Coklat", desc:"Pudding coklat lembut dengan topping krim.", price:12000, img:"https://source.unsplash.com/300x200/?chocolate-pudding", category:"Dessert", discount:10, time:"10-15min", rating:4.4 },
  { name:"Klepon", desc:"Kue tradisional dengan isian gula merah.", price:8000, img:"https://source.unsplash.com/300x200/?klepon", category:"Dessert", discount:0, time:"15-20min", rating:4.2 },
  { name:"Cendol Dawet", desc:"Minuman tradisional dengan santan dan gula merah.", price:10000, img:"https://source.unsplash.com/300x200/?cendol", category:"Dessert", discount:15, time:"10-15min", rating:4.5 },

  // PIZZA CATEGORY
  { name:"Pizza Margherita", desc:"Pizza klasik dengan keju mozzarella dan basil.", price:45000, img:"https://source.unsplash.com/300x200/?margherita-pizza", category:"Pizza", discount:0, time:"25-35min", rating:4.5 },
  { name:"Pizza Pepperoni", desc:"Pizza dengan topping pepperoni yang gurih.", price:50000, img:"https://source.unsplash.com/300x200/?pepperoni-pizza", category:"Pizza", discount:20, time:"25-35min", rating:4.6 },
  { name:"Pizza Hawaiian", desc:"Pizza dengan nanas dan ham yang unik.", price:48000, img:"https://source.unsplash.com/300x200/?hawaiian-pizza", category:"Pizza", discount:0, time:"30-40min", rating:4.3 },

  // BURGER CATEGORY
  { name:"Burger Beef", desc:"Burger dengan daging sapi juicy dan saus spesial.", price:25000, img:"https://source.unsplash.com/300x200/?beef-burger", category:"Burger", discount:0, time:"15-25min", rating:4.4 },
  { name:"Burger Chicken", desc:"Burger dengan ayam crispy dan sayuran segar.", price:22000, img:"https://source.unsplash.com/300x200/?chicken-burger", category:"Burger", discount:15, time:"15-25min", rating:4.3 },
  { name:"Burger Double Cheese", desc:"Burger dengan double keju yang melted.", price:28000, img:"https://source.unsplash.com/300x200/?cheese-burger", category:"Burger", discount:0, time:"20-30min", rating:4.5 }
];

const categories = ["Semua", ...new Set(menus.map(m=>m.category))];

const categoryImages = {
  "Semua": "https://pfst.cf2.poecdn.net/base/image/b3be979177b45539ee7953df52aec625559ddedd32eea027992a07ef14c30cb8?w=500&h=500",
  "Bubur Ayam": "https://pfst.cf2.poecdn.net/base/image/a2a0e424819cc0f5bbac502d783ebe0cef6043647bc92faafb97204d55730bb0?w=534&h=468",
  "Mie Ayam": "https://pfst.cf2.poecdn.net/base/image/e8e346a1d2acea15e628463bee9c911ab10c7c52b99d021298a20ea8c4ab6b25?w=500&h=500",
  "Nasi Goreng": "https://pfst.cf2.poecdn.net/base/image/9b0927f25fd5c895ce5672a2cee7b42a087cdeca77fac687dbd8ac0ec86212c4?w=638&h=391",
  "Sushi": "https://pfst.cf2.poecdn.net/base/image/45012fcf3342ee6176f35110eede28b1dc71340af4ffe25ba0facaeb46928da3?w=551&h=453",
  "Minuman": "https://pfst.cf2.poecdn.net/base/image/3d806838cff2a7260d080f59a5c26ee9235b84fea4559800046f6cc67e20af1a?w=4096&h=3803",
  "Sate": "https://source.unsplash.com/80x80/?satay",
  "Gado-Gado": "https://source.unsplash.com/80x80/?gado-gado",
  "Soto": "https://source.unsplash.com/80x80/?soup",
  "Bakso": "https://source.unsplash.com/80x80/?meatball",
  "Ayam": "https://source.unsplash.com/80x80/?chicken",
  "Seafood": "https://source.unsplash.com/80x80/?seafood",
  "Cemilan": "https://source.unsplash.com/80x80/?snack",
  "Dessert": "https://source.unsplash.com/80x80/?dessert",
  "Pizza": "https://source.unsplash.com/80x80/?pizza",
  "Burger": "https://source.unsplash.com/80x80/?burger"
};

// ==================== FUNGSI TAMBAHAN ====================
function showPaymentSuccessPopup(transaction) {
  // Tampilkan loading dulu
  const loadingModal = document.createElement('div');
  loadingModal.className = 'fixed inset-0 bg-black/40 flex items-center justify-center z-[10001] p-3';
  
  loadingModal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 text-center animate-zoomIn">
            <div class="w-12 h-12 border-4 border-green-200 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p class="text-gray-600 dark:text-gray-400 text-sm">Memproses pembayaran...</p>
        </div>
    `;
  
  document.body.appendChild(loadingModal);
  
  // Setelah 1.5 detik, ganti dengan card success
  setTimeout(() => {
    loadingModal.remove();
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/40 flex items-center justify-center z-[10001] p-3';
    
    modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-[92%] max-w-sm overflow-hidden animate-zoomIn">
                
                <!-- Header -->
                <div class="bg-green-500 text-white p-4 text-center relative">
                    <div class="absolute top-2 right-2">
                        <button onclick="this.closest('.fixed').remove()" class="text-white/80 hover:text-white">
                            ✕
                        </button>
                    </div>
                    <div class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" 
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 
                                     1 0 01-1.414 0l-4-4a1 1 0 
                                     011.414-1.414L8 12.586l7.293-7.293a1 
                                     1 0 011.414 0z" 
                                  clip-rule="evenodd"/>
                        </svg>
                    </div>
                    <h2 class="text-lg font-bold">Pembayaran Berhasil!</h2>
                    <p class="text-green-100 text-sm">Pesanan sedang diproses</p>
                </div>
                
                <!-- Body -->
                <div class="p-4 space-y-3 text-sm">
                    
                    <!-- Info utama -->
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">ID</span>
                        <span class="font-mono text-gray-900 dark:text-gray-200">#${transaction.id.toUpperCase()}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Total</span>
                        <span class="font-bold text-green-600">Rp ${transaction.total.toLocaleString('id-ID')}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Status</span>
                        <span class="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs">${transaction.status}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Estimasi</span>
                        <span class="text-gray-900 dark:text-gray-200">20-30 mnt</span>
                    </div>
                    
                    <!-- Ringkasan -->
                    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <h3 class="font-medium text-gray-900 dark:text-gray-200 mb-2 text-sm">Ringkasan</h3>
                        
                        <!-- Scroll container -->
                        <div class="max-h-40 overflow-y-auto pr-1 space-y-2">
                            ${transaction.menus.map(item => `
                                <div class="flex items-center justify-between">
                                    <!-- Foto menu -->
                                    <img src="${item.img}" alt="${item.name}" 
                                         class="w-10 h-10 rounded-md object-cover mr-2 border border-gray-200 dark:border-gray-600">
                                    
                                    <!-- Nama & Qty -->
                                    <div class="flex-1 min-w-0">
                                        <p class="text-gray-800 dark:text-gray-200 text-sm truncate">${item.name}</p>
                                        <p class="text-xs text-gray-500 dark:text-gray-400">x${item.qty}</p>
                                    </div>
                                    
                                    <!-- Harga -->
                                    <div class="text-gray-900 dark:text-gray-200 text-sm font-medium whitespace-nowrap ml-2">
                                        Rp ${(item.price * item.qty).toLocaleString('id-ID')}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- Kontak -->
                    <div class="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3">
                        <div class="flex items-center text-blue-700 dark:text-blue-300 text-xs mb-1">
                            <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 
                                         1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 
                                         006.105 6.105l.774-1.548a1 1 0 
                                         011.059-.54l4.435.74a1 1 0 
                                         01.836.986V17a1 1 0 01-1 1h-2C7.82 
                                         18 2 12.18 2 5V3z"/>
                            </svg>
                            Kontak Penjual
                        </div>
                        <p class="text-xs text-gray-700 dark:text-gray-300">${transaction.seller}</p>
                        <p class="text-xs text-blue-600 dark:text-blue-400">${transaction.sellerPhone}</p>
                    </div>
                    
                    <!-- Tombol -->
                    <div class="flex space-x-2 pt-2">
                        <button onclick="this.closest('.fixed').remove()" 
                                class="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-200 py-2 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-500">
                            Tutup
                        </button>
                        <button onclick="showOrderTracking('${transaction.id}'); this.closest('.fixed').remove();" 
                                class="flex-1 bg-green-500 text-white py-2 rounded-lg text-sm hover:bg-green-600">
                            Lacak
                        </button>
                    </div>
                </div>
                
                <!-- Loading Bar at Bottom -->
                <div class="h-1 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-green-400 to-green-600 animate-loading-bar"></div>
                </div>
            </div>
        `;
    
    document.body.appendChild(modal);
    
    // auto close (optional)
    setTimeout(() => modal.remove(), 15000);
    
  }, 1500); // Loading selama 1.5 detik
}

function showOrderTracking(orderId) {
  console.log('Tracking order:', orderId);
}

// CSS Animations
const style = document.createElement('style');
style.innerHTML = `
    @keyframes zoomIn {
        from { 
            transform: scale(0.8) translateY(20px); 
            opacity: 0; 
        }
        to { 
            transform: scale(1) translateY(0); 
            opacity: 1; 
        }
    }
    
    @keyframes loadingBar {
        0% { 
            transform: translateX(-100%); 
        }
        50% { 
            transform: translateX(0%); 
        }
        100% { 
            transform: translateX(100%); 
        }
    }
    
    .animate-zoomIn { 
        animation: zoomIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
    }
    
    .animate-loading-bar { 
        animation: loadingBar 2s ease-in-out infinite; 
    }
`;
document.head.appendChild(style);

// ==================== RENDER KATEGORI ====================
categories.forEach(cat => {
  const div = document.createElement("div");
  div.className = "flex flex-col items-center min-w-[90px]";
  div.innerHTML = `
    <img src="${categoryImages[cat] || 'https://via.placeholder.com/80'}" class="w-20 h-20 rounded-full object-cover mb-1 hover:scale-110 transition" />
    <button class="category-btn text-sm">${cat}</button>
  `;
  categoryBar.appendChild(div);
  div.querySelector("button").addEventListener("click", () => {
    document.querySelectorAll(".category-btn").forEach(b => b.classList.remove("active"));
    div.querySelector("button").classList.add("active");
    renderMenu(cat==="Semua"?menus:menus.filter(m=>m.category===cat));
  });
});

// ==================== RENDER MENU ====================
function renderMenu(list){
  menuList.innerHTML = "";
  if(!list.length){ 
    menuList.innerHTML = '<p class="text-center text-gray-600">Menu tidak ditemukan.</p>'; 
    return; 
  }

  list.forEach(m => {
    const card = document.createElement("div");
    card.className = "bg-white rounded-lg shadow flex flex-col hover:shadow-md transition";
    card.innerHTML = `
      <div class="relative">
        <img src="${m.img}" class="w-full h-36 object-cover rounded-t-lg" />
        ${
          m.discount > 0
          ? `<span class="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded animate-pulse">-${m.discount}%</span>`
          : ""
        }
      </div>
      <div class="p-2 flex flex-col flex-1">
        <div class="flex justify-between text-xs text-gray-600 mb-1">
          <span>${m.time}</span><span>⭐ ${m.rating}</span>
        </div>
        <p class="font-semibold text-sm text-gray-900">${m.name}</p>
        <p class="text-gray-600 text-xs">${m.desc}</p>
        <div class="mt-3 flex justify-between items-center">
          <div>
            <span class="text-red-600 font-bold">
              ${m.discount>0?`Rp${(m.price*(1-m.discount/100)).toLocaleString()}`:`Rp${m.price.toLocaleString()}`}
            </span>
            ${m.discount>0?`<span class="line-through text-xs text-gray-500 ml-1">Rp${m.price.toLocaleString()}</span>`:""}
          </div>
          <div class="flex items-center space-x-2">
            <button class="minus-btn bg-gray-200 px-3 rounded">-</button>
            <button class="plus-btn bg-red-600 text-white px-3 rounded">+</button>
          </div>
        </div>
      </div>`;
    
    card.querySelector(".plus-btn").addEventListener("click",()=>addToCart(m));
    card.querySelector(".minus-btn").addEventListener("click",()=>removeFromCart(m));
    menuList.appendChild(card);
  });
}

// ==================== CART ====================
function addToCart(menu){
  const index=cart.findIndex(i=>i.name===menu.name);
  const price=menu.discount>0?menu.price*(1-menu.discount/100):menu.price;
  if(index>-1){ cart[index].qty+=1; } else { cart.push({...menu, price, qty:1}); }
  renderCart();
}
function removeFromCart(menu){
  const index=cart.findIndex(i=>i.name===menu.name);
  if(index>-1){ cart[index].qty-=1; if(cart[index].qty<=0) cart.splice(index,1); renderCart(); }
}
function renderCart(){
  cartList.innerHTML=""; let total=0;
  cart.forEach(i=>{ total+=i.price*i.qty; const li=document.createElement("li"); li.textContent=`${i.name} x${i.qty} - Rp${i.price.toLocaleString()}`; cartList.appendChild(li); });
  cartTotalEl.textContent="Rp"+total.toLocaleString();
  cartLayout.classList.toggle("hidden",cart.length===0);
}

// ==================== BAYAR & RIWAYAT ====================
document.getElementById("pay-btn").addEventListener("click",()=>{
  if(cart.length===0) return;
  const total=cart.reduce((s,i)=>s+i.price*i.qty,0);
  const txHistory=gofoodStorage.get(TX2_KEY,[]);
  const newTx={id:Date.now().toString(36)+Math.random().toString(36).substr(2,5),menus:[...cart],total,status:"Pesanan dibuat",ts:Date.now(),seller:"Warung Makan Enak",sellerPhone:"08123456789",deliveryRouteImg:"https://source.unsplash.com/600x150/?map"};
  txHistory.unshift(newTx); gofoodStorage.set(TX2_KEY,txHistory);
  showPaymentSuccessPopup(newTx);
  cart=[]; renderCart();
});

// ==================== RIWAYAT ====================
aktivitasBtn.addEventListener("click", () => {
  renderTx();
  aktivitasLayout.classList.remove("hidden");
});
aktivitasClose.addEventListener("click", () => {
  aktivitasLayout.classList.add("hidden");
});

function renderTx(){
  const tx = gofoodStorage.get(TX2_KEY, []);
  txList.innerHTML = "";

  if(tx.length === 0){
    txList.innerHTML = `
      <div class="text-center py-8">
        <div class="text-gray-400 text-6xl mb-4">ðŸ“‹</div>
        <p class="text-gray-600 text-lg">Belum ada transaksi</p>
        <p class="text-gray-500 text-sm">Pesanan Anda akan muncul di sini</p>
      </div>
    `;
    return;
  }

  tx.forEach(t => {
    const div = document.createElement("div");
    div.className = "bg-white rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer border border-gray-100";
    
    div.innerHTML = `
      <div class="p-4">
        <!-- Header Card -->
        <div class="flex justify-between items-start mb-3">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
              <span class="text-white font-bold text-sm">#${t.id.substring(0,3).toUpperCase()}</span>
            </div>
            <div>
              <p class="font-bold text-red-600 text-lg">Rp ${t.total.toLocaleString()}</p>
              <p class="text-xs text-gray-600">${new Date(t.ts).toLocaleDateString('id-ID', { 
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>
          </div>
          <div class="flex flex-col items-end">
            <span class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium mb-1">${t.status}</span>
            <span class="text-xs text-gray-500">${t.menus.length} item</span>
          </div>
        </div>
        
        <!-- Menu Items Preview -->
        <div class="bg-gray-50 rounded-lg p-3 mb-3">
          <div class="flex items-center space-x-2 overflow-x-auto">
            ${t.menus.slice(0, 3).map(m => `
              <img src="${m.img}" class="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
            `).join('')}
            ${t.menus.length > 3 ? `<div class="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0"><span class="text-xs text-gray-600">+${t.menus.length - 3}</span></div>` : ''}
          </div>
          <p class="text-sm text-gray-700 mt-2 line-clamp-2">${t.menus.map(m => `${m.name} x${m.qty}`).join(", ")}</p>
        </div>
        
        <!-- Footer -->
        <div class="flex justify-between items-center">
          <div class="flex items-center space-x-2 text-xs text-gray-600">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
            </svg>
            <span>${t.seller}</span>
          </div>
          <div class="text-red-600 text-sm font-medium">Lihat Detail â†’</div>
        </div>
      </div>
    `;

    div.addEventListener("click", () => openTxDetail(t));
    txList.appendChild(div);
  });
}

// ==================== OPEN DETAIL TRANSAKSI DENGAN RUTE ====================
function openTxDetail(t){
  txDetailList.innerHTML = "";
  txDetailLayout.classList.remove("hidden");

  // Show loading skeleton first
  showLoadingSkeleton();

  // Simulate loading delay for better UX
  setTimeout(() => {
    txDetailList.innerHTML = "";
    
    // Add entrance animation
    txDetailList.style.opacity = "0";
    txDetailList.style.transform = "translateY(20px)";
    
    // Header Info with proper alignment
    const headerInfo = document.createElement("div");
    headerInfo.className = "bg-green-600 text-white rounded-lg p-6 mb-6 shadow-md";
    headerInfo.innerHTML = `
      <div class="flex justify-between items-center mb-6">
        <div>
          <div class="flex items-center space-x-3 mb-2">
            <div class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7ZM9 3V4H15V3H9ZM7 6V19H17V6H7Z"/>
              </svg>
            </div>
            <h3 class="text-xl font-bold">Pesanan #${t.id.toUpperCase()}</h3>
          </div>
          <p class="text-white/90 text-sm ml-13">${new Date(t.ts).toLocaleDateString('id-ID', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
        </div>
        <div class="text-right">
          <p class="text-sm text-white/80 mb-1">Total Saldo</p>
          <p class="text-3xl font-bold mb-1">Rp ${t.total.toLocaleString()}</p>
          <span class="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">${t.status}</span>
        </div>
      </div>
      
      <!-- Step tracker instead of progress bar -->
      <div class="bg-white/10 rounded-lg p-4">
        <div class="flex items-center justify-between text-xs">
          <div class="flex flex-col items-center">
            <div class="w-6 h-6 bg-white rounded-full flex items-center justify-center mb-1">
              <svg class="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
              </svg>
            </div>
            <span class="text-white/80">Dipesan</span>
          </div>
          <div class="flex-1 h-0.5 bg-white/30 mx-2"></div>
          <div class="flex flex-col items-center">
            <div class="w-6 h-6 bg-white rounded-full flex items-center justify-center mb-1">
              <svg class="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
              </svg>
            </div>
            <span class="text-white/80">Dimasak</span>
          </div>
          <div class="flex-1 h-0.5 bg-white/30 mx-2"></div>
          <div class="flex flex-col items-center">
            <div class="w-6 h-6 bg-white/60 rounded-full flex items-center justify-center mb-1">
              <div class="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
            </div>
            <span class="text-white/80">Diantar</span>
          </div>
          <div class="flex-1 h-0.5 bg-white/20 mx-2"></div>
          <div class="flex flex-col items-center">
            <div class="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mb-1">
              <div class="w-2 h-2 bg-white/40 rounded-full"></div>
            </div>
            <span class="text-white/60">Selesai</span>
          </div>
        </div>
      </div>
    `;
    txDetailList.appendChild(headerInfo);

    // Delivery tracking with motorcycle icon
    const routeDiv = document.createElement("div");
    routeDiv.className = "mb-6";
    routeDiv.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div class="p-4 border-b border-gray-100 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5,11L6.5,6.5H17.5L19,11H17V12C17,12.55 16.55,13 16,13H15C14.45,13 14,12.55 14,12V11H10V12C10,12.55 9.55,13 9,13H8C7.45,13 7,12.55 7,12V11H5M6,13.5C6,14.33 6.67,15 7.5,15C8.33,15 9,14.33 9,13.5C9,12.67 8.33,12 7.5,12C6.67,12 6,12.67 6,13.5M15,13.5C15,14.33 15.67,15 16.5,15C17.33,15 18,14.33 18,13.5C18,12.67 17.33,12 16.5,12C15.67,12 15,12.67 15,13.5Z"/>
                </svg>
              </div>
              <div>
                <p class="font-semibold text-gray-900 dark:text-gray-100">Driver dalam perjalanan</p>
                <p class="text-sm text-gray-600 dark:text-gray-400">Est. 15-25 menit • 3.2 km</p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span class="text-sm font-medium text-green-600 dark:text-green-400">Live</span>
            </div>
          </div>
        </div>
        <div class="p-4">
          <div class="flex items-center justify-between">
            <p class="text-sm text-gray-600 dark:text-gray-400">Tracking aktif untuk pesanan ini</p>
            <button class="text-green-600 dark:text-green-400 text-sm font-medium hover:text-green-700 dark:hover:text-green-300 transition">
              Lihat Rute →
            </button>
          </div>
        </div>
      </div>
    `;
    txDetailList.appendChild(routeDiv);

    // Restaurant info with aligned text and smaller contact buttons
    const sellerInfo = document.createElement("div");
    sellerInfo.className = "bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6 border border-gray-100 dark:border-gray-700";
    sellerInfo.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3 flex-1">
          <div class="relative">
            <div class="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6 text-orange-600 dark:text-orange-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
              </svg>
            </div>
            <div class="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center border border-white dark:border-gray-800">
              <svg class="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
              </svg>
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center space-x-2 mb-1">
              <p class="font-bold text-gray-900 dark:text-gray-100 text-base truncate">${t.seller}</p>
              <span class="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-md font-medium whitespace-nowrap">Verified</span>
            </div>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-1">Merchant Partner</p>
            <div class="flex items-center space-x-3 text-sm">
              <div class="flex items-center space-x-1">
                <svg class="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
                <span class="text-gray-700 dark:text-gray-300">4.8</span>
              </div>
              <span class="text-gray-300 dark:text-gray-600">•</span>
              <span class="text-gray-600 dark:text-gray-400">2.1k orders</span>
            </div>
          </div>
        </div>
        <div class="flex items-center space-x-2 ml-3">
          <button class="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition shadow-sm" onclick="window.location.href='tel:${t.sellerPhone}'">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
            </svg>
          </button>
          <button class="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition shadow-sm" onclick="window.open('https://wa.me/${t.sellerPhone?.replace(/[^0-9]/g, '')}')">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.89 3.097"/>
            </svg>
          </button>
        </div>
      </div>
    `;
    txDetailList.appendChild(sellerInfo);

    // Menu container with visual separators
    const menuContainer = document.createElement("div");
    menuContainer.className = "bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6 border border-gray-100 dark:border-gray-700";
    menuContainer.innerHTML = `
      <div class="flex items-center justify-between mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
        <h3 class="font-bold text-gray-900 dark:text-gray-100 text-base">Detail Pesanan</h3>
        <span class="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs">${t.menus.length} Items</span>
      </div>
    `;
    
    t.menus.forEach((m, index) => {
      const item = document.createElement("div");
      item.className = "flex items-center space-x-3 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-2 last:mb-0";
      item.innerHTML = `
        <div class="relative flex-shrink-0">
          <img src="${m.img}" class="w-12 h-12 object-cover rounded-lg border border-gray-200 dark:border-gray-600">
          ${m.discount > 0 ? `<div class="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded-full font-bold text-[10px]">${m.discount}%</div>` : ''}
        </div>
        <div class="flex-1 min-w-0 px-2">
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">${m.name}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">${m.time}</p>
              <div class="flex items-center space-x-2">
                <span class="px-2 py-0.5 bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs border">Qty: ${m.qty}</span>
                ${index === 0 ? '<span class="px-2 py-0.5 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded text-xs border border-orange-200 dark:border-orange-700">Terpopuler</span>' : ''}
              </div>
            </div>
            <div class="text-right ml-3">
              <p class="font-bold text-sm text-gray-900 dark:text-gray-100">
                ${m.discount > 0 ? 
                  `Rp ${(m.price * (1 - m.discount / 100) * m.qty).toLocaleString()}` : 
                  `Rp ${(m.price * m.qty).toLocaleString()}`
                }
              </p>
              ${m.discount > 0 ? 
                `<p class="text-xs text-gray-400 line-through">Rp ${(m.price * m.qty).toLocaleString()}</p>` : 
                ''
              }
            </div>
          </div>
        </div>
      `;
      menuContainer.appendChild(item);
    });
    txDetailList.appendChild(menuContainer);

    // Footer with better visual hierarchy
    const footer = document.createElement("div");
    footer.className = "bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-gray-100 dark:border-gray-700";
    footer.innerHTML = `
      <div class="space-y-3">
        <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-600 dark:text-gray-400">Subtotal</span>
            <span class="font-medium text-gray-900 dark:text-gray-100">Rp ${(t.total * 0.85).toLocaleString()}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600 dark:text-gray-400">Biaya Pengiriman</span>
            <span class="font-medium text-gray-900 dark:text-gray-100">Rp ${(t.total * 0.1).toLocaleString()}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600 dark:text-gray-400">Biaya Platform</span>
            <span class="font-medium text-gray-900 dark:text-gray-100">Rp ${(t.total * 0.05).toLocaleString()}</span>
          </div>
        </div>
        <div class="border-t dark:border-gray-700 pt-3">
          <div class="flex justify-between">
            <span class="font-bold text-lg text-gray-900 dark:text-gray-100">Total Saldo</span>
            <span class="font-bold text-xl text-green-600 dark:text-green-400">Rp ${t.total.toLocaleString()}</span>
          </div>
        </div>
        <div class="flex space-x-3 pt-2">
          <button class="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition cancel-btn">
            <svg class="w-4 h-4 mr-2 inline" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
            Batalkan
          </button>
          <button class="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition shadow-sm" onclick="showOrderTracking('${t.id}')">
            <svg class="w-4 h-4 mr-2 inline" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
            </svg>
            Lacak Pesanan
          </button>
        </div>
      </div>
    `;
    
    footer.querySelector(".cancel-btn").addEventListener("click", () => {
      const allTx = gofoodStorage.get(TX2_KEY, []);
      gofoodStorage.set(TX2_KEY, allTx.filter(x => x.id !== t.id));
      txDetailLayout.classList.add("hidden");
      renderTx();
    });
    
    txDetailList.appendChild(footer);

    // Animate content in
    setTimeout(() => {
      txDetailList.style.transition = "all 0.5s ease-out";
      txDetailList.style.opacity = "1";
      txDetailList.style.transform = "translateY(0)";
    }, 100);
    
  }, 800); // Loading delay
}

// Loading skeleton function
function showLoadingSkeleton() {
  txDetailList.innerHTML = `
    <div class="animate-pulse space-y-6">
      <!-- Header skeleton -->
      <div class="bg-gray-200 dark:bg-gray-700 rounded-lg p-6 relative overflow-hidden">
        <div class="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-white/10"></div>
        <div class="flex justify-between items-center mb-4">
          <div>
            <div class="h-6 bg-gray-300 dark:bg-gray-600 rounded w-40 mb-2"></div>
            <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-48"></div>
          </div>
          <div class="text-right">
            <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16 mb-1"></div>
            <div class="h-8 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-1"></div>
            <div class="h-6 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
          </div>
        </div>
        <div class="h-16 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
      </div>
      
      <!-- Route skeleton -->
      <div class="bg-gray-200 dark:bg-gray-700 rounded-xl overflow-hidden relative">
        <div class="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-white/10"></div>
        <div class="p-4">
          <div class="flex items-center space-x-3 mb-3">
            <div class="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
            <div>
              <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-1"></div>
              <div class="h-3 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
            </div>
          </div>
          <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
        </div>
      </div>
      
      <!-- Seller skeleton -->
      <div class="bg-gray-200 dark:bg-gray-700 rounded-xl p-4 relative overflow-hidden">
        <div class="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-white/10"></div>
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3 flex-1">
            <div class="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-xl"></div>
            <div class="flex-1">
              <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-2"></div>
              <div class="h-3 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-1"></div>
              <div class="h-3 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
            </div>
          </div>
          <div class="flex space-x-2">
            <div class="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
            <div class="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
          </div>
        </div>
      </div>
      
      <!-- Menu items skeleton -->
      <div class="bg-gray-200 dark:bg-gray-700 rounded-xl p-4 relative overflow-hidden">
        <div class="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-white/10"></div>
        <div class="h-5 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-4"></div>
        <div class="space-y-3">
          ${[1,2,3].map(() => `
            <div class="bg-gray-300 dark:bg-gray-600 rounded-lg p-3">
              <div class="flex items-center space-x-3">
                <div class="w-12 h-12 bg-gray-400 dark:bg-gray-500 rounded-lg"></div>
                <div class="flex-1">
                  <div class="h-4 bg-gray-400 dark:bg-gray-500 rounded w-32 mb-2"></div>
                  <div class="h-3 bg-gray-400 dark:bg-gray-500 rounded w-24 mb-1"></div>
                  <div class="h-3 bg-gray-400 dark:bg-gray-500 rounded w-16"></div>
                </div>
                <div class="h-4 bg-gray-400 dark:bg-gray-500 rounded w-16"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <!-- Footer skeleton -->
      <div class="bg-gray-200 dark:bg-gray-700 rounded-xl p-5 relative overflow-hidden">
        <div class="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-white/10"></div>
        <div class="bg-gray-300 dark:bg-gray-600 rounded-lg p-3 mb-3">
          <div class="space-y-2">
            ${[1,2,3].map(() => `
              <div class="flex justify-between">
                <div class="h-3 bg-gray-400 dark:bg-gray-500 rounded w-20"></div>
                <div class="h-3 bg-gray-400 dark:bg-gray-500 rounded w-16"></div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="flex space-x-3">
          <div class="flex-1 h-12 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
          <div class="flex-1 h-12 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
        </div>
      </div>
    </div>
  `;
}

// Tombol tutup overlay detail
txDetailClose.addEventListener("click", () => {
  txDetailLayout.classList.add("hidden");
});

// ==================== SEARCH DENGAN EFEK ====================
searchInput?.addEventListener("input", e => {
  const keyword = e.target.value.toLowerCase();
  searchWrapper.classList.add('search-focused');
  
  if (keyword.length === 0) {
    // Jika kosong, kembali normal
    searchWrapper.classList.remove('search-focused', 'search-no-results');
    renderMenu(menus);
    return;
  }
  
  const filteredMenus = menus.filter(m => m.name.toLowerCase().includes(keyword));
  
  if (filteredMenus.length === 0) {
    // Jika tidak ada hasil
    searchWrapper.classList.remove('search-focused');
    searchWrapper.classList.add('search-no-results');
  } else {
    // Jika ada hasil
    searchWrapper.classList.remove('search-no-results');
    searchWrapper.classList.add('search-focused');
  }
  
  renderMenu(filteredMenus);
});

searchInput?.addEventListener("blur", () => {
  setTimeout(() => {
    if (searchInput.value.length === 0) {
      searchWrapper.classList.remove('search-focused', 'search-no-results');
    }
  }, 200);
});

// ==================== OPEN LAYOUT ====================
gfBtn.addEventListener("click",()=>{ gfLoading.classList.remove("hidden"); setTimeout(()=>{gfLoading.classList.add("hidden"); gfLayout.classList.remove("hidden"); renderMenu(menus); startCarousel();},1000); });
gfClose.addEventListener("click",()=>gfLayout.classList.add("hidden"));


// ==================== PROMO FILTER ====================
document.getElementById("promo-btn").addEventListener("click", () => {
  document.querySelectorAll(".category-btn").forEach(b => b.classList.remove("active"));
  renderMenu(menus.filter(m => m.discount > 0));
});

// Dark mode support
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark');
}
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    if (event.matches) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
});
