import { useEffect, useRef, useState } from "react";

import {
  getCompetitionsForAdmin,
  createCompetition,
  updateCompetition,
  deleteCompetition,
  finalizeCompetition,
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
  const [finalizingId, setFinalizingId] = useState(null);
  const [message, setMessage] = useState("");
  const [finalizedTopThree, setFinalizedTopThree] =
    useState([]);
  const [error, setError] = useState("");

  const formSectionRef = useRef(null);

  useEffect(() => {
    loadCompetitions();
  }, []);

  async function loadCompetitions() {
    setLoading(true);
    setError("");

    try {
      const data = await getCompetitionsForAdmin();
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

    window.setTimeout(() => {
      formSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Vul een naam in.");
      return;
    }

    if (!form.teamLockDate) {
      setError("Vul een deadline in.");
      return;
    }

    const competition = {
      name: form.name.trim(),
      year: Number(form.year),
      teamSize: Number(form.teamSize),
      budget: Number(form.budget),
      maxTransfers: Number(form.maxTransfers),
      teamLockDate: new Date(
        form.teamLockDate
      ).toISOString(),
      isActive: form.isActive,
    };

    setSaving(true);
    setError("");

    try {
      if (editingId) {
        await updateCompetition(
          editingId,
          competition
        );
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

  async function handleFinalize(competition) {
    const confirmed = window.confirm(
      `Weet je zeker dat je "${competition.name} ${competition.year}" definitief wilt afronden?\n\n` +
        "Hierna kan de wedstrijd niet meer worden gewijzigd."
    );

    if (!confirmed) {
      return;
    }

    setFinalizingId(competition.id);
    setError("");
    setMessage("");
    setFinalizedTopThree([]);

    try {
      const result = await finalizeCompetition(
        competition.id
      );

      setMessage(
        result.message ??
          "De wedstrijd is definitief afgerond."
      );

      setFinalizedTopThree(result.topThree ?? []);

      if (editingId === competition.id) {
        resetForm();
      }

      await loadCompetitions();
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setFinalizingId(null);
    }
  }

  return (
    <section
      className="responsive-card"
      style={{
        marginTop: "30px",
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

      {message && (
        <p
          style={{
            padding: "12px",
            border: "1px solid #2f7d32",
            borderRadius: "8px",
          }}
        >
          {message}
        </p>
      )}

      {finalizedTopThree.length > 0 && (
        <section
          className="responsive-card"
          style={{
            marginBottom: "20px",
            borderColor: "#d4af37",
          }}
        >
          <h4 style={{ marginTop: 0 }}>
            Definitieve top 3
          </h4>

          <ol style={{ marginBottom: 0 }}>
            {finalizedTopThree.map((standing) => (
              <li key={standing.userId}>
                <strong>{standing.userName}</strong>
                {" — "}
                {standing.totalPoints} punten
              </li>
            ))}
          </ol>
        </section>
      )}

      <section>
        <h4>Bestaande wedstrijden</h4>

        {loading && <p>Wedstrijden laden...</p>}

        {!loading && competitions.length === 0 && (
          <p>
            Er zijn nog geen wedstrijden toegevoegd.
          </p>
        )}

        {!loading && competitions.length > 0 && (
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
            }}
          >
            {competitions.map((competition) => (
              <li
                key={competition.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "14px 0",
                  borderBottom: "1px solid #ddd",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    flex: "1 1 300px",
                  }}
                >
                  <strong>
                    {competition.name}{" "}
                    {competition.year}
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

                  <div>
                    Status:{" "}
                    {competition.isFinished
                      ? "Afgerond"
                      : competition.isActive
                        ? "Actief"
                        : "Niet actief"}
                  </div>
                </div>

                <div className="responsive-actions">
                  <button
                    type="button"
                    onClick={() => onOpen(competition)}
                  >
                    Openen
                  </button>

                  {!competition.isFinished && (
                    <button
                      type="button"
                      onClick={() =>
                        handleFinalize(competition)
                      }
                      disabled={
                        finalizingId === competition.id ||
                        saving
                      }
                    >
                      {finalizingId === competition.id
                        ? "Afronden..."
                        : "Wedstrijd afronden"}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      startEditing(competition)
                    }
                    disabled={
                      competition.isFinished ||
                      finalizingId === competition.id
                    }
                  >
                    Wijzigen
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(competition)
                    }
                    disabled={
                      competition.isFinished ||
                      finalizingId === competition.id
                    }
                  >
                    Verwijderen
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        ref={formSectionRef}
        style={{
          marginTop: "35px",
          paddingTop: "25px",
          borderTop: "1px solid #ccc",
        }}
      >
        <h4>
          {editingId
            ? "Wedstrijd wijzigen"
            : "Nieuwe wedstrijd toevoegen"}
        </h4>

        {editingId && (
          <p>
            Je wijzigt momenteel een bestaande wedstrijd.
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
              className="responsive-input"
            />
          </FormField>

          <FormField label="Jaar">
            <input
              name="year"
              type="number"
              min="2000"
              max="2200"
              value={form.year}
              onChange={handleChange}
              className="responsive-input"
            />
          </FormField>

          <FormField label="Ploeggrootte">
            <input
              name="teamSize"
              type="number"
              min="1"
              value={form.teamSize}
              onChange={handleChange}
              className="responsive-input"
            />
          </FormField>

          <FormField label="Budget in miljoenen">
            <input
              name="budget"
              type="number"
              min="1"
              value={form.budget}
              onChange={handleChange}
              className="responsive-input"
            />
          </FormField>

          <FormField label="Maximaal aantal wissels">
            <input
              name="maxTransfers"
              type="number"
              min="0"
              value={form.maxTransfers}
              onChange={handleChange}
              className="responsive-input"
            />
          </FormField>

          <FormField label="Deadline ploeg">
            <input
              name="teamLockDate"
              type="datetime-local"
              value={form.teamLockDate}
              onChange={handleChange}
              className="responsive-input"
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

            {" "}
            Actief
          </label>

          <div className="responsive-actions">
            <button
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Opslaan..."
                : editingId
                  ? "Wijzigingen opslaan"
                  : "Wedstrijd toevoegen"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
              >
                Annuleren
              </button>
            )}
          </div>
        </form>
      </section>
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
  const timezoneOffset =
    date.getTimezoneOffset() * 60_000;

  return new Date(
    date.getTime() - timezoneOffset
  )
    .toISOString()
    .slice(0, 16);
}

export default CompetitionManager;