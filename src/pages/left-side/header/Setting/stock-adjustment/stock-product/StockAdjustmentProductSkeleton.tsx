import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const StockAdjustmentProductSkeleton = () => {
  return (
    <div className="card h-100 p-2">
      <Skeleton height={120} />
      <Skeleton height={15} className="mt-2" />
      <Skeleton height={12} width="60%" />
    </div>
  );
};

export default StockAdjustmentProductSkeleton;
