'use client';
export default function ServiceAttachmentForm({serviceRecordId}){
  return <details className="attachmentAdd">
    <summary className="attachmentUploadTrigger">+ Upload Service Document</summary>
    <form action={`/api/service-records/${serviceRecordId}/attachments`} method="post" encType="multipart/form-data" className="attachmentForm">
      <label>Document Name</label>
      <input name="displayName" placeholder="e.g. 500-Hour Service Invoice" required/>
      <label>Document Type</label><select name="documentType" defaultValue="Other"><option>Invoice</option><option>Service Record</option><option>Inspection</option><option>Warranty</option><option>Manual</option><option>Photo</option><option>Other</option></select><label>File</label>
      <input name="attachment" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required/>
      <label>Document Notes <span className="muted">(optional)</span></label>
      <input name="attachmentNotes" placeholder="Invoice #, work order, vendor, etc."/>
      <button className="btn small primary">Upload Document</button>
    </form>
  </details>
}
