import { useState } from 'react';
import useClientForm from '../hooks/useClientForm';



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
        resetForm
      } = useClientForm(); // bez initialData
      

//   const [formData, setFormData] = useState({
//     company_name: '',
//     street: '',
//     city: '',
//     postal_code: '',
//     voivodeship: '',
//     country: '',
//     nip: '',
//     www: '',
//     facebook: '',
//     auction_service: '',
//     private_brand: 0,
//     private_brand_details: '',
//     loyalty_program: 0,
//     loyalty_program_details: '',
//     structure_installer: 0,
//     structure_wholesaler: 0,
//     structure_ecommerce: 0,
//     structure_retail: 0
//   });

//   const [isSaving, setIsSaving] = useState(false);
//   const [contacts, setContacts] = useState([]);

//   const handleAddContact = () => {
//     setContacts([...contacts, { department: '', position: '', name: '', phone: '', email: '', notes: '', decision_level: '' }]);
//   };

//   const handleContactChange = (index, e) => {
//     const { name, value } = e.target;
//     const updatedContacts = [...contacts];
//     updatedContacts[index][name] = value;
//     setContacts(updatedContacts);
//   };

//   const handleRemoveContact = (index) => {
//     const updatedContacts = [...contacts];
//     updatedContacts.splice(index, 1);
//     setContacts(updatedContacts);
//   };

//   const handleChange = (e) => {
//     const { name, value, type, checked } = e.target;
  
//     let newValue = type === 'checkbox' ? (checked ? 1 : 0) : value;
  
//     // Limit procentów
//     if (
//       ['structure_installer', 'structure_wholesaler', 'structure_ecommerce', 'structure_retail'].includes(name)
//     ) {
//       const numeric = parseInt(newValue, 10);
//       if (isNaN(numeric) || numeric < 0) newValue = 0;
//       else if (numeric > 100) newValue = 100;
//       else newValue = numeric;
//     }
  
//     setFormData((prev) => ({
//       ...prev,
//       [name]: newValue,
//     }));
//   };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const response = await fetch('/api/customers/add.php', {
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
        alert('Klient dodany poprawnie');
        resetForm();
      onClientAdded();
      // Reset formularza:
    // setFormData({
    //     company_name: '',
    //     street: '',
    //     city: '',
    //     postal_code: '',
    //     voivodeship: '',
    //     country: '',
    //     nip: '',
    //     www: '',
    //     facebook: '',
    //     auction_service: '',
    //     private_brand: 0,
    //     private_brand_details: '',
    //     loyalty_program: 0,
    //     loyalty_program_details: '',
    //     structure_installer: 0,
    //     structure_wholesaler: 0,
    //     structure_ecommerce: 0,
    //     structure_retail: 0
    //   });
    //   setContacts([]);
      onClose();
    } else {
      alert('Error adding client');
    }

    setIsSaving(false);
  };

  if (!isOpen) return null;

//   const structureSum =
//   Number(formData.structure_installer) +
//   Number(formData.structure_wholesaler) +
//   Number(formData.structure_ecommerce) +
//   Number(formData.structure_retail);

// const isStructureInvalid = structureSum > 100;


  return (
    <div className='fixed inset-0 bg-black/50 flex justify-center items-center'> 
      <div className='bg-neutral-100 p-8 rounded-lg w-[1100px] max-h-[90vh] overflow-y-auto'>
        <h2 className="text-lime-500 text-xl font-extrabold mb-5">Add New Client</h2>
        <form onSubmit={handleSubmit} className="text-white flex flex-col gap-3">
            {/* Podstawowe informacje */}

            <div className="flex-col">
                <h4 className='header2' >Dane firmy</h4>

                <div className="grid2col mb-7">
                  <div className="flexColumn">
                    <input type="text" name="company_name" placeholder="Nazwa firmy" value={formData.company_name} onChange={handleChange} />
                    <input type="text" name="nip" placeholder="NIP" value={formData.nip} onChange={handleChange} />
                    <input type="text" name="street" placeholder="Ulica" value={formData.street} onChange={handleChange} />
                    <input type="text" name="city" placeholder="Miasto" value={formData.city} onChange={handleChange} />
                  </div>
                
                  <div className="flexColumn">
                    <input type="text" name="voivodeship" placeholder="Województwo" value={formData.voivodeship} onChange={handleChange} /> 
                    <input type="text" name="country" placeholder="Kraj" value={formData.country} onChange={handleChange} />
                    <input type="text" name="postal_code" placeholder="Kod kreskowy" value={formData.postal_code} onChange={handleChange} />
                  </div>

                </div>
              </div>

                <div className="flex-col mb-7">
                <h4 className='header2'>Konta i serwisy</h4>
                
                <div className='grid2col'>

                  <div className="flexColumn">
                    <input type="text" name="engo_team_contact" placeholder="Engo Team Osoba" value={formData.engo_team_contact} onChange={handleChange} />
                    <input type="text" name="number_of_branches" placeholder="Ilość oddziałów" value={formData.number_of_branches} onChange={handleChange} />
                    <input type="text" name="number_of_sales_reps" placeholder="Ilość handlowców" value={formData.number_of_sales_reps} onChange={handleChange} />
                    <input type="text" name="www" placeholder="WWW" value={formData.www} onChange={handleChange} />
                    <input type="text" name="facebook" placeholder="Facebook" value={formData.facebook} onChange={handleChange} />
                    <input type="text" name="auction_service" placeholder="Serwis aukcyjny" value={formData.auction_service} onChange={handleChange} />

                    <label className='text-neutral-800'>
                    <input type="checkbox" name="private_brand" checked={formData.private_brand} onChange={handleChange} /> Marka własna
                    </label>
                      {formData.private_brand === 1 && (
                      <input type="text" name="private_brand_details" placeholder="Private Brand Details" value={formData.private_brand_details} onChange={handleChange} />
                        )}

                    <label className='text-neutral-800'>
                    <input type="checkbox" name="loyalty_program" checked={formData.loyalty_program} onChange={handleChange} /> Program lojalnościowy
                    </label>
                      {formData.loyalty_program === 1 && (
                      <input type="text" name="loyalty_program_details" placeholder="Loyalty Program Details" value={formData.loyalty_program_details} onChange={handleChange} />
                      )}
                  </div>

                  <div className='flexColumn'>
                    <input type="text" name="turnover_pln" placeholder="Obrót PLN" value={formData.turnover_pln} onChange={handleChange} />
                    <input type="text" name="turnover_eur" placeholder="Obrót EUR" value={formData.turnover_eur} onChange={handleChange} />
                    <input type="text" name="installation_sales_share" placeholder="Udział sprzedaży instal." value={formData.installation_sales_share} onChange={handleChange} />
                    <input type="text" name="sales_potential" placeholder="Potencjał PLN" value={formData.sales_potential} onChange={handleChange} />
                    <input type="text" name="has_webstore" placeholder="Sklep www" value={formData.has_webstore} onChange={handleChange} />
                    <input type="text" name="has_b2b_platform" placeholder="B2B" value={formData.has_b2b_platform} onChange={handleChange} />
                    <input type="text" name="has_b2c_platform" placeholder="B2C" value={formData.has_b2c_platform} onChange={handleChange} />  
                  </div>

                </div>

                </div>

                
            {/* Sales Structure */}
            <h4 className='header2'>Sales Structure (%)</h4>
            {isStructureInvalid && (
                <div style={{ color: 'red', fontWeight: 'bold', marginBottom: '10px' }}>
                    Suma struktur sprzedaży nie może przekraczać 100%
                </div>
                )}
            <div className="flexColumn mb-7">
                <label className='text-neutral-800'>Instalator<br></br><input type="number" name="structure_installer" placeholder="Instalatorzy %" value={formData.structure_installer} onChange={handleChange} /></label>
                <label className='text-neutral-800'>Podhurt<br></br><input type="number" name="structure_wholesaler" placeholder="Podhurt %" value={formData.structure_wholesaler} onChange={handleChange} /></label>
                <label className='text-neutral-800'>E-commarce<br></br><input type="number" name="structure_ecommerce" placeholder="E-commerce %" value={formData.structure_ecommerce} onChange={handleChange} /></label>
                <label className='text-neutral-800'>Kowalski<br></br><input type="number" name="structure_retail" placeholder="Kowalski %" value={formData.structure_retail} onChange={handleChange} /></label>
            </div>

            <h4 className='header2'>Kontakt</h4>
            {contacts.map((contact, index) => (
            <div key={index} className='contactBlock'>
                <select name="department" value={contact.department} onChange={(e) => handleContactChange(index, e)} className="contactSelect">
                <option className='' value="">Dział</option>
                <option value="Zarząd">Zarząd / Właściciel</option>
                <option value="Sprzedaż">Dział Sprzedaży</option>
                <option value="Zakupy">Dział Zakupów</option>
                <option value="Marketing">Dział Marketingu</option>
                <option value="Inwestycje">Dział Inwestycji</option>
                <option value="Finanse">Dział Finansowy</option>
                <option value="Logistyka">Dział Logistyki</option>
                <option value="Administracja">Dział Administracji / Obsługi klienta</option>
                </select>
                <input type="text" name="position" placeholder="Stanowisko" value={contact.position} onChange={(e) => handleContactChange(index, e)} className="contactInput"/>
                <input type="text" name="name" placeholder="Imię i nazwisko" value={contact.name} onChange={(e) => handleContactChange(index, e)} className="contactInput"/>
                <input type="text" name="phone" placeholder="Telefon" value={contact.phone} onChange={(e) => handleContactChange(index, e)} className="contactInput"/>
                <input type="email" name="email" placeholder="Email" value={contact.email} onChange={(e) => handleContactChange(index, e)} className="contactInput"/>
                <input type="text" name="function_notes" placeholder="Funkcja / Uwagi" value={contact.function_notes} onChange={(e) => handleContactChange(index, e)} className="contactInput"/>
                <select className='text-neutral-800' name="decision_level" value={contact.decision_level} onChange={(e) => handleContactChange(index, e)} className="contactSelect">
                <option value="">Decyzyjność</option>
                <option value="wysoka">Wysoka</option>
                <option value="średnia">Średnia (zastępstwo)</option>
                <option value="nie ma">Brak</option>
                </select>
                <button className='buttonRed' type="button" onClick={() => handleRemoveContact(index)}>Remove</button>
            </div>
            ))}

            <button className='buttonGreen' type="button" onClick={handleAddContact} style={{ marginTop: '10px' }}>Add Contact</button>


            {/* Przyciski */}
            <div style={{ marginTop: '20px' }}>
                <button type="submit" disabled={isSaving || isStructureInvalid}>{isSaving ? 'Saving...' : 'Save'}</button>
                <button type="button" onClick={onClose} style={{ marginLeft: '10px' }}>Cancel</button>
            </div>
            </form>
      </div>
    </div>
  );
}

export default AddClientModal;
