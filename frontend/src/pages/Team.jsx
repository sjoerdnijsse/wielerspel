import { useEffect, useMemo, useState } from "react";

import {
  getCompetitions,
  getCompetitionCyclists,
  getMyCompetitionTeam,
  getStages,
  addCyclistToCompetitionTeam,
  removeCyclistFromCompetitionTeam,
  transferCompetitionCyclist,
  saveCompetitionTeamJokers,
} from "../services/Api";

import TeamList from "../components/team/TeamList";
import AvailableCyclists from "../components/team/AvailableCyclists";
import Countdown from "../components/Countdown";

function Team() {
  const [competitionId, setCompetitionId] = useState("");

  const [availableCyclists, setAvailableCyclists] = useState([]);
  const [stages, setStages] = useState([]);
  const [teamData, setTeamData] = useState(null);
  const [jokerSelections, setJokerSelections] = useState({});

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [savingJokers, setSavingJokers] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [firstStageStartTime, setFirstStageStartTime] =
  useState(null);

  const [
    selectedTransferCyclist,
    setSelectedTransferCyclist,
  ] = useState(null);

  useEffect(() => {
    loadCompetitions();
  }, []);

  useEffect(() => {
    if (competitionId) {
      setSelectedTransferCyclist(null);
      setSearch("");
      loadCompetitionData(competitionId);
    }
  }, [competitionId]);

  async function loadCompetitions() {
      setLoading(true);
      setError("");

      try {
        const data = await getCompetitions();

        const activeCompetition = data.find(
          (competition) => competition.isActive
        );

        if (activeCompetition) {
          setCompetitionId(activeCompetition.id);
        } else {
          setCompetitionId("");
          setLoading(false);
        }
      } catch (error) {
        console.error(error);
        setError(error.message);
        setLoading(false);
      }
    }

  async function loadCompetitionData(
      selectedCompetitionId,
      showLoading = true
    ) {
      if (showLoading) {
        setLoading(true);
      }

      setError("");

    try {
      const [competitionCyclists, myTeam, stageData] =
        await Promise.all([
          getCompetitionCyclists(selectedCompetitionId),
          getMyCompetitionTeam(selectedCompetitionId),
          getStages(selectedCompetitionId),
        ]);

      const sortedStages = [...stageData].sort(
        (first, second) =>
          first.stageNumber - second.stageNumber
      );

      const savedJokers = Object.fromEntries(
        (myTeam.cyclists ?? []).map((cyclist) => [
          cyclist.selectionId,
          cyclist.jokerStageId ?? "",
        ])
      );

      setAvailableCyclists(competitionCyclists);
      setStages(sortedStages);
      setTeamData(myTeam);
      setJokerSelections(savedJokers);
      setFirstStageStartTime(
        sortedStages.length > 0
          ? sortedStages[0].startTime
          : null
      );
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }

  async function handleAdd(competitionCyclistId) {
    setSavingId(competitionCyclistId);
    setError("");
    setMessage("");

    try {
      await addCyclistToCompetitionTeam(
        competitionId,
        competitionCyclistId
      );

      await loadCompetitionData(
        competitionId,
        false
      );
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
    setMessage("");

    try {
      await removeCyclistFromCompetitionTeam(
        competitionId,
        competitionCyclistId
      );

      await loadCompetitionData(
        competitionId,
        false
      );
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setSavingId(null);
    }
  }

  function handleJokerChange(selectionId, stageId) {
    setError("");
    setMessage("");

    setJokerSelections((current) => ({
      ...current,
      [selectionId]: stageId,
    }));
  }

  async function handleSaveJokers() {
    if (!teamData) {
      return;
    }

    if (teamData.selectedCount !== teamData.teamSize) {
      setError(
        "Je ploeg moet compleet zijn voordat je jokers kunt opslaan."
      );
      return;
    }

    if (teamData.teamLocked) {
      setError(
        "De ploegdeadline is verstreken. Jokers kunnen niet meer worden gewijzigd."
      );
      return;
    }

    if (stages.length < teamData.teamSize) {
      setError(
        `Er zijn minimaal ${teamData.teamSize} etappes nodig om iedere renner een unieke jokeretappe te geven.`
      );
      return;
    }

    const jokers = teamData.cyclists.map((cyclist) => ({
      competitionUserCyclistId: cyclist.selectionId,
      stageId: jokerSelections[cyclist.selectionId] ?? "",
    }));

    if (jokers.some((joker) => !joker.stageId)) {
      setError(
        "Selecteer voor iedere renner een jokeretappe."
      );
      return;
    }

    const uniqueStageIds = new Set(
      jokers.map((joker) => joker.stageId)
    );

    if (uniqueStageIds.size !== jokers.length) {
      setError(
        "Iedere etappe mag binnen je ploeg maar één keer als joker worden gebruikt."
      );
      return;
    }

    setSavingJokers(true);
    setError("");
    setMessage("");

    try {
      const result = await saveCompetitionTeamJokers(
        competitionId,
        jokers
      );

      setMessage(
        result.message ?? "De jokers zijn opgeslagen."
      );

      await loadCompetitionData(
        competitionId,
        false
      );
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setSavingJokers(false);
    }
  }

  function handleTransferStart(cyclist) {
    setError("");
    setMessage("");

    if (
      selectedTransferCyclist?.competitionCyclistId ===
      cyclist.competitionCyclistId
    ) {
      setSelectedTransferCyclist(null);
      return;
    }

    setSelectedTransferCyclist(cyclist);
    setSearch("");
  }

  function handleCancelTransfer() {
    setSelectedTransferCyclist(null);
    setSearch("");
    setError("");
  }

  async function handleTransfer(incomingCompetitionCyclistId) {
    if (!selectedTransferCyclist) {
      setError(
        "Selecteer eerst de renner die je wilt vervangen."
      );
      return;
    }

    setSavingId(incomingCompetitionCyclistId);
    setError("");
    setMessage("");

    try {
      const result = await transferCompetitionCyclist(
        competitionId,
        selectedTransferCyclist.competitionCyclistId,
        incomingCompetitionCyclistId
      );

      setMessage(
        result.message ?? "De transfer is uitgevoerd."
      );

      setSelectedTransferCyclist(null);
      setSearch("");

      await loadCompetitionData(
        competitionId,
        false
      );
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

  const transferBudget = useMemo(() => {
    if (!teamData || !selectedTransferCyclist) {
      return teamData?.remainingBudget ?? 0;
    }

    return (
      teamData.remainingBudget +
      selectedTransferCyclist.price
    );
  }, [teamData, selectedTransferCyclist]);

  return (
    <main className="page-container">
      
      <h2>Mijn ploeg</h2>

      {!teamData?.teamLocked &&
      firstStageStartTime && (
        <Countdown
          targetDate={firstStageStartTime}
        />
    )}

 
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
            border: "1px solid #2f7d32",
            borderRadius: "8px",
          }}
        >
          {message}
        </p>
      )}

      {loading && <p>Gegevens laden...</p>}

      {!loading && teamData && (
        <>
          <section
            className="responsive-grid"
            style={{
              marginBottom: "25px",
            }}
          >
            <Summary
              icon="👥"
              label="Renners"
              value={`${teamData.selectedCount} / ${teamData.teamSize}`}
            />

            <Summary
              icon="💰"
              label="Budget gebruikt"
              value={`€${teamData.totalPrice}M / €${teamData.budget}M`}
            />

            <Summary
              icon="💶"
              label="Budget over"
              value={`€${teamData.remainingBudget}M`}
            />
          </section>

          <TeamList
            cyclists={teamData.cyclists}
            stages={stages}
            jokerSelections={jokerSelections}
            savingId={savingId}
            savingJokers={savingJokers}
            teamComplete={
              teamData.selectedCount === teamData.teamSize
            }
            teamLocked={teamData.teamLocked}
            transfersUsed={teamData.transfersUsed}
            maxTransfers={teamData.maxTransfers}
            selectedTransferCyclistId={
              selectedTransferCyclist?.competitionCyclistId ??
              null
            }
            onJokerChange={handleJokerChange}
            onSaveJokers={handleSaveJokers}
            onRemove={handleRemove}
            onTransfer={handleTransferStart}
          />

          {teamData.teamLocked &&
            selectedTransferCyclist && (
              <section
                className="responsive-card"
                style={{
                  marginBottom: "25px",
                  borderColor: "#888",
                }}
              >
                <h3 style={{ marginTop: 0 }}>
                  Transfer voorbereiden
                </h3>

                <p>
                  Je vervangt{" "}
                  <strong>
                    {selectedTransferCyclist.name}
                  </strong>{" "}
                  van €{selectedTransferCyclist.price}M.
                </p>

                <p>
                  Je mag een vervanger kiezen van maximaal{" "}
                  <strong>€{transferBudget}M</strong>.
                </p>

                <div className="responsive-actions">
                  <button
                    type="button"
                    onClick={handleCancelTransfer}
                    disabled={savingId !== null}
                  >
                    Transfer annuleren
                  </button>
                </div>
              </section>
            )}

          {!teamData.teamLocked && (
            <AvailableCyclists
              cyclists={filteredAvailableCyclists}
              search={search}
              onSearchChange={setSearch}
              savingId={savingId}
              remainingBudget={teamData.remainingBudget}
              selectedCount={teamData.selectedCount}
              teamSize={teamData.teamSize}
              transferMode={false}
              onAdd={handleAdd}
            />
          )}

          {teamData.teamLocked &&
            selectedTransferCyclist && (
              <AvailableCyclists
                cyclists={filteredAvailableCyclists}
                search={search}
                onSearchChange={setSearch}
                savingId={savingId}
                remainingBudget={transferBudget}
                selectedCount={teamData.selectedCount}
                teamSize={teamData.teamSize}
                transferMode
                outgoingCyclistName={
                  selectedTransferCyclist.name
                }
                onTransfer={handleTransfer}
              />
            )}

          {teamData.teamLocked &&
            !selectedTransferCyclist && (
              <section className="responsive-card">
                <h3>Beschikbare renners</h3>

                {teamData.transfersUsed >=
                teamData.maxTransfers ? (
                  <p>
                    Je hebt al je beschikbare transfers
                    gebruikt.
                  </p>
                ) : (
                  <p>
                    Klik bij een renner in je ploeg op{" "}
                    <strong>Transfer</strong> om een
                    vervanger te kiezen.
                  </p>
                )}
              </section>
            )}
        </>
      )}
    </main>
  );
}

function Summary({ label, value, icon }) {
  return (
    <div className="summary-card">
      <span className="summary-card__label">
        {icon && (
          <span
            className="summary-card__icon"
            aria-hidden="true"
          >
            {icon}
          </span>
        )}

        {label}
      </span>

      <strong className="summary-card__value">
        {value}
      </strong>
    </div>
  );
}

export default Team;
