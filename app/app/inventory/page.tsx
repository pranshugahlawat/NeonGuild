import Inventory from "@/components/Inventory";
import { Card } from "@/components/ui/Card";

export default function InventoryPage() {
  return (
    <Card>
      <div className="text-lg font-semibold">Inventory</div>
      <p className="mt-1 text-sm text-mut">Items you own from the shop.</p>
      <div className="mt-4">
        <Inventory />
      </div>
    </Card>
  );
}