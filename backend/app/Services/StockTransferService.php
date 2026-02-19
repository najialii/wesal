<?php

namespace App\Services;

use App\Models\StockTransfer;
use App\Models\Product;
use App\Models\Branch;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class StockTransferService
{
    /**
     * Initiate a stock transfer between branches
     */
    public function initiateTransfer(
        int $productId,
        int $fromBranchId,
        int $toBranchId,
        int $quantity,
        ?string $notes = null
    ): StockTransfer {
        // Validate the transfer
        $this->validateTransfer($productId, $fromBranchId, $toBranchId, $quantity);

        // Create the transfer record
        $transfer = StockTransfer::create([
            'product_id' => $productId,
            'from_branch_id' => $fromBranchId,
            'to_branch_id' => $toBranchId,
            'quantity' => $quantity,
            'status' => 'pending',
            'initiated_by' => Auth::id(),
            'notes' => $notes,
        ]);

        return $transfer;
    }

    /**
     * Complete a stock transfer
     */
    public function completeTransfer(int $transferId): StockTransfer
    {
        $transfer = StockTransfer::findOrFail($transferId);

        if (!$transfer->isPending()) {
            throw new \Exception('Transfer is not in pending status');
        }

        // Validate stock availability again
        $this->validateTransfer(
            $transfer->product_id,
            $transfer->from_branch_id,
            $transfer->to_branch_id,
            $transfer->quantity
        );

        DB::transaction(function () use ($transfer) {
            $product = Product::findOrFail($transfer->product_id);

            // Deduct from source branch
            $product->decrementStockForBranch($transfer->from_branch_id, $transfer->quantity);

            // Add to destination branch
            $product->incrementStockForBranch($transfer->to_branch_id, $transfer->quantity);

            // Create stock movements for audit trail
            StockMovement::create([
                'product_id' => $transfer->product_id,
                'branch_id' => $transfer->from_branch_id,
                'type' => 'out',
                'quantity' => $transfer->quantity,
                'reference_type' => 'transfer',
                'reference_id' => $transfer->id,
                'notes' => "Transfer to branch {$transfer->to_branch_id}",
                'user_id' => Auth::id(),
            ]);

            StockMovement::create([
                'product_id' => $transfer->product_id,
                'branch_id' => $transfer->to_branch_id,
                'type' => 'in',
                'quantity' => $transfer->quantity,
                'reference_type' => 'transfer',
                'reference_id' => $transfer->id,
                'notes' => "Transfer from branch {$transfer->from_branch_id}",
                'user_id' => Auth::id(),
            ]);

            // Update transfer status
            $transfer->update([
                'status' => 'completed',
                'completed_by' => Auth::id(),
                'completed_at' => now(),
            ]);
        });

        return $transfer->fresh();
    }

    /**
     * Cancel a stock transfer
     */
    public function cancelTransfer(int $transferId): StockTransfer
    {
        $transfer = StockTransfer::findOrFail($transferId);

        if (!$transfer->isPending()) {
            throw new \Exception('Only pending transfers can be cancelled');
        }

        $transfer->update([
            'status' => 'cancelled',
            'completed_by' => Auth::id(),
            'completed_at' => now(),
        ]);

        return $transfer;
    }

    /**
     * Validate a stock transfer
     */
    public function validateTransfer(
        int $productId,
        int $fromBranchId,
        int $toBranchId,
        int $quantity
    ): bool {
        // Check if branches exist and belong to same tenant
        $fromBranch = Branch::findOrFail($fromBranchId);
        $toBranch = Branch::findOrFail($toBranchId);

        if ($fromBranch->tenant_id !== $toBranch->tenant_id) {
            throw new \Exception('Cannot transfer between branches of different tenants');
        }

        // Check if transferring to same branch
        if ($fromBranchId === $toBranchId) {
            throw new \Exception('Cannot transfer to the same branch');
        }

        // Check if branches are active
        if (!$fromBranch->isActive() || !$toBranch->isActive()) {
            throw new \Exception('Cannot transfer to/from inactive branch');
        }

        // Check if product exists
        $product = Product::findOrFail($productId);

        // Check if product is assigned to both branches
        if (!$product->branches()->where('branches.id', $fromBranchId)->exists()) {
            throw new \Exception('Product is not assigned to source branch');
        }

        if (!$product->branches()->where('branches.id', $toBranchId)->exists()) {
            throw new \Exception('Product is not assigned to destination branch');
        }

        // Check if sufficient stock exists
        $availableStock = $product->getStockForBranch($fromBranchId);
        if ($availableStock < $quantity) {
            throw new \Exception("Insufficient stock. Available: {$availableStock}, Requested: {$quantity}");
        }

        // Check if quantity is positive
        if ($quantity <= 0) {
            throw new \Exception('Transfer quantity must be positive');
        }

        return true;
    }
}
