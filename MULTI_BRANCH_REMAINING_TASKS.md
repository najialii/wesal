# Multi-Branch Management - Remaining Tasks Implementation Guide

## Status Overview
- ✅ Tasks 15-20: Complete (Backend APIs + Branch Management Page)
- ✅ Task 29: Complete (Localization)
- ✅ Task 30: Complete (Error Handling)
- ⏳ Tasks 21-28: Need Implementation

## Task 22: Staff Management with Branch Assignments

### Files to Modify:
1. `frontend/src/pages/business/Staff.tsx`
2. `frontend/src/pages/business/StaffCreate.tsx` (if exists) or add to Staff.tsx
3. `frontend/src/pages/business/StaffEdit.tsx`

### Key Changes Needed:

#### In Staff List (Staff.tsx):
```typescript
// Add branch column to table
<td>{staff.branches?.map(b => b.name).join(', ') || 'No branches'}</td>

// Load staff with branches
const response = await api.get('/tenant/staff');
// Backend already returns branches via relationship
```

#### In Staff Create/Edit Forms:
```typescript
// Add branch selection checkboxes
const [branches, setBranches] = useState([]);
const [selectedBranches, setSelectedBranches] = useState([]);

useEffect(() => {
  // Load available branches
  api.get('/business/branches').then(res => setBranches(res.data));
}, []);

// In form
<div className="space-y-2">
  <label>Assign to Branches</label>
  {branches.map(branch => (
    <label key={branch.id} className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={selectedBranches.includes(branch.id)}
        onChange={(e) => {
          if (e.target.checked) {
            setSelectedBranches([...selectedBranches, branch.id]);
          } else {
            setSelectedBranches(selectedBranches.filter(id => id !== branch.id));
          }
        }}
      />
      {branch.name}
    </label>
  ))}
</div>

// On submit
await api.post(`/tenant/staff/${staffId}/branches`, {
  branch_ids: selectedBranches
});
```

## Task 24: Stock Transfer Interface

### New File: `frontend/src/pages/business/StockTransfers.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { Plus, ArrowRight, Check, X } from 'lucide-react';
import api from '../../lib/axios';

interface StockTransfer {
  id: number;
  product: { id: number; name: string };
  fromBranch: { id: number; name: string };
  toBranch: { id: number; name: string };
  quantity: number;
  status: 'pending' | 'completed' | 'cancelled';
  initiated_by: { name: string };
  created_at: string;
}

export default function StockTransfers() {
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [showModal, setShowModal] = useState(false);

  const loadTransfers = async () => {
    const res = await api.get('/business/stock-transfers');
    setTransfers(res.data.data);
  };

  const handleComplete = async (id: number) => {
    await api.post(`/business/stock-transfers/${id}/complete`);
    loadTransfers();
  };

  const handleCancel = async (id: number) => {
    await api.post(`/business/stock-transfers/${id}/cancel`);
    loadTransfers();
  };

  return (
    <div>
      <button onClick={() => setShowModal(true)}>Initiate Transfer</button>
      
      {/* Transfers List */}
      <div className="space-y-4">
        {transfers.map(transfer => (
          <div key={transfer.id} className="border p-4 rounded">
            <div className="flex justify-between">
              <div>
                <h3>{transfer.product.name}</h3>
                <p>{transfer.fromBranch.name} → {transfer.toBranch.name}</p>
                <p>Quantity: {transfer.quantity}</p>
              </div>
              <div>
                <span className={`badge ${transfer.status}`}>{transfer.status}</span>
                {transfer.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => handleComplete(transfer.id)}>
                      <Check /> Complete
                    </button>
                    <button onClick={() => handleCancel(transfer.id)}>
                      <X /> Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && <InitiateTransferModal onClose={() => setShowModal(false)} onSuccess={loadTransfers} />}
    </div>
  );
}

function InitiateTransferModal({ onClose, onSuccess }) {
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    product_id: '',
    from_branch_id: '',
    to_branch_id: '',
    quantity: 1,
    notes: ''
  });

  useEffect(() => {
    api.get('/business/branches').then(res => setBranches(res.data));
    api.get('/tenant/products').then(res => setProducts(res.data.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/business/stock-transfers', formData);
    onSuccess();
    onClose();
  };

  return (
    <div className="modal">
      <form onSubmit={handleSubmit}>
        <select value={formData.product_id} onChange={e => setFormData({...formData, product_id: e.target.value})}>
          <option value="">Select Product</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <select value={formData.from_branch_id} onChange={e => setFormData({...formData, from_branch_id: e.target.value})}>
          <option value="">From Branch</option>
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>

        <select value={formData.to_branch_id} onChange={e => setFormData({...formData, to_branch_id: e.target.value})}>
          <option value="">To Branch</option>
          {branches.filter(b => b.id != formData.from_branch_id).map(b => 
            <option key={b.id} value={b.id}>{b.name}</option>
          )}
        </select>

        <input 
          type="number" 
          value={formData.quantity}
          onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})}
          min="1"
        />

        <textarea 
          value={formData.notes}
          onChange={e => setFormData({...formData, notes: e.target.value})}
          placeholder="Notes (optional)"
        />

        <button type="submit">Initiate Transfer</button>
        <button type="button" onClick={onClose}>Cancel</button>
      </form>
    </div>
  );
}
```

### Add Route:
```typescript
// In App.tsx
<Route path="stock-transfers" element={<StockTransfers />} />
```

## Task 25: POS Branch Context

### File: `frontend/src/pages/business/POS.tsx`

**Already Partially Complete** - Backend filters products by branch and sets branch_id automatically.

### Additional Changes Needed:
```typescript
// Add branch indicator in header
<div className="pos-header">
  <h1>Point of Sale</h1>
  <div className="current-branch">
    Branch: {currentBranch?.name}
  </div>
