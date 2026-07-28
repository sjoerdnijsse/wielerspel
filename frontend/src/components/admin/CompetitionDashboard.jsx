import { useState } from "react";

import TeamManager from "./TeamManager";
import CyclistManager from "./CyclistManager";
import { updateCompetition } from "../../services/Api";
import PriceManager from "./PriceManager";

function CompetitionDashboard({
  competition,
  onBack,
  onCompetitionUpdated,
}) {
  const [activeTab, setActiveTab] = useState("general");

  const tabs = [
    {
      id: "general",
      title: "Algemeen",
    },
    {
      id: "teams",
      title: "Professionele ploegen",
    },
    {
      id: "cyclists",
      title: "Renners",
    },
    {
      id: "prices",
      title: "Prijzen",
    },
    {
      id: "stages",
      title: "Etappes",
    },
    {
      id: "results",
      title: "Uitslagen",
    },
    {
      id: "players",
      title: "Deelnemers",
    },
  ];

  function renderActiveTab() {
    switch (activeTab) {
      case "general":
        return (
          <GeneralTab
            competition={competition}
            onCompetitionUpdated={onCompetitionUpdated}
          />
        );

      case "teams":
        return <TeamManager />;

      case "cyclists":
        return <CyclistManager />;

      case "prices":
        return <PriceManager competition={competition} />;

      case "stages":
        return (
          <Placeholder
            title="Etappes"
            description="Hier komt het beheer van de etappes."
          />
        );

      case "results":
        return (
          <Placeholder
            title="Uitslagen"
            description="Hier komt het invoeren van etappe-uitslagen."
          />
        );

      case "players":
        return (
          <Placeholder
            title="Deelnemers"
            description="Hier komt het overzicht van de deelnemers aan deze wedstrijd."
          />
        );

      default:
        return null;
    }
  }

  return (
    <section>
      <button type="button" onClick={onBack}>
        Terug naar wedstrijden
      </button>

      <header
        style={{
          marginTop: "20px",
          marginBottom: "25px",
        }}
      >
        <h2>
          {competition.name} {competition.year}
        </h2>

        <p>
          Beheer de instellingen en gegevens van deze wedstrijdeditie.
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "220px minmax(0, 1fr)",
          gap: "25px",
          alignItems: "start",
        }}
      >
        <nav
          style={{
            padding: "15px",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        >
          <strong>Onderdelen</strong>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              marginTop: "15px",
            }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                disabled={activeTab === tab.id}
                style={{
                  textAlign: "left",
                  padding: "10px",
                }}
              >
                {tab.title}
              </button>
            ))}
          </div>
        </nav>

        <div
          style={{
            minWidth: 0,
          }}
        >
          {renderActiveTab()}
        </div>
      </div>
    </section>
  );
}

function GeneralTab({ competition, onCompetitionUpdated }) {
  const [form, setForm] = useState({
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

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Vul een naam in.");
      setMessage("");
      return;
    }

    if (!form.teamLockDate) {
      setError("Vul een deadline in.");
      setMessage("");
      return;
    }

    const updatedCompetition = {
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
    setMessage("");

    try {
      const result = await updateCompetition(
        competition.id,
        updatedCompetition
      );

      onCompetitionUpdated(result);
      setMessage("Instellingen opgeslagen.");
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      style={{
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <h3>Algemeen</h3>

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
            border: "1px solid #2a7",
            borderRadius: "8px",
          }}
        >
          {message}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <FormField label="Naam">
          <input
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
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

        <button type="submit" disabled={saving}>
          {saving ? "Opslaan..." : "Instellingen opslaan"}
        </button>
      </form>
    </section>
  );
}

function Placeholder({ title, description }) {
  return (
    <section
      style={{
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <h3>{title}</h3>

      <p>{description}</p>
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

export default CompetitionDashboard;