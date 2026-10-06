import AppShell from '../../../components/AppShell';
import DeleteButton from '../../../components/DeleteButton';
import {prisma} from '../../../lib/prisma';
import {sql} from '../../../lib/db';
import {getCurrentUser} from '../../../lib/session';
import {notFound} from 'next/navigation';
export const dynamic='force-dynamic';

export default async function VendorDetail({params}){
  const id=Number(params.id),user=await getCurrentUser();
  const [vendor,parts,history]=await Promise.all([
    prisma.vendor.findUnique({where:{id},include:{vendorParts:{include:{part:true},orderBy:{part:{internalPartNumber:'asc'}}}}}),
    prisma.part.findMany({orderBy:{internalPartNumber:'asc'}}),
    sql(`SELECT h.id,h.vendorPartId,h.price,h.recordedAt,u.name AS recordedBy FROM VendorPriceHistory h LEFT JOIN User u ON u.id=h.recordedById JOIN VendorPart vp ON vp.id=h.vendorPartId WHERE vp.vendorId=? ORDER BY h.recordedAt DESC LIMIT 30`,[id])
  ]);
  if(!vendor)notFound();
  const admin=user?.role?.name==='Admin';

  return <AppShell title={`${vendor.name} — Vendor`} active="Vendors">
    <div className="detailToolbar"><a className="btn" href="/vendors">← Vendors</a></div>
    <div className="moduleGrid">
      <section className="card"><h2>Vendor Information</h2>{admin?<form action={`/api/vendors/${id}`} method="post" className="formgrid"><div className="field full"><label>Name</label><input name="name" defaultValue={vendor.name} required/></div><div className="field full"><label>Contact / Notes</label><textarea name="contactInfo" rows="4" defaultValue={vendor.contactInfo||''}/></div><div className="field"><label>Lead Time Days</label><input name="leadTimeDays" type="number" min="0" defaultValue={vendor.leadTimeDays??''}/></div><div className="field"><button className="btn primary" style={{marginTop:20}}>Save Vendor</button></div></form>:<p>{vendor.contactInfo||'No contact information.'}</p>}</section>
      {admin?<section className="card"><h2>Link / Price a Part</h2><form action={`/api/vendors/${id}/parts`} method="post" className="formgrid"><div className="field full"><label>Part</label><select name="partId">{parts.map(p=><option key={p.id} value={p.id}>{p.internalPartNumber} — {p.name}</option>)}</select></div><div className="field"><label>Vendor Part #</label><input name="vendorPartNumber"/></div><div className="field"><label>Price</label><input name="price" type="number" min="0" step="0.01"/></div><div className="field full"><label>Purchase URL</label><input name="purchaseUrl" type="url" placeholder="https://..."/></div><div className="field"><label><input name="isPreferred" type="checkbox" value="1"/> Preferred vendor</label></div><div className="field"><button className="btn primary">Save Part</button></div></form></section>:null}
    </div>

    <section className="card" style={{marginTop:18}}><h2>Vendor Parts</h2><p className="muted">Update price, purchase link, part number, or preferred status directly in the row. Price changes are preserved in Price History.</p><div className="tablewrap"><table><thead><tr><th>OTE Part</th><th>Vendor Part #</th><th>Price</th><th>Purchase URL</th><th>Preferred</th><th>Updated</th><th>Actions</th></tr></thead><tbody>
      {vendor.vendorParts.length?vendor.vendorParts.map(vp=><tr key={vp.id}>
        <td><a className="tableLink" href={`/parts/${vp.partId}`}>{vp.part.internalPartNumber}</a><div className="muted">{vp.part.name}</div></td>
        {admin?<>
          <td colSpan="4"><form id={`vp-${vp.id}`} action={`/api/vendors/${id}/parts`} method="post" className="vendorInlineForm"><input type="hidden" name="partId" value={vp.partId}/><input name="vendorPartNumber" defaultValue={vp.vendorPartNumber||''} placeholder="Vendor part #"/><input name="price" type="number" min="0" step="0.01" defaultValue={vp.price??''} placeholder="Price"/><input name="purchaseUrl" type="url" defaultValue={vp.purchaseUrl||''} placeholder="https://..."/><label className="checkLabel"><input name="isPreferred" type="checkbox" value="1" defaultChecked={vp.isPreferred}/> Preferred</label></form></td>
          <td>{vp.lastPriceUpdate?new Date(vp.lastPriceUpdate).toLocaleDateString():'—'}</td>
          <td><div className="rowActions"><button form={`vp-${vp.id}`} className="btn small">Save</button>{vp.purchaseUrl?<a className="btn small" href={vp.purchaseUrl} target="_blank" rel="noreferrer">Open</a>:null}<DeleteButton url={`/api/vendors/${id}/parts?partId=${vp.partId}`} label="Unlink" confirmText="Unlink this vendor from the part? This also removes its price history."/></div></td>
        </>:<>
          <td>{vp.vendorPartNumber||'—'}</td><td>{vp.price!=null?`$${vp.price.toFixed(2)}`:'—'}</td><td>{vp.purchaseUrl?<a className="btn small" href={vp.purchaseUrl} target="_blank" rel="noreferrer">Open</a>:'—'}</td><td>{vp.isPreferred?'Yes':'—'}</td><td>{vp.lastPriceUpdate?new Date(vp.lastPriceUpdate).toLocaleDateString():'—'}</td><td></td>
        </>}
      </tr>):<tr><td colSpan="7" className="emptyCell">No parts linked to this vendor yet.</td></tr>}
    </tbody></table></div></section>

    <section className="card" style={{marginTop:18}}><h2>Recent Price History</h2><div className="tablewrap"><table><thead><tr><th>Date</th><th>Vendor Part Link</th><th>Price</th><th>Recorded By</th></tr></thead><tbody>{history.length?history.map(h=><tr key={h.id}><td>{new Date(h.recordedAt).toLocaleDateString()}</td><td>#{h.vendorPartId}</td><td>${Number(h.price).toFixed(2)}</td><td>{h.recordedBy||'System'}</td></tr>):<tr><td colSpan="4" className="emptyCell">No price changes recorded yet.</td></tr>}</tbody></table></div></section>
  </AppShell>;
}
