import { useCallback, useEffect, useState } from "react";
import api, { errorMessage } from "../api";
import ReadingForm from "../components/ReadingForm";
import { formatDate, todayString } from "../dates";

export default function Readings() {
  const [date, setDate] = useState(todayString());
  const [readings, setReadings] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/readings", { params: { date } });
      setReadings(data.readings);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  const changeDate = (e) => {
    setEditing(null);
    setDate(e.target.value);
  };

  async function remove(reading) {
    if (
      !window.confirm(
        `Delete the ${reading.slotLabel} reading (${reading.value} mg/dl)?`,
      )
    )
      return;
    try {
      await api.delete(`/readings/${reading.id}`);
      if (editing?.id === reading.id) setEditing(null);
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <>
      <h1>My readings</h1>

      <label className="date-picker">
        Date
        <input type="date" value={date} onChange={changeDate} />
      </label>

      <ReadingForm
        date={date}
        editing={editing}
        onCancel={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          load();
        }}
      />

      <div className="card">
        <h2>{formatDate(date)}</h2>
        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <p className="muted">Loading…</p>
        ) : readings.length === 0 ? (
          <p className="empty">
            No readings for this date yet. Add your first one above.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Time slot</th>
                <th>mg/dl</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {readings.map((r) => (
                <tr key={r.id}>
                  <td>{r.slotLabel}</td>
                  <td>
                    <strong>{r.value}</strong>
                  </td>
                  <td className="row-actions">
                    <button
                      className="btn btn-small btn-secondary"
                      onClick={() => setEditing(r)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-small btn-danger"
                      onClick={() => remove(r)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
