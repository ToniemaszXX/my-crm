import useClientForm from '../hooks/useClientForm';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import LocationPicker from './LocationPicker';
import { useTranslation } from 'react-i18next';
import { isReadOnly, isBok } from '../utils/roles';
import CountrySelect from './CountrySelect';
import { X } from 'lucide-react';
import ClientVisits from "./ClientVisits";
import AddVisitModal from "./AddVisitModal";
import EditVisitModal from './EditVisitModal';
import { checkSessionBeforeSubmit } from '../utils/checkSessionBeforeSubmit';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { canEditVisit } from '../utils/visitUtils';




const normalizeCategory = cat => (cat ? cat.toString() : '').trim().replace(/\s+/g, '_');

function EditClientModal({ isOpen, client, onClose, onClientUpdated, allClients }) {
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
      const [isAddVisitOpen, setIsAddVisitOpen] = useState(false);
      const [refreshFlag, setRefreshFlag] = useState(false); // do odświeżenia ClientVisits po dodaniu
      const [selectedBranch, setSelectedBranch] = useState(null);
      const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
      const [selectedVisit, setSelectedVisit] = useState(null);
      const [isEditModalOpen, setIsEditModalOpen] = useState(false);




  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const isSessionOk = await checkSessionBeforeSubmit();
    if (!isSessionOk) {
      setIsSaving(false);
      return;
    }


    let data;

        const fieldsToTrim = ['company_name', 'client_code_erp', 'voivodeship', 'country', 'city', 'street', 'nip'];

    const cleanedFormData = { ...formData };
    fieldsToTrim.forEach((field) => {
      if (typeof cleanedFormData[field] === 'string') {
        cleanedFormData[field] = cleanedFormData[field].trim();
      }
    });

    try {
      const response = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/customers/edit.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...cleanedFormData, contacts })
      });
    
      const text = await response.text();
    


      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Invalid JSON response: ${text}`);
      }
    
      if (response.ok && data.success) {
        onClientUpdated();
        onClose();
      } else {
        alert(data?.message || 'Server error occurred');
      }
    } catch (error) {
      console.error('Error submitting client:', error);
      alert(`Error submitting client: ${error.message}`);
    } finally {
      setIsSaving(false);
    }

  };

  function handleNumericWithDotAndSpaceOnly(e) {
    const cleaned = e.target.value.replace(/[^\d. ]+/g, '');
    e.target.value = cleaned;
  }

  const handleBranchClick = (branch) => {
  setSelectedBranch(branch);
  setIsBranchModalOpen(true);
  };

  const formatNumberWithSpaces = (value) => {
    if (!value) return '';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const parseNumber = (value) => {
    return value.replace(/\s/g, '');
  };
  

  if (!isOpen || !formData) return null;

  return (

    <div className='fixed inset-0 bg-black/50 flex justify-center items-center z-[99]'> 

      <div className='bg-neutral-100 pb-8 rounded-lg w-[1100px] max-h-[90vh] overflow-y-auto'>

      <div className="bg-neutral-100 flex justify-between items-center sticky top-0 z-50 p-4 border-b border-neutral-300">
          <h2 className="text-lime-500 text-xl font-extrabold">{t('editClientModal.editLead')}</h2>
          <button
            className="text-black hover:text-red-500 text-2xl font-bold bg-neutral-300 rounded-lg w-10 h-10 flex items-center justify-center leading-none"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

          <form onSubmit={handleSubmit} className="text-white flex flex-col gap-3 mt-2 pl-8 pr-8">

          <div className="flex-col">
            <h4 className='header2'>{t('addClientModal.companyData')}</h4>
            
            <div className="grid2col mb-7">
                  <div className="flexColumn">
                    <label className="text-neutral-800">{t('addClientModal.companyName')}
                      <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} readOnly={readOnly}/>
                  </label>

                  <label className="text-neutral-800">{t('addClientModal.client_code_erp')}<br/>
                    <input type="text" name="client_code_erp" value={formData.client_code_erp} onChange={handleChange} readOnly={readOnly}/>
                  </label>
                  {!isBok(user) && (<label className="text-neutral-800">{t('addClientModal.status')}<br/>
                    <select name="status" className='AddSelectClient' value={formData.status} onChange={handleChange} readOnly={readOnly}>
                      <option value="1">Nowy</option>
                      <option value="0">Zweryfikowany</option>
                    </select>
                  </label>)}
                  <label className="text-neutral-800">{t('addClientModal.data_veryfication')}<br/>
                    <select name="data_veryfication" className='AddSelectClient' value={formData.data_veryfication} onChange={handleChange} readOnly={readOnly}>
                      <option value="0">Brak danych</option>
                      <option value="1">Gotowe</option>
                    </select>
                  </label>


                  <label className="text-neutral-800">{t('addClientModal.nip')}
                  <input type="text" name="nip" value={formData.nip} onChange={handleChange} readOnly={readOnly}/>
                  </label>
                  <label className='text-neutral-800'>
                  {t('addClientModal.clientCategory')}
                  <select name="client_category" value={formData.client_category} onChange={handleChange} disabled={readOnly} className='AddSelectClient'>
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
                    <option value="INSTALATOR_FIRMA">{t('addClientModal.categories.INSTALATOR_FIRMA')}</option>
                    <option value="PODHURT">{t('addClientModal.categories.PODHURT')}</option>
                    <option value="PODHURT_ELEKTRYKA">{t('addClientModal.categories.PODHURT_ELEKTRYKA')}</option>
                    <option value="PROJEKTANT">{t('addClientModal.categories.PROJEKTANT')}</option>
                    </select>

                    {formData.client_category === 'DYSTRYBUTOR_ODDZIAŁ' && (
                    <label className="text-neutral-800">Siedziba główna<br />
                      <select
                        name="index_of_parent"
                        value={(formData.index_of_parent || '').trim()}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            index_of_parent: e.target.value.trim(),
                          }))
                        }
                        className='AddSelectClient'
                        disabled={readOnly}
                      >
                        <option value="">Wybierz centralę</option>
                        {allClients
                          .filter((c) =>
                            normalizeCategory(c.client_category) === 'DYSTRYBUTOR_CENTRALA' &&
                            (c.client_code_erp && c.client_code_erp.trim() !== '')
                          )
                          .map((parent) => (
                            <option key={parent.id} value={(parent.client_code_erp || '').trim()}>
                              {parent.company_name} ({(parent.client_code_erp || '').trim()})
                            </option>
                        ))}
                      </select>
                    </label>
                  )}


                  </label>
                 
            </div>

            <div className='flexColumn'>
                  <label className="text-neutral-800">{t('addClientModal.street')}
                  <input type="text" name="street" value={formData.street} onChange={handleChange} readOnly={readOnly}/>
                  </label>
                  <label className="text-neutral-800">{t('addClientModal.city')}
                  <input type="text" name="city" value={formData.city} onChange={handleChange} readOnly={readOnly}/>
                  </label>
                  <label className='text-neutral-800'>
                  {t('addClientModal.postalCode')}
                  <input type="text" name="postal_code" value={formData.postal_code} onChange={handleChange} readOnly={readOnly}/>
                  </label>
                  <label className='text-neutral-800'>
                  {t('addClientModal.voivodeship')}
                  <input type="text" name="voivodeship" placeholder="" value={formData.voivodeship} onChange={handleChange} readOnly={readOnly}/>
                  </label>
                  <CountrySelect
                    label={t('addClientModal.country')}
                    value={formData.country}
                    onChange={handleChange}
                  />
                  
            </div>
          </div>

          {normalizeCategory(formData.client_category) === 'DYSTRYBUTOR_CENTRALA' && (
            <div className="mb-6">
              <h4 className="header2">Oddziały przypisane do tej centrali</h4>
              <div className="text-black flex flex-col">
                {allClients
                  .filter((client) =>
                    normalizeCategory(client.client_category) === 'DYSTRYBUTOR_ODDZIAŁ' &&
                    (formData.client_code_erp && client.index_of_parent) && // oba muszą być ustawione i nie puste/null
                    (client.index_of_parent || '').trim() === (formData.client_code_erp || '').trim()
                  )
                  .map((branch) => (
                    <a
                      key={branch.id}
                      className="cursor-pointer hover:text-lime-500"
                      onClick={() => handleBranchClick(branch)}
                    >
                      {branch.company_name}
                    </a>
                  ))}
              </div>
            </div>
          )}



          <div className="flex-col mb-7">
                <h4 className="header2">{t('addClientModal.location')}</h4>

                <div className="grid2col mb-4">
                  <label  className='text-neutral-800'>Szerokość geograficzna (lat)
                  <input
                    type="text"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    readOnly={readOnly}
                  />
                  </label>
                  <label  className='text-neutral-800'>Długość geograficzna (lng)
                  <input
                    type="text"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    readOnly={readOnly}
                  />
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
              <label className="text-neutral-800">{t('addClientModal.engoTeamContact')}<br/>
                  <select name="engo_team_contact" value={formData.engo_team_contact} onChange={handleChange} className='AddSelectClient' disabled={readOnly}>
                    <option value="">{t('addClientModal.chooseMember')}</option>
                    <option value="Paweł Kulpa; DOK">Paweł Kulpa, DOK</option>
                    <option value="Bartosz Jamruszkiewicz;">Bartosz Jamruszkiewicz</option>
                    <option value="Arna Cizmovic; Bartosz Jamruszkiewicz">Arna Cizmovic, Bartosz Jamruszkiewicz</option>
                    <option value="Bogdan Iacob; Bartosz Jamruszkiewicz">Bogdan Iacob, Bartosz Jamruszkiewicz</option>
                    <option value="Lukasz Apanel;">Łukasz Apanel</option>
                    <option value="Lukasz Apanel; Damian Krzyżanowski">Damian Krzyżanowski, Łukasz Apanel</option>
                    <option value="Lukasz Apanel; Egidijus Karitonis">Egidijus Karitonis, Łukasz Apanel</option>
                  </select>
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
                    <input
                      type="text"
                      name="turnover_pln"
                      onInput={handleNumericWithDotAndSpaceOnly}
                      placeholder=""
                      value={formatNumberWithSpaces(formData.turnover_pln)}
                      onChange={(e) => {
                        const numeric = parseNumber(e.target.value);
                        handleChange({
                          target: {
                            name: 'turnover_pln',
                            value: numeric,
                          }
                        });
                      }}
                      readOnly={readOnly}
                    />
                    </label>
                    <label className='text-neutral-800'>{t('addClientModal.turnoverEur')}
                    <input
                      type="text"
                      name="turnover_eur"
                      onInput={handleNumericWithDotAndSpaceOnly}
                      placeholder=""
                      value={formatNumberWithSpaces(formData.turnover_eur)}
                      onChange={(e) => {
                        const numeric = parseNumber(e.target.value);
                        handleChange({
                          target: {
                            name: 'turnover_eur',
                            value: numeric,
                          }
                        });
                      }}
                      readOnly={readOnly}
                    />
                    </label>
                    <label className='text-neutral-800'>{t('addClientModal.installationSales')}
                    <input type="text" name="installation_sales_share" placeholder="" onInput={handleNumericWithDotAndSpaceOnly} value={formData.installation_sales_share} onChange={handleChange} readOnly={readOnly}/>
                    </label>
                    <label className='text-neutral-800'>{t('addClientModal.automationSales')}
                    <input type="text" name="automatic_sales_share" placeholder="" onInput={handleNumericWithDotAndSpaceOnly} value={formData.automatic_sales_share} onChange={handleChange} readOnly={readOnly}/>
                    </label>
                    <label className='text-neutral-800'>{t('addClientModal.salesPotential')}
                    <input type="text" name="sales_potential" placeholder="" onInput={handleNumericWithDotAndSpaceOnly} value={formData.sales_potential} onChange={handleChange} readOnly={readOnly}/>
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
{isStructureInvalid && (
  <div style={{ color: 'red', fontWeight: 'bold', marginBottom: '10px' }}>
    {t('addClientModal.structureSumError')}
  </div>
)}
<div className="flexColumn mb-7">
  <label className='text-neutral-800'>{t('addClientModal.structure.installer')}<br />
      <input type="number" name="structure_installer" value={formData.structure_installer} onChange={handleChange} onFocus={(e) => {if (e.target.value === '0') e.target.value = '';}} readOnly={readOnly}/>
    </label>
    <label className='text-neutral-800'>{t('addClientModal.structure.wholesaler')}<br />
      <input type="number" name="structure_wholesaler" value={formData.structure_wholesaler} onChange={handleChange} onFocus={(e) => {if (e.target.value === '0') e.target.value = '';}} readOnly={readOnly}/>
    </label>
    <label className='text-neutral-800'>{t('addClientModal.structure.ecommerce')}<br />
      <input type="number" name="structure_ecommerce" value={formData.structure_ecommerce} onChange={handleChange} onFocus={(e) => {if (e.target.value === '0') e.target.value = '';}} readOnly={readOnly}/>
    </label>
    <label className='text-neutral-800'>{t('addClientModal.structure.retail')}<br />
      <input type="number" name="structure_retail" value={formData.structure_retail} onChange={handleChange} onFocus={(e) => {if (e.target.value === '0') e.target.value = '';}} readOnly={readOnly}/>
    </label>
    <label className='text-neutral-800'>{t('addClientModal.structure.other')}<br />
      <input type="number" name="structure_other" value={formData.structure_other} onChange={handleChange} onFocus={(e) => {if (e.target.value === '0') e.target.value = '';}} readOnly={readOnly}/>
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
      <option value="brak">{t('addClientModal.decision.none')}</option>
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

        <div className="mt-10 px-8">
          <h4 className="header2">{t('editClientModal.visits')}</h4>
          <button
            className="buttonGreen"
            onClick={() => setIsAddVisitOpen(true)}
          >
            {t('visit.addVisit')}
          </button>
          
          <ClientVisits
            client={client}
            clientId={client?.id}
            key={refreshFlag}
            onEdit={(visit) => {
              if (!canEditVisit(visit, user)) {
                alert("Edycja wizyty jest możliwa tylko do 24 godzin od jej utworzenia.");
                return;
              }
              setSelectedVisit(visit);
              setIsEditModalOpen(true);
            }}
          />


        
          <AddVisitModal
            isOpen={isAddVisitOpen}
            onClose={() => setIsAddVisitOpen(false)}
            onVisitAdded={() => {
              setIsAddVisitOpen(false);
              setRefreshFlag(prev => !prev);
            }}
            clients={[{ id: client.id, company_name: client.company_name }]}
            fixedClientId={client.id}
          />

                  {selectedVisit && (
          <EditVisitModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedVisit(null);
            }}
            onVisitUpdated={() => {
              setIsEditModalOpen(false);
              setSelectedVisit(null);
              setRefreshFlag(prev => !prev); // odśwież listę
            }}
            visit={selectedVisit}
            clients={[{ id: client.id, company_name: client.company_name }]}
          />
        )}


          {selectedBranch && (
            <EditClientModal
              isOpen={isBranchModalOpen}
              client={selectedBranch}
              onClose={() => {
                setIsBranchModalOpen(false);
                setSelectedBranch(null);
              }}
              onClientUpdated={() => {
                setIsBranchModalOpen(false);
                setSelectedBranch(null);
                onClientUpdated(); // odśwież listę po edycji
              }}
              allClients={allClients}
            />
          )}



        </div>
      </div>
    </div>
  );
}


export default EditClientModal;
