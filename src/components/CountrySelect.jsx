import React from 'react';
import { useTranslation } from 'react-i18next';



const europeanCountries = [
  "Albania", "Andorra", "Austria", "Belarus", "Belgium", "Bosnia and Herzegovina",
  "Bulgaria", "Croatia", "Cyprus", "Czech Republic", "Denmark", "Estonia", "Finland",
  "France", "Germany", "Greece", "Hungary", "Iceland", "Ireland", "Italy", "Kosovo",
  "Latvia", "Liechtenstein", "Lithuania", "Luxembourg", "Malta", "Moldova", "Monaco",
  "Montenegro", "Netherlands", "North Macedonia", "Norway", "Poland", "Portugal",
  "Romania", "Russia", "San Marino", "Serbia", "Slovakia", "Slovenia", "Spain",
  "Sweden", "Switzerland", "Turkey", "Ukraine", "UK", "Vatican City"
];

function CountrySelect({ value, onChange, name = 'country', label = 'Country', className = '' }) {

    const { t } = useTranslation();

    
  return (
    <label className="text-neutral-800">
      {label}<br />
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`AddSelectClient ${className}`}
      >
        <option value="">-- Select a country --</option>
        {europeanCountries.map((country) => (
          <option key={country} value={country}>
            {t('countries.' + country)}
          </option>
        ))}
      </select>
    </label>
  );
}

export default CountrySelect;
export { europeanCountries };
