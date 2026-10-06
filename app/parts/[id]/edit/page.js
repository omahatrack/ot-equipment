import AppShell from '../../../../components/AppShell';
import DeleteButton from '../../../../components/DeleteButton';
import {prisma} from '../../../../lib/prisma';
import {sql} from '../../../../lib/db';
import {getCurrentUser} from '../../../../lib/session';
import {notFound,redirect} from 'next/navigation';
export const dynamic='force-dynamic';

export default async function EditPart({params,searchParams}){
  const id=Number(params.id),user=await getCurrentUser();
  if(!user)redirect('/');
  if(user.role.name!=='Admin')redirect(`/parts/${id}`);

  const p=await prisma.part.findUnique({where:{id},include:{
    crossReferences:true,
    locationStock:{where:{locationId:user.locationId}},
    equipmentParts:{where:{equipment:{locationId:user.locationId}},include:{equipment:true}},
    vendorParts:{include:{vendor:true},orderBy:[{isPreferred:'desc'},{vendor:{name:'asc'}}]}
  }});
  if(!p)notFound();

  const [equipment,vendors,costRows]=await Promise.all([
    prisma.equipment.findMany({where:{locationId:user.locationId,status:{not:'ARCHIVED'}},orderBy:{code:'asc'}}),
    prisma.vendor.findMany({orderBy:{name:'asc'}}),
    sql('SELECT defaultCost FROM Part WHERE id=? LIMIT 1',[id])
  ]);
  const defaultCost=costRows?.[0]?.defaultCost==null?'':Number(costRows[0].defaultCost).toFixed(2);
  const inv=p.locationStock[0];
  const newVendorId=Number(searchParams?.newVendor||0)||null;

  return <AppShell title={`Edit ${p.internalPartNumber}`} active="Parts">
    <div className="detailToolbar"><a className="btn" href={`/parts/${p.id}`}>← Part Detail</a></div>
    <div className="editGrid">
      <section className="card"><h2>Part Information</h2><form action={`/api/parts/${p.id}`} method="post" className="formgrid">
        <input type="hidden" name="action" value="update"/>
        <div className="field"><label>Part Number</label><input name="internalPartNumber" defaultValue={p.internalPartNumber} required/></div>
        <div className="field"><label>Description</label><input name="name" defaultValue={p.name} required/></div>
        <div className="field"><label>Unit of Measure</label><input name="unitOfMeasure" defaultValue={p.unitOfMeasure}/></div>
        <div className="field"><label>Bin / Shelf</label><input name="binLocation" defaultValue={p.binLocation||''}/></div>
        <div className="field"><label>Default Unit Cost</label><input name="defaultCost" type="number" min="0" step="0.01" defaultValue={defaultCost} placeholder="0.00"/></div>
        <div className="field"><label>Keep On Hand — {user.location.name}</label><input name="keepOnHand" type="number" min="0" defaultValue={inv?.keepOnHand??1}/></div>
        <div className="field"><label>Reorder When Below</label><input name="reorderWhenBelow" type="number" min="0" defaultValue={inv?.reorderWhenBelow??1}/></div>
        <div className="field full"><button className="btn primary">Save Part</button></div>
      </form></section>

      <section className="card"><h2>Cross References</h2>
        {p.crossReferences.map(x=><form key={x.id} action={`/api/parts/${p.id}`} method="post" className="xrefRow"><input type="hidden" name="action" value="xref-update"/><input type="hidden" name="xrefId" value={x.id}/><input name="brand" defaultValue={x.brand||''} placeholder="Brand"/><input name="number" defaultValue={x.number} placeholder="Number" required/><select name="type" defaultValue={x.type}><option value="aftermarket">Aftermarket</option><option value="OEM">OEM</option></select><label className="checkLabel"><input type="checkbox" name="isPreferred" value="1" defaultChecked={x.isPreferred}/> Preferred</label><button className="btn">Save</button><DeleteButton url={`/api/parts/${p.id}?xrefId=${x.id}`} label="Remove" confirmText="Remove this cross reference?"/></form>)}
        <form action={`/api/parts/${p.id}`} method="post" className="formgrid inlineForm"><input type="hidden" name="action" value="xref-add"/><div className="field"><label>Brand</label><input name="brand"/></div><div className="field"><label>Number</label><input name="number" required/></div><div className="field"><label>Type</label><select name="type"><option value="aftermarket">Aftermarket</option><option value="OEM">OEM</option></select></div><div className="field"><label><input type="checkbox" name="isPreferred" value="1"/> Preferred</label></div><div className="field full"><button className="btn">+ Add Cross Reference</button></div></form>
      </section>

      <section className="card"><h2>Linked Equipment — {user.location.name}</h2>
        {p.equipmentParts.map(ep=><div className="serviceRow" key={ep.id}><div><b>{ep.equipment.code}</b><div className="muted">{ep.equipment.displayName||'Equipment'} • {ep.partRole||'General'} • Qty {ep.qtyRequired}</div></div><form action={`/api/parts/${p.id}/fitments`} method="post"><input type="hidden" name="action" value="remove"/><input type="hidden" name="equipmentPartId" value={ep.id}/><button className="btn danger">Remove</button></form></div>)}
        <form action={`/api/parts/${p.id}/fitments`} method="post" className="formgrid inlineForm"><div className="field"><label>Equipment</label><select name="equipmentId">{equipment.map(e=><option key={e.id} value={e.id}>{e.code} — {e.displayName||'Equipment'}</option>)}</select></div><div className="field"><label>Role</label><input name="partRole" placeholder="Oil, Fuel, Air..."/></div><div className="field"><label>Qty Required</label><input name="qtyRequired" type="number" min="1" defaultValue="1"/></div><div className="field"><button className="btn" style={{marginTop:20}}>+ Link Equipment</button></div></form>
      </section>

      <section className="card"><h2>Vendor Sources</h2><p className="muted">Edit an existing source below whenever price, link, vendor part number, or preferred status changes.</p>
        {p.vendorParts.map(vp=><form action={`/api/parts/${p.id}/vendor`} method="post" className="formgrid vendorEditRow" key={vp.id}>
          <input type="hidden" name="vendorId" value={vp.vendorId}/>
          <div className="field"><label>Vendor</label><input value={vp.vendor.name} readOnly/></div>
          <div className="field"><label>Vendor Part #</label><input name="vendorPartNumber" defaultValue={vp.vendorPartNumber||''}/></div>
          <div className="field"><label>Unit Price</label><input name="price" type="number" min="0" step="0.01" defaultValue={vp.price??''}/></div>
          <div className="field"><label>Purchase URL</label><input name="purchaseUrl" type="url" defaultValue={vp.purchaseUrl||''}/></div>
          <div className="field"><label><input type="checkbox" name="isPreferred" value="1" defaultChecked={vp.isPreferred}/> Preferred Vendor</label></div>
          <div className="field"><button className="btn" style={{marginTop:20}}>Update Source</button></div>
        </form>)}

        <h3 style={{marginTop:22}}>Add Vendor Source</h3>
        <form action={`/api/parts/${p.id}/vendor`} method="post" className="formgrid inlineForm">
          <div className="field"><label>Vendor</label><select name="vendorId" defaultValue={newVendorId||vendors[0]?.id}>{vendors.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
          <div className="field"><label>Vendor Part #</label><input name="vendorPartNumber"/></div>
          <div className="field"><label>Unit Price</label><input name="price" type="number" min="0" step="0.01"/></div>
          <div className="field"><label>Purchase URL</label><input name="purchaseUrl" type="url"/></div>
          <div className="field"><label><input type="checkbox" name="isPreferred" value="1"/> Preferred Vendor</label></div>
          <div className="field"><button className="btn" style={{marginTop:20}}>Save Vendor Source</button></div>
        </form>

        <details className="quickCreate" open={!!newVendorId}><summary>+ New Vendor</summary>
          <form action="/api/vendors" method="post" className="formgrid inlineForm" style={{marginTop:12}}>
            <input type="hidden" name="returnTo" value={`/parts/${p.id}/edit`}/>
            <div className="field"><label>Vendor Name</label><input name="name" required/></div>
            <div className="field"><label>Lead Time Days</label><input name="leadTimeDays" type="number" min="0"/></div>
            <div className="field full"><label>Contact / Notes</label><input name="contactInfo"/></div>
            <div className="field full"><button className="btn">Create Vendor & Return to Part</button></div>
          </form>
        </details>
      </section>
    </div>
  </AppShell>;
}
