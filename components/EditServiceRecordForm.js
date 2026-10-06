'use client';
import {useState} from 'react';

function isoDate(value){
  const d=new Date(value);
  if(Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0,10);
}

export default function EditServiceRecordForm({record,intervals=[]}){
  const [open,setOpen]=useState(false);
  if(!record) return null;
  return <>
    <button type="button" className="btn serviceEditBtn" onClick={()=>setOpen(true)}>Edit</button>
    {open?<div className="modalBackdrop" onMouseDown={()=>setOpen(false)}>
      <div className="modalCard" onMouseDown={e=>e.stopPropagation()}>
        <div className="toolbar">
          <div><h2 style={{margin:0}}>Edit Service Record</h2><div className="muted">Correct service details without deleting the historical record.</div></div>
          <button type="button" className="btn" onClick={()=>setOpen(false)}>Cancel</button>
        </div>
        <form action={`/api/service-records/${record.id}`} method="post" className="serviceRecordForm" style={{marginTop:16}}>
          <div><label>Service Type</label><select name="intervalId" defaultValue={record.intervalId||0}><option value="0">General Service / Document Only</option>{intervals.map(i=><option key={i.id} value={i.id}>{i.description}</option>)}</select></div>
          <div className="costGrid">
            <div><label>Service Date</label><input name="serviceDate" type="date" defaultValue={isoDate(record.serviceDate)} required/></div>
            <div><label>Hours at Service</label><input name="hoursAtService" type="number" min="0" step="0.1" defaultValue={record.hoursAtService} required/></div>
          </div>
          <div className="costGrid">
            <div><label>Parts Cost <span className="muted">(manual / invoice)</span></label><input name="manualPartsCost" type="number" min="0" step="0.01" defaultValue={Number(record.manualParts||0).toFixed(2)}/><small className="muted">Use only for parts cost not already captured by inventory parts.</small></div>
            <div><label>Labor Cost</label><input name="laborCost" type="number" min="0" step="0.01" defaultValue={Number(record.labor||0).toFixed(2)}/></div>
          </div>
          <div className="costGrid">
            <div><label>Outside / Repair Cost</label><input name="externalCost" type="number" min="0" step="0.01" defaultValue={Number(record.external||0).toFixed(2)}/></div><div></div>
          </div>
          <div><label>Notes</label><textarea name="notes" rows="3" defaultValue={record.notes||''} placeholder="Service notes (optional)"/></div>
          <div className="noticeBox" style={{marginBottom:0}}><b>Parts Used are not changed here.</b> They are tied to inventory transactions and remain locked to preserve inventory history.</div>
          <button className="btn primary">Save Service Changes</button>
        </form>
      </div>
    </div>:null}
  </>;
}
