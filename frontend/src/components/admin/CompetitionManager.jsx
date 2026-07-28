import { useEffect, useState } from "react";

import {
  getCompetitions,
  createCompetition,
  updateCompetition,
  deleteCompetition,
} from "../../services/Api";

const emptyForm = {
  name: "",
  year: new Date().getFullYear(),
  teamSize: 15,
  budget: 100,
  maxTransfers: 3,
  teamLockDate: "",
  isActive: true,
};

function CompetitionManager({ onOpen }) {
    
  const [competitions, setCompetitions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCompetitions();
  }, []);

  async function loadCompetitions() {
    setLoading(true);
    setError("");

    try {
      const data = await getCompetitions();
      setCompetitions(data);
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
  }

  function startEditing(competition) {
    setEditingId(competition.id);

    setForm({
      name: competition.name,
      year: competition.year,
      teamSize: competition.teamSize,
      budget: competition.budget,
      maxTransfers: competition.maxTransfers,
      teamLockDate: formatForDateTimeInput(
        competition.teamLockDate
      ),
      isActive: competition.isActive,
    });

    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const competition = {
      name: form.name.trim(),
      year: Number(form.year),
      teamSize: Number(form.teamSize),
      budget: Number(form.budget),
      maxTransfers: Number(form.maxTransfers),
      teamLockDate: new Date(form.teamLockDate).toISOString(),
      isActive: form.isActive,
    };

    if (!competition.name) {
      setError("Vul een naam in.");
      return;
    }

    if (!form.teamLockDate) {
      setError("Vul een deadline in.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (editingId) {
        await updateCompetition(editingId, competition);
      } else {
        await createCompetition(competition);
      }

      resetForm();
      await loadCompetitions();
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(competition) {
    const confirmed = window.confirm(
      `Weet je zeker dat je "${competition.name} ${competition.year}" wilt verwijderen?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteCompetition(competition.id);

      if (editingId === competition.id) {
        resetForm();
      }

      await loadCompetitions();
    } catch (error) {
      console.error(error);
      setError(error.message);
    }
  }

  return (
    <section
      style={{
        marginTop: "30px",
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <h3>Wedstrijden beheren</h3>

      {error && (
        <p
          style={{
            padding: "12px",
            border: "1px solid #c33",
            borderRadius: "8px",
          }}
        >
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <FormField label="Naam">
          <input
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            placeholder="Tour de France"
          />
        </FormField>

        <FormField label="Jaar">
          <input
            name="year"
            type="number"
            value={form.year}
            onChange={handleChange}
          />
        </FormField>

        <FormField label="Ploeggrootte">
          <input
            name="teamSize"
            type="number"
            min="1"
            value={form.teamSize}
            onChange={handleChange}
          />
        </FormField>

        <FormField label="Budget in miljoenen">
          <input
            name="budget"
            type="number"
            min="1"
            value={form.budget}
            onChange={handleChange}
          />
        </FormField>

        <FormField label="Maximaal aantal wissels">
          <input
            name="maxTransfers"
            type="number"
            min="0"
            value={form.maxTransfers}
            onChange={handleChange}
          />
        </FormField>

        <FormField label="Deadline ploeg">
          <input
            name="teamLockDate"
            type="datetime-local"
            value={form.teamLockDate}
            onChange={handleChange}
          />
        </FormField>

        <label
          style={{
            display: "block",
            marginBottom: "15px",
          }}
        >
          <input
            name="isActive"
            type="checkbox"
            checked={form.isActive}
            onChange={handleChange}
          />

          {" "}Actief
        </label>

        <div
          style={{
            display: "flex",
            gap: "10px",
          }}
        >
          <button type="submit" disabled={saving}>
            {saving
              ? "Opslaan..."
              : editingId
                ? "Wijzigingen opslaan"
                : "Wedstrijd toevoegen"}
          </button>

          {editingId && (
            <button type="button" onClick={resetForm}>
              Annuleren
            </button>
          )}
        </div>
      </form>

      <h4 style={{ marginTop: "30px" }}>
        Bestaande wedstrijden
      </h4>

      {loading && <p>Wedstrijden laden...</p>}

      {!loading && competitions.length === 0 && (
        <p>Er zijn nog geen wedstrijden toegevoegd.</p>
      )}

      <ul
        style={{
          listStyle: "none",
          padding: 0,
        }}
      >
        {competitions.map((competition) => (
          <li
            key={competition.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 0",
              borderBottom: "1px solid #ddd",
            }}
          >
            <div style={{ flex: 1 }}>
              <strong>
                {competition.name} {competition.year}
              </strong>

              <div>
                {competition.teamSize} renners ·{" "}
                {competition.budget}M budget ·{" "}
                {competition.maxTransfers} wissels
              </div>

              <div>
                Deadline:{" "}
                {new Date(
                  competition.teamLockDate
                ).toLocaleString("nl-NL")}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpen(competition)}
            >
              Openen
            </button>

            <button
             type="button"
              onClick={() => startEditing(competition)}
            >
              Wijzigen
            </button>

            <button
              type="button"
              onClick={() => handleDelete(competition)}
            >
              Verwijderen
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FormField({ label, children }) {
  return (
    <label
      style={{
        display: "block",
        marginBottom: "15px",
      }}
    >
      <span
        style={{
          display: "block",
          marginBottom: "6px",
        }}
      >
        {label}
      </span>

      <span
        style={{
          display: "block",
        }}
      >
        {children}
      </span>
    </label>
  );
}

function formatForDateTimeInput(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const timezoneOffset = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - timezoneOffset)
    .toISOString()
    .slice(0, 16);
}

export default CompetitionManager;