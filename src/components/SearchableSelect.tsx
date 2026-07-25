import React, { useState } from 'react';
import { Field } from 'formik'; // Import Field from Formik

const SearchableSelect = ({ name, filteredOptions, errors, touched } : any) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleChange = (e:any) => {
    setSearchTerm(e.target.value.toLowerCase());
    // You can handle formik field change here if needed
  };

  // Filter options based on searchTerm
  const filteredOptionsList = filteredOptions.filter((option: { name: string; }) =>
    option.name.toLowerCase().includes(searchTerm)
  );

  return (
    <Field
      as="select"
      name={name}
      className={`form-control font-size-15 rounded-1 ${
        errors[name] && touched[name] && 'is-invalid input-box-error'
      }`}
      onChange={handleChange}
    >
      <option value="">Select a country...</option>
      {filteredOptionsList.map((option:any) => (
        <option key={option.id} value={option.name}>
          {option.name}
        </option>
      ))}
    </Field>
  );
};

export default SearchableSelect;
