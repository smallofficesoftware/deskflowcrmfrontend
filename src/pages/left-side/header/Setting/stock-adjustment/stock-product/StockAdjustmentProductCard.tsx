import React from "react";
import { StockProduct } from "./stocktypes";
import noImage from "../../../../../../assets/images/no_image.jpeg";
interface Props {
  product: StockProduct;
  onClick: (product: StockProduct) => void;
  selected: StockProduct[];
  /** Company's "Product Image View In a Cart" setting (1 = show images) - same flag/markup/classes as order-create's product card (OrderCreateModal.tsx, dynamicImageView). */
  inOrderImageView?: number;
}

const StockAdjustmentProductCard: React.FC<Props> = React.memo(
  ({ product, onClick, selected, inOrderImageView }) => {
    const isSelected = selected.includes(product);
    const showImage = inOrderImageView === 1;

    return (
      <div
        className={`${showImage ? "mb-3" : "mb-1"} card`}
        onClick={() => onClick(product)}
        style={{
          cursor: "pointer",
          backgroundColor: isSelected ? "#DDF4E7" : "",
          borderRadius: "0px",
        }}
      >
        {showImage ? (
          <>
            <div
              style={{
                backgroundImage: product.image
                  ? `url(${product.image})`
                  : `url(${noImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                height: "12vh",
                width: "100%",
                backgroundRepeat: "no-repeat",
              }}
            ></div>
            <div title={product.name} className="p-1">
              <div style={{ maxHeight: "60px" }}>
                <h4
                  className="order-text-card-body"
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    margin: 0,
                  }}
                >
                  <b>{product.name}</b>
                </h4>
              </div>
              <h4 className="order-text-card-body">
                <b> {product.category_name}</b>
              </h4>
              <h4 className="order-text-card-body">
                <b>Stock: {product.stock}</b>
              </h4>
            </div>
          </>
        ) : (
          <div className="p-1 d-flex justify-content-between align-items-start">
            <div>
              <h5
                style={{
                  fontSize: "13px",
                  wordWrap: "break-word",
                  whiteSpace: "normal",
                  maxWidth: "200px",
                  width: "200px",
                  margin: 0,
                }}
              >
                <b>{product.name}</b>
              </h5>
              <small className="text-muted order-text-card-body">
                {product.category_name}
              </small>
            </div>
            <div className="text-end">
              <strong className="order-text-card-body">
                Stock: {product.stock}
              </strong>
            </div>
          </div>
        )}
      </div>
    );
  },
);

export default StockAdjustmentProductCard;
