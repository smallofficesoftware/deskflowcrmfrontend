import { useState } from "react";
import { IProductView } from "../../ProductController";
import BomProcessField from "./BomProcessFieldView";
import BomProcessList, { IProcess } from "./BomProcessListView";

interface IPropsBOM {
  show: boolean;
  onHide: () => void;
  product: IProductView;
  bomId: any;
}

const BomProcessView = ({ show, onHide, product, bomId }: IPropsBOM) => {

  const [recallGetProcessOnCreate, setRecallGetProcessOnCreate] = useState<boolean>(false);
  const [editTimeData, setEditTimeData] = useState<IProcess>();

  const handleRefreshListView = (data: boolean) => {
    setRecallGetProcessOnCreate(data);
  }

  const handleSetEditTimeData = (item: IProcess) => {
    setEditTimeData(item);
  }

  return (
    show && (
      <div>
        <BomProcessField show={show} product={product} bomId={bomId} handleRefreshListView={handleRefreshListView} editTimeData={editTimeData} handleSetEditTimeData={handleSetEditTimeData}/>

        <BomProcessList product={product} recallGetProcessOnCreate={recallGetProcessOnCreate} handleRefreshListView={handleRefreshListView} handleSetEditTimeData={handleSetEditTimeData} bomId={bomId}/>
      </div>
    )
  );
};

export default BomProcessView;