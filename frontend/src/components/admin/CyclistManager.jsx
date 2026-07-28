import { useEffect, useState } from "react";

import {
  getCyclists,
  getTeamsForAdmin,
  createCyclist,
  updateCyclist,
  deleteCyclist,
} from "../../services/Api";

const emptyForm = {
  name: "",
  teamId: "",
};

function CyclistManager() {
  const [cyclists, setCyclists] = useState([]);
  const [teams, setTeams] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingCyclistId, setEditingCyclistId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [cyclistData, teamData] = await Promise.all([
        getCyclists(),
        getTeamsForAdmin(),
      ]);

      setCyclists(cyclistData);
      setTeams(teamData);
    } catch (error) {
      console.error(error);
      setError("Renners of ploegen konden niet worden geladen.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingCyclistId(null);
    setError("");
  }

  function startEditing(cyclist) {
    setEditingCyclistId(cyclist.id);

    setForm({
      name: cyclist.name,
      teamId: cyclist.teamId,
    });

    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const cyclist = {
      name: form.name.trim(),
      teamId: form.teamId,
    };

    if (!cyclist.name) {
      setError("Vul de naam van de renner in.");
      return;
    }

    if (!cyclist.teamId) {
      setError("Selecteer een ploeg.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (editingCyclistId) {
        await updateCyclist(editingCyclistId, cyclist);
      } else {
        await createCyclist(cyclist);
      }

      resetForm();
      await loadData();
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(cyclist) {
    const confirmed = window.confirm(
      `Weet je zeker dat je "${cyclist.name}" wilt verwijderen?`
    );

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      await deleteCyclist(cyclist.id);

      if (editingCyclistId === cyclist.id) {
        resetForm();
      }

      await loadData();
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
      <h3>Renners beheren</h3>

      <p>
        Beheer hier de algemene rennergegevens. Rugnummer en prijs stel je
        per wedstrijd in bij Prijzen.
      </p>

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
        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="cyclist-name">Naam</label>
          <br />

          <input
            id="cyclist-name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            placeholder="Bijvoorbeeld Jonas Vingegaard"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "10px",
              marginTop: "6px",
            }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="cyclist-team">Professionele ploeg</label>
          <br />

          <select
            id="cyclist-team"
            name="teamId"
            value={form.teamId}
            onChange={handleChange}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "10px",
              marginTop: "6px",
            }}
          >
            <option value="">Selecteer een ploeg</option>

            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
          }}
        >
          <button type="submit" disabled={saving}>
            {saving
              ? "Opslaan..."
              : editingCyclistId
                ? "Wijzigingen opslaan"
                : "Renner toevoegen"}
          </button>

          {editingCyclistId && (
            <button type="button" onClick={resetForm}>
              Annuleren
            </button>
          )}
        </div>
      </form>

      <h4 style={{ marginTop: "30px" }}>Bestaande renners</h4>

      {loading && <p>Renners laden...</p>}

      {!loading && cyclists.length === 0 && (
        <p>Er zijn nog geen renners toegevoegd.</p>
      )}

      <ul
        style={{
          listStyle: "none",
          padding: 0,
        }}
      >
        {cyclists.map((cyclist) => (
          <li
            key={cyclist.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 0",
              borderBottom: "1px solid #ddd",
            }}
          >
            <div style={{ flex: 1 }}>
              <strong>{cyclist.name}</strong>

              <div>
                {cyclist.team?.name ?? "Geen ploeg"}
              </div>
            </div>

            <button
              type="button"
              onClick={() => startEditing(cyclist)}
            >
              Wijzigen
            </button>

            <button
              type="button"
              onClick={() => handleDelete(cyclist)}
            >
              Verwijderen
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default CyclistManager;