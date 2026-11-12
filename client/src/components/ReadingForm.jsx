import { useEffect, useState } from "react";
import api, { errorMessage } from "../api";
import { SLOTS } from "../slots";

export default function ReadingForm({ date, editing, onSaved, onCancel }) {
  const [slot, setSlot] = useState("morning");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // When "Edit" is clicked, fill the form; when cancelled, reset it.
  useEffect(() => {
    setError("");
    if (editing) {
      setSlot(editing.slot);
      setValue(String(editing.value));
    } else {
      setSlot("morning");
      setValue("");
    }
  }, [editing]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const body = { date, slot, value };
      if (editing) await api.put(`/readings/${editing.id}`, body);
      else await api.post("/readings", body);
      setValue("");
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      <h2>{editing ? "Edit reading" : "Add a reading"}</h2>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      <div className="form-row">
        <label>
          Time slot
          <select value={slot} onChange={(e) => setSlot(e.target.value)}>
            {SLOTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Glucose (mg/dl)
          <input
            type="text"
            inputMode="numeric"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. 110"
          />
        </label>
      </div>

      <div className="form-actions">
        <button className="btn" disabled={saving}>
          {saving ? "Saving…" : editing ? "Save changes" : "Add reading"}
        </button>
        {editing && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