</div>

// Show branch-specific stock warnings
{product.stock_quantity <= product.min_stock_level && (
  <span className="text-red-600">Low Stock at this branch!</span>
)}
```

## Task 26: Sales Pages with Branch Filtering

### File: `frontend/src/pages/business/Sales.tsx` (create if doesn't exist)

```typescript
import React, { useState, useEffect } from 'react';
import api from '../../lib/axios';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('all');

  useEffect(() => {
    loadSales();
    api.get('/business/branches').then(res => setBranches(res.data));
  }, [selectedBranch]);

  const loadSales = async () => {
    const params = selectedBranch !== 'all' ? { branch_id: selectedBranch } : {};
    const res = await api.get('/pos/daily-sales', { params });
    setSales(res.data.sales);
  };

  return (
    <div>
      <div className="filters">
        <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}>
          <option value="all">All Branches</option>
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      <table>
        <thead>
          <tr>
            <th>Sale #</th>
            <th>Customer</th>
            <th>Branch</th>
            <th>Amount</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {sales.map(sale => (
            <tr key={sale.id}>
              <td>{sale.sale_number}</td>
              <td>{sale.customer_name}</td>
              <td>{sale.branch?.name || 'N/A'}</td>
              <td>{sale.total_amount}</td>
              <td>{new Date(sale.sale_date).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## Task 27: Maintenance Pages with Branch Context

### Files to Modify:
1. `frontend/src/pages/business/MaintenanceContracts.tsx`
2. `frontend/src/pages/business/Maintenance.tsx`

### Key Changes:

```typescript
// Add branch filter
const [selectedBranch, setSelectedBranch] = useState('all');

// Filter contracts/visits by branch
useEffect(() => {
  const params = selectedBranch !== 'all' ? { branch_id: selectedBranch } : {};
  api.get('/maintenance/contracts', { params }).then(res => setContracts(res.data));
}, [selectedBranch]);

// Display branch in list
<td>{contract.branch?.name || 'N/A'}</td>

// In contract form, add branch selection
<select name="branch_id" required>
  <option value="">Select Branch</option>
  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
</select>
```

## Task 28: Customer Pages (Verification)

### File: `frontend/src/pages/business/Customers.tsx`

**No Changes Needed** - Customers are already tenant-wide (not branch-scoped).

### Verification Points:
1. ✅ Customer search returns results from all branches
2. ✅ Customer model uses `BelongsToTenant` (not `BelongsToBranch`)
3. ✅ Customer transactions show branch information

### Optional Enhancement:
```typescript
// In customer detail view, show transactions grouped by branch
<div className="customer-transactions">
  <h3>Transaction History</h3>
  {Object.entries(groupedByBranch).map(([branchName, transactions]) => (
    <div key={branchName}>
      <h4>{branchName}</h4>
      <ul>
        {transactions.map(t => <li key={t.id}>{t.description}</li>)}
      </ul>
    </div>
  ))}
</div>
```

## Implementation Priority

### High Priority (Core Functionality):
1. **Task 24** - Stock Transfers (new feature, high value)
2. **Task 22** - Staff Branch Assignments (critical for access control)
3. **Task 26** - Sales Filtering (important for reporting)

### Medium Priority (Enhancements):
4. **Task 27** - Maintenance Branch Context
5. **Task 25** - POS Branch Indicator

### Low Priority (Already Working):
6. **Task 28** - Customer Verification (no changes needed)

## Quick Implementation Steps

For each task:
1. Mark task as in_progress
2. Create/modify the necessary files
3. Add routes if needed
4. Test the functionality
5. Mark task as completed

## Notes

- All backend APIs are already implemented and functional
- Focus on UI/UX integration
- Use existing UI components (Button, Card, Table, etc.)
- Follow existing patterns in the codebase
- Ensure RTL support for Arabic
- Add proper error handling using `handleBranchError` utility

## Testing Checklist

- [ ] Staff can be assigned to multiple branches
- [ ] Stock transfers can be initiated and completed
- [ ] Sales can be filtered by branch
- [ ] Maintenance contracts show branch information
- [ ] Customers remain accessible across all branches
- [ ] Branch selector works correctly
- [ ] Error messages display properly
- [ ] RTL layout works correctly
