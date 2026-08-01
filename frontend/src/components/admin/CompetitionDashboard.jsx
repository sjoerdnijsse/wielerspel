import { useState } from "react";

import TeamManager from "./TeamManager";
import CyclistManager from "./CyclistManager";
import CompetitionCyclistManager from "./CompetitionCyclistManager";
import StageManager from "./StageManager";
import StageResultManager from "./StageResultManager";
import StandingsManager from "./StandingsManager";
import ParticipantsManager from "./ParticipantsManager";

import {
  updateCompetition,
} from "../../services/Api";

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
      id: "competitionCyclists",
      title: "Wedstrijdrenners",
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
      id: "standings",
      title: "Klassement",
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
            onCompetitionUpdated={
              onCompetitionUpdated
            }
          />
        );

      case "teams":
        return <TeamManager />;

      case "cyclists":
        return <CyclistManager />;

      case "competitionCyclists":
        return (
          <CompetitionCyclistManager
            competition={competition}
          />
        );

      case "stages":
        return (
          <StageManager
            competition={competition}
          />
        );

      case "results":
        return (
          <StageResultManager
            competition={competition}
          />
        );

      case "standings":
        return (
          <StandingsManager
            competition={competition}
          />
        );

      case "players":
        return (
          <ParticipantsManager
            competition={competition}
          />
        );

      default:
        return null;
    }
  }

  return (
    <section>
      <button
        type="button"
        onClick={onBack}
      >
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
          Beheer de instellingen en gegevens van deze
          wedstrijdeditie.
        </p>
      </header>

      <div className="competition-dashboard-layout">
        <nav
          aria-label="Wedstrijdbeheer"
          className="responsive-card"
        >
          <strong>Onderdelen</strong>

          <div className="competition-dashboard-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setActiveTab(tab.id)
                }
                disabled={activeTab === tab.id}
                aria-current={
                  activeTab === tab.id
                    ? "page"
                    : undefined
                }
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

function GeneralTab({
  competition,
  onCompetitionUpdated,
}) {
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
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? checked
          : value,
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

    const year = Number(form.year);
    const teamSize = Number(form.teamSize);
    const budget = Number(form.budget);
    const maxTransfers =
      Number(form.maxTransfers);

    if (
      !Number.isInteger(year) ||
      year < 2000 ||
      year > 2200
    ) {
      setError("Vul een geldig jaar in.");
      setMessage("");
      return;
    }

    if (
      !Number.isInteger(teamSize) ||
      teamSize <= 0
    ) {
      setError(
        "Vul een geldige ploegomvang in."
      );
      setMessage("");
      return;
    }

    if (
      !Number.isInteger(budget) ||
      budget <= 0
    ) {
      setError("Vul een geldig budget in.");
      setMessage("");
      return;
    }

    if (
      !Number.isInteger(maxTransfers) ||
      maxTransfers < 0
    ) {
      setError(
        "Vul een geldig maximaal aantal wissels in."
      );
      setMessage("");
      return;
    }

    const updatedCompetition = {
      name: form.name.trim(),
      year,
      teamSize,
      budget,
      maxTransfers,
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
    <section className="responsive-card">
      <h3>Algemeen</h3>

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

      <form onSubmit={handleSubmit}>
        <FormField label="Naam">
          <input
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
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
            step="1"
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
            step="1"
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
            step="1"
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
            className="responsive-input"
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
            : "Instellingen opslaan"}
          </button>
        </div>
      </form>
    </section>
  );
}

function FormField({
  label,
  children,
}) {
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

export default CompetitionDashboard;