import { useEffect, useMemo, useState } from "react";

import {
  getStages,
  createStage,
  updateStage,
  deleteStage,
} from "../../services/Api";

const STAGE_TYPES = [
  { value: 0, label: "Vlak" },
  { value: 1, label: "Heuvelachtig" },
  { value: 2, label: "Berg" },
  { value: 3, label: "Tijdrit" },
];

const EMPTY_FORM = {
  stageNumber: "",
  startTime: "",
  startLocation: "",
  finishLocation: "",
  type: 0,
};

function StageManager({ competition }) {
  const [stages, setStages] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingStageId, setEditingStageId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingStageId, setDeletingStageId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    resetForm();
    loadStages();
  }, [competition.id]);

  const sortedStages = useMemo(() => {
    return [...stages].sort(
      (first, second) => first.stageNumber - second.stageNumber
    );
  }, [stages]);

  async function loadStages() {
    setLoading(true);
    setError("");

    try {
      const data = await getStages(competition.id);
      setStages(data);
    } catch (error) {
      console.error(error);
      setError(
        cleanApiError(
          error.message,
          "De etappes konden niet worden geladen."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: name === "type" ? Number(value) : value,
    }));
  }

  function startEditing(stage) {
    setEditingStageId(stage.id);
    setForm({
      stageNumber: String(stage.stageNumber),
      startTime: formatForDateTimeInput(stage.startTime),
      startLocation: stage.startLocation ?? "",
      finishLocation: stage.finishLocation ?? "",
      type: getStageTypeValue(stage.type),
    });
    setError("");
    setMessage("");
  }

  function cancelEditing() {
    resetForm();
    setError("");
    setMessage("");
  }

  function resetForm() {
    setEditingStageId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateForm(form);
    if (validationError) {
      setError(validationError);
      setMessage("");
      return;
    }

    const stageNumber = Number(form.stageNumber);
    const stage = {
      stageNumber,
      date: getDateFromStartTime(form.startTime),
      startTime: new Date(form.startTime).toISOString(),
      startLocation: form.startLocation.trim(),
      finishLocation: form.finishLocation.trim(),
      type: Number(form.type),
    };

    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (editingStageId !== null) {
        await updateStage(competition.id, editingStageId, stage);
        setMessage(`Etappe ${stageNumber} is bijgewerkt.`);
      } else {
        await createStage(competition.id, stage);
        setMessage(`Etappe ${stageNumber} is toegevoegd.`);
      }

      resetForm();
      await loadStages();
    } catch (error) {
      console.error(error);
      setError(
        cleanApiError(
          error.message,
          editingStageId !== null
            ? "De etappe kon niet worden bijgewerkt."
            : "De etappe kon niet worden toegevoegd."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(stage) {
    const confirmed = window.confirm(
      `Weet je zeker dat je etappe ${stage.stageNumber} van ${stage.startLocation} naar ${stage.finishLocation} wilt verwijderen?`
    );

    if (!confirmed) return;

    setDeletingStageId(stage.id);
    setError("");
    setMessage("");

    try {
      await deleteStage(competition.id, stage.id);

      if (editingStageId === stage.id) {
        resetForm();
      }

      setMessage(`Etappe ${stage.stageNumber} is verwijderd.`);
      await loadStages();
    } catch (error) {
      console.error(error);
      setError(
        cleanApiError(
          error.message,
          "De etappe kon niet worden verwijderd."
        )
      );
    } finally {
      setDeletingStageId(null);
    }
  }

  return (
    <section>
      <header style={{ marginBottom: "20px" }}>
        <h3>Etappes</h3>
        <p>
          Beheer de etappes van {competition.name} {competition.year}.
        </p>
      </header>

      {error && (
        <p
          role="alert"
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
            border: "1px solid #2a7",
            borderRadius: "8px",
          }}
        >
          {message}
        </p>
      )}

      <div className="stage-manager-layout">
        <section className="responsive-card">
          <h4>{editingStageId !== null ? "Etappe wijzigen" : "Etappe toevoegen"}</h4>

          <form onSubmit={handleSubmit}>
            <FormField label="Etappenummer" htmlFor="stage-number">
              <input
                id="stage-number"
                name="stageNumber"
                type="number"
                min="1"
                step="1"
                value={form.stageNumber}
                onChange={handleChange}
                disabled={saving}
                className="responsive-input"
              />
            </FormField>
<FormField label="Startdatum en starttijd" htmlFor="stage-start-time">
              <input
                id="stage-start-time"
                name="startTime"
                type="datetime-local"
                value={form.startTime}
                onChange={handleChange}
                disabled={saving}
                className="responsive-input"
              />
            </FormField>

            <FormField label="Startplaats" htmlFor="stage-start-location">
              <input
                id="stage-start-location"
                name="startLocation"
                type="text"
                value={form.startLocation}
                onChange={handleChange}
                disabled={saving}
                className="responsive-input"
              />
            </FormField>

            <FormField label="Finishplaats" htmlFor="stage-finish-location">
              <input
                id="stage-finish-location"
                name="finishLocation"
                type="text"
                value={form.finishLocation}
                onChange={handleChange}
                disabled={saving}
                className="responsive-input"
              />
            </FormField>

            <FormField label="Type" htmlFor="stage-type">
              <select
                id="stage-type"
                name="type"
                value={form.type}
                onChange={handleChange}
                disabled={saving}
                className="responsive-input"
              >
                {STAGE_TYPES.map((stageType) => (
                  <option key={stageType.value} value={stageType.value}>
                    {stageType.label}
                  </option>
                ))}
              </select>
            </FormField>

            <div className="responsive-actions">
              <button type="submit" disabled={saving}>
                {saving
                  ? "Opslaan..."
                  : editingStageId !== null
                    ? "Wijzigingen opslaan"
                    : "Etappe toevoegen"}
              </button>

              {editingStageId !== null && (
                <button type="button" onClick={cancelEditing} disabled={saving}>
                  Annuleren
                </button>
              )}
            </div>
          </form>
        </section>

        <section
          className="responsive-card"
          style={{
            minWidth: 0,
          }}
        >
          <h4>Etappeoverzicht</h4>

          {loading ? (
            <p>Etappes laden...</p>
          ) : sortedStages.length === 0 ? (
            <p>Er zijn nog geen etappes toegevoegd.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <TableHeader>Nr.</TableHeader>
                    <TableHeader>Datum</TableHeader>
                    <TableHeader>Starttijd</TableHeader>
                    <TableHeader>Route</TableHeader>
                    <TableHeader>Type</TableHeader>
                    <TableHeader>Uitslag</TableHeader>
                    <TableHeader>Acties</TableHeader>
                  </tr>
                </thead>

                <tbody>
                  {sortedStages.map((stage) => (
                    <tr key={stage.id}>
                      <TableCell>
                        <strong>{stage.stageNumber}</strong>
                      </TableCell>
                      <TableCell>{formatDisplayDate(stage.date)}</TableCell>
                      <TableCell>{formatDisplayDateTime(stage.startTime)}</TableCell>
                      <TableCell>
                        {stage.startLocation} {" → "} {stage.finishLocation}
                      </TableCell>
                      <TableCell>{getStageTypeLabel(stage.type)}</TableCell>
                      <TableCell>
                        {stage.resultsPublished ? "Gepubliceerd" : "Niet gepubliceerd"}
                      </TableCell>
                      <TableCell>
                        <div className="responsive-actions">
                          <button
                            type="button"
                            onClick={() => startEditing(stage)}
                            disabled={saving || deletingStageId === stage.id}
                          >
                            Wijzigen
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(stage)}
                            disabled={saving || deletingStageId === stage.id}
                          >
                            {deletingStageId === stage.id
                              ? "Verwijderen..."
                              : "Verwijderen"}
                          </button>
                        </div>
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

function FormField({ label, htmlFor, children }) {
  return (
    <div style={{ marginBottom: "15px" }}>
      <label htmlFor={htmlFor} style={{ display: "block", marginBottom: "6px" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function TableHeader({ children }) {
  return (
    <th
      scope="col"
      style={{
        padding: "10px",
        borderBottom: "2px solid #ccc",
        textAlign: "left",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </th>
  );
}

function TableCell({ children }) {
  return (
    <td
      style={{
        padding: "12px 10px",
        borderBottom: "1px solid #ddd",
        verticalAlign: "top",
      }}
    >
      {children}
    </td>
  );
}

function validateForm(form) {
  const stageNumber = Number(form.stageNumber);

  if (!Number.isInteger(stageNumber) || stageNumber <= 0) {
    return "Vul een geldig etappenummer in.";
  }
  if (!form.startTime) return "Vul een startdatum en starttijd in.";
  if (Number.isNaN(new Date(form.startTime).getTime())) {
    return "Vul een geldige startdatum en starttijd in.";
  }
  if (!form.startLocation.trim()) return "Vul een startplaats in.";
  if (!form.finishLocation.trim()) return "Vul een finishplaats in.";

  const type = Number(form.type);
  if (!STAGE_TYPES.some((stageType) => stageType.value === type)) {
    return "Selecteer een geldig etappetype.";
  }

  return "";
}

function getStageTypeValue(type) {
  if (typeof type === "number") return type;

  switch (String(type).toLowerCase()) {
    case "flat":
      return 0;
    case "hilly":
      return 1;
    case "mountain":
      return 2;
    case "timetrial":
      return 3;
    default:
      return 0;
  }
}

function getStageTypeLabel(type) {
  const value = getStageTypeValue(type);
  return STAGE_TYPES.find((stageType) => stageType.value === value)?.label ?? "Onbekend";
}

function getDateFromStartTime(value) {
  return value ? String(value).slice(0, 10) : "";
}

function formatForDateTimeInput(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatDisplayDate(value) {
  if (!value) return "-";

  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return String(value);

  return new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function formatDisplayDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function cleanApiError(message, fallbackMessage) {
  if (!message) return fallbackMessage;

  try {
    const parsed = JSON.parse(message);
    if (typeof parsed === "string") return parsed;
    return parsed.message ?? fallbackMessage;
  } catch {
    return message;
  }
}

export default StageManager;
