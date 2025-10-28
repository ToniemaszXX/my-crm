import React from 'react';
import { useTranslation } from 'react-i18next';



const europeanCountries = [
  "Albania", "Andorra", "Austria", "Belarus", "Belgium", "Bosnia and Herzegovina",
  "Bulgaria", "Croatia", "Cyprus", "Czech Republic", "Denmark", "Estonia", "Finland",
  "France", "Germany", "Greece", "Hungary", "Iceland", "Ireland", "Italy", "Kosovo",
  "Latvia", "Liechtenstein", "Lithuania", "Luxembourg", "Malta", "Moldova", "Monaco",
  "Montenegro", "Netherlands", "North Macedonia", "Norway", "Poland", "Portugal",
  "Romania", "Russia", "San Marino", "Serbia", "Slovakia", "Slovenia", "Spain",
  "Sweden", "Switzerland", "Turkey", "Ukraine", "United Kingdom", "Vatican City", "Uzbekistan",
  "Uruguay", "Israel", "Jordan", "Argentina", "Australia", "Azerbaijan", "Brazil",
  "China", "Georgia", "Hong Kong", "Canada", "South Korea", "India", "Iraq"
];

function CountrySelect({ value, onChange, name = 'country', label = 'Country', className = '', hideLabel = false, disabled = false}) {

  const { t } = useTranslation();

  // Mapuj do par [klucz, przetłumaczona nazwa], potem sortuj po tłumaczeniu
  const sortedCountries = europeanCountries
    .map((country) => ({
      key: country,
      label: t('countries.' + country)
    }))
    .sort((a, b) => a.label.localeCompare(b.label));


  return (
    <div className="text-neutral-800">
    {!hideLabel && <label htmlFor={name}>{label}</label>}
    <select
        name={name}
        value={value}
        onChange={onChange}
  className={`${className} ${disabled ? 'bg-neutral-100 text-neutral-500 cursor-not-allowed' : ''}`}
  disabled={disabled}
      >
        <option value="">-- Select a country --</option>
        {sortedCountries.map((country) => (
          <option key={country.key} value={country.key}>
            {country.label}
          </option>
        ))}
      </select>
      </div>
  );
}

export default CountrySelect;
export { europeanCountries };
