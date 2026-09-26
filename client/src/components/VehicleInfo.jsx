import { useState } from 'react';

function VehicleInfo({ vehicle = {}, onSave }) {
  const [form, setForm] = useState({
    make: vehicle.make || '',
    model: vehicle.model || '',
    year: vehicle.year || '',
    registrationNumber: vehicle.registrationNumber || '',
    mileage: vehicle.mileage || '',
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
    <div className="panel">
      <h3 style={{ marginTop: 0 }}>Vehicle details</h3>
      <form className="form-grid" onSubmit={handleSubmit}>
        <input
          name="make"
          value={form.make}
          onChange={handleChange}
          placeholder="Make"
        />
        <input
          name="model"
          value={form.model}
          onChange={handleChange}
          placeholder="Model"
        />
        <input
          name="year"
          value={form.year}
          onChange={handleChange}
          placeholder="Year"
        />
        <input
          name="registrationNumber"
          value={form.registrationNumber}
          onChange={handleChange}
          placeholder="Registration number"
        />
        <input
          name="mileage"
          value={form.mileage}
          onChange={handleChange}
          placeholder="Mileage"
        />
        <button type="submit" className="secondary-button">
          Save vehicle info
        </button>
      </form>
    </div>
  );
}

export { VehicleInfo };
