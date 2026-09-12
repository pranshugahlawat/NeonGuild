import Shop from "@/components/Shop";
import { Card } from "@/components/ui/Card";

export default function ShopPage() {
  return (
    <Card>
      <div className="text-lg font-semibold">Guild Shop</div>
      <p className="mt-1 text-sm text-mut">Purchases are enforced server-side.</p>
      <div className="mt-4">
        <Shop />
      </div>
    </Card>
  );
}