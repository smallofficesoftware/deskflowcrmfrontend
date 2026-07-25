import React, { useState } from "react";
import { StockProduct } from "./stocktypes";
import noImage from "../../../../../../assets/images/no_image.jpeg";
interface Props {
  product: StockProduct;
  onClick: (product: StockProduct) => void;
  selected: StockProduct[]
}

const StockAdjustmentProductCard: React.FC<Props> = React.memo(
  ({ product, onClick, selected }) => {

    return (
      <div
        className="card h-100 shadow-sm cursor-pointer"
        onClick={() => onClick(product)}
        style={{ cursor: "pointer" }}
      >
        <img
          src={product.image || noImage}
          className="card-img-top"
          alt={product.name}
          style={{ height: 120, objectFit: "cover" }}
          loading="lazy"
        />
        <div className="card-body p-2" style={{ backgroundColor: selected.includes(product) ? "#DDF4E7" : "#FFFFFF" }}>
          <h6 className="card-title mb-1 text-truncate">{product.name}</h6>
          <small className="text-muted">Stock: {product.stock}</small>
        </div>
      </div>
    );
  },
);

export default StockAdjustmentProductCard;
