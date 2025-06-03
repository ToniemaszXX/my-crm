import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import useClientForm from '../hooks/useClientForm';
import LocationPicker from './LocationPicker';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import CountrySelect from './CountrySelect';
import { isAdmin, isZarzad } from '../utils/roles';

function AddClientModal({ isOpen, onClose, onClientAdded }) {
  const {
    formData,
    contacts,
    isSaving,
    isStructureInvalid,
    setIsSaving,
    handleChange,
    handleAddContact,
    handleRemoveContact,
    handleContactChange,
    resetForm,
    setFormData
  } = useClientForm();

  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);


    const response = await fetch(`${import.meta.env.VITE_API_URL}/customers/add.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...formData,
        contacts: contacts
      }),
      credentials: 'include'
    });

    const data = await response.json();

    if (data.success) {
      alert(t('success'));
      resetForm();
      onClientAdded();
      onClose();
    } else {
      alert(t('error'));
    }

    setIsSaving(false);
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/50 flex justify-center items-center z-[99]'>
      
      <div className='bg-neutral-100 pb-8 rounded-lg w-[1100px] max-h-[90vh] overflow-y-auto'>
      <div className="bg-neutral-100 flex justify-between items-center sticky top-0 z-50 p-4 border-b border-neutral-300">
        <h2 className="text-lime-500 text-xl font-extrabold">{t('addClientModal.title')}</h2>
        <button
          className="text-black hover:text-red-500 text-2xl font-bold bg-neutral-300 rounded-lg w-10 h-10 flex items-center justify-center leading-none"
          onClick={onClose}
          aria-label="Close modal"
        >
          <X size={20} />
        </button>
        </div>

        <form onSubmit={handleSubmit} className="text-white flex flex-col gap-3  pl-8 pr-8">
          {/* Podstawowe informacje */}
          <div className="flex-col">
            <h4 className='header2'>{t('addClientModal.companyData')}</h4>
            <div className="grid2col mb-7">
              <div className="flexColumn">
                <label className="text-neutral-800">{t('addClientModal.companyName')}<br/>
                  <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} />
                </label>
                <label className="text-neutral-800">{t('addClientModal.client_code_erp')}<br/>
                  <input type="text" name="client_code_erp" value={formData.client_code_erp} onChange={handleChange} />
                </label>
                <label className="text-neutral-800">{t('addClientModal.status')}<br/>
                  <select name="status" className='AddSelectClient' value={formData.status} onChange={handleChange}>
                  <option value="1">Nowy</option>
                  <option value="0">Zweryfikowany</option>
                  </select>
                </label>
                <label className="text-neutral-800">{t('addClientModal.data_veryfication')}<br/>
                  <select name="data_veryfication" className='AddSelectClient' value={formData.data_veryfication}  onChange={handleChange}>
                  <option value="0">Brak danych</option>
                  <option value="1">Gotowe</option>
                  </select>
                </label>
                <label className="text-neutral-800">{t('addClientModal.nip')}<br/>
                  <input type="text" name="nip" value={formData.nip} onChange={handleChange} />
                </label>
                <label className="text-neutral-800">{t('addClientModal.clientCategory')}<br/>
                  <select name="client_category" value={formData.client_category} onChange={handleChange} className='AddSelectClient'>
                    <option value="">{t('addClientModal.selectCategory')}</option>
                    <option value="KLIENT POTENCJALNY">{t('addClientModal.categories.KLIENT_POTENCJALNY')}</option>
                    <option value="CENTRALA_SIEĆ">{t('addClientModal.categories.CENTRALA_SIEĆ')}</option>
                    <option value="DEWELOPER">{t('addClientModal.categories.DEWELOPER')}</option>
                    {/* <option value="DYSTRYBUTOR">{t('addClientModal.categories.DYSTRYBUTOR')}</option> */}
                    <option value="DYSTRYBUTOR_CENTRALA">{t('addClientModal.categories.DYSTRYBUTOR_CENTRALA')}</option>
                    <option value="DYSTRYBUTOR_MAGAZYN">{t('addClientModal.categories.DYSTRYBUTOR_MAGAZYN')}</option>
                    <option value="DYSTRYBUTOR_ODDZIAŁ">{t('addClientModal.categories.DYSTRYBUTOR_ODDZIAŁ')}</option>
                    <option value="INSTALATOR_ENGO_PLUS">{t('addClientModal.categories.INSTALATOR_ENGO_PLUS')}</option>
                    <option value="INSTALATOR">{t('addClientModal.categories.INSTALATOR')}</option>
                    <option value="INSTALATOR_FIRMA">{t('addClientModal.categories.INSTALATOR')}</option>
                    <option value="PODHURT">{t('addClientModal.categories.PODHURT')}</option>
                    <option value="PODHURT_ELEKTRYKA">{t('addClientModal.categories.PODHURT_ELEKTRYKA')}</option>
                    <option value="PROJEKTANT">{t('addClientModal.categories.PROJEKTANT')}</option>
                  </select>
                </label>
              </div>
              <div className="flexColumn">
              
                <label className="text-neutral-800">{t('addClientModal.street')}<br/>
                  <input type="text" name="street" value={formData.street} onChange={handleChange} />
                </label>
                <label className="text-neutral-800">{t('addClientModal.city')}<br/>
                  <input type="text" name="city" value={formData.city} onChange={handleChange} />
                </label>
                <label className="text-neutral-800">{t('addClientModal.voivodeship')}<br/>
                  <input type="text" name="voivodeship" value={formData.voivodeship} onChange={handleChange} />
                </label>
                <CountrySelect
                    label={t('addClientModal.country')}
                    value={formData.country}
                    onChange={handleChange}
                  />
                <label className="text-neutral-800">{t('addClientModal.postalCode')}<br/>
                  <input type="text" name="postal_code" value={formData.postal_code} onChange={handleChange} />
                </label>
                
              </div>
            </div>
          </div>


          <div className="flex-col mb-7">
            <h4 className="header2">{t('addClientModal.location')}</h4>
            <div className="grid2col mb-4">
              <label className="text-neutral-800">{t('addClientModal.latitude')}<br/>
                <input type="text" name="latitude" value={formData.latitude} onChange={handleChange} />
              </label>
              <label className="text-neutral-800">{t('addClientModal.longitude')}<br/>
                <input type="text" name="longitude" value={formData.longitude} onChange={handleChange} />
              </label>
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
          </div>

          <div className="flex-col mb-7">
            <h4 className='header2'>{t('addClientModal.accounts')}</h4>
            <div className='grid2col'>
              <div className="flexColumn">

              <label className="text-neutral-800">{t('addClientModal.engoTeamContact')}<br/>
                  <select name="engo_team_contact" value={formData.engo_team_contact} onChange={handleChange} className='AddSelectClient'>
                    <option value="">{t('addClientModal.chooseMember')}</option>
                    <option value="Pawel Kulpa; DOK">Pawel Kulpa, DOK</option>
                    <option value="Bartosz Jamruszkiewicz">Bartosz Jamruszkiewicz</option>
                    <option value="Arna Cizmovic; Bartosz Jamruszkiewicz">Arna Cizmovic, Bartosz Jamruszkiewicz</option>
                    <option value="Lukasz Apanel">Lukasz Apanel</option>
                    <option value="Damian Krzyzanowski; Lukasz Apanel">Damian Krzyzanowski, Lukasz Apanel</option>
                    <option value="Egidijus Karitonis; Lukasz Apane">Egidijus Karitonis, Lukasz Apanel</option>
                  </select>
                </label>

                <label className="text-neutral-800">{t('addClientModal.branches')}<br/>
                  <input type="text" name="number_of_branches" value={formData.number_of_branches} onChange={handleChange} />
                </label>
                <label className="text-neutral-800">{t('addClientModal.salesReps')}<br/>
                  <input type="text" name="number_of_sales_reps" value={formData.number_of_sales_reps} onChange={handleChange} />
                </label>
                <label className="text-neutral-800">{t('addClientModal.www')}<br/>
                  <input type="text" name="www" value={formData.www} onChange={handleChange} />
                </label>
                <label className="text-neutral-800">{t('addClientModal.facebook')}<br/>
                  <input type="text" name="facebook" value={formData.facebook} onChange={handleChange} />
                </label>
                <label className="text-neutral-800">{t('addClientModal.auctionService')}<br/>
                  <input type="text" name="auction_service" value={formData.auction_service} onChange={handleChange} />
                </label>
                <label className="text-neutral-800">
                  <input type="checkbox" name="private_brand" checked={formData.private_brand} onChange={handleChange} />{t('addClientModal.privateBrand')}
                </label>
                {formData.private_brand === 1 && (
                  <label className="text-neutral-800">{t('addClientModal.privateBrandDetails')}
                    <input type="text" name="private_brand_details" value={formData.private_brand_details} onChange={handleChange} />
                  </label>
                )}
                <label className="text-neutral-800">
                  <input type="checkbox" name="loyalty_program" checked={formData.loyalty_program} onChange={handleChange} />{t('addClientModal.loyaltyProgram')}<br/>
                </label>
                {formData.loyalty_program === 1 && (
                  <label className="text-neutral-800">{t('addClientModal.loyaltyProgramDetails')}<br/>
                    <input type="text" name="loyalty_program_details" value={formData.loyalty_program_details} onChange={handleChange} />
                  </label>
                )}
              </div>

              <div className="flexColumn">
                <label className="text-neutral-800">{t('addClientModal.turnoverPln')}<br/>
                  <input type="text" name="turnover_pln" value={formData.turnover_pln} onChange={handleChange} />
                </label>
                <label className="text-neutral-800">{t('addClientModal.turnoverEur')}<br/>
                  <input type="text" name="turnover_eur" value={formData.turnover_eur} onChange={handleChange} />
                </label>
                <label className="text-neutral-800">{t('addClientModal.installationSales')}<br/>
                  <input type="text" name="installation_sales_share" value={formData.installation_sales_share} onChange={handleChange} />
                </label>
                <label className="text-neutral-800">{t('addClientModal.automationSales')}<br/>
                  <input type="text" name="automatic_sales_share" value={formData.automatic_sales_share} onChange={handleChange} />
                </label>
                <label className="text-neutral-800">{t('addClientModal.salesPotential')}<br/>
                  <input type="text" name="sales_potential" value={formData.sales_potential} onChange={handleChange} />
                </label>
                <label className="text-neutral-800">{t('addClientModal.webstore')}<br/>
                  <input type="text" name="has_webstore" value={formData.has_webstore} onChange={handleChange} />
                </label>
                <label className="text-neutral-800">{t('addClientModal.b2b')}<br/>
                  <input type="text" name="has_b2b_platform" value={formData.has_b2b_platform} onChange={handleChange} />
                </label>
                <label className="text-neutral-800">{t('addClientModal.b2c')}<br/>
                  <input type="text" name="has_b2c_platform" value={formData.has_b2c_platform} onChange={handleChange} />
                </label>
              </div>
            </div>
          </div>


                
                      {/* Sales Structure */}
          <h4 className='header2'>{t('addClientModal.salesStructure')}</h4>
          {isStructureInvalid && (
            <div style={{ color: 'red', fontWeight: 'bold', marginBottom: '10px' }}>
              {t('addClientModal.structureSumError')}
            </div>
          )}
          <div className="flexColumn mb-7">
            <label className='text-neutral-800'>{t('addClientModal.structure.installer')}<br/>
              <input type="number" name="structure_installer" value={formData.structure_installer} onChange={handleChange} />
            </label>
            <label className='text-neutral-800'>{t('addClientModal.structure.wholesaler')}<br/>
              <input type="number" name="structure_wholesaler" value={formData.structure_wholesaler} onChange={handleChange} />
            </label>
            <label className='text-neutral-800'>{t('addClientModal.structure.ecommerce')}<br/>
              <input type="number" name="structure_ecommerce" value={formData.structure_ecommerce} onChange={handleChange} />
            </label>
            <label className='text-neutral-800'>{t('addClientModal.structure.retail')}<br/>
              <input type="number" name="structure_retail" value={formData.structure_retail} onChange={handleChange} />
            </label>
            <label className='text-neutral-800'>{t('addClientModal.structure.other')}<br/>
              <input type="number" name="structure_other" value={formData.structure_other} onChange={handleChange} />
            </label>
          </div>

          {/* Contact Section */}
          <h4 className='header2'>{t('addClientModal.contact')}</h4>
          {contacts.map((contact, index) => (
            <div key={index} className='contactBlock'>
              <label className='text-neutral-800'> 
                <select name="department" value={contact.department} onChange={(e) => handleContactChange(index, e)} className="contactSelect mb-4">
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
              </label>

              <div className='flex gap-2'>
                <label className='text-neutral-800'>{t('addClientModal.position')}
                  <input type="text" name="position" value={contact.position} onChange={(e) => handleContactChange(index, e)} className="contactInput" />
                </label>
                <label className='text-neutral-800'>{t('addClientModal.name')}
                  <input type="text" name="name" value={contact.name} onChange={(e) => handleContactChange(index, e)} className="contactInput" />
                </label>
                <label className='text-neutral-800'>{t('addClientModal.phone')}
                  <input type="text" name="phone" value={contact.phone} onChange={(e) => handleContactChange(index, e)} className="contactInput" />
                </label>
                <label className='text-neutral-800'>{t('addClientModal.email')}
                  <input type="email" name="email" value={contact.email} onChange={(e) => handleContactChange(index, e)} className="contactInput" />
                </label>
                <label className='text-neutral-800'>{t('addClientModal.functionNotes')}
                  <input type="text" name="function_notes" value={contact.function_notes} onChange={(e) => handleContactChange(index, e)} className="contactInput" />
                </label>
                <label className='text-neutral-800'>{t('addClientModal.decisionLevel')}
                  <select name="decision_level" value={contact.decision_level} onChange={(e) => handleContactChange(index, e)} className="contactSelect text-neutral-800">
                    <option value="">{t('addClientModal.decisionLevel')}</option>
                    <option value="wysoka">{t('addClientModal.decision.high')}</option>
                    <option value="średnia">{t('addClientModal.decision.medium')}</option>
                    <option value="brak">{t('addClientModal.decision.none')}</option>
                  </select>
                </label>
                <button className='buttonRed' type="button" onClick={() => handleRemoveContact(index)}>{t('addClientModal.remove')}</button>
              </div>
            </div>
          ))}

          <button className='buttonGreenNeg' type="button" onClick={handleAddContact} style={{ marginTop: '10px' }}>{t('addClientModal.addContact')}</button>

          {/* Buttons */}
          <div className='flex justify-end mt-5'>
            <button className='buttonGreen' type="submit" disabled={isSaving || isStructureInvalid}>
              {isSaving ? t('addClientModal.saving') : t('addClientModal.save')}
            </button>
            <button className='buttonRed' type="button" onClick={onClose} style={{ marginLeft: '10px' }}>
              {t('addClientModal.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddClientModal;

