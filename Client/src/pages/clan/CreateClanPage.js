import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import '../../styles/AssignClanPage.css';

export default function CreateClanForm() {
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => {
      const updated = { ...prev };
      delete updated[name];
      return updated;
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Clan name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1000)); // Simulated delay
    console.log('Submitted: ', formData);
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="assign-form">
      <label>Clan Name</label>
      <input
        name="name"
        type="text"
        placeholder="Enter clan name"
        value={formData.name}
        onChange={handleChange}
        className={errors.name ? 'input-error' : ''}
      />
      {errors.name && <p className="input-error-text">{errors.name}</p>}

      <label>Description</label>
      <textarea
        name="description"
        type="text"
        placeholder="Describe your clan"
        value={formData.description}
        onChange={handleChange}
        rows="1"
        className={errors.description ? 'input-error' : ''}
      />
      {errors.description && <p className="input-error-text">{errors.description}</p>}

      <button className="btn" type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="spinner" /> : 'Create Clan'}
      </button>
    </form>
  );
}




