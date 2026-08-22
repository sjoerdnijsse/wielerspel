function TeamList({
  cyclists,
  stages,
  jokerSelections,
  savingId,
  savingJokers,
  teamComplete,
  teamLocked,
  transfersUsed,
  maxTransfers,
  selectedTransferSelectionIds,
  onJokerChange,
  onSaveJokers,
  onRemove,
  onTransfer,
}) {
  const transfersRemaining = Math.max(
    maxTransfers - transfersUsed,
    0
  );

  const selectedJokerStageIds = new Set(
    Object.values(jokerSelections).filter(Boolean)
  );

  function handleAction(cyclist) {
    if (teamLocked) {
      onTransfer?.(cyclist);
      return;
    }

    onRemove(cyclist.competitionCyclistId);
  }

  function getButtonText(cyclist) {
    const isSaving =
      savingId === cyclist.competitionCyclistId;

    const isSelectedForTransfer =
      selectedTransferSelectionIds?.includes(
        cyclist.selectionId
      );

    if (isSaving) {
      return teamLocked
        ? "Transfer verwerken..."
        : "Verwijderen...";
    }

    if (!teamLocked) {
      return "Verwijderen";
    }

    if (transfersRemaining <= 0) {
      return "Geen transfers meer";
    }

    if (isSelectedForTransfer) {
      return "Annuleren";
    }

    return "Transfer";
  }

  function getStageTypeLabel(type) {
    switch (type) {
      case 0:
        return "Vlak";

      case 1:
        return "Heuvelachtig";

      case 2:
        return "Berg";

      case 3:
        return "Tijdrit";

      default:
        return "Onbekend";
    }
  }

  function getJokerLabel(cyclist) {
    const stage = stages.find(
      (item) =>
        item.stageNumber === cyclist.jokerStageNumber
    );

    if (cyclist.jokerStageNumber) {
      return stage
        ? `Etappe ${cyclist.jokerStageNumber} (${getStageTypeLabel(
            stage.type
          )})`
        : `Etappe ${cyclist.jokerStageNumber}`;
    }

    const selectedStageId =
      jokerSelections[cyclist.selectionId];

    const selectedStage = stages.find(
      (stage) => stage.id === selectedStageId
    );

    return selectedStage
      ? `Etappe ${selectedStage.stageNumber} (${getStageTypeLabel(
          selectedStage.type
        )})`
      : "Niet ingesteld";
  }

  return (
    <section
      className="responsive-card"
      style={{
        marginBottom: "25px",
      }}
    >
      <h3>Geselecteerde renners</h3>

      {teamLocked && (
        <p>
          Transfers beschikbaar:{" "}
          <strong>{transfersRemaining}</strong> van{" "}
          <strong>{maxTransfers}</strong>
        </p>
      )}

      {!teamLocked && !teamComplete && (
        <p>
          Zodra je ploeg compleet is, kun je voor iedere
          renner een unieke jokeretappe kiezen.
        </p>
      )}

      {!teamLocked && teamComplete && (
        <p>
          Kies voor iedere renner één jokeretappe. Iedere
          etappe mag maar één keer worden gebruikt.
          Vergeet de jokers niet op te slaan als je alles
          hebt ingevuld.
        </p>
      )}

      {teamLocked && teamComplete && (
        <p>
          De jokerkeuzes zijn definitief en kunnen na de
          ploegdeadline niet meer worden gewijzigd.
        </p>
      )}

      {cyclists.length === 0 && (
        <p>Je hebt nog geen renners geselecteerd.</p>
      )}

      <ul className="team-list">
        {cyclists.map((cyclist) => {
          const isSaving =
            savingId === cyclist.competitionCyclistId;

          const transfersExhausted =
            teamLocked && transfersRemaining <= 0;

          const isSelectedForTransfer =
            selectedTransferSelectionIds?.includes(
              cyclist.selectionId
            );

          const currentJokerStageId =
            jokerSelections[cyclist.selectionId] ?? "";

          return (
            <li
              key={cyclist.selectionId}
              className={[
                "team-list__item",
                isSelectedForTransfer
                  ? "team-list__item--selected"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="team-list__info">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                  }}
                >
                  <div
                    style={{
                      width: "54px",
                      minWidth: "54px",
                      height: "64px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {cyclist.team?.jerseyImageUrl ? (
                      <img
                        src={cyclist.team.jerseyImageUrl}
                        alt={`Shirt van ${
                          cyclist.team?.name ??
                          "de ploeg"
                        }`}
                        style={{
                          width: "48px",
                          height: "60px",
                          objectFit: "contain",
                          display: "block",
                        }}
                      />
                    ) : null}
                  </div>

                  <div
                    style={{
                      minWidth: 0,
                    }}
                  >
                    <strong>{cyclist.name}</strong>

                    <div>
                      {cyclist.team?.name ?? "Geen ploeg"} · €
                      {cyclist.price}M
                    </div>
                  </div>
                </div>

                {isSelectedForTransfer && (
                  <div className="team-list__helper">
                    Geselecteerd voor transfer.
                  </div>
                )}
              </div>

              {teamComplete && (
                <div className="team-list__joker">
                  {!teamLocked ? (
                    <label>
                      <span className="team-list__label">
                        Joker
                      </span>

                      <select
                        value={currentJokerStageId}
                        onChange={(event) =>
                          onJokerChange(
                            cyclist.selectionId,
                            event.target.value
                          )
                        }
                        disabled={savingJokers}
                        className="responsive-input"
                      >
                        <option value="">
                          Kies een etappe
                        </option>

                        {stages.map((stage) => {
                          const usedByAnotherCyclist =
                            selectedJokerStageIds.has(
                              stage.id
                            ) &&
                            currentJokerStageId !== stage.id;

                          return (
                            <option
                              key={stage.id}
                              value={stage.id}
                              disabled={usedByAnotherCyclist}
                            >
                              Etappe {stage.stageNumber} (
                              {getStageTypeLabel(stage.type)})
                            </option>
                          );
                        })}
                      </select>
                    </label>
                  ) : (
                    <div>
                      <div className="team-list__label">
                        Joker
                      </div>

                      <strong>
                        {getJokerLabel(cyclist)}
                      </strong>
                    </div>
                  )}
                </div>
              )}

              <div className="team-list__action">
                <button
                  type="button"
                  onClick={() => handleAction(cyclist)}
                  disabled={
                    isSaving ||
                    savingJokers ||
                    transfersExhausted ||
                    (teamLocked && !onTransfer)
                  }
                >
                  {getButtonText(cyclist)}
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {!teamLocked && teamComplete && (
        <div
          className="responsive-actions"
          style={{
            marginTop: "20px",
          }}
        >
          <button
            type="button"
            onClick={onSaveJokers}
            disabled={savingJokers}
          >
            {savingJokers
              ? "Jokers opslaan..."
              : "Jokers opslaan"}
          </button>
        </div>
      )}
    </section>
  );
}

export default TeamList;