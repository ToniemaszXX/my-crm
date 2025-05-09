import useClientForm from '../hooks/useClientForm';
import { useEffect } from 'react';



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

  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const response = await fetch('/api/customers/edit.php', {
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
  console.log('client prop:', client);


  console.log('form prop:', formData);

  return (

    <div className='fixed inset-0 bg-black/50 flex justify-center items-center'> 
      <div className='bg-neutral-100 p-8 rounded-lg w-[1100px] max-h-[90vh] overflow-y-auto'>
        <h2 className="text-lime-500 text-xl font-extrabold mb-5">Edycja klienta</h2>
          <form onSubmit={handleSubmit} className="text-white flex flex-col gap-3">

          <div className="flex-col">
            <h4 className='header2'>Dane firmy</h4>
            
            <div className="grid2col mb-7">
                  <div className="flexColumn">
                  <input type="text" name="company_name" placeholder="Company Name" value={formData.company_name} onChange={handleChange} />
                  <input type="text" name="nip" placeholder="NIP" value={formData.nip} onChange={handleChange} />
                  <input type="text" name="street" placeholder="Street" value={formData.street} onChange={handleChange} />
                  <input type="text" name="city" placeholder="City" value={formData.city} onChange={handleChange} />
            </div>

            <div className='flexColumn'>
                  <input type="text" name="postal_code" placeholder="Postal Code" value={formData.postal_code} onChange={handleChange} />
                  <input type="text" name="voivodeship" placeholder="Voivodeship" value={formData.voivodeship} onChange={handleChange} />
                  <input type="text" name="country" placeholder="Country" value={formData.country} onChange={handleChange} />
            </div>
          </div>


          <div className="flex-col mb-7">

            <h4 className='header2'>Konta i serwisy</h4>

            <div className='grid2col'>
              <div className="flexColumn">
                    <input type="text" name="engo_team_contact" placeholder="Engo Member" value={formData.engo_team_contact} onChange={handleChange} />
                    <input type="text" name="number_of_branches" placeholder="Number of Branches" value={formData.number_of_branches} onChange={handleChange} />
                    <input type="text" name="number_of_sales_reps" placeholder="Ilość oddziałów" value={formData.number_of_sales_reps} onChange={handleChange} />
                    <input type="text" name="www" placeholder="Website" value={formData.www} onChange={handleChange} />
                    <input type="text" name="facebook" placeholder="Facebook" value={formData.facebook} onChange={handleChange} />
                    <input type="text" name="auction_service" placeholder="Auction Service" value={formData.auction_service} onChange={handleChange} />
                    <label className='text-neutral-800'>
                    <input type="checkbox" name="private_brand" checked={formData.private_brand === 1} onChange={handleChange} />
                    Marka własna
                    </label>
                      {formData.private_brand === 1 && (
                        <input type="text" name="private_brand_details" placeholder="Private Brand Details" value={formData.private_brand_details} onChange={handleChange} />
                      )}

                    <label className='text-neutral-800'>
                      <input type="checkbox" name="loyalty_program" checked={formData.loyalty_program === 1} onChange={handleChange} />
                      Program lojalnościowy
                    </label>
                      {formData.loyalty_program === 1 && (
                        <input type="text" name="loyalty_program_details" placeholder="Loyalty Program Details" value={formData.loyalty_program_details} onChange={handleChange} />
                      )}
              </div>
              
              <div className="flexColumn">
                    <input type="text" name="turnover_pln" placeholder="Obrót PLN" value={formData.turnover_pln} onChange={handleChange} />
                    <input type="text" name="turnover_eur" placeholder="Obrót EUR" value={formData.turnover_eur} onChange={handleChange} />
                    <input type="text" name="installation_sales_share" placeholder="Udział sprzedaży instal." value={formData.installation_sales_share} onChange={handleChange} />
                    <input type="text" name="automatic_sales_share" placeholder="Udział sprzedaży z automatyki" value={formData.automatic_sales_share} onChange={handleChange} />
                    <input type="text" name="sales_potential" placeholder="Potencjał PLN" value={formData.sales_potential} onChange={handleChange} />
                    <input type="text" name="has_webstore" placeholder="Sklep www" value={formData.has_webstore} onChange={handleChange} />
                    <input type="text" name="has_b2b_platform" placeholder="B2B" value={formData.has_b2b_platform} onChange={handleChange} />
                    <input type="text" name="has_b2c_platform" placeholder="B2C" value={formData.has_b2c_platform} onChange={handleChange} />
              </div>
              

            </div>

          </div>
</div>

<h4 className='header2'>Struktura sprzedaży (%)</h4>

<div className="flexColumn mb-7">
  <label className='text-neutral-800'>Instalator<br />
      <input type="number" name="structure_installer" value={formData.structure_installer} onChange={handleChange} />
    </label>
    <label className='text-neutral-800'>Podhurt<br />
      <input type="number" name="structure_wholesaler" value={formData.structure_wholesaler} onChange={handleChange} />
    </label>
    <label className='text-neutral-800'>E-commerce<br />
      <input type="number" name="structure_ecommerce" value={formData.structure_ecommerce} onChange={handleChange} />
    </label>
    <label className='text-neutral-800'>Kowalski<br />
      <input type="number" name="structure_retail" value={formData.structure_retail} onChange={handleChange} />
    </label>
    <label className='text-neutral-800'>Inne<br />
      <input type="number" name="structure_other" value={formData.structure_other} onChange={handleChange} />
    </label> 
</div>


<h4 className='header2'>Contacts</h4>
{contacts.map((c, i) => (
  <div key={i} className='contactBlock'>
    <select name="department" value={c.department} onChange={(e) => handleContactChange(i, e)} className="contactSelect mb-4">
      <option value="">Select Department</option>
      <option value="Zarząd">Zarząd / Właściciel</option>
      <option value="Sprzedaż">Dział Sprzedaży</option>
      <option value="Zakupy">Dział Zakupów</option>
      <option value="Marketing">Dział Marketingu</option>
      <option value="Inwestycje">Dział Inwestycji</option>
      <option value="Finanse">Dział Finansowy</option>
      <option value="Logistyka">Dział Logistyki</option>
      <option value="Administracja">Dział Administracji</option>
      <option value="Obsługi klienta">Obsługi klienta</option>
    </select>

    <div className='flex gap-2'>
    <input type="text" name="position" placeholder="Position" value={c.position} onChange={(e) => handleContactChange(i, e)}  className="contactInput"/>
    <input type="text" name="name" placeholder="Full Name" value={c.name} onChange={(e) => handleContactChange(i, e)}  className="contactInput"/>
    <input type="text" name="phone" placeholder="Phone" value={c.phone} onChange={(e) => handleContactChange(i, e)}  className="contactInput"/>
    <input type="email" name="email" placeholder="Email" value={c.email} onChange={(e) => handleContactChange(i, e)}  className="contactInput"/>
    <input type="text" name="function_notes" placeholder="Function / Notes" value={c.function_notes} onChange={(e) => handleContactChange(i, e)}  className="contactInput"/>
    <select name="decision_level" value={c.decision_level} onChange={(e) => handleContactChange(i, e)}  className="contactSelect text-neutral-800">
      <option value="">Decision Level</option>
      <option value="wysoka">Wysoka</option>
      <option value="średnia">Średnia</option>
      <option value="nie ma">Nie ma</option>
    </select>
    <button className='buttonRed' type="button" onClick={() => handleRemoveContact(i)}>Remove</button>
    </div>
  </div>
))}
<button className='buttonGreenNeg' type="button" onClick={handleAddContact}>Add Contact</button>


          <div style={{ marginTop: '20px' }}>
            <button className='buttonGreen' type="submit" disabled={isSaving || isStructureInvalid}>
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button className='buttonRed' type="button" onClick={onClose} style={{ marginLeft: '10px' }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center'
  },
  modal: {
    backgroundColor: 'grey', padding: '30px', borderRadius: '8px',
    width: '1100px', maxHeight: '90vh', overflowY: 'auto'
  },
  form: {
    display: 'flex', flexDirection: 'column', gap: '10px'
  },
  grid2col: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'
  },
  flex: {
    display: 'flex', flexDirection: 'column'
  },
  contactBlock: {
    display: 'flex', border: '1px solid #ccc', padding: '15px',
    borderRadius: '8px', marginBottom: '15px', gap: '10px',
    alignItems: 'center', justifyContent: 'center'
  },
  contactInput: {
    flex: '0 0 100px', minWidth: '80px', height: '40px'
  },
  contactSelect: {
    flex: '0 0 170px', minWidth: '100px', height: '40px'
  }
};

export default EditClientModal;
