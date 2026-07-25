import React, { useEffect } from "react";

interface IImageViewerProps {
  onClose: () => void;
}

const Information: React.FC<IImageViewerProps> = ({ onClose }) => {


  return (
    <div className="">
    <ul>
      <li>
        <div className="m-list">
          <label className="form-check-label" htmlFor="8-hours">
            <input
              className="form-check-input-custom"
              type="radio"
              name="groupsRadios"
              value=""
              id="8-hours"
              checked
            />
          </label>
        </div>
      </li>
      <li>
        <div className="m-list">
          <label className="form-check-label" htmlFor="week">
            <input
              className="form-check-input-custom"
              type="radio"
              name="groupsRadios"
              value=""
              id="week"
            />
          </label>
        </div>
      </li>
      <li>
        <div className="m-list">
          <label className="form-check-label" htmlFor="always">
            <input
              className="form-check-input-custom"
              type="radio"
              name="groupsRadios"
              value=""
              id="always"
            />
          </label>
        </div>
      </li>
    </ul>
  </div>
  );
};

export default Information;
