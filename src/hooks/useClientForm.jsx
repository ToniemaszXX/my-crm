// src/hooks/useClientForm.jsx
import { useEffect, useState } from 'react';

export default function useClientForm(initialData = {}) {
  const [formData, setFormData] = useState({
    id: null,
    market_id: '',
    company_name: '',
    client_code_erp: '',
    status: 1,
    data_veryfication: 0,
    street: '',
    city: '',
    postal_code: '',
    voivodeship: '',
    country: '',
    nip: '',
    class_category: '-',
    client_category: '',
    client_subcategory: '',
    fairs: '',
    competition: '',
    index_of_parent: '',
    engo_team_director: '',
    engo_team_manager: '',
    engo_team_contact: '',
    // new: selected user IDs
    engo_team_director_id: undefined,
    engo_team_manager_id: undefined,
    engo_team_contact_id: undefined,
    number_of_branches: '',
    number_of_sales_reps: '',
    www: '',
    possibility_www_baner: 0,
    possibility_add_articles: 0,
    turnover_pln: '',
    turnover_eur: '',
    installation_sales_share: '',
    automatic_sales_share: '',
    sales_potential: '',
    has_webstore: '',
    has_ENGO_products_in_webstore: 0,
    possibility_add_ENGO_products_to_webstore: 0,
    has_b2b_platform: '',
    has_b2c_platform: '',
    facebook: '',
    possibility_graphic_and_posts_FB: 0,
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
      // Sanityzacja kontaktów: backend potrafi zwrócić null w polach stringowych,
      // a schema Zod oczekuje stringów (opcjonalnych) lub pustych stringów.
      const sanitizeContact = (c = {}) => ({
        id: c.id ?? undefined,
        department: c.department ?? '',
        position: c.position ?? '',
        first_name: c.first_name ?? '',
        last_name: c.last_name ?? '',
        name: (c.name ?? `${c.first_name || ''} ${c.last_name || ''}`).trim(),
        phone: c.phone ?? '',
        email: c.email ?? '',
        function_notes: c.function_notes ?? '',
        decision_level: c.decision_level ?? '-',
      });

      setFormData({
        id: initialData.id || null,
        market_id: initialData.market_id ?? '',
        company_name: initialData.company_name || '',
        client_code_erp: initialData.client_code_erp || '',
        status: initialData.status ?? 1,
        data_veryfication: initialData.data_veryfication ?? 0,
        street: initialData.street || '',
        city: initialData.city || '',
        postal_code: initialData.postal_code || '',
        voivodeship: initialData.voivodeship || '',
        country: initialData.country || '',
        nip: initialData.nip || '',
        class_category: (initialData.class_category || '-'),
        client_category: (initialData.client_category || '').trim().replace(/\s+/g, '_'),
        client_subcategory: initialData.client_subcategory || '',
        fairs: initialData.fairs || '',
        competition: initialData.competition || '',
        index_of_parent: initialData.index_of_parent || '',
  // UI etykiety ignorują wartości tekstowe z BE; etykieta będzie ustawiona po ID przez UserSelect
  engo_team_director: '',
  engo_team_manager: '',
  engo_team_contact: '',
        // new: hydrate IDs from record if provided by BE
        engo_team_director_id: initialData.engo_team_director_user_id || undefined,
        engo_team_manager_id: initialData.engo_team_manager_user_id || undefined,
        engo_team_contact_id: initialData.engo_team_user_id || undefined,
        number_of_branches: initialData.number_of_branches || '',
        number_of_sales_reps: initialData.number_of_sales_reps || '',
        www: initialData.www || '',
        possibility_www_baner: initialData.possibility_www_baner ?? 0,
        possibility_add_articles: initialData.possibility_add_articles ?? 0,
        turnover_pln: initialData.turnover_pln || '',
        turnover_eur: initialData.turnover_eur || '',
        installation_sales_share: initialData.installation_sales_share || '',
        automatic_sales_share: initialData.automatic_sales_share || '',
        sales_potential: initialData.sales_potential || '',
        has_webstore: initialData.has_webstore || '',
        has_ENGO_products_in_webstore: initialData.has_ENGO_products_in_webstore ?? 0,
        possibility_add_ENGO_products_to_webstore: initialData.possibility_add_ENGO_products_to_webstore ?? 0,
        has_b2b_platform: initialData.has_b2b_platform || '',
        has_b2c_platform: initialData.has_b2c_platform || '',
        facebook: initialData.facebook || '',
        possibility_graphic_and_posts_FB: initialData.possibility_graphic_and_posts_FB ?? 0,
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
      setContacts((initialData.contacts || []).map(sanitizeContact));
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === 'checkbox' ? (checked ? 1 : 0) : value;

    if (name === 'status' || name === 'data_veryfication') newValue = parseInt(value, 10);

    if ([
      'structure_installer',
      'structure_wholesaler',
      'structure_ecommerce',
      'structure_retail',
      'structure_other'
    ].includes(name)) {
      // Allow empty string while typing; clamp only when value is numeric
      if (newValue === '') {
        newValue = '';
      } else {
        const numeric = parseInt(newValue, 10);
        // if not a number (e.g., just cleared), keep as '' to avoid forcing 0 immediately
        if (isNaN(numeric)) {
          newValue = '';
        } else {
          newValue = Math.min(Math.max(numeric, 0), 100);
        }
      }
    }

    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  const handleContactChange = (index, e) => {
    const { name, value } = e.target;
    const updated = [...contacts];
    updated[index][name] = value;
    setContacts(updated);
  };

  const handleAddContact = () => {
    setContacts([
      ...contacts,
      { department: '', position: '', first_name: '', last_name: '', name: '', phone: '', email: '', function_notes: '', decision_level: '-' }
    ]);
  };

  const handleRemoveContact = (index) => {
    const updated = [...contacts];
    updated.splice(index, 1);
    setContacts(updated);
  };

  const resetForm = () => {
    setFormData({
      id: null,
      market_id: '',
      company_name: '', client_code_erp: '', status: 1, data_veryfication: 0,
      street: '', city: '', postal_code: '', voivodeship: '', country: '', nip: '', class_category: '-',
      client_category: '', fairs: '', competition: '', index_of_parent: '', engo_team_director: '', engo_team_contact: '',
      engo_team_manager: '',
      client_subcategory: '',
      // reset IDs as well
      engo_team_director_id: undefined,
      engo_team_manager_id: undefined,
      engo_team_contact_id: undefined,
      number_of_branches: '', number_of_sales_reps: '', www: '',
      turnover_pln: '', turnover_eur: '', installation_sales_share: '', automatic_sales_share: '', sales_potential: '',
      has_webstore: '', has_b2b_platform: '', has_b2c_platform: '', facebook: '', auction_service: '',
      private_brand: 0, private_brand_details: '', loyalty_program: 0, loyalty_program_details: '',
      structure_installer: 0, structure_wholesaler: 0, structure_ecommerce: 0, structure_retail: 0, structure_other: 0,
      latitude: '', longitude: ''
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
    formData, setFormData,
    contacts, setContacts,
    isSaving, setIsSaving,
    isStructureInvalid,
    handleChange, handleAddContact, handleRemoveContact, handleContactChange,
    resetForm
  };
}
