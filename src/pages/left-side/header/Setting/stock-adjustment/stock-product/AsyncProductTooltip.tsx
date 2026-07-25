import React, { useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";
import { axiosInstance } from "../../../../../../services/axiosInstance";
import { ProductDetails } from "./stocktypes";
import { TReactSetState } from "../../../../../../helpers/AppType";

interface Props {
  productId: number;
  children: React.ReactNode;
  cache: Record<number, ProductDetails[]>;
  setCache: TReactSetState<Record<number, ProductDetails[]>>;
}

const AsyncProductTooltip: React.FC<Props> = ({
  cache,
  setCache,
  productId,
  children,
}) => {
  const [show, setShow] = useState(false);
  const [data, setData] = useState<ProductDetails[] | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDetails = async () => {
    if (cache[productId]) {
      setData(cache[productId]);
      return;
    }

    try {
      setLoading(true);

      const res = await axiosInstance.post("warehouse-wise-item-stock", {
        product_id: productId,
      });

      const result: ProductDetails[] = res.data?.data?.data || [];

      setCache((prev) => ({
        ...prev,
        [productId]: result,
      }));

      setData(result);
    } catch (err) {
      console.error("Tooltip fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show && data === null) {
      fetchDetails();
    }
  }, [show]);

  return (
    <div
      className="position-relative d-inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}

      {show && (
        <div
          className="position-absolute bg-white border rounded shadow p-2"
          style={{
            top: "100%",
            left: 0,
            zIndex: 9999,
            minWidth: "220px",
          }}
        >
          {loading ? (
            <div className="text-center">
              <Spinner size="sm" />
            </div>
          ) : data && data.length > 0 ? (
            data.map((v, i) => (
              <div key={i} className="mb-1 border-bottom pb-1">
                <div>
                  <strong>{v.warehouse}</strong>
                </div>
                <div>Stock: {v.stock?.toFixed()}</div>
              </div>
            ))
          ) : (
            <div className="text-muted">No data</div>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(AsyncProductTooltip);
