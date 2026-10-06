'use client';
import {useState} from 'react';
export default function ServiceRecordForm({equipmentId,intervalId,currentHours,parts=[],intervals=null}){
  const [open,setOpen]=useState(false);
  const [selected,setSelected]=useState({});
  function toggle(id){setSelected(s=>({...s,[id]:!s[id]}))}
  const today=new Date().toISOString().slice(0,10);
  return <form action="/api/service-records" method="post" encType="multipart/form-data" className="serviceRecordForm">
    <input type="hidden" name="equipmentId" value={equipmentId}/>{intervals?<div><label>Service Type</label><select name="intervalId" defaultValue={intervalId||0}><option value="0">General Service / Document Only</option>{intervals.map(i=><option key={i.id} value={i.id}>{i.description}</option>)}</select></div>:<input type="hidden" name="intervalId" value={intervalId}/> }
    <div className="costGrid"><div><label>Service Date</label><input name="serviceDate" type="date" defaultValue={today} required/></div><div><label>Hours</label><input name="hoursAtService" type="number" step="0.1" min="0" defaultValue={currentHours} required/></div></div>
    <label>Parts Used <span className="muted">(optional)</span></label>
    <button type="button" className="btn" onClick={()=>setOpen(true)}>Select Equipment Parts {Object.values(selected).filter(Boolean).length?`(${Object.values(selected).filter(Boolean).length})`:''}</button>
    {parts.filter(p=>selected[p.id]).map(p=><input key={`hidden-${p.id}`} type="hidden" name="partId" value={p.id}/>) }
    <div className="selectedPartsSummary">{parts.filter(p=>selected[p.id]).map(p=><span key={p.id} className="accessChip">{p.number} × <input aria-label={`Quantity for ${p.number}`} name={`qty_${p.id}`} type="number" min="1" defaultValue="1"/></span>)}</div>
    <div className="costGrid"><div><label>Parts Cost <span className="muted">(manual / invoice)</span></label><input name="manualPartsCost" type="number" min="0" step="0.01" defaultValue="0"/><small className="muted">Use only for parts cost not already captured by selected inventory parts.</small></div><div><label>Labor Cost</label><input name="laborCost" type="number" min="0" step="0.01" defaultValue="0"/></div></div>
    <div className="costGrid"><div><label>Outside / Repair Cost</label><input name="externalCost" type="number" min="0" step="0.01" defaultValue="0"/></div><div></div></div>
    <textarea name="notes" rows="2" placeholder="Service notes (optional)"/>
    <details className="serviceAttachmentEntry"><summary>Attach service document <span className="muted">(optional)</span></summary><div className="attachmentForm"><label>Document Name</label><input name="attachmentName" placeholder="e.g. 500-Hour Service Invoice"/><label>Document Type</label><select name="attachmentType" defaultValue="Other"><option>Invoice</option><option>Service Record</option><option>Inspection</option><option>Warranty</option><option>Manual</option><option>Photo</option><option>Other</option></select><label>PDF / Image</label><input name="attachment" type="file" accept="application/pdf,image/jpeg,image/png,image/webp"/><label>Document Notes <span className="muted">(optional)</span></label><input name="attachmentNotes" placeholder="Invoice #, work order, vendor, etc."/></div></details>
    <button className="btn primary">Record Service</button>
    {open?<div className="modalBackdrop" onMouseDown={()=>setOpen(false)}><div className="modalCard" onMouseDown={e=>e.stopPropagation()}><div className="toolbar"><div><h2 style={{margin:0}}>Parts Used</h2><div className="muted">Only parts linked to this equipment are shown.</div></div><button type="button" className="btn" onClick={()=>setOpen(false)}>Done</button></div><div className="partPicker">{parts.length?parts.map(p=><label className="partPickRow" key={p.id}><input type="checkbox" checked={!!selected[p.id]} onChange={()=>toggle(p.id)}/><span><b>{p.number}</b><small>{p.name}{p.role?` • ${p.role}`:''}</small></span><span className={p.onHand<1?'stockWarn':''}>On hand: {p.onHand}</span></label>):<div className="emptyCell">No parts are linked to this equipment yet.</div>}</div></div></div>:null}
  </form>
}
