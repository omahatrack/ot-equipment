'use client';
export default function AttachmentManager({attachment,serviceDate}){
  return <details className="attachmentManage">
    <summary>Manage</summary>
    <form action={`/api/service-attachments/${attachment.id}/manage`} method="post" encType="multipart/form-data" className="attachmentForm compactAttachmentForm">
      <label>Document Name</label>
      <input name="displayName" defaultValue={attachment.displayName} required/>
      <label>Document Type</label><select name="documentType" defaultValue={attachment.documentType||'Other'}><option>Invoice</option><option>Service Record</option><option>Inspection</option><option>Warranty</option><option>Manual</option><option>Photo</option><option>Other</option></select><label>Notes <span className="muted">(optional)</span></label>
      <input name="notes" defaultValue={attachment.notes||''} placeholder="Invoice #, vendor, work order, etc."/>
      <label>Replace File <span className="muted">(optional)</span></label>
      <input name="attachment" type="file" accept="application/pdf,image/jpeg,image/png,image/webp"/>
      <div className="muted">Service date: {new Date(serviceDate).toLocaleDateString()} — change this with Edit Service Record.</div>
      <button className="btn small primary">Save Attachment</button>
    </form>
  </details>
}
