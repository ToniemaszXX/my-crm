import { useEffect, useState } from 'react';

export default function useClientForm(initialData = {}) {
  const [formData, setFormData] = useState({
    id: null,
    company_name: '',
    client_code_erp: '',
    status: 1,
    data_veryfication: '',
    street: '',
    city: '',
    postal_code: '',
    voivodeship: '',
    country: '',
    nip: '',
    client_category: '',
    index_of_parent: '',
    engo_team_contact: '',
    number_of_branches: '',
    number_of_sales_reps: '',
    www: '',
    turnover_pln: '',
    turnover_eur: '',
    installation_sales_share: '',
    automatic_sales_share: '',
    sales_potential: '',
    has_webstore: '',
    has_b2b_platform: '',
    has_b2c_platform: '',
    facebook: '',
    auction_service: '',
    private_brand: 0,
    private_brand_details: '',
    loyalty_program: 0,
    loyalty_program_details: '',
    structure_installer: 0,
    structure_wholesaler: 0,
    structure_ecommerce: 0,
    structure_retail: 0,
    structure_other: 0,
    latitude: '',
    longitude: ''
  });

  const [contacts, setContacts] = useState([]);
  const [isSaving, setIsSaving] = useState(false);


  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData({
        id: initialData.id || null,
        company_name: initialData.company_name || '',
        client_code_erp: initialData.client_code_erp || '',
        status: initialData.status || '',
        data_veryfication: initialData.data_veryfication || '',
        street: initialData.street || '',
        city: initialData.city || '',
        postal_code: initialData.postal_code || '',
        voivodeship: initialData.voivodeship || '',
        country: initialData.country || '',
        nip: initialData.nip || '',
        client_category: (initialData.client_category || '').trim().replace(/\s+/g, '_'),
        index_of_parent:  initialData.index_of_parent || '',
        engo_team_contact: (initialData.engo_team_contact || '').trim() || '',
        number_of_branches: initialData.number_of_branches || '',
        number_of_sales_reps: initialData.number_of_sales_reps || '',
        www: initialData.www || '',
        turnover_pln: initialData.turnover_pln || '',
        turnover_eur: initialData.turnover_eur || '',
        installation_sales_share: initialData.installation_sales_share || '',
        automatic_sales_share: initialData.automatic_sales_share || '',
        sales_potential: initialData.sales_potential || '',
        has_webstore: initialData.has_webstore || '',
        has_b2b_platform: initialData.has_b2b_platform || '',
        has_b2c_platform: initialData.has_b2c_platform || '',
        facebook: initialData.facebook || '',
        auction_service: initialData.auction_service || '',
        private_brand: initialData.private_brand == 1 ? 1 : 0,
        private_brand_details: initialData.private_brand_details || '',
        loyalty_program: initialData.loyalty_program == 1 ? 1 : 0,
        loyalty_program_details: initialData.loyalty_program_details || '',
        structure_installer: initialData.structure_installer || 0,
        structure_wholesaler: initialData.structure_wholesaler || 0,
        structure_ecommerce: initialData.structure_ecommerce || 0,
        structure_retail: initialData.structure_retail || 0,
        structure_other: initialData.structure_other || 0,
        latitude: initialData.latitude || '',
        longitude: initialData.longitude || ''
      });

      setContacts(initialData.contacts || []);
    }
  }, [initialData]);

 const handleChange = (e) => {
  const { name, value, type, checked } = e.target;
  let newValue = type === 'checkbox' ? (checked ? 1 : 0) : value;

  // Przytnij spacje z przodu i końca dla tekstowych pól
  if (typeof newValue === 'string' && ['country', 'company_name', 'city', 'street', 'nip'].includes(name)) {
    newValue = newValue.trim();
  }

  if (name === 'status' || name === 'data_veryfication') {
    newValue = parseInt(value, 10);
  }

  if ([
    'structure_installer',
    'structure_wholesaler',
    'structure_ecommerce',
    'structure_retail',
    'structure_other'
  ].includes(name)) {
    const numeric = parseInt(newValue, 10);
    newValue = isNaN(numeric) ? 0 : Math.min(Math.max(numeric, 0), 100);
  }

  setFormData((prev) => ({
    ...prev,
    [name]: newValue,
  }));
};

  const handleContactChange = (index, e) => {
    const { name, value } = e.target;
    const updated = [...contacts];
    updated[index][name] = value;
    setContacts(updated);
  };

  const handleAddContact = () => {
    setContacts([...contacts, {
      department: '', position: '', name: '', phone: '', email: '', function_notes: '', decision_level: ''
    }]);
  };

  const handleRemoveContact = (index) => {
    const updated = [...contacts];
    updated.splice(index, 1);
    setContacts(updated);
  };

  const resetForm = () => {
    setFormData({
      id: null,
      company_name: '',
      client_code_erp: '',
      status: '',
      data_veryfication: '',
      street: '',
      city: '',
      postal_code: '',
      voivodeship: '',
      country: '',
      nip: '',
      client_category: '',
      index_of_parent:'',
      engo_team_contact: '',
      number_of_branches: '',
      number_of_sales_reps: '',
      www: '',
      turnover_pln: '',
      turnover_eur: '',
      installation_sales_share: '',
      automatic_sales_share: '',
      sales_potential: '',
      has_webstore: '',
      has_b2b_platform: '',
      has_b2c_platform: '',
      facebook: '',
      auction_service: '',
      private_brand: 0,
      private_brand_details: '',
      loyalty_program: 0,
      loyalty_program_details: '',
      structure_installer: 0,
      structure_wholesaler: 0,
      structure_ecommerce: 0,
      structure_retail: 0,
      structure_other: 0,
      latitude: '',
      longitude: ''
    });
    setContacts([]);
    setIsSaving(false);
  };

  const structureSum =
    Number(formData.structure_installer) +
    Number(formData.structure_wholesaler) +
    Number(formData.structure_ecommerce) +
    Number(formData.structure_retail) +
    Number(formData.structure_other);

  const isStructureInvalid = structureSum > 100;

  return {
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
  };
}
