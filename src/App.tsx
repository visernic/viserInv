import React, { useState, useRef, useEffect } from 'react';
import './App.css';
// @ts-ignore
import html2pdf from 'html2pdf.js';

// --- Interfaces ---
interface InvoiceItem {
  id: number;
  desc: string;
  qty: number;
  rate: number;
}

interface InvoiceData {
  invNumber: string;
  date: string;
  dueDate: string;
  status: 'status-paid' | 'status-unpaid' | 'status-refunded';
  fromName: string;
  fromDetails: string;
  toName: string;
  toDetails: string;
  currency: string;
  taxLabel: string;
  taxRate: number;
  notes: string;
  brandColor: string;
  bgStyle: 'bg-plain' | 'bg-geometric' | 'bg-abstract';
  logoUrl: string | null;
  signatureUrl: string | null;
}

// --- Initial Data ---
const initialData: InvoiceData = {
  invNumber: '#INV-001',
  date: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  status: 'status-unpaid',
  fromName: 'Visernic Limited',
  fromDetails: '123 Business St, Tech City, 5000',
  toName: '',
  toDetails: '',
  currency: '$',
  taxLabel: 'Tax',
  taxRate: 0,
  notes: 'Thank you for your business.',
  brandColor: '#2563eb',
  bgStyle: 'bg-plain',
  logoUrl: null,
  signatureUrl: null
};

// --- Helper Component ---
const AccordionItem = ({ 
  title, 
  id, 
  activeId, 
  setActiveId, 
  children, 
  icon 
}: { 
  title: string, 
  id: string, 
  activeId: string | null, 
  setActiveId: (id: string | null) => void, 
  children: React.ReactNode, 
  icon: string 
}) => (
  <div className="accordion">
    <div className="accordion-header" onClick={() => setActiveId(activeId === id ? null : id)}>
      <span><i className={`fas ${icon}`}></i> {title}</span>
      <i className={`fas fa-chevron-${activeId === id ? 'up' : 'down'}`}></i>
    </div>
    {activeId === id && <div className="accordion-content">{children}</div>}
  </div>
);

