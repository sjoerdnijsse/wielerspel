import { useEffect, useMemo, useState } from "react";

import {
  getCyclists,
  getCompetitionCyclists,
  addCompetitionCyclist,
  updateCompetitionCyclist,
  deleteCompetitionCyclist,
} from "../../services/Api";

const NO_TEAM_ID = "no-team";

function CompetitionCyclistManager({ competition }) {
  const [allCyclists, setAllCyclists] = useState([]);
  const [competitionCyclists, setCompetitionCyclists] = useState([]);

  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [search, setSearch] = useState("");

  const [selectedCyclistId, setSelectedCyclistId] = useState(null);
  const [newPrice, setNewPrice] = useState("");

  const [editingCyclistId, setEditingCyclistId] = useState(null);
  const [editingPrice, setEditingPrice] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingCyclistId, setSavingCyclistId] = useState(null);
  const [deletingCyclistId, setDeletingCyclistId] = useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, [competition.id]);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [cyclistsData, competitionCyclistsData] =
        await Promise.all([
          getCyclists(),
          getCompetitionCyclists(competition.id),
        ]);

      setAllCyclists(cyclistsData);
      setCompetitionCyclists(competitionCyclistsData);
    } catch (error) {
      console.error(error);
      setError(
        "De renners en wedstrijdprijzen konden niet worden geladen."
      );
    } finally {
      setLoading(false);
    }
  }

  const competitionCyclistByCyclistId = useMemo(() => {
    return new Map(
      competitionCyclists.map((item) => [
        item.cyclistId,
        item,
      ])
    );
  }, [competitionCyclists]);

  const teams = useMemo(() => {
    const teamsById = new Map();

    for (const cyclist of allCyclists) {
      const teamId = cyclist.team?.id ?? NO_TEAM_ID;
      const teamName = cyclist.team?.name ?? "Geen ploeg";

      if (!teamsById.has(teamId)) {
        teamsById.set(teamId, {
          id: teamId,
          name: teamName,
          cyclistCount: 0,
          competitionCyclistCount: 0,
        });
      }

      const team = teamsById.get(teamId);

      team.cyclistCount += 1;

      if (competitionCyclistByCyclistId.has(cyclist.id)) {
        team.competitionCyclistCount += 1;
      }
    }

    return Array.from(teamsById.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "nl", {
        sensitivity: "base",
      })
    );
  }, [allCyclists, competitionCyclistByCyclistId]);

  useEffect(() => {
    if (teams.length === 0) {
      setSelectedTeamId("");
      return;
    }

    const selectedTeamStillExists = teams.some(
      (team) => team.id === selectedTeamId
    );

    if (!selectedTeamStillExists) {
      setSelectedTeamId(teams[0].id);
    }
  }, [teams, selectedTeamId]);

  const selectedTeam = useMemo(() => {
    return (
      teams.find((team) => team.id === selectedTeamId) ??
      null
    );
  }, [teams, selectedTeamId]);

  const selectedTeamCyclists = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return allCyclists
      .filter((cyclist) => {
        const teamId = cyclist.team?.id ?? NO_TEAM_ID;
        return teamId === selectedTeamId;
      })
      .filter((cyclist) => {
        if (!searchValue) {
          return true;
        }

        return cyclist.name
          .toLowerCase()
          .includes(searchValue);
      })
      .sort((a, b) =>
        a.name.localeCompare(b.name, "nl", {
          sensitivity: "base",
        })
      );
  }, [allCyclists, selectedTeamId, search]);

  function selectTeam(teamId) {
    setSelectedTeamId(teamId);
    setSearch("");
    cancelAdding();
    cancelEditing();
    clearFeedback();
  }

  function startAdding(cyclist) {
    setSelectedCyclistId(cyclist.id);
    setNewPrice("");
    cancelEditing();
    clearFeedback();
  }

  function cancelAdding() {
    setSelectedCyclistId(null);
    setNewPrice("");
  }

  function startEditing(item) {
    setEditingCyclistId(item.cyclistId);
    setEditingPrice(String(item.price));
    cancelAdding();
    clearFeedback();
  }

  function cancelEditing() {
    setEditingCyclistId(null);
    setEditingPrice("");
  }

  function clearFeedback() {
    setError("");
    setMessage("");
  }

  async function handleAdd(cyclist) {
    const price = Number(newPrice);

    if (!Number.isInteger(price) || price <= 0) {
      setError(
        "Vul een geldige prijs in hele miljoenen in."
      );
      return;
    }

    setSavingCyclistId(cyclist.id);
    clearFeedback();

    try {
      await addCompetitionCyclist(
        competition.id,
        cyclist.id,
        price
      );

      setMessage(
        `${cyclist.name} is voor €${price}M aan de wedstrijd toegevoegd.`
      );

      cancelAdding();
      await loadData();
    } catch (error) {
      console.error(error);
      setError(cleanApiError(error.message));
    } finally {
      setSavingCyclistId(null);
    }
  }

  async function handleUpdate(item) {
    const price = Number(editingPrice);

    if (!Number.isInteger(price) || price <= 0) {
      setError(
        "Vul een geldige prijs in hele miljoenen in."
      );
      return;
    }

    setSavingCyclistId(item.cyclistId);
    clearFeedback();

    try {
      await updateCompetitionCyclist(
        competition.id,
        item.cyclistId,
        price
      );

      setMessage(
        `De prijs van ${item.cyclist.name} is aangepast naar €${price}M.`
      );

      cancelEditing();
      await loadData();
    } catch (error) {
      console.error(error);
      setError(cleanApiError(error.message));
    } finally {
      setSavingCyclistId(null);
    }
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(
      `Weet je zeker dat je "${item.cyclist.name}" uit deze wedstrijd wilt verwijderen?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingCyclistId(item.cyclistId);
    clearFeedback();

    try {
      await deleteCompetitionCyclist(
        competition.id,
        item.cyclistId
      );

      if (editingCyclistId === item.cyclistId) {
        cancelEditing();
      }

      setMessage(
        `${item.cyclist.name} is uit deze wedstrijd verwijderd.`
      );

      await loadData();
    } catch (error) {
      console.error(error);
      setError(cleanApiError(error.message));
    } finally {
      setDeletingCyclistId(null);
    }
  }

  return (
    <section>
      <header style={{ marginBottom: "20px" }}>
        <h3>Wedstrijdrenners</h3>

        <p>
          Koppel renners aan {competition.name}{" "}
          {competition.year} en stel per renner de prijs in.
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

      {loading ? (
        <p>Renners laden...</p>
      ) : teams.length === 0 ? (
        <p>
          Er zijn nog geen ploegen met renners beschikbaar.
        </p>
      ) : (
        <div className="competition-cyclist-layout">
          <TeamNavigation
            teams={teams}
            selectedTeamId={selectedTeamId}
            onSelectTeam={selectTeam}
          />

          <section className="responsive-card">
            <header style={{ marginBottom: "20px" }}>
              <h4 style={{ marginTop: 0 }}>
                {selectedTeam?.name ?? "Ploeg"}
              </h4>

              {selectedTeam && (
                <p>
                  {selectedTeam.competitionCyclistCount} van{" "}
                  {selectedTeam.cyclistCount} renners toegevoegd
                </p>
              )}
            </header>

            <label
              htmlFor="competition-cyclist-search"
              style={{
                display: "block",
                marginBottom: "8px",
              }}
            >
              Zoeken binnen deze ploeg
            </label>

            <input
              id="competition-cyclist-search"
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Zoek op naam"
              className="responsive-input"
              style={{
                marginBottom: "20px",
              }}
            />

            {selectedTeamCyclists.length === 0 ? (
              <p>Geen renners gevonden.</p>
            ) : (
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                }}
              >
                {selectedTeamCyclists.map((cyclist) => {
                  const competitionCyclist =
                    competitionCyclistByCyclistId.get(
                      cyclist.id
                    );

                  return (
                    <CyclistRow
                      key={cyclist.id}
                      cyclist={cyclist}
                      competitionCyclist={
                        competitionCyclist
                      }
                      selectedCyclistId={
                        selectedCyclistId
                      }
                      newPrice={newPrice}
                      editingCyclistId={
                        editingCyclistId
                      }
                      editingPrice={editingPrice}
                      savingCyclistId={
                        savingCyclistId
                      }
                      deletingCyclistId={
                        deletingCyclistId
                      }
                      onStartAdding={startAdding}
                      onCancelAdding={cancelAdding}
                      onNewPriceChange={setNewPrice}
                      onAdd={handleAdd}
                      onStartEditing={startEditing}
                      onCancelEditing={cancelEditing}
                      onEditingPriceChange={
                        setEditingPrice
                      }
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                    />
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}
    </section>
  );
}

function TeamNavigation({
  teams,
  selectedTeamId,
  onSelectTeam,
}) {
  return (
    <aside className="responsive-card competition-team-navigation">
      <h4 style={{ marginTop: 0 }}>Ploegen</h4>

      <ul className="competition-team-nav">
        {teams.map((team) => {
          const isSelected = team.id === selectedTeamId;

          return (
            <li key={team.id}>
              <button
                type="button"
                onClick={() => onSelectTeam(team.id)}
                aria-pressed={isSelected}
                className="competition-team-nav__button"
                style={{
                  width: "100%",
                  padding: "12px",
                  textAlign: "left",
                  border: isSelected
                    ? "2px solid currentColor"
                    : "1px solid #ccc",
                  borderRadius: "8px",
                  fontWeight: isSelected
                    ? "bold"
                    : "normal",
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  {team.name}
                </span>

                <small>
                  {team.competitionCyclistCount} van{" "}
                  {team.cyclistCount} toegevoegd
                </small>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

function CyclistRow({
  cyclist,
  competitionCyclist,
  selectedCyclistId,
  newPrice,
  editingCyclistId,
  editingPrice,
  savingCyclistId,
  deletingCyclistId,
  onStartAdding,
  onCancelAdding,
  onNewPriceChange,
  onAdd,
  onStartEditing,
  onCancelEditing,
  onEditingPriceChange,
  onUpdate,
  onDelete,
}) {
  const isAdded = Boolean(competitionCyclist);
  const isAdding = selectedCyclistId === cyclist.id;
  const isEditing = editingCyclistId === cyclist.id;
  const isSaving = savingCyclistId === cyclist.id;
  const isDeleting = deletingCyclistId === cyclist.id;
  const isBusy = isSaving || isDeleting;

  return (
    <li className="competition-cyclist-row">
      <div className="competition-cyclist-row__main">
        <div className="competition-cyclist-row__info">
          <strong>{cyclist.name}</strong>

          {isAdded && !isEditing && (
            <div style={{ marginTop: "4px" }}>
              €{competitionCyclist.price}M
            </div>
          )}

          {!isAdded && !isAdding && (
            <div style={{ marginTop: "4px" }}>
              Nog niet toegevoegd
            </div>
          )}
        </div>

        {!isAdded && !isAdding && (
          <div className="competition-cyclist-row__actions">
            <button
              type="button"
              onClick={() => onStartAdding(cyclist)}
              disabled={isBusy}
            >
              Toevoegen
            </button>
          </div>
        )}

        {isAdded && !isEditing && (
          <div className="competition-cyclist-row__actions">
            <button
              type="button"
              onClick={() =>
                onStartEditing(competitionCyclist)
              }
              disabled={isBusy}
            >
              Prijs wijzigen
            </button>

            <button
              type="button"
              onClick={() =>
                onDelete(competitionCyclist)
              }
              disabled={isBusy}
            >
              {isDeleting
                ? "Verwijderen..."
                : "Verwijderen"}
            </button>
          </div>
        )}
      </div>

      {isAdding && (
        <PriceEditor
          cyclist={cyclist}
          price={newPrice}
          saving={isSaving}
          submitLabel="Toevoegen"
          onPriceChange={onNewPriceChange}
          onSubmit={() => onAdd(cyclist)}
          onCancel={onCancelAdding}
        />
      )}

      {isEditing && (
        <PriceEditor
          cyclist={cyclist}
          price={editingPrice}
          saving={isSaving}
          submitLabel="Opslaan"
          onPriceChange={onEditingPriceChange}
          onSubmit={() =>
            onUpdate(competitionCyclist)
          }
          onCancel={onCancelEditing}
        />
      )}
    </li>
  );
}

function PriceEditor({
  cyclist,
  price,
  saving,
  submitLabel,
  onPriceChange,
  onSubmit,
  onCancel,
}) {
  return (
    <div
      className="responsive-card"
      style={{
        marginTop: "14px",
      }}
    >
      <label htmlFor={`price-${cyclist.id}`}>
        Prijs in hele miljoenen
      </label>

      <input
        id={`price-${cyclist.id}`}
        type="number"
        min="1"
        step="1"
        value={price}
        onChange={(event) =>
          onPriceChange(event.target.value)
        }
        disabled={saving}
        autoFocus
        className="responsive-input"
        style={{
          marginTop: "8px",
        }}
      />

      <div
        className="responsive-actions"
        style={{
          marginTop: "12px",
        }}
      >
        <button
          type="button"
          onClick={onSubmit}
          disabled={saving}
        >
          {saving ? "Opslaan..." : submitLabel}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
        >
          Annuleren
        </button>
      </div>
    </div>
  );
}

function cleanApiError(message) {
  if (!message) {
    return "Er is iets misgegaan.";
  }

  try {
    const parsed = JSON.parse(message);

    if (typeof parsed === "string") {
      return parsed;
    }

    return parsed.message ?? message;
  } catch {
    return message;
  }
}

export default CompetitionCyclistManager;