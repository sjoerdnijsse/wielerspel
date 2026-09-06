import { useEffect, useMemo, useState } from "react";

import {
  getCompetitions,
  getCompetitionCyclists,
  getMyCompetitionTeam,
  getStages,
  addCyclistToCompetitionTeam,
  removeCyclistFromCompetitionTeam,
  transferCompetitionCyclists,
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
    selectedTransferSelections,
    setSelectedTransferSelections,
  ] = useState([]);

  const [
    transferAssignments,
    setTransferAssignments,
  ] = useState({});

  useEffect(() => {
    loadCompetitions();
  }, []);

  useEffect(() => {
    if (competitionId) {
      setSelectedTransferSelections([]);
      setTransferAssignments({});
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

  async function handleJokerChange(
    selectionId,
    stageId
  ) {
    setError("");
    setMessage("");

    const updatedSelections = {
      ...jokerSelections,
      [selectionId]: stageId,
    };

    setJokerSelections(updatedSelections);

    if (!teamData) {
      return;
    }

    if (
      teamData.selectedCount !==
      teamData.teamSize
    ) {
      return;
    }

    if (teamData.teamLocked) {
      return;
    }

    const jokerStagesForTeam = teamData.cyclists.map(
      (cyclist) => ({
        competitionUserCyclistId:
          cyclist.selectionId,
        stageId:
          updatedSelections[
            cyclist.selectionId
          ] ?? "",
      })
    );

    // Nog niet alle jokers ingevuld.
    if (
      jokerStagesForTeam.some(
        (joker) => !joker.stageId
      )
    ) {
      return;
    }

    // Iedere etappe moet uniek zijn.
    const uniqueStageIds = new Set(
      jokerStagesForTeam.map(
        (joker) => joker.stageId
      )
    );

    if (
      uniqueStageIds.size !==
      jokerStagesForTeam.length
    ) {
      return;
    }

    // Controleer of alle gekozen etappes
    // daadwerkelijk toegestane jokeretappes zijn.
    const validJokerStageIds = new Set(
      jokerStages.map((stage) => stage.id)
    );

    if (
      jokerStagesForTeam.some(
        (joker) =>
          !validJokerStageIds.has(
            joker.stageId
          )
      )
    ) {
      return;
    }

    setSavingJokers(true);

    try {
      const result =
        await saveCompetitionTeamJokers(
          competitionId,
          jokerStagesForTeam
        );

      setMessage(
        result.message ??
          "De jokers zijn automatisch opgeslagen."
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

  function handleTransferSelectionToggle(
    cyclist
  ) {
    setError("");
    setMessage("");

    setSelectedTransferSelections(
      (current) => {
        const alreadySelected =
          current.some(
            (item) =>
              item.selectionId ===
              cyclist.selectionId
          );

        if (alreadySelected) {
          setTransferAssignments(
            (assignments) => {
              const updated = {
                ...assignments,
              };

              delete updated[
                cyclist.selectionId
              ];

              return updated;
            }
          );

          return current.filter(
            (item) =>
              item.selectionId !==
              cyclist.selectionId
          );
        }

        const transfersRemaining =
          teamData?.transfersRemaining ?? 0;

        if (
          current.length >=
          transfersRemaining
        ) {
          setError(
            `Je kunt nog maximaal ${transfersRemaining} renner(s) vervangen.`
          );

          return current;
        }

        return [...current, cyclist];
      }
    );
  }

  function handleTransferAssignmentChange(
    selectionId,
    incomingCompetitionCyclistId
  ) {
    setError("");
    setMessage("");

    setTransferAssignments((current) => ({
      ...current,
      [selectionId]:
        incomingCompetitionCyclistId,
    }));
  }

  function handleCancelTransfers() {
    setSelectedTransferSelections([]);
    setTransferAssignments({});
    setSearch("");
    setError("");
  }

  async function handleConfirmTransfers() {
    if (!teamData) {
      return;
    }

    if (
      selectedTransferSelections.length ===
      0
    ) {
      setError(
        "Selecteer eerst minimaal één renner die je wilt vervangen."
      );
      return;
    }

    const missingAssignment =
      selectedTransferSelections.some(
        (selection) =>
          !transferAssignments[
            selection.selectionId
          ]
      );

    if (missingAssignment) {
      setError(
        "Kies voor iedere vrijgekomen plek een nieuwe renner."
      );
      return;
    }

    const incomingIds =
      selectedTransferSelections.map(
        (selection) =>
          transferAssignments[
            selection.selectionId
          ]
      );

    if (
      new Set(incomingIds).size !==
      incomingIds.length
    ) {
      setError(
        "Dezelfde nieuwe renner kan niet op meerdere plekken worden gekozen."
      );
      return;
    }

    if (transferBudgetRemaining < 0) {
      setError(
        `Je overschrijdt je budget met €${Math.abs(
          transferBudgetRemaining
        )} miljoen.`
      );
      return;
    }

    const transfers =
      selectedTransferSelections.map(
        (selection) => ({
          competitionUserCyclistId:
            selection.selectionId,
          incomingCompetitionCyclistId:
            transferAssignments[
              selection.selectionId
            ],
        })
      );

    setSavingId("transfers");
    setError("");
    setMessage("");

    try {
      const result =
        await transferCompetitionCyclists(
          competitionId,
          transfers
        );

      setMessage(
        result.message ??
          "De transfers zijn uitgevoerd."
      );

      setSelectedTransferSelections([]);
      setTransferAssignments({});
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
        (cyclist) =>
          cyclist.competitionCyclistId
      ) ?? []
    );
  }, [teamData]);

  const filteredAvailableCyclists =
    useMemo(() => {
      const value = search
        .trim()
        .toLowerCase();

      return availableCyclists
        .filter(
          (item) =>
            !selectedIds.has(item.id)
        )
        .filter((item) => {
          if (!value) {
            return true;
          }

          const teamName =
            item.cyclist.team?.name ?? "";

          return (
            item.cyclist.name
              .toLowerCase()
              .includes(value) ||
            teamName
              .toLowerCase()
              .includes(value)
          );
        });
    }, [
      availableCyclists,
      selectedIds,
      search,
    ]);

  const transferAvailableBudget =
    useMemo(() => {
      if (!teamData) {
        return 0;
      }

      const releasedBudget =
        selectedTransferSelections.reduce(
          (total, cyclist) =>
            total + cyclist.price,
          0
        );

      return (
        teamData.remainingBudget +
        releasedBudget
      );
    }, [
      teamData,
      selectedTransferSelections,
    ]);

  const transferIncomingTotal =
    useMemo(() => {
      return Object.values(
        transferAssignments
      ).reduce(
        (total, cyclistId) => {
          const cyclist =
            availableCyclists.find(
              (item) =>
                item.id === cyclistId
            );

          return (
            total +
            (cyclist?.price ?? 0)
          );
        },
        0
      );
    }, [
      transferAssignments,
      availableCyclists,
    ]);

  const transferBudgetRemaining =
    transferAvailableBudget -
    transferIncomingTotal;

  const nextTransferStage = useMemo(() => {
    if (
      !teamData?.teamLocked ||
      stages.length === 0
    ) {
      return null;
    }

    const now = Date.now();

    for (
      let index = 1;
      index < stages.length;
      index++
    ) {
      const previousStage =
        stages[index - 1];

      const stage = stages[index];

      if (!previousStage.resultsPublished) {
        continue;
      }

      if (!stage.startTime) {
        continue;
      }

      const stageStartTime =
        new Date(
          stage.startTime
        ).getTime();

      if (
        Number.isNaN(stageStartTime) ||
        stageStartTime <= now
      ) {
        continue;
      }

      return stage;
    }

    return null;
  }, [
    stages,
    teamData?.teamLocked,
  ]);

  function canAffordIncomingCyclist(
    cyclist,
    currentSelectionId
  ) {
    const currentAssignedCyclistId =
      transferAssignments[
        currentSelectionId
      ];

    const currentAssignedCyclist =
      availableCyclists.find(
        (item) =>
          item.id ===
          currentAssignedCyclistId
      );

    const currentAssignedPrice =
      currentAssignedCyclist?.price ?? 0;

    const budgetWithoutCurrentAssignment =
      transferBudgetRemaining +
      currentAssignedPrice;

    return (
      cyclist.price <=
      budgetWithoutCurrentAssignment
    );
  }

  const jokerStages = useMemo(() => {
    if (!teamData?.isLateEntry) {
      return stages;
    }

    return stages.filter(
      (stage) =>
        stage.stageNumber >=
        teamData.teamActiveFromStageNumber
    );
  }, [
    stages,
    teamData?.isLateEntry,
    teamData?.teamActiveFromStageNumber,
  ]);

  const isBuildingLateEntryTeam =
    teamData?.isLateEntry &&
    teamData.selectedCount <
      teamData.teamSize;

  return (
    <main className="page-container">
      <h2>Mijn ploeg</h2>

      {!teamData?.teamLocked &&
        firstStageStartTime && (
          <Countdown
            targetDate={firstStageStartTime}
          />
        )}

      {teamData?.teamLocked &&
        nextTransferStage && (
          <Countdown
            targetDate={
              nextTransferStage.startTime
            }
            label={`Transferdeadline voor etappe ${nextTransferStage.stageNumber}`}
            finishedLabel="Transferdeadline verstreken"
            finishedMessage={`Transfers tellen niet meer mee voor etappe ${nextTransferStage.stageNumber}.`}
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

          {isBuildingLateEntryTeam && (
            <div
              className="responsive-card"
              style={{
                marginBottom: "20px",
                textAlign: "center",
              }}
            >
              <strong>
                Stel je ploeg samen
              </strong>

              <p
                style={{
                  marginBottom: 0,
                }}
              >
                Je bent na de start van de
                wedstrijd ingestapt. Je ploeg
                telt mee vanaf etappe{" "}
                <strong>
                  {
                    teamData.teamActiveFromStageNumber
                  }
                </strong>
                .
              </p>
            </div>
          )}

          <TeamList
            cyclists={teamData.cyclists}
            stages={jokerStages}
            jokerSelections={jokerSelections}
            savingId={savingId}
            savingJokers={savingJokers}
            teamComplete={
              teamData.selectedCount ===
              teamData.teamSize
            }
            teamLocked={
              teamData.teamLocked &&
              !isBuildingLateEntryTeam
            }
            canSetJokers={
              !teamData.teamLocked ||
              (
                teamData.isLateEntry &&
                !teamData.cyclists.some(
                  (cyclist) =>
                    cyclist.jokerStageId
                )
              )
            }
            transfersUsed={
              teamData.transfersUsed
            }
            maxTransfers={
              teamData.maxTransfers
            }
            selectedTransferSelectionIds={
              selectedTransferSelections.map(
                (selection) =>
                  selection.selectionId
              )
            }
            onJokerChange={
              handleJokerChange
            }
            onRemove={handleRemove}
            onTransfer={
              teamData.transfersAllowed
                ? handleTransferSelectionToggle
                : null
            }
          />

          {(!teamData.teamLocked ||
            isBuildingLateEntryTeam) && (
            <AvailableCyclists
              cyclists={
                filteredAvailableCyclists
              }
              search={search}
              onSearchChange={setSearch}
              savingId={savingId}
              remainingBudget={
                teamData.remainingBudget
              }
              selectedCount={
                teamData.selectedCount
              }
              teamSize={teamData.teamSize}
              transferMode={false}
              onAdd={handleAdd}
            />
          )}

          {teamData.teamLocked &&
            !isBuildingLateEntryTeam &&
            !teamData.transfersAllowed &&
            teamData.transfersRemaining >
              0 && (
              <div
                className="responsive-card"
                style={{
                  marginTop: "25px",
                  marginBottom: "20px",
                  textAlign: "center",
                }}
              >
                <strong>
                  Transfers tijdelijk gesloten
                </strong>

                <p
                  style={{
                    marginBottom: 0,
                  }}
                >
                  Transfers zijn weer mogelijk
                  zodra de uitslag van de
                  huidige etappe is gepubliceerd.
                </p>
              </div>
            )}

          {teamData.teamLocked &&
            !isBuildingLateEntryTeam && (
              <section
                className="responsive-card"
                style={{
                  marginTop: "25px",
                  marginBottom: "25px",
                }}
              >
                <h3
                  style={{
                    marginTop: 0,
                  }}
                >
                  Transfers
                </h3>

                <p>
                  Selecteer in je ploeg één of
                  meer renners die je wilt
                  vervangen. Daarna kies je per
                  vrijgekomen plek een nieuwe
                  renner.
                </p>

                <p>
                  Transfers gebruikt:{" "}
                  <strong>
                    {teamData.transfersUsed} /{" "}
                    {teamData.maxTransfers}
                  </strong>
                </p>

                <div
                  className="responsive-grid"
                  style={{
                    marginTop: "20px",
                    marginBottom: "20px",
                  }}
                >
                  <Summary
                    label="Beschikbaar voor transfers"
                    value={`€${transferAvailableBudget}M`}
                  />

                  <Summary
                    label="Nieuwe renners"
                    value={`€${transferIncomingTotal}M`}
                  />

                  <Summary
                    label="Budget over"
                    value={`€${transferBudgetRemaining}M`}
                  />
                </div>

                {transferBudgetRemaining <
                  0 && (
                  <p
                    style={{
                      color: "#b42318",
                      fontWeight: "700",
                    }}
                  >
                    Je zit €
                    {Math.abs(
                      transferBudgetRemaining
                    )}
                    M boven je budget.
                  </p>
                )}

                {selectedTransferSelections.length ===
                  0 && (
                  <p>
                    Klik bij één of meer renners
                    in je ploeg op{" "}
                    <strong>Transfer</strong>.
                  </p>
                )}

                {selectedTransferSelections.length >
                  0 && (
                  <>
                    <h4>
                      Geselecteerd voor transfer (
                      {
                        selectedTransferSelections.length
                      }
                      )
                    </h4>

                    {selectedTransferSelections.map(
                      (selection) => {
                        const currentAssignmentId =
                          transferAssignments[
                            selection.selectionId
                          ] ?? "";

                        const selectedIncomingIds =
                          Object.values(
                            transferAssignments
                          );

                        return (
                          <div
                            key={
                              selection.selectionId
                            }
                            style={{
                              padding:
                                "15px 0",
                              borderBottom:
                                "1px solid #ddd",
                            }}
                          >
                            <p
                              style={{
                                marginTop: 0,
                                marginBottom:
                                  "6px",
                              }}
                            >
                              <strong>
                                {
                                  selection.name
                                }
                              </strong>{" "}
                              — €
                              {
                                selection.price
                              }
                              M
                            </p>

                            <p
                              style={{
                                marginTop: 0,
                              }}
                            >
                              Joker:{" "}
                              <strong>
                                {
                                  selection.jokerStageNumber
                                    ? `etappe ${selection.jokerStageNumber}`
                                    : "geen joker"
                                }
                              </strong>
                            </p>

                            <SearchableTransferCyclistSelect
                              cyclists={
                                availableCyclists
                              }
                              value={
                                currentAssignmentId
                              }
                              selectedCyclistIds={
                                selectedIncomingIds
                              }
                              onChange={(
                                cyclistId
                              ) =>
                                handleTransferAssignmentChange(
                                  selection.selectionId,
                                  cyclistId
                                )
                              }
                              canAfford={(
                                cyclist
                              ) =>
                                canAffordIncomingCyclist(
                                  cyclist,
                                  selection.selectionId
                                )
                              }
                              getCyclistName={(
                                cyclist
                              ) =>
                                cyclist.cyclist
                                  .name
                              }
                              getCyclistTeamName={(
                                cyclist
                              ) =>
                                cyclist.cyclist
                                  .team
                                  ?.name ??
                                "Geen ploeg"
                              }
                              disabled={
                                savingId ===
                                "transfers"
                              }
                            />
                          </div>
                        );
                      }
                    )}

                    <div
                      className="responsive-actions"
                      style={{
                        marginTop: "20px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={
                          handleConfirmTransfers
                        }
                        disabled={
                          savingId ===
                            "transfers" ||
                          transferBudgetRemaining <
                            0
                        }
                      >
                        {savingId ===
                        "transfers"
                          ? "Transfers uitvoeren..."
                          : "Transfers bevestigen"}
                      </button>

                      <button
                        type="button"
                        onClick={
                          handleCancelTransfers
                        }
                        disabled={
                          savingId ===
                          "transfers"
                        }
                      >
                        Annuleren
                      </button>
                    </div>
                  </>
                )}
              </section>
            )}
        </>
      )}
    </main>
  );
}

function SearchableTransferCyclistSelect({
  cyclists,
  value,
  selectedCyclistIds,
  onChange,
  canAfford,
  getCyclistName,
  getCyclistTeamName,
  disabled,
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const selectedCyclist =
    cyclists.find(
      (cyclist) => cyclist.id === value
    ) ?? null;

  const filteredCyclists = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return cyclists
      .filter(
        (cyclist) =>
          !selectedCyclistIds.includes(
            cyclist.id
          ) ||
          cyclist.id === value
      )
      .filter((cyclist) => {
        if (!normalizedSearch) {
          return true;
        }

        const name =
          getCyclistName(cyclist).toLowerCase();

        const team =
          getCyclistTeamName(cyclist).toLowerCase();

        return (
          name.includes(normalizedSearch) ||
          team.includes(normalizedSearch)
        );
      });
  }, [
    cyclists,
    selectedCyclistIds,
    value,
    search,
    getCyclistName,
    getCyclistTeamName,
  ]);

  function handleSelect(cyclist) {
    onChange(cyclist.id);
    setSearch("");
    setOpen(false);
  }

  function handleClear() {
    onChange("");
    setSearch("");
    setOpen(false);
  }

  return (
    <div
      style={{
        position: "relative",
      }}
    >
      <label
        style={{
          display: "block",
          marginBottom: "6px",
          fontWeight: "600",
        }}
      >
        Nieuwe renner voor deze plek
      </label>

      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        {selectedCyclist && (
          <div
            style={{
              flex: "1 1 240px",
              minWidth: 0,
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              background: "#f8f8f8",
            }}
          >
            <strong>
              {getCyclistName(
                selectedCyclist
              )}
            </strong>

            <div
              style={{
                marginTop: "3px",
                fontSize: "0.9rem",
              }}
            >
              {getCyclistTeamName(
                selectedCyclist
              )}
              {" · €"}
              {selectedCyclist.price}M
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            if (disabled) {
              return;
            }

            setOpen(
              (current) => !current
            );
          }}
          disabled={disabled}
          style={{
            flex:
              selectedCyclist
                ? "0 0 auto"
                : "1 1 100%",
          }}
        >
          {selectedCyclist
            ? "Andere renner kiezen"
            : "Kies een renner"}
        </button>

        {selectedCyclist && (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
          >
            Wissen
          </button>
        )}
      </div>

      {open && !disabled && (
        <div
          style={{
            marginTop: "8px",
            padding: "12px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            background: "#fff",
          }}
        >
          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Zoek op naam of ploeg..."
            autoFocus
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "10px",
              marginBottom: "10px",
            }}
          />

          <div
            style={{
              maxHeight: "300px",
              overflowY: "auto",
            }}
          >
            {filteredCyclists.length ===
            0 ? (
              <p
                style={{
                  margin: 0,
                }}
              >
                Geen renners gevonden.
              </p>
            ) : (
              filteredCyclists.map(
                (cyclist) => {
                  const selectedElsewhere =
                    selectedCyclistIds.includes(
                      cyclist.id
                    ) &&
                    cyclist.id !== value;

                  const affordable =
                    canAfford(cyclist);

                  const unavailable =
                    selectedElsewhere ||
                    !affordable;

                  return (
                    <button
                      key={cyclist.id}
                      type="button"
                      onClick={() =>
                        handleSelect(
                          cyclist
                        )
                      }
                      disabled={
                        unavailable
                      }
                      style={{
                        display:
                          "block",
                        width: "100%",
                        textAlign:
                          "left",
                        padding:
                          "10px",
                        marginBottom:
                          "6px",
                        border:
                          "1px solid #ddd",
                        borderRadius:
                          "6px",
                        background:
                          unavailable
                            ? "#f5f5f5"
                            : "#fff",
                        cursor:
                          unavailable
                            ? "not-allowed"
                            : "pointer",
                        opacity:
                          unavailable
                            ? 0.6
                            : 1,
                      }}
                    >
                      <strong>
                        {getCyclistName(
                          cyclist
                        )}
                      </strong>

                      <span>
                        {" · "}
                        {getCyclistTeamName(
                          cyclist
                        )}
                      </span>

                      <span>
                        {" · €"}
                        {cyclist.price}M
                      </span>

                      {!affordable && (
                        <span>
                          {" · te duur"}
                        </span>
                      )}

                      {selectedElsewhere && (
                        <span>
                          {" · al gekozen"}
                        </span>
                      )}
                    </button>
                  );
                }
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Summary({ label, value }) {
  return (
    <div className="summary-card">
      <span className="summary-card__label">
        {label}
      </span>

      <strong className="summary-card__value">
        {value}
      </strong>
    </div>
  );
}

export default Team;