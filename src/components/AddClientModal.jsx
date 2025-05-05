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
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2>Add New Client</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
            {/* Podstawowe informacje */}

            <div style={styles.grid2col}>
                <div style={styles.flex}>
                <h4>Dane firmy</h4>
                <input type="text" name="company_name" placeholder="Company Name" value={formData.company_name} onChange={handleChange} />
                <input type="text" name="street" placeholder="Street" value={formData.street} onChange={handleChange} />
                <input type="text" name="city" placeholder="City" value={formData.city} onChange={handleChange} />
                <input type="text" name="voivodeship" placeholder="Voivodeship" value={formData.voivodeship} onChange={handleChange} />
                <input type="text" name="country" placeholder="Country" value={formData.country} onChange={handleChange} />
                <input type="text" name="postal_code" placeholder="Postal Code" value={formData.postal_code} onChange={handleChange} />
                <input type="text" name="nip" placeholder="NIP" value={formData.nip} onChange={handleChange} />
                </div>

                <div style={styles.flex}>
                <h4>Konta i serwisy</h4>
                <input type="text" name="engo_team_contact" placeholder="Engo Member" value={formData.engo_team_contact} onChange={handleChange} />
                <input type="text" name="number_of_branches" placeholder="Number of Branches" value={formData.number_of_branches} onChange={handleChange} />
                <input type="text" name="number_of_sales_reps" placeholder="Ilość oddziałów" value={formData.number_of_sales_reps} onChange={handleChange} />
                <input type="text" name="www" placeholder="Website" value={formData.www} onChange={handleChange} />
                
                <input type="text" name="turnover_pln" placeholder="Obrót PLN" value={formData.turnover_pln} onChange={handleChange} />
                <input type="text" name="turnover_eur" placeholder="Obrót EUR" value={formData.turnover_eur} onChange={handleChange} />
                <input type="text" name="installation_sales_share" placeholder="Udział sprzedaży instal." value={formData.installation_sales_share} onChange={handleChange} />
                <input type="text" name="sales_potential" placeholder="Potencjał PLN" value={formData.sales_potential} onChange={handleChange} />
                <input type="text" name="has_webstore" placeholder="Sklep www" value={formData.has_webstore} onChange={handleChange} />
                <input type="text" name="has_b2b_platform" placeholder="B2B" value={formData.has_b2b_platform} onChange={handleChange} />
                <input type="text" name="has_b2c_platform" placeholder="B2C" value={formData.has_b2c_platform} onChange={handleChange} />

                <input type="text" name="facebook" placeholder="Facebook" value={formData.facebook} onChange={handleChange} />
                <input type="text" name="auction_service" placeholder="Auction Service" value={formData.auction_service} onChange={handleChange} />
                
                
                <label>
                <input type="checkbox" name="private_brand" checked={formData.private_brand} onChange={handleChange} /> Marka własna
                </label>
                {formData.private_brand === 1 && (
                <input type="text" name="private_brand_details" placeholder="Private Brand Details" value={formData.private_brand_details} onChange={handleChange} />
                    )}

                    <label>
                    <input type="checkbox" name="loyalty_program" checked={formData.loyalty_program} onChange={handleChange} /> Program lojalnościowy
                    </label>
                    {formData.loyalty_program === 1 && (
                    <input type="text" name="loyalty_program_details" placeholder="Loyalty Program Details" value={formData.loyalty_program_details} onChange={handleChange} />
                    )}
                </div>
            </div>
            {/* Sales Structure */}
            <h4>Sales Structure (%)</h4>
            {isStructureInvalid && (
                <div style={{ color: 'red', fontWeight: 'bold', marginBottom: '10px' }}>
                    Suma struktur sprzedaży nie może przekraczać 100%
                </div>
                )}
            <div style={styles.flex}>
                <label>Instalator<br></br><input type="number" name="structure_installer" placeholder="Installer %" value={formData.structure_installer} onChange={handleChange} /></label>
                <label>Podhurt<br></br><input type="number" name="structure_wholesaler" placeholder="Wholesaler %" value={formData.structure_wholesaler} onChange={handleChange} /></label>
                <label>E-commarce<br></br><input type="number" name="structure_ecommerce" placeholder="E-commerce %" value={formData.structure_ecommerce} onChange={handleChange} /></label>
                <label>Kowalski<br></br><input type="number" name="structure_retail" placeholder="Retail (Kowalski) %" value={formData.structure_retail} onChange={handleChange} /></label>
            </div>

            <h4>Contacts</h4>
            {contacts.map((contact, index) => (
            <div key={index} style={styles.contactBlock}>
                <select name="department" value={contact.department} onChange={(e) => handleContactChange(index, e)} style={styles.contactSelect}>
                <option value="">Select Department</option>
                <option value="Zarząd">Zarząd / Właściciel</option>
                <option value="Sprzedaż">Dział Sprzedaży</option>
                <option value="Zakupy">Dział Zakupów</option>
                <option value="Marketing">Dział Marketingu</option>
                <option value="Inwestycje">Dział Inwestycji</option>
                <option value="Finanse">Dział Finansowy</option>
                <option value="Logistyka">Dział Logistyki</option>
                <option value="Administracja">Dział Administracji / Obsługi klienta</option>
                </select>
                <input type="text" name="position" placeholder="Position" value={contact.position} onChange={(e) => handleContactChange(index, e)} style={styles.contactInput}/>
                <input type="text" name="name" placeholder="Full Name" value={contact.name} onChange={(e) => handleContactChange(index, e)} style={styles.contactInput}/>
                <input type="text" name="phone" placeholder="Phone" value={contact.phone} onChange={(e) => handleContactChange(index, e)} style={styles.contactInput}/>
                <input type="email" name="email" placeholder="Email" value={contact.email} onChange={(e) => handleContactChange(index, e)} style={styles.contactInput}/>
                <input type="text" name="function_notes" placeholder="Function / Notes" value={contact.function_notes} onChange={(e) => handleContactChange(index, e)} style={styles.contactInput}/>
                <select name="decision_level" value={contact.decision_level} onChange={(e) => handleContactChange(index, e)} style={styles.contactSelect}>
                <option value="">Decision Level</option>
                <option value="wysoka">Wysoka</option>
                <option value="średnia">Średnia (zastępstwo)</option>
                <option value="nie ma">Brak</option>
                </select>
                <button type="button" onClick={() => handleRemoveContact(index)}>Remove</button>
            </div>
            ))}

            <button type="button" onClick={handleAddContact} style={{ marginTop: '10px' }}>Add Contact</button>


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

const styles = {
    overlay: {
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    },
    modal: {
      backgroundColor: 'grey',
      padding: '30px',
      borderRadius: '8px',
      width: '1100px',
      maxHeight: '90vh',
      overflowY: 'auto'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    },
    row: {
      display: 'flex',
      gap: '10px'
    },
    block: {
      marginTop: '10px'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '10px'
    },
    grid2col: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px'
      },
    flex: {
        display: 'flex',
        flexDirection: 'column'
    },
    contactBlock: {
        display: 'flex',
        border: '1px solid #ccc',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '15px',
        gap: '10px',
        alignItems: 'center',
        justifyContent: 'center'
    },
    contactInput: {
        flex: '0 0 100px', // szerokość inputu około 180px
        minWidth: '80px',
        height: '40px'
      },
      contactSelect: {
        flex: '0 0 170px',
        minWidth: '100px',
        height: '40px'
      }
  };

export default AddClientModal;
