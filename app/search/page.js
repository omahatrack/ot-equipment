import Link from 'next/link';
import AppShell from '../../components/AppShell';
import {getCurrentUser} from '../../lib/session';
import {sql} from '../../lib/db';
export const dynamic='force-dynamic';
function like(q){return `%${q}%`}
export default async function SearchPage({searchParams}){
  const user=await getCurrentUser(); const q=String(searchParams?.q||'').trim(); const role=user.role.name; const loc=Number(user.locationId); const results={equipment:[],parts:[],vendors:[],service:[],documents:[],notes:[]};
  if(q.length>=2){const p=like(q);
    results.equipment=await sql(`SELECT id,code,displayName,status,currentHours FROM Equipment WHERE locationId=? AND UPPER(TRIM(status))<>'ARCHIVED' AND (code LIKE ? OR COALESCE(displayName,'') LIKE ?) ORDER BY code LIMIT 30`,[loc,p,p]);
    if(role==='Admin'||role==='Scale House')results.parts=await sql(`SELECT p.id,p.internalPartNumber,p.name,COALESCE(i.onHand,0) onHand FROM Part p LEFT JOIN PartLocationInventory i ON i.partId=p.id AND i.locationId=? WHERE p.internalPartNumber LIKE ? OR p.name LIKE ? OR EXISTS(SELECT 1 FROM PartCrossReference x WHERE x.partId=p.id AND (x.number LIKE ? OR COALESCE(x.brand,'') LIKE ?)) ORDER BY p.internalPartNumber LIMIT 40`,[loc,p,p,p,p]);
    if(role==='Admin')results.vendors=await sql(`SELECT v.id,v.name,v.contactInfo FROM Vendor v WHERE v.name LIKE ? OR COALESCE(v.contactInfo,'') LIKE ? ORDER BY v.name LIMIT 25`,[p,p]);
    if(role==='Admin'||role==='Mechanic'){
      results.service=await sql(`SELECT r.id,r.equipmentId,e.code,r.serviceDate,r.hoursAtService,r.notes,COALESCE(si.description,'General Service') serviceName,u.name performedBy FROM ServiceRecord r JOIN Equipment e ON e.id=r.equipmentId LEFT JOIN ServiceInterval si ON si.id=r.intervalId LEFT JOIN User u ON u.id=r.performedById WHERE e.locationId=? AND (e.code LIKE ? OR COALESCE(si.description,'') LIKE ? OR COALESCE(r.notes,'') LIKE ? OR COALESCE(u.name,'') LIKE ?) ORDER BY r.serviceDate DESC LIMIT 30`,[loc,p,p,p,p]);
      results.documents=await sql(`SELECT a.id,a.displayName,a.fileName,a.notes,a.uploadedAt,r.equipmentId,e.code,r.serviceDate FROM ServiceAttachment a JOIN ServiceRecord r ON r.id=a.serviceRecordId JOIN Equipment e ON e.id=r.equipmentId WHERE e.locationId=? AND (a.displayName LIKE ? OR a.fileName LIKE ? OR COALESCE(a.notes,'') LIKE ? OR e.code LIKE ?) ORDER BY a.uploadedAt DESC LIMIT 30`,[loc,p,p,p,p]);
    }
    if(role==='Admin')results.notes=await sql(`SELECT n.id,n.title,n.body,n.equipmentId,e.code FROM Note n LEFT JOIN Equipment e ON e.id=n.equipmentId WHERE (n.equipmentId IS NULL OR e.locationId=?) AND (n.title LIKE ? OR n.body LIKE ?) ORDER BY n.createdAt DESC LIMIT 25`,[loc,p,p]);
  }
  const count=Object.values(results).reduce((n,a)=>n+a.length,0);
  return <AppShell title="Global Search" active="Search"><div className="searchPage"><form className="globalSearchHero" action="/search"><input autoFocus name="q" defaultValue={q} placeholder="Search equipment, parts, vendors, service, documents..."/><button className="btn primary">Search</button></form>{q&&q.length<2?<div className="card emptyCell">Enter at least 2 characters.</div>:null}{q.length>=2?<div className="searchSummary">{count} result{count===1?'':'s'} for <b>“{q}”</b> at {user.location?.name}</div>:null}
  {results.equipment.length?<section className="card searchGroup"><h2>Equipment</h2>{results.equipment.map(x=><Link className="searchResult" href={`/equipment/${x.id}`} key={x.id}><b>{x.code}</b><span>{x.displayName||'Equipment'} • {x.status.replaceAll('_',' ')}</span></Link>)}</section>:null}
  {results.parts.length?<section className="card searchGroup"><h2>Parts</h2>{results.parts.map(x=><Link className="searchResult" href={`/parts/${x.id}`} key={x.id}><b>{x.internalPartNumber}</b><span>{x.name} • On hand {x.onHand}</span></Link>)}</section>:null}
  {results.vendors.length?<section className="card searchGroup"><h2>Vendors</h2>{results.vendors.map(x=><Link className="searchResult" href={`/vendors/${x.id}`} key={x.id}><b>{x.name}</b><span>{x.contactInfo||'Vendor'}</span></Link>)}</section>:null}
  {results.service.length?<section className="card searchGroup"><h2>Service Records</h2>{results.service.map(x=><Link className="searchResult" href={`/equipment/${x.equipmentId}`} key={x.id}><b>{x.code} — {x.serviceName}</b><span>{new Date(x.serviceDate).toLocaleDateString()} • {Number(x.hoursAtService).toLocaleString()} hrs • {x.performedBy||'Unknown'}</span></Link>)}</section>:null}
  {results.documents.length?<section className="card searchGroup"><h2>Service Documents</h2>{results.documents.map(x=><div className="searchResult" key={x.id}><a href={`/api/service-attachments/${x.id}`} target="_blank" rel="noreferrer"><b>{x.displayName}</b></a><span>{x.code} • service {new Date(x.serviceDate).toLocaleDateString()} • uploaded {new Date(x.uploadedAt).toLocaleDateString()}</span></div>)}</section>:null}
  {results.notes.length?<section className="card searchGroup"><h2>General Reference</h2>{results.notes.map(x=><Link className="searchResult" href="/general-ref" key={x.id}><b>{x.title}</b><span>{x.code?`${x.code} • `:''}{String(x.body).slice(0,130)}</span></Link>)}</section>:null}
  {q.length>=2&&count===0?<div className="card emptyCell">No matches found at this location.</div>:null}</div></AppShell>;
}
