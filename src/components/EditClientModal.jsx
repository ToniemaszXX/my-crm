import useClientForm from '../hooks/useClientForm';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import LocationPicker from './LocationPicker';
import { useTranslation } from 'react-i18next';
import { isReadOnly } from '../utils/roles';
import { X } from 'lucide-react';


function EditClientModal({ isOpen, client, onClose, onClientUpdated }) {
    const {
        formData,
        setFormData,
        contacts,
        setContacts,
        isSaving,
        setIsSaving,
        isStructureInvalid,
        handleChange,
        handleAddContact,
        handleRemoveContact,
        handleContactChange,
        resetForm
      } = useClientForm(client); // przekazujemy klienta jako client

      const { t } = useTranslation();
      const { user } = useAuth();
      const readOnly = isReadOnly(user);
      const [searchTerm, setSearchTerm] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const response = await fetch(`${import.meta.env.VITE_API_URL}/customers/edit.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...formData, contacts })
    });

    const data = await response.json();
    setIsSaving(false);

    if (data.success) {
      onClientUpdated();
      onClose();
    } else {
      alert('Error saving changes');
    }
  };

  if (!isOpen || !formData) return null;

  return (

    <div className='fixed inset-0 bg-black/50 flex justify-center items-center  z-[99]'> 
      <div className='bg-neutral-100 p-8 rounded-lg w-[1100px] max-h-[90vh] overflow-y-auto'>
        <div className='flex justify-between items-center mb-5'>
        <h2 className="text-lime-500 text-xl font-extrabold">{t('editClientModal.editLead')}</h2>
        <button
          className="text-black hover:text-red-500 text-2xl font-bold bg-neutral-300 rounded-lg w-10 h-10 flex items-center justify-center leading-none"
          onClick={onClose}
          aria-label="Close modal"
        >
          <X size={20} />
        </button>
        </div>

          <form onSubmit={handleSubmit} className="text-white flex flex-col gap-3">

          <div className="flex-col">
            <h4 className='header2'>{t('addClientModal.companyData')}</h4>
            
            <div className="grid2col mb-7">
                  <div className="flexColumn">
                    <label className="text-neutral-800">{t('addClientModal.companyName')}
                      <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} readOnly={readOnly}/>
                    </label>
                  <label className="text-neutral-800">{t('addClientModal.nip')}
                  <input type="text" name="nip" value={formData.nip} onChange={handleChange} readOnly={readOnly}/>
                  </label>
                  <label className="text-neutral-800">{t('addClientModal.street')}
                  <input type="text" name="street" value={formData.street} onChange={handleChange} readOnly={readOnly}/>
                  </label>
                  <label className="text-neutral-800">{t('addClientModal.city')}
                  <input type="text" name="city" value={formData.city} onChange={handleChange} readOnly={readOnly}/>
                  </label>
            </div>

            <div className='flexColumn'>
                  <label className='text-neutral-800'>
                  {t('addClientModal.postalCode')}
                  <input type="text" name="postal_code" value={formData.postal_code} onChange={handleChange} readOnly={readOnly}/>
                  </label>
                  <label className='text-neutral-800'>
                  {t('addClientModal.voivodeship')}
                  <input type="text" name="voivodeship" placeholder="" value={formData.voivodeship} onChange={handleChange} readOnly={readOnly}/>
                  </label>
                  <label className='text-neutral-800'>
                  {t('addClientModal.country')}
                  <input type="text" name="country" placeholder="" value={formData.country} onChange={handleChange} readOnly={readOnly}/>
                  </label>
                  <label className='text-neutral-800'>
                  {t('addClientModal.clientCategory')}
                  <select name="client_category" value={formData.client_category} onChange={handleChange} disabled={readOnly} className='AddSelectClient'>
                  <option value="">{t('addClientModal.selectCategory')}</option>
                    <option value="CENTRALA_SIEĆ">{t('addClientModal.categories.CENTRALA_SIEĆ')}</option>
                    <option value="DEWELOPER">{t('addClientModal.categories.DEWELOPER')}</option>
                    <option value="DYSTRYBUTOR">{t('addClientModal.categories.DYSTRYBUTOR')}</option>
                    <option value="DYSTRYBUTOR_CENTRALA">{t('addClientModal.categories.DYSTRYBUTOR_CENTRALA')}</option>
                    <option value="DYSTRYBUTOR_MAGAZYN">{t('addClientModal.categories.DYSTRYBUTOR_MAGAZYN')}</option>
                    <option value="DYSTRYBUTOR_ODDZIAŁ">{t('addClientModal.categories.DYSTRYBUTOR_ODDZIAŁ')}</option>
                    <option value="ENGO_PLUS">{t('addClientModal.categories.ENGO_PLUS')}</option>
                    <option value="INSTALATOR">{t('addClientModal.categories.INSTALATOR')}</option>
                    <option value="PODHURT">{t('addClientModal.categories.PODHURT')}</option>
                    <option value="PODHURT_ELEKTRYKA">{t('addClientModal.categories.PODHURT_ELEKTRYKA')}</option>
                    <option value="PROJEKTANT">{t('addClientModal.categories.PROJEKTANT')}</option>
                    </select>
                  </label>
            </div>
          </div>

          <div className="flex-col mb-7">
                <h4 className="header2">{t('addClientModal.location')}</h4>

                <div className="grid2col mb-4">
                  <input
                    type="text"
                    name="latitude"
                    placeholder="Szerokość geograficzna (lat)"
                    value={formData.latitude}
                    onChange={handleChange}
                    readOnly={readOnly}
                  />
                  <input
                    type="text"
                    name="longitude"
                    placeholder="Długość geograficzna (lng)"
                    value={formData.longitude}
                    onChange={handleChange}
                    readOnly={readOnly}
                  />
                </div>

                <div className='bg-neutral-100 p-8 rounded-lg w-full max-w-[90%] max-h-[90vh] overflow-y-auto'>

                <LocationPicker
                  street={formData.street}
                  city={formData.city}
                  postal_code={formData.postal_code}
                  voivodeship={formData.voivodeship}
                  country={formData.country}
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  onCoordsChange={(coords) => {
                    setFormData((prev) => ({
                      ...prev,
                      latitude: coords.lat,
                      longitude: coords.lng,
                    }));
                  }}
                />



                </div>

                {formData.latitude && formData.longitude && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${formData.latitude},${formData.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="buttonGreen mt-3 inline-block"
                  >
                    {t('editClientModal.direct')}
                  </a>
                )}
                </div>

          <div className="flex-col mb-7">

            <h4 className='header2'>{t('addClientModal.accounts')}</h4>

            <div className='grid2col'>
              <div className="flexColumn">
                <label className='text-neutral-800'>{t('addClientModal.engoTeamContact')}
                    <input type="text" name="engo_team_contact" placeholder="Pracownik Engo" value={formData.engo_team_contact} onChange={handleChange} readOnly={readOnly}/>
                </label>
                    <label className='text-neutral-800'>{t('addClientModal.branches')}
                    <input type="text" name="number_of_branches" placeholder="" value={formData.number_of_branches} onChange={handleChange} readOnly={readOnly}/>
                    </label>
                    <label className='text-neutral-800'>{t('addClientModal.salesReps')}
                    <input type="text" name="number_of_sales_reps" placeholder="" value={formData.number_of_sales_reps} onChange={handleChange} readOnly={readOnly}/>
                    </label>
                    <label className='text-neutral-800'>{t('addClientModal.www')}
                    <input type="text" name="www" placeholder="" value={formData.www} onChange={handleChange} readOnly={readOnly}/>
                    </label>
                    <label className='text-neutral-800'>{t('addClientModal.facebook')}
                    <input type="text" name="facebook" placeholder="" value={formData.facebook} onChange={handleChange} readOnly={readOnly}/>
                    </label>
                    <label className='text-neutral-800'>{t('addClientModal.auctionService')}
                    <input type="text" name="auction_service" placeholder="" value={formData.auction_service} onChange={handleChange} readOnly={readOnly}/>
                    </label>
                    <label className='text-neutral-800'>
                    <input type="checkbox" name="private_brand" checked={formData.private_brand === 1} onChange={handleChange} disabled={readOnly}/>
                    {t('addClientModal.privateBrand')}
                    </label>
                      {formData.private_brand === 1 && (
                        <input type="text" name="private_brand_details" placeholder="Nazwa marki własnej" value={formData.private_brand_details} onChange={handleChange} readOnly={readOnly}/>
                      )}

                    <label className='text-neutral-800'>
                      <input type="checkbox" name="loyalty_program" checked={formData.loyalty_program === 1} onChange={handleChange} disabled={readOnly}/>
                      {t('addClientModal.loyaltyProgram')}
                    </label>
                      {formData.loyalty_program === 1 && (
                        <input type="text" name="loyalty_program_details" placeholder="Nazwa programu lojalnościowego" value={formData.loyalty_program_details} onChange={handleChange} readOnly={readOnly}/>
                      )}
              </div>
              
              <div className="flexColumn">
                    <label className='text-neutral-800'>{t('addClientModal.turnoverPln')}
                    <input type="text" name="turnover_pln" placeholder="" value={formData.turnover_pln} onChange={handleChange} readOnly={readOnly}/>
                    </label>
                    <label className='text-neutral-800'>{t('addClientModal.turnoverEur')}
                    <input type="text" name="turnover_eur" placeholder="" value={formData.turnover_eur} onChange={handleChange} readOnly={readOnly}/>
                    </label>
                    <label className='text-neutral-800'>{t('addClientModal.installationSales')}
                    <input type="text" name="installation_sales_share" placeholder="" value={formData.installation_sales_share} onChange={handleChange} readOnly={readOnly}/>
                    </label>
                    <label className='text-neutral-800'>{t('addClientModal.automationSales')}
                    <input type="text" name="automatic_sales_share" placeholder="" value={formData.automatic_sales_share} onChange={handleChange} readOnly={readOnly}/>
                    </label>
                    <label className='text-neutral-800'>{t('addClientModal.salesPotential')}
                    <input type="text" name="sales_potential" placeholder="" value={formData.sales_potential} onChange={handleChange} readOnly={readOnly}/>
                    </label>
                    <label className='text-neutral-800'>{t('addClientModal.webstore')}
                    <input type="text" name="has_webstore" placeholder="" value={formData.has_webstore} onChange={handleChange} readOnly={readOnly}/>
                    </label>
                    <label className='text-neutral-800'>{t('addClientModal.b2b')}
                    <input type="text" name="has_b2b_platform" placeholder="" value={formData.has_b2b_platform} onChange={handleChange} readOnly={readOnly}/>
                    </label>
                    <label className='text-neutral-800'>{t('addClientModal.b2c')}
                    <input type="text" name="has_b2c_platform" placeholder="" value={formData.has_b2c_platform} onChange={handleChange} readOnly={readOnly}/>
                    </label>
              </div>
              

            </div>

          </div>
</div>

<h4 className='header2'>{t('addClientModal.salesStructure')}</h4>

<div className="flexColumn mb-7">
  <label className='text-neutral-800'>{t('addClientModal.structure.installer')}<br />
      <input type="number" name="structure_installer" value={formData.structure_installer} onChange={handleChange} readOnly={readOnly}/>
    </label>
    <label className='text-neutral-800'>{t('addClientModal.structure.wholesaler')}<br />
      <input type="number" name="structure_wholesaler" value={formData.structure_wholesaler} onChange={handleChange} readOnly={readOnly}/>
    </label>
    <label className='text-neutral-800'>{t('addClientModal.structure.ecommerce')}<br />
      <input type="number" name="structure_ecommerce" value={formData.structure_ecommerce} onChange={handleChange} readOnly={readOnly}/>
    </label>
    <label className='text-neutral-800'>{t('addClientModal.structure.retail')}<br />
      <input type="number" name="structure_retail" value={formData.structure_retail} onChange={handleChange} readOnly={readOnly}/>
    </label>
    <label className='text-neutral-800'>{t('addClientModal.structure.other')}<br />
      <input type="number" name="structure_other" value={formData.structure_other} onChange={handleChange} readOnly={readOnly}/>
    </label> 
</div>


<h4 className='header2'>{t('addClientModal.contact')}</h4>
<input
  type="text"
  placeholder= {t('editClientModal.searchContact')}
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  className="mb-4 p-2 border rounded w-full text-black"
/>

{contacts
  .filter((c) =>
    Object.values(c).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  )
  .map((c, i) => (
  <div key={i} className='contactBlock'>
    <select name="department" value={c.department} onChange={(e) => handleContactChange(i, e)} className="contactSelect mb-4" disabled={readOnly}>
    <option value="">{t('addClientModal.selectDepartment')}</option>
    <option value="Zarząd">{t('addClientModal.departments.management')}</option>
    <option value="Sprzedaż">{t('addClientModal.departments.sales')}</option>
    <option value="Zakupy">{t('addClientModal.departments.purchasing')}</option>
    <option value="Marketing">{t('addClientModal.departments.marketing')}</option>
    <option value="Inwestycje">{t('addClientModal.departments.investments')}</option>
    <option value="Finanse">{t('addClientModal.departments.finance')}</option>
    <option value="Logistyka">{t('addClientModal.departments.logistics')}</option>
    <option value="Administracja">{t('addClientModal.departments.admin')}</option>
    <option value="Obsługi klienta">{t('addClientModal.departments.customerService')}</option>
    </select>

    <div className='flex gap-2'>
    <label className='text-neutral-800'>{t('addClientModal.position')}
      <input type="text" name="position" placeholder="" value={c.position} onChange={(e) => handleContactChange(i, e)}  className="contactInput" readOnly={readOnly}/>
    </label>
    <label className='text-neutral-800'> {t('addClientModal.name')}
      <input type="text" name="name" placeholder="" value={c.name} onChange={(e) => handleContactChange(i, e)}  className="contactInput" readOnly={readOnly}/>
    </label>
    <label className='text-neutral-800'>{t('addClientModal.phone')}
      <input type="text" name="phone" placeholder="" value={c.phone} onChange={(e) => handleContactChange(i, e)}  className="contactInput" readOnly={readOnly}/>
    </label>
    <label className='text-neutral-800'>{t('addClientModal.email')}Email
      <input type="email" name="email" placeholder="" value={c.email} onChange={(e) => handleContactChange(i, e)}  className="contactInput" readOnly={readOnly}/>
    </label>
    <label className='text-neutral-800'>{t('addClientModal.functionNotes')}
      <input type="text" name="function_notes" placeholder="" value={c.function_notes} onChange={(e) => handleContactChange(i, e)}  className="contactInput" readOnly={readOnly}/>
    </label>
    <label className='text-neutral-800'> {t('addClientModal.decisionLevel')}
      <select name="decision_level" value={c.decision_level} onChange={(e) => handleContactChange(i, e)}  className="contactSelect text-neutral-800" readOnly={readOnly}>
      <option value="">{t('addClientModal.decisionLevel')}</option>
      <option value="wysoka">{t('addClientModal.decision.high')}</option>
      <option value="średnia">{t('addClientModal.decision.medium')}</option>
      <option value="nie ma">{t('addClientModal.decision.none')}</option>
    </select>
    </label>
    <button className='buttonRed' type="button" onClick={() => handleRemoveContact(i)} disabled={readOnly}>{t('addClientModal.remove')}</button>
    </div>
  </div>
))}
{!isReadOnly(user) && (<button className='buttonGreenNeg' type="button" onClick={handleAddContact}>{t('addClientModal.addContact')}</button>)}


{!isReadOnly(user) && (<div className='flex justify-end mt-5'>
            <button className='buttonGreen' type="submit" disabled={isSaving || isStructureInvalid}>
              {isSaving ? t('addClientModal.saving') : t('addClientModal.save')}
            </button>
            <button className='buttonRed' type="button" onClick={onClose} style={{ marginLeft: '10px' }}>
            {t('addClientModal.cancel')}
            </button>
          </div>)}
        </form>
      </div>
    </div>
  );
}


export default EditClientModal;
