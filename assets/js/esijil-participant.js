/* STRAVA eSIJIL Fasa 3D — restricted client. No Drive URL exposed. */
'use strict';
(() => {
  const $ = (id) => document.getElementById(id);
  const bridge = window.stravaEsijilBridge;
  let pin = '';
  let catalog = [];
  let owner = '';
  let generation = 0;
  let busy = false;
  let pdfUrl = '';
  let pdfName = '';
  const status = (text) => { $('esijil-status').textContent = text; };
  const error = (text='') => { $('esijil-error').textContent=text; $('esijil-error').hidden=!text; };
  function clearPdf() {
    $('esijil-pdf-frame').removeAttribute('src');
    $('esijil-pdf-frame').hidden=true;
    $('esijil-pdf-download').disabled=true;
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    pdfUrl=''; pdfName='';
  }
  function reset() {
    generation++; pin=''; owner=''; catalog=[]; busy=false;
    $('esijil-pin').value=''; $('esijil-check').disabled=false;
    $('esijil-list').replaceChildren();
    clearPdf(); if ($('esijil-pdf-dialog').open) $('esijil-pdf-dialog').close();
    status('Sila sahkan PIN untuk menyemak sijil.'); error();
  }
  function onOpen() {
    if (bridge?.getCode() !== owner) reset();
    // A fresh verification is required on every entry to prevent stale release state.
    if (catalog.length) { catalog=[]; pin=''; $('esijil-list').replaceChildren(); status('Sila sahkan PIN semula untuk status terkini.'); }
  }
  function certKey(c) { return c.type + ':' + (c.rank ?? ''); }
  function render(certs) {
    const list=$('esijil-list');list.replaceChildren();
    for (const c of certs) {
      const card=document.createElement('article');card.className='esijil-card';
      const h=document.createElement('h3');h.textContent=c.label;
      const b=document.createElement('button');b.className='primary';b.type='button';b.textContent='LIHAT SIJIL';
      b.addEventListener('click',()=>openPdf(c));
      card.append(h,b);list.append(card);
    }
  }
  function failMessage(result) {
    const msg=String(result?.error || result?.message || '');
    if (/belum dibuka|belum_dibuka/i.test(msg)) return 'Akses eSIJIL belum dibuka oleh urusetia.';
    if (/pin|kod peserta|aktif|auth/i.test(msg)) return 'PIN tidak sah atau akaun tidak aktif.';
    if (/action tidak sah/i.test(msg)) return 'Fungsi eSIJIL belum tersedia pada server.';
    return 'Permintaan tidak berjaya. Sila cuba semula.';
  }
  $('esijil-pin-form').addEventListener('submit',async(event)=>{
    event.preventDefault();
    if (busy || !bridge?.getCode()) return;
    const entered=$('esijil-pin').value.trim();$('esijil-pin').value='';
    if (!/^\d{4}$/.test(entered)) {error('PIN mesti 4 digit.');return;}
    const code=bridge.getCode(), seq=++generation;
    pin=''; catalog=[];owner='';$('esijil-list').replaceChildren();error();
    busy=true;$('esijil-check').disabled=true;status('Menyemak sijil...');
    try {
      const response=await bridge.request({action:'participant_esijil_list',kod_peserta:code,pin:entered});
      if(seq!==generation || bridge.getCode()!==code) return;
      if(response.ok!==true) throw new Error(failMessage(response));
      const data=response.data;
      if(!data || typeof data.released!=='boolean'|| !Array.isArray(data.certificates)) throw new Error('Respons eSIJIL tidak sah.');
      if(!data.released) { status('eSIJIL belum dibuka oleh urusetia.');return; }
      const certs=data.certificates;
      if(certs.some(c => !c || !['FINISHER','TOP5_LELAKI','TOP5_WANITA'].includes(c.type) || c.available!==true || typeof c.label!=='string' || (c.type!=='FINISHER' && (!Number.isInteger(c.rank)||c.rank<1||c.rank>5)))) throw new Error('Data sijil tidak sah.');
      pin=entered;owner=code;catalog=certs;
      status(certs.length ? `${certs.length} sijil tersedia.` : 'Sijil anda belum tersedia. Sila semak selepas Autocrat selesai.');
      render(certs);
      bridge.refreshSession();
    } catch(e){if(seq===generation){pin='';error(e.message || 'Gagal menyemak eSIJIL.');status('Semakan tidak berjaya.');}}
    finally{if(seq===generation){busy=false;$('esijil-check').disabled=false;}}
  });
  function bytesFromBase64(input) {
    if(typeof input!=='string'||input.length>7_100_000||!/^[A-Za-z0-9+/]*={0,2}$/.test(input)) throw new Error('Data PDF tidak sah.');
    const binary=atob(input), parts=[];
    for(let i=0;i<binary.length;i+=65536){const part=binary.slice(i,i+65536);const bytes=new Uint8Array(part.length);for(let j=0;j<part.length;j++) bytes[j]=part.charCodeAt(j);parts.push(bytes);}
    return new Blob(parts,{type:'application/pdf'});
  }
  async function openPdf(cert) {
    if(busy||!pin||owner!==bridge?.getCode()||!catalog.some(c=>certKey(c)===certKey(cert))) return;
    const code=owner, seq=++generation;
    busy=true;$('esijil-check').disabled=true;error();
    clearPdf();$('esijil-pdf-status').textContent='Memuatkan PDF daripada server...';
    $('esijil-pdf-dialog').showModal();
    try {
      const result=await bridge.request({action:'participant_esijil_pdf',kod_peserta:code,pin,certificate_type:cert.type,...(cert.type==='FINISHER'?{}:{rank:cert.rank})});
      if(seq!==generation||bridge.getCode()!==code)return;
      if(result.ok!==true)throw new Error(failMessage(result));
      const data=result.data;
      if(!data||data.mime_type!=='application/pdf'||data.type!==cert.type|| (cert.type!=='FINISHER'&&data.rank!==cert.rank)||typeof data.filename!=='string')throw new Error('Respons sijil tidak sah.');
      const blob=bytesFromBase64(data.pdf_base64);
      if(blob.size<5||blob.size>5*1024*1024)throw new Error('Saiz PDF tidak sah.');
      pdfName=data.filename.replace(/[^A-Za-z0-9._-]/g,'_');
      pdfUrl=URL.createObjectURL(blob);
      $('esijil-pdf-frame').src=pdfUrl;$('esijil-pdf-frame').hidden=false;
      $('esijil-pdf-download').disabled=false;
      $('esijil-pdf-status').textContent='PDF tersedia untuk dilihat atau dimuat turun.';
      bridge.refreshSession();
    }catch(e){if(seq===generation){$('esijil-pdf-status').textContent=e.message||'PDF gagal dimuatkan.';}}
    finally{if(seq===generation){busy=false;$('esijil-check').disabled=false;}}
  }
  $('esijil-pdf-download').addEventListener('click',()=>{
    if(!pdfUrl || !owner || bridge?.getCode()!==owner)return;
    const a=document.createElement('a');a.href=pdfUrl;a.download=pdfName||'sijil.pdf';
    document.body.append(a);a.click();a.remove();
  });
  $('esijil-pdf-close').addEventListener('click',()=> $('esijil-pdf-dialog').close());
  $('esijil-pdf-dialog').addEventListener('close',clearPdf);
  window.stravaEsijil=Object.freeze({onOpen,reset});
})();