function App() {
  const [data, setData] = useState<InvoiceData>(initialData);
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: Date.now(), desc: 'Web Development', qty: 1, rate: 500 }
  ]);
  const [activeAccordion, setActiveAccordion] = useState<string | null>('design');
  
  const previewRef = useRef<HTMLDivElement>(null);

  // --- Effects ---
  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', data.brandColor);
  }, [data.brandColor]);

  // --- Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'signatureUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setData(prev => ({ ...prev, [field]: ev.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Item Handlers ---
  const addItem = () => {
    setItems([...items, { id: Date.now(), desc: '', qty: 1, rate: 0 }]);
  };

  const updateItem = (id: number, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const deleteItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  // --- Calculations ---
  const subtotal = items.reduce((acc, item) => acc + (item.qty * item.rate), 0);
  const taxAmount = subtotal * (data.taxRate / 100);
  const total = subtotal + taxAmount;

  // --- PDF Download (FIXED TYPESCRIPT ERROR) ---
  const handleDownload = () => {
    const element = previewRef.current;
    if (!element) return;

    // 1. Temporarily remove styles that cause overflow/extra pages
    const originalShadow = element.style.boxShadow;
    const originalMinHeight = element.style.minHeight;
    const originalMargin = element.style.marginBottom;
    
    element.style.boxShadow = 'none';
    element.style.minHeight = 'auto'; 
    element.style.marginBottom = '0'; 

    const opt = {
      margin: 0,
      filename: `${data.invNumber || 'invoice'}.pdf`,
      // FIX: Added 'as const' to satisfy TypeScript strict types
      image: { type: 'jpeg' as const, quality: 0.98 }, 
      html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
      // FIX: Added 'as const' here as well
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const } 
    };

    html2pdf().set(opt).from(element).save().then(() => {
      // 2. Restore styles after download
      element.style.boxShadow = originalShadow;
      element.style.minHeight = originalMinHeight;
      element.style.marginBottom = originalMargin;
    });
  };

  return (
    <div className="app-container">
      {/* --- Sidebar --- */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2><i className="fas fa-file-invoice"></i> ViserInv</h2>
          <p style={{ fontSize: '0.8rem', color: '#666' }}>Professional React Invoice Maker</p>
        </div>

        <button className="btn btn-primary" onClick={handleDownload}>
           <i className="fas fa-download"></i> Download PDF
        </button>

        <AccordionItem title="Design & Branding" id="design" activeId={activeAccordion} setActiveId={setActiveAccordion} icon="fa-palette">
          <div className="form-group">
            <label>Brand Color</label>
            <input type="color" name="brandColor" className="form-control" value={data.brandColor} onChange={handleInputChange} style={{ height: '40px' }} />
          </div>
          <div className="form-group">
            <label>Background Style</label>
            <select name="bgStyle" className="form-control" value={data.bgStyle} onChange={handleInputChange}>
              <option value="bg-plain">Clean White</option>
              <option value="bg-geometric">Geometric Dots</option>
              <option value="bg-abstract">Modern Abstract</option>
            </select>
          </div>
          <div className="form-group">
            <label>Currency</label>
            <select name="currency" className="form-control" value={data.currency} onChange={handleInputChange}>
              <option value="$">USD ($)</option>
              <option value="৳">BDT (৳)</option>
              <option value="€">EUR (€)</option>
              <option value="£">GBP (£)</option>
              <option value="₹">INR (₹)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Upload Logo</label>
            <input type="file" accept="image/*" className="form-control" onChange={(e) => handleImageUpload(e, 'logoUrl')} />
          </div>
        </AccordionItem>

        <AccordionItem title="Invoice Info" id="info" activeId={activeAccordion} setActiveId={setActiveAccordion} icon="fa-info-circle">
          <div className="form-group">
            <label>Invoice Number</label>
            <input type="text" name="invNumber" className="form-control" value={data.invNumber} onChange={handleInputChange} />
          </div>
          <div className="form-group">
            <label>Date</label>
            <input type="date" name="date" className="form-control" value={data.date} onChange={handleInputChange} />
          </div>
          <div className="form-group">
            <label>Due Date</label>
            <input type="date" name="dueDate" className="form-control" value={data.dueDate} onChange={handleInputChange} />
          </div>
          <div className="form-group">
            <label>Payment Status</label>
            <select name="status" className="form-control" value={data.status} onChange={handleInputChange}>
              <option value="status-paid">Paid</option>
              <option value="status-unpaid">Unpaid</option>
              <option value="status-refunded">Refunded</option>
            </select>
          </div>
        </AccordionItem>

        <AccordionItem title="From (Company)" id="from" activeId={activeAccordion} setActiveId={setActiveAccordion} icon="fa-user-tie">
          <div className="form-group">
            <label>Company Name</label>
            <input type="text" name="fromName" className="form-control" value={data.fromName} onChange={handleInputChange} />
          </div>
          <div className="form-group">
            <label>Address / Details</label>
            <textarea name="fromDetails" className="form-control" rows={3} value={data.fromDetails} onChange={handleInputChange} />
          </div>
        </AccordionItem>

        <AccordionItem title="To (Client)" id="to" activeId={activeAccordion} setActiveId={setActiveAccordion} icon="fa-user">
          <div className="form-group">
            <label>Client Name</label>
            <input type="text" name="toName" className="form-control" placeholder="Client Name" value={data.toName} onChange={handleInputChange} />
          </div>
          <div className="form-group">
            <label>Address / Details</label>
            <textarea name="toDetails" className="form-control" rows={3} value={data.toDetails} onChange={handleInputChange} />
          </div>
        </AccordionItem>

        <AccordionItem title="Items" id="items" activeId={activeAccordion} setActiveId={setActiveAccordion} icon="fa-list">
          {items.map((item, index) => (
            <div key={item.id} className="item-row">
              <div className="item-row-header">
                <label>Item {index + 1}</label>
                <button className="btn btn-danger" onClick={() => deleteItem(item.id)}><i className="fas fa-trash"></i></button>
              </div>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Description" 
                value={item.desc} 
                onChange={(e) => updateItem(item.id, 'desc', e.target.value)} 
                style={{ marginBottom: '5px' }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="Qty" 
                  value={item.qty} 
                  onChange={(e) => updateItem(item.id, 'qty', parseFloat(e.target.value) || 0)} 
                />
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="Rate" 
                  value={item.rate} 
                  onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)} 
                />
              </div>
            </div>
          ))}
          <button className="btn btn-outline" onClick={addItem}><i className="fas fa-plus"></i> Add Item</button>
        </AccordionItem>

        <AccordionItem title="Tax & Discounts" id="tax" activeId={activeAccordion} setActiveId={setActiveAccordion} icon="fa-calculator">
          <div className="form-group">
            <label>Tax Label</label>
            <input type="text" name="taxLabel" className="form-control" value={data.taxLabel} onChange={handleInputChange} />
          </div>
          <div className="form-group">
            <label>Tax Rate (%)</label>
            <input type="number" name="taxRate" className="form-control" value={data.taxRate} onChange={handleInputChange} />
          </div>
        </AccordionItem>

        <AccordionItem title="Notes & Signature" id="notes" activeId={activeAccordion} setActiveId={setActiveAccordion} icon="fa-pen-nib">
          <div className="form-group">
            <label>Notes / Terms</label>
            <textarea name="notes" className="form-control" rows={3} value={data.notes} onChange={handleInputChange} />
          </div>
          <div className="form-group">
            <label>Upload Signature</label>
            <input type="file" accept="image/*" className="form-control" onChange={(e) => handleImageUpload(e, 'signatureUrl')} />
          </div>
        </AccordionItem>
      </aside>

      {/* --- Preview Area --- */}
      <main className="preview-area">
        <div id="invoice-preview" className={data.bgStyle} ref={previewRef}>
          <div className="inv-header">
            <div className="inv-logo">
              {data.logoUrl ? (
                <img src={data.logoUrl} alt="Logo" />
              ) : (
                <div style={{ fontWeight: 'bold', fontSize: '1.5rem', color: 'var(--primary-color)' }}>LOGO</div>
              )}
            </div>
            <div className="inv-title">
              <h1>INVOICE</h1>
              <div className={`status-badge ${data.status}`}>
                {data.status.replace('status-', '')}
              </div>
            </div>
          </div>

          <div className="inv-info">
            <div className="inv-col">
              <h4>Billed To:</h4>
              <p>{data.toName || 'Client Name'}</p>
              <p style={{ whiteSpace: 'pre-line', color: '#666' }}>{data.toDetails}</p>
            </div>
            <div className="inv-col" style={{ textAlign: 'right' }}>
              <h4>Billed From:</h4>
              <p>{data.fromName}</p>
              <p style={{ whiteSpace: 'pre-line', color: '#666' }}>{data.fromDetails}</p>
            </div>
          </div>

          <div className="inv-info" style={{ background: '#f8fafc', padding: '15px', borderRadius: '6px' }}>
            <div className="inv-col">
              <h4>Invoice No:</h4>
              <p>{data.invNumber}</p>
            </div>
            <div className="inv-col">
              <h4>Date:</h4>
              <p>{data.date}</p>
            </div>
            <div className="inv-col">
              <h4>Due Date:</h4>
              <p>{data.dueDate}</p>
            </div>
          </div>

          <table className="inv-table">
            <thead>
              <tr>
                <th style={{ width: '50%' }}>Description</th>
                <th style={{ width: '15%' }}>Qty</th>
                <th style={{ width: '15%' }}>Rate</th>
                <th style={{ width: '20%' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.desc}</td>
                  <td>{item.qty}</td>
                  <td>{data.currency}{item.rate}</td>
                  <td>{data.currency}{(item.qty * item.rate).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="inv-totals">
            <div className="totals-box">
              <div className="total-row">
                <span>Subtotal:</span>
                <span>{data.currency}{subtotal.toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>{data.taxLabel} ({data.taxRate}%):</span>
                <span>{data.currency}{taxAmount.toFixed(2)}</span>
              </div>
              <div className="total-row grand-total">
                <span>Total:</span>
                <span>{data.currency}{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="inv-footer">
            <div className="inv-notes">
              <h4>Notes:</h4>
              <p>{data.notes}</p>
            </div>
            <div className="inv-signature">
              {data.signatureUrl && <img src={data.signatureUrl} alt="Sig" className="signature-img" />}
              <div className="signature-line">Authorized Signature</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
