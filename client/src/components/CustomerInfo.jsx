import { useState } from 'react';

function CustomerInfo({ customer = {}, onSave }) {
  const [form, setForm] = useState({
    fullName: customer.fullName || '',
    phoneNumber: customer.phoneNumber || '',
    email: customer.email || '',
    preferredServiceLocation: customer.preferredServiceLocation || '',
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave?.(form);
  };

  return (
    <div className="panel" style={{ marginBottom: '16px' }}>
      <h3 style={{ marginTop: 0 }}>Customer details</h3>
      <form className="form-grid" onSubmit={handleSubmit}>
        <input
          name="fullName"
          value={form.fullName}
          onChange={handleChange}
          placeholder="Full name"
        />
        <input
          name="phoneNumber"
          value={form.phoneNumber}
          onChange={handleChange}
          placeholder="Phone number"
        />
        <input
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email"
        />
        <input
          name="preferredServiceLocation"
          value={form.preferredServiceLocation}
          onChange={handleChange}
          placeholder="Preferred service location"
        />
        <button type="submit" className="secondary-button">
          Save customer info
        </button>
      </form>
    </div>
  );
}

export { CustomerInfo };
