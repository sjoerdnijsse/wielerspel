import { useEffect, useMemo, useState } from "react";

import {
  getCompetitions,
  getCompetitionCyclists,
  getMyCompetitionTeam,
  addCyclistToCompetitionTeam,
  removeCyclistFromCompetitionTeam,
} from "../services/Api";

import CompetitionSelector from "../components/team/CompetitionSelector";
import TeamSummary from "../components/team/TeamSummary";
import TeamList from "../components/team/TeamList";
import AvailableCyclists from "../components/team/AvailableCyclists";

function Team() {
  const [competitions, setCompetitions] = useState([]);
  const [competitionId, setCompetitionId] = useState("");

  const [availableCyclists, setAvailableCyclists] = useState([]);
  const [teamData, setTeamData] = useState(null);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCompetitions();
  }, []);

  useEffect(() => {
    if (competitionId) {
      loadCompetitionData(competitionId);
    }
  }, [competitionId]);

  async function loadCompetitions() {
    setLoading(true);
    setError("");

    try {
      const data = await getCompetitions();

      setCompetitions(data);

      if (data.length > 0) {
        setCompetitionId(data[0].id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      setError(error.message);
      setLoading(false);
    }
  }

  async function loadCompetitionData(selectedCompetitionId) {
    setLoading(true);
    setError("");

    try {
      const [competitionCyclists, myTeam] = await Promise.all([
        getCompetitionCyclists(selectedCompetitionId),
        getMyCompetitionTeam(selectedCompetitionId),
      ]);

      setAvailableCyclists(competitionCyclists);
      setTeamData(myTeam);
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(competitionCyclistId) {
    setSavingId(competitionCyclistId);
    setError("");

    try {
      await addCyclistToCompetitionTeam(
        competitionId,
        competitionCyclistId
      );

      await loadCompetitionData(competitionId);
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setSavingId(null);
    }
  }

  async function handleRemove(competitionCyclistId) {
    setSavingId(competitionCyclistId);
    setError("");

    try {
      await removeCyclistFromCompetitionTeam(
        competitionId,
        competitionCyclistId
      );

      await loadCompetitionData(competitionId);
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setSavingId(null);
    }
  }

  const selectedIds = useMemo(() => {
    return new Set(
      teamData?.cyclists?.map(
        (cyclist) => cyclist.competitionCyclistId
      ) ?? []
    );
  }, [teamData]);

  const filteredAvailableCyclists = useMemo(() => {
    const value = search.trim().toLowerCase();

    return availableCyclists
      .filter((item) => !selectedIds.has(item.id))
      .filter((item) => {
        if (!value) {
          return true;
        }

        const teamName = item.cyclist.team?.name ?? "";

        return (
          item.cyclist.name.toLowerCase().includes(value) ||
          teamName.toLowerCase().includes(value)
        );
      });
  }, [availableCyclists, selectedIds, search]);

  return (
    <main
      style={{
        padding: "30px",
        maxWidth: "1100px",
        margin: "0 auto",
      }}
    >
      <h2>Mijn ploeg</h2>

      <CompetitionSelector
        competitions={competitions}
        competitionId={competitionId}
        onChange={setCompetitionId}
      />

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

      {loading && <p>Gegevens laden...</p>}

      {!loading && teamData && (
        <>
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "15px",
              marginBottom: "25px",
            }}
          >
            <Summary
              label="Renners"
              value={`${teamData.selectedCount} / ${teamData.teamSize}`}
            />

            <Summary
              label="Budget gebruikt"
              value={`€${teamData.totalPrice}M / €${teamData.budget}M`}
            />

            <Summary
              label="Budget over"
              value={`€${teamData.remainingBudget}M`}
            />
          </section>

          <TeamList
            cyclists={teamData.cyclists}
            savingId={savingId}
            onRemove={handleRemove}
          />

          <AvailableCyclists
            cyclists={filteredAvailableCyclists}
            search={search}
            onSearchChange={setSearch}
            savingId={savingId}
            remainingBudget={teamData.remainingBudget}
            selectedCount={teamData.selectedCount}
            teamSize={teamData.teamSize}
            onAdd={handleAdd}
          />
        </>
      )}
    </main>
  );
}

function Summary({ label, value }) {
  return (
    <div
      style={{
        padding: "15px",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <div>{label}</div>
      <strong>{value}</strong>
    </div>
  );
}

export default Team;