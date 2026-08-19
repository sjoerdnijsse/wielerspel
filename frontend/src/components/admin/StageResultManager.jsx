import { useEffect, useMemo, useState } from "react";
import {
  deleteStageResults,
  getCompetitionCyclists,
  getStageResults,
  getStages,
  publishStageResults,
  saveStageResults,
  unpublishStageResults,
} from "../../services/Api";

const POINTS_BY_POSITION = [
  20,
  17,
  15,
  13,
  11,
  10,
  9,
  8,
  7,
  6,
  5,
  4,
  3,
  2,
  1,
];

function createEmptySelections() {
  return Array.from({ length: 15 }, () => "");
}

export default function StageResultManager({ competition }) {
  const [stages, setStages] = useState([]);
  const [cyclists, setCyclists] = useState([]);
  const [selectedStageId, setSelectedStageId] =
    useState("");

  const [selections, setSelections] = useState(
    createEmptySelections
  );

  const [
    yellowJerseyCompetitionCyclistId,
    setYellowJerseyCompetitionCyclistId,
  ] = useState("");

  const [
    greenJerseyCompetitionCyclistId,
    setGreenJerseyCompetitionCyclistId,
  ] = useState("");

  const [
    polkaDotJerseyCompetitionCyclistId,
    setPolkaDotJerseyCompetitionCyclistId,
  ] = useState("");

  const [
    whiteJerseyCompetitionCyclistId,
    setWhiteJerseyCompetitionCyclistId,
  ] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingResults, setLoadingResults] =
    useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadInitialData();
  }, [competition.id]);

  useEffect(() => {
    if (!selectedStageId) {
      resetResultForm();
      return;
    }

    loadResults(selectedStageId);
  }, [selectedStageId]);

  function resetResultForm() {
    setSelections(createEmptySelections());
    setYellowJerseyCompetitionCyclistId("");
    setGreenJerseyCompetitionCyclistId("");
    setPolkaDotJerseyCompetitionCyclistId("");
    setWhiteJerseyCompetitionCyclistId("");
  }

  async function loadInitialData() {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const [stageData, cyclistData] =
        await Promise.all([
          getStages(competition.id),
          getCompetitionCyclists(competition.id),
        ]);

      const sortedStages = [...stageData].sort(
        (a, b) => a.stageNumber - b.stageNumber
      );

      const sortedCyclists = [...cyclistData].sort(
        (a, b) => {
          const teamA = getCyclistTeamName(a);
          const teamB = getCyclistTeamName(b);

          const teamComparison = teamA.localeCompare(
            teamB,
            "nl",
            { sensitivity: "base" }
          );

          if (teamComparison !== 0) {
            return teamComparison;
          }

          return getCyclistName(a).localeCompare(
            getCyclistName(b),
            "nl",
            { sensitivity: "base" }
          );
        }
      );

      setStages(sortedStages);
      setCyclists(sortedCyclists);

      if (sortedStages.length > 0) {
        setSelectedStageId(sortedStages[0].id);
      } else {
        setSelectedStageId("");
        resetResultForm();
      }
    } catch (err) {
      setError(
        err.message ||
          "De etappes en wedstrijdrenners konden niet worden opgehaald."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadResults(stageId) {
    try {
      setLoadingResults(true);
      setError("");
      setMessage("");

      const stageData = await getStageResults(
        competition.id,
        stageId
      );

      const newSelections = createEmptySelections();

      const stageResults = Array.isArray(stageData)
        ? stageData
        : stageData.results ?? [];

      stageResults.forEach((result) => {
        const index = result.position - 1;

        if (index >= 0 && index < 15) {
          newSelections[index] =
            result.competitionCyclistId;
        }
      });

      setSelections(newSelections);

      setYellowJerseyCompetitionCyclistId(
        stageData.yellowJerseyCompetitionCyclistId ??
          ""
      );

      setGreenJerseyCompetitionCyclistId(
        stageData.greenJerseyCompetitionCyclistId ??
          ""
      );

      setPolkaDotJerseyCompetitionCyclistId(
        stageData.polkaDotJerseyCompetitionCyclistId ??
          ""
      );

      setWhiteJerseyCompetitionCyclistId(
        stageData.whiteJerseyCompetitionCyclistId ??
          ""
      );

    } catch (err) {
      setError(
        err.message ||
          "De uitslag van deze etappe kon niet worden opgehaald."
      );

      resetResultForm();
    } finally {
      setLoadingResults(false);
    }
  }

  function handleCyclistChange(
    positionIndex,
    cyclistId
  ) {
    setError("");
    setMessage("");

    setSelections((currentSelections) => {
      const updatedSelections = [
        ...currentSelections,
      ];

      updatedSelections[positionIndex] = cyclistId;

      return updatedSelections;
    });
  }

  function handleJerseyChange(setter, cyclistId) {
    setError("");
    setMessage("");
    setter(cyclistId);
  }

  const selectedCyclistIds = useMemo(() => {
    return selections.filter(Boolean);
  }, [selections]);

  const selectedStage = useMemo(() => {
    return (
      stages.find(
        (stage) => stage.id === selectedStageId
      ) ?? null
    );
  }, [stages, selectedStageId]);

  const cyclistGroups = useMemo(
    () => getCyclistsByTeam(cyclists),
    [cyclists]
  );

  function getCyclistName(competitionCyclist) {
    return (
      competitionCyclist.cyclist?.name ||
      competitionCyclist.cyclistName ||
      competitionCyclist.name ||
      "Onbekende renner"
    );
  }

  function getCyclistTeamName(
    competitionCyclist
  ) {
    return (
      competitionCyclist.cyclist?.team?.name ||
      competitionCyclist.teamName ||
      ""
    );
  }

  function getCyclistNumber(
    competitionCyclist
  ) {
    return competitionCyclist.number ?? "";
  }

  function getCyclistLabel(
    competitionCyclist
  ) {
    const number = getCyclistNumber(
      competitionCyclist
    );

    const name = getCyclistName(
      competitionCyclist
    );

    const teamName = getCyclistTeamName(
      competitionCyclist
    );

    const numberPart = number
      ? `${number} - `
      : "";

    const teamPart = teamName
      ? ` (${teamName})`
      : "";

    return `${numberPart}${name}${teamPart}`;
  }

  function getCyclistsByTeam(cyclists) {
  const groups = {};

  cyclists.forEach((competitionCyclist) => {
    const teamName =
      getCyclistTeamName(competitionCyclist) ||
      "Geen ploeg";

    if (!groups[teamName]) {
      groups[teamName] = [];
    }

    groups[teamName].push(competitionCyclist);
  });

  return Object.entries(groups)
    .sort(([teamA], [teamB]) =>
      teamA.localeCompare(teamB, "nl", {
        sensitivity: "base",
      })
    )
    .map(([teamName, teamCyclists]) => ({
      teamName,
      cyclists: teamCyclists.sort((a, b) =>
        getCyclistName(a).localeCompare(
          getCyclistName(b),
          "nl",
          {
            sensitivity: "base",
          }
        )
      ),
    }));
}

  function validateResults() {
    const filledSelections =
      selections.filter(Boolean);

    if (filledSelections.length === 0) {
      return "Selecteer minimaal één renner.";
    }

    const uniqueCyclistIds = new Set(
      filledSelections
    );

    if (
      uniqueCyclistIds.size !==
      filledSelections.length
    ) {
      return (
        "Een renner kan maar één positie " +
        "in de etappe-uitslag krijgen."
      );
    }

    let emptyPositionFound = false;

    for (
      let index = 0;
      index < selections.length;
      index++
    ) {
      if (!selections[index]) {
        emptyPositionFound = true;
        continue;
      }

      if (emptyPositionFound) {
        return (
          "Vul de uitslag zonder lege posities in. " +
          "Je kunt bijvoorbeeld niet positie 4 " +
          "invullen als positie 3 leeg is."
        );
      }
    }

    if (!yellowJerseyCompetitionCyclistId) {
      return (
        "Selecteer de drager van de " +
        "leiderstrui."
      );
    }

    if (!greenJerseyCompetitionCyclistId) {
      return (
        "Selecteer de drager van de " +
        "puntentrui."
      );
    }

    if (!polkaDotJerseyCompetitionCyclistId) {
      return (
        "Selecteer de drager van de " +
        "bergtrui."
      );
    }

    if (!whiteJerseyCompetitionCyclistId) {
      return (
        "Selecteer de drager van de " +
        "witte trui."
      );
    }

    return "";
  }

  async function handleSave() {
    if (!selectedStageId) {
      setError("Selecteer eerst een etappe.");
      return;
    }

    const validationError = validateResults();

    if (validationError) {
      setError(validationError);
      return;
    }

    const results = selections
      .map(
        (
          competitionCyclistId,
          index
        ) => ({
          competitionCyclistId,
          position: index + 1,
        })
      )
      .filter(
        (result) =>
          result.competitionCyclistId
      );

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await saveStageResults(
        competition.id,
        selectedStageId,
        results,
        yellowJerseyCompetitionCyclistId,
        greenJerseyCompetitionCyclistId,
        polkaDotJerseyCompetitionCyclistId,
        whiteJerseyCompetitionCyclistId
      );

      setStages((currentStages) =>
        currentStages.map((stage) =>
          stage.id === selectedStageId
            ? {
                ...stage,
                resultsPublished: false,
              }
            : stage
        )
      );

      await loadResults(selectedStageId);

      setMessage(
        "De etappe-uitslag en truiendragers zijn opgeslagen."
      );
    } catch (err) {
      setError(
        err.message ||
          "De etappe-uitslag kon niet worden opgeslagen."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedStageId) {
      setError("Selecteer eerst een etappe.");
      return;
    }

    const confirmed = window.confirm(
      "Weet je zeker dat je de volledige uitslag en alle truiendragers van deze etappe wilt verwijderen?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await deleteStageResults(
        competition.id,
        selectedStageId
      );

      resetResultForm();

      setStages((currentStages) =>
        currentStages.map((stage) =>
          stage.id === selectedStageId
            ? {
                ...stage,
                resultsPublished: false,
              }
            : stage
        )
      );

      setMessage(
        "De etappe-uitslag en truiendragers zijn verwijderd."
      );
    } catch (err) {
      setError(
        err.message ||
          "De etappe-uitslag kon niet worden verwijderd."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (!selectedStageId) {
      setError("Selecteer eerst een etappe.");
      return;
    }

    const validationError = validateResults();

    if (validationError) {
      setError(
        "Sla eerst een geldige etappe-uitslag en alle truiendragers op voordat je publiceert."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await publishStageResults(
        competition.id,
        selectedStageId
      );

      setStages((currentStages) =>
        currentStages.map((stage) =>
          stage.id === selectedStageId
            ? {
                ...stage,
                resultsPublished: true,
              }
            : stage
        )
      );

      setMessage(
        "De etappe-uitslag is gepubliceerd."
      );
    } catch (err) {
      setError(
        err.message ||
          "De etappe-uitslag kon niet worden gepubliceerd."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleUnpublish() {
    if (!selectedStageId) {
      setError("Selecteer eerst een etappe.");
      return;
    }

    const confirmed = window.confirm(
      "Weet je zeker dat je de publicatie van deze uitslag wilt intrekken?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await unpublishStageResults(
        competition.id,
        selectedStageId
      );

      setStages((currentStages) =>
        currentStages.map((stage) =>
          stage.id === selectedStageId
            ? {
                ...stage,
                resultsPublished: false,
              }
            : stage
        )
      );

      setMessage(
        "De publicatie van de etappe-uitslag is ingetrokken."
      );
    } catch (err) {
      setError(
        err.message ||
          "De publicatie kon niet worden ingetrokken."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p>Uitslagenpagina laden...</p>;
  }

  return (
    <section className="stage-results-manager">
      <header className="stage-results-manager__header">
        <div>
          <h2>Etappe-uitslag</h2>

          <p>
            Selecteer per positie de juiste renner en wijs
            daarna de vier truiendragers aan. De punten
            worden automatisch toegekend.
          </p>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="stage-results-message stage-results-message--error"
        >
          {error}
        </div>
      )}

      {message && (
        <div className="stage-results-message stage-results-message--success">
          {message}
        </div>
      )}

      <section className="responsive-card stage-results-stage-card">
        <label htmlFor="stage">
          <strong>Etappe</strong>
        </label>

        <select
          id="stage"
          value={selectedStageId}
          onChange={(event) =>
            setSelectedStageId(event.target.value)
          }
          disabled={saving}
          className="responsive-input"
          style={{ marginTop: "8px" }}
        >
          {stages.length === 0 && (
            <option value="">
              Er zijn nog geen etappes
            </option>
          )}

          {stages.map((stage) => (
            <option
              key={stage.id}
              value={stage.id}
            >
              Etappe {stage.stageNumber}:{" "}
              {stage.startLocation} -{" "}
              {stage.finishLocation}
            </option>
          ))}
        </select>

        {selectedStage && (
          <div className="stage-results-status">
            <span>Status</span>

            <strong>
              {selectedStage.resultsPublished
                ? "Gepubliceerd"
                : "Niet gepubliceerd"}
            </strong>
          </div>
        )}
      </section>

      {loadingResults ? (
        <p>Uitslag laden...</p>
      ) : (
        <>
          <section className="responsive-card">
            <div className="stage-results-section-heading">
              <div>
                <h3>Top 15</h3>

                <p>
                  Vul de klassering zonder lege posities
                  in. Een renner kan maar één keer worden
                  geselecteerd.
                </p>
              </div>
            </div>

            <div className="stage-results-desktop-table">
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                  }}
                >
                  <thead>
                    <tr>
                      <th className="stage-results-th">
                        Positie
                      </th>

                      <th className="stage-results-th">
                        Renner
                      </th>

                      <th className="stage-results-th stage-results-th--right">
                        Punten
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {POINTS_BY_POSITION.map(
                      (
                        points,
                        positionIndex
                      ) => {
                        const selectedCyclistId =
                          selections[positionIndex];

                        return (
                          <tr
                            key={positionIndex + 1}
                          >
                            <td className="stage-results-td">
                              <strong>
                                {positionIndex + 1}
                              </strong>
                            </td>

                            <td className="stage-results-td">
                              <select
                                value={
                                  selectedCyclistId
                                }
                                onChange={(event) =>
                                  handleCyclistChange(
                                    positionIndex,
                                    event.target.value
                                  )
                                }
                                disabled={saving}
                                className="responsive-input"
                              >
                                <option value="">
                                  Kies een renner
                                </option>

                                {cyclistGroups.map((group) => (
                                  <optgroup
                                    key={group.teamName}
                                    label={group.teamName}
                                  >
                                    {group.cyclists.map(
                                      (competitionCyclist) => {
                                        const isSelectedElsewhere =
                                          selectedCyclistIds.includes(
                                            competitionCyclist.id
                                          ) &&
                                          selectedCyclistId !==
                                            competitionCyclist.id;

                                        return (
                                          <option
                                            key={competitionCyclist.id}
                                            value={competitionCyclist.id}
                                            disabled={isSelectedElsewhere}
                                          >
                                            {getCyclistName(
                                              competitionCyclist
                                            )}
                                          </option>
                                        );
                                      }
                                    )}
                                  </optgroup>
                                ))}
                              </select>
                            </td>

                            <td className="stage-results-td stage-results-td--right">
                              <strong>{points}</strong>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="stage-results-mobile-list">
              {POINTS_BY_POSITION.map(
                (points, positionIndex) => {
                  const selectedCyclistId =
                    selections[positionIndex];

                  return (
                    <div
                      key={positionIndex + 1}
                      className="stage-result-mobile-row"
                    >
                      <div className="stage-result-mobile-position">
                        {positionIndex + 1}
                      </div>

                      <div className="stage-result-mobile-select">
                        <select
                          id={`position-${positionIndex + 1}`}
                          aria-label={`Renner op positie ${
                            positionIndex + 1
                          }`}
                          value={selectedCyclistId}
                          onChange={(event) =>
                            handleCyclistChange(
                              positionIndex,
                              event.target.value
                            )
                          }
                          disabled={saving}
                          className="responsive-input"
                        >
                          <option value="">
                            Kies een renner
                          </option>

                          {cyclistGroups.map((group) => (
                            <optgroup
                              key={group.teamName}
                              label={group.teamName}
                            >
                              {group.cyclists.map(
                                (competitionCyclist) => {
                                  const isSelectedElsewhere =
                                    selectedCyclistIds.includes(
                                      competitionCyclist.id
                                    ) &&
                                    selectedCyclistId !==
                                      competitionCyclist.id;

                                  return (
                                    <option
                                      key={competitionCyclist.id}
                                      value={competitionCyclist.id}
                                      disabled={isSelectedElsewhere}
                                    >
                                      {getCyclistName(
                                        competitionCyclist
                                      )}
                                    </option>
                                  );
                                }
                              )}
                            </optgroup>
                          ))}
                        </select>
                      </div>

                      <div className="stage-result-mobile-points">
                        <strong>{points}</strong>
                        <span>pt</span>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </section>

          <section
            className="responsive-card"
            style={{ marginTop: "24px" }}
          >
            <div className="stage-results-section-heading">
              <div>
                <h3>Truiendragers</h3>

                <p>
                  Een truiendrager hoeft niet in de top
                  15 te staan. Dezelfde renner mag
                  meerdere truien dragen.
                </p>
              </div>
            </div>

            <div className="stage-results-jersey-grid">
              <JerseyField
                id="yellow-jersey"
                label="🟡 Leiderstrui"
                points={10}
                value={
                  yellowJerseyCompetitionCyclistId
                }
                onChange={(value) =>
                  handleJerseyChange(
                    setYellowJerseyCompetitionCyclistId,
                    value
                  )
                }
                cyclistGroups={cyclistGroups}
                getCyclistName={getCyclistName}
                disabled={saving}
              />

              <JerseyField
                id="green-jersey"
                label="🟢 Puntentrui"
                points={5}
                value={
                  greenJerseyCompetitionCyclistId
                }
                onChange={(value) =>
                  handleJerseyChange(
                    setGreenJerseyCompetitionCyclistId,
                    value
                  )
                }
                cyclistGroups={cyclistGroups}
                getCyclistName={getCyclistName}
                disabled={saving}
              />

              <JerseyField
                id="polka-dot-jersey"
                label="🔴 Bergtrui"
                points={5}
                value={
                  polkaDotJerseyCompetitionCyclistId
                }
                onChange={(value) =>
                  handleJerseyChange(
                    setPolkaDotJerseyCompetitionCyclistId,
                    value
                  )
                }
                cyclistGroups={cyclistGroups}
                getCyclistName={getCyclistName}
                disabled={saving}
              />

              <JerseyField
                id="white-jersey"
                label="⚪ Witte trui"
                points={5}
                value={
                  whiteJerseyCompetitionCyclistId
                }
                onChange={(value) =>
                  handleJerseyChange(
                    setWhiteJerseyCompetitionCyclistId,
                    value
                  )
                }
                cyclistGroups={cyclistGroups}
                getCyclistName={getCyclistName}
                disabled={saving}
              />
            </div>
          </section>
        </>
      )}

      <div className="stage-results-actions">
        <button
          type="button"
          onClick={handleSave}
          disabled={
            saving ||
            loadingResults ||
            !selectedStageId
          }
        >
          {saving
            ? "Bezig..."
            : "Uitslag opslaan"}
        </button>

        {selectedStage?.resultsPublished ? (
          <button
            type="button"
            onClick={handleUnpublish}
            disabled={
              saving ||
              loadingResults ||
              !selectedStageId
            }
          >
            Publicatie intrekken
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePublish}
            disabled={
              saving ||
              loadingResults ||
              !selectedStageId
            }
          >
            Uitslag publiceren
          </button>
        )}

        <button
          type="button"
          onClick={handleDelete}
          disabled={
            saving ||
            loadingResults ||
            !selectedStageId
          }
        >
          Uitslag verwijderen
        </button>
      </div>
    </section>
  );
}

function JerseyField({
  id,
  label,
  points,
  value,
  onChange,
  cyclistGroups,
  getCyclistName,
  disabled,
}) {
  return (
    <div className="stage-results-jersey-card">
      <label htmlFor={id}>
        <strong>{label}</strong>
      </label>

      <div className="stage-results-jersey-card__points">
        +{points} punten
      </div>

      <select
        id={id}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        disabled={disabled}
        className="responsive-input"
        style={{ marginTop: "10px" }}
      >
        <option value="">
          Kies een renner
        </option>

        {cyclistGroups.map((group) => (
          <optgroup
            key={group.teamName}
            label={group.teamName}
          >
            {group.cyclists.map(
              (competitionCyclist) => (
                <option
                  key={competitionCyclist.id}
                  value={competitionCyclist.id}
                >
                  {getCyclistName(
                    competitionCyclist
                  )}
                </option>
              )
            )}
          </optgroup>
        ))}
      </select>
    </div>
  );
}

function getPositionIcon(position) {
  switch (position) {
    case 1:
      return "🥇";

    case 2:
      return "🥈";

    case 3:
      return "🥉";

    default:
      return position;
  }
}
