import { useEffect, useMemo, useState } from "react";

import {
  getCyclists,
  getTeamsForAdmin,
  createCyclist,
  updateCyclist,
  deleteCyclist,
} from "../../services/Api";

function CyclistManager() {
  const [cyclists, setCyclists] = useState([]);
  const [teams, setTeams] = useState([]);

  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [cyclistName, setCyclistName] = useState("");
  const [search, setSearch] = useState("");

  const [editingCyclistId, setEditingCyclistId] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData(preferredTeamId = null) {
    setLoading(true);
    setError("");

    try {
      const [cyclistData, teamData] = await Promise.all([
        getCyclists(),
        getTeamsForAdmin(),
      ]);

      setCyclists(cyclistData);
      setTeams(teamData);

      setSelectedTeamId((currentTeamId) => {
        const requestedTeamId =
          preferredTeamId ?? currentTeamId;

        const requestedTeamStillExists = teamData.some(
          (team) => team.id === requestedTeamId
        );

        if (requestedTeamStillExists) {
          return requestedTeamId;
        }

        return teamData[0]?.id ?? "";
      });
    } catch (error) {
      console.error(error);
      setError(
        "Renners of ploegen konden niet worden geladen."
      );
    } finally {
      setLoading(false);
    }
  }

  const selectedTeam = useMemo(() => {
    return (
      teams.find((team) => team.id === selectedTeamId) ??
      null
    );
  }, [teams, selectedTeamId]);

  const cyclistCountByTeam = useMemo(() => {
    const counts = new Map();

    cyclists.forEach((cyclist) => {
      if (!cyclist.teamId) {
        return;
      }

      const currentCount =
        counts.get(cyclist.teamId) ?? 0;

      counts.set(cyclist.teamId, currentCount + 1);
    });

    return counts;
  }, [cyclists]);

  const selectedTeamCyclists = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return cyclists
      .filter(
        (cyclist) => cyclist.teamId === selectedTeamId
      )
      .filter((cyclist) => {
        if (!searchValue) {
          return true;
        }

        return cyclist.name
          .toLowerCase()
          .includes(searchValue);
      })
      .sort((firstCyclist, secondCyclist) =>
        firstCyclist.name.localeCompare(
          secondCyclist.name,
          "nl"
        )
      );
  }, [cyclists, selectedTeamId, search]);

  const selectedTeamCyclistCount = useMemo(() => {
    return cyclists.filter(
      (cyclist) => cyclist.teamId === selectedTeamId
    ).length;
  }, [cyclists, selectedTeamId]);

  function selectTeam(teamId) {
    if (saving || deletingId) {
      return;
    }

    setSelectedTeamId(teamId);
    setCyclistName("");
    setSearch("");
    setEditingCyclistId(null);
    setError("");
    setMessage("");
  }

  function resetForm() {
    setCyclistName("");
    setEditingCyclistId(null);
    setError("");
  }

  function startEditing(cyclist) {
    setSelectedTeamId(cyclist.teamId);
    setCyclistName(cyclist.name);
    setEditingCyclistId(cyclist.id);
    setError("");
    setMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedName = cyclistName.trim();

    if (!selectedTeamId) {
      setError("Selecteer eerst een ploeg.");
      return;
    }

    if (!trimmedName) {
      setError("Vul de naam van de renner in.");
      return;
    }

    const duplicateCyclist = cyclists.some(
      (cyclist) =>
        cyclist.teamId === selectedTeamId &&
        cyclist.id !== editingCyclistId &&
        cyclist.name.trim().toLowerCase() ===
          trimmedName.toLowerCase()
    );

    if (duplicateCyclist) {
      setError(
        "Er bestaat binnen deze ploeg al een renner met deze naam."
      );
      return;
    }

    const cyclist = {
      name: trimmedName,
      teamId: selectedTeamId,
    };

    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (editingCyclistId) {
        await updateCyclist(
          editingCyclistId,
          cyclist
        );

        setMessage(
          `"${trimmedName}" is bijgewerkt.`
        );
      } else {
        await createCyclist(cyclist);

        setMessage(
          `"${trimmedName}" is toegevoegd aan ${selectedTeam?.name ?? "de ploeg"}.`
        );
      }

      setCyclistName("");
      setEditingCyclistId(null);

      await loadData(selectedTeamId);
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(cyclist) {
    const confirmed = window.confirm(
      `Weet je zeker dat je "${cyclist.name}" wilt verwijderen?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(cyclist.id);
    setError("");
    setMessage("");

    try {
      await deleteCyclist(cyclist.id);

      if (editingCyclistId === cyclist.id) {
        setCyclistName("");
        setEditingCyclistId(null);
      }

      setMessage(
        `"${cyclist.name}" is verwijderd.`
      );

      await loadData(selectedTeamId);
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section
      className="responsive-card"
      style={{
        marginTop:"30px",
      }}
    >
      <h3>Renners beheren</h3>

      <p>
        Selecteer eerst een professionele ploeg. Daarna
        kun je renners aan die ploeg toevoegen en alleen
        de renners van die ploeg bekijken.
      </p>

      <p>
        Rugnummer en prijs stel je per wedstrijd in bij
        Wedstrijdrenners.
      </p>

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

      {loading && <p>Renners en ploegen laden...</p>}

      {!loading && teams.length === 0 && (
        <p>
          Er zijn nog geen professionele ploegen
          toegevoegd. Voeg eerst een ploeg toe.
        </p>
      )}

      {!loading && teams.length > 0 && (
        <div className="cyclist-manager-layout">
          <aside className="responsive-card" style={{overflow:"hidden"}}>
            <div
              style={{
                padding: "15px",
                borderBottom: "1px solid #ddd",
              }}
            >
              <strong>Ploegen</strong>

              <div
                style={{
                  marginTop: "4px",
                  fontSize: "14px",
                }}
              >
                {teams.length} ploegen
              </div>
            </div>

            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                maxHeight: "650px",
                overflowY: "auto",
              }}
            >
              {teams.map((team) => {
                const isSelected =
                  team.id === selectedTeamId;

                const cyclistCount =
                  cyclistCountByTeam.get(team.id) ?? 0;

                return (
                  <li
                    key={team.id}
                    style={{
                      borderBottom:
                        "1px solid #eee",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        selectTeam(team.id)
                      }
                      disabled={
                        saving ||
                        deletingId !== null
                      }
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent:
                          "space-between",
                        gap: "12px",
                        padding: "14px 15px",
                        border: 0,
                        textAlign: "left",
                        cursor: "pointer",
                        fontWeight: isSelected
                          ? "bold"
                          : "normal",
                        backgroundColor: isSelected
                          ? "#f0f0f0"
                          : "transparent",
                      }}
                    >
                      <span>{team.name}</span>

                      <span
                        style={{
                          minWidth: "32px",
                          padding: "3px 8px",
                          border: "1px solid #bbb",
                          borderRadius: "999px",
                          textAlign: "center",
                          fontSize: "13px",
                        }}
                      >
                        {cyclistCount}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          <div>
            {selectedTeam ? (
              <>
                <header
                  style={{
                    marginBottom: "20px",
                  }}
                >
                  <h4
                    style={{
                      marginTop: 0,
                      marginBottom: "6px",
                    }}
                  >
                    {selectedTeam.name}
                  </h4>

                  <div>
                    {selectedTeamCyclistCount}{" "}
                    {selectedTeamCyclistCount === 1
                      ? "renner"
                      : "renners"}{" "}
                    toegevoegd
                  </div>
                </header>

                <form
                  onSubmit={handleSubmit}
                  className="responsive-card"
                  style={{marginBottom:"25px"}}
                >
                  <h4 style={{ marginTop: 0 }}>
                    {editingCyclistId
                      ? "Renner wijzigen"
                      : `Renner toevoegen aan ${selectedTeam.name}`}
                  </h4>

                  <label htmlFor="cyclist-name">
                    Naam
                  </label>

                  <input
                    id="cyclist-name"
                    name="name"
                    type="text"
                    value={cyclistName}
                    onChange={(event) =>
                      setCyclistName(
                        event.target.value
                      )
                    }
                    placeholder="Bijvoorbeeld Jonas Vingegaard"
                    autoComplete="off"
                    disabled={saving}
                    className="responsive-input"
                    style={{marginTop:"6px",marginBottom:"15px"}}
                  />

                  <div className="responsive-actions">
                    <button
                      type="submit"
                      disabled={saving}
                    >
                      {saving
                        ? "Opslaan..."
                        : editingCyclistId
                          ? "Wijzigingen opslaan"
                          : "Renner toevoegen"}
                    </button>

                    {editingCyclistId && (
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

                <div
                  style={{
                    marginBottom: "20px",
                  }}
                >
                  <label htmlFor="cyclist-search">
                    Zoeken binnen{" "}
                    {selectedTeam.name}
                  </label>

                  <input
                    id="cyclist-search"
                    type="search"
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Zoek op naam"
                    className="responsive-input"
                    style={{marginTop:"6px"}}
                  />
                </div>

                {selectedTeamCyclistCount === 0 && (
                  <p>
                    Er zijn nog geen renners aan deze
                    ploeg toegevoegd.
                  </p>
                )}

                {selectedTeamCyclistCount > 0 &&
                  selectedTeamCyclists.length ===
                    0 && (
                    <p>
                      Geen renners gevonden voor deze
                      zoekopdracht.
                    </p>
                  )}

                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                  }}
                >
                  {selectedTeamCyclists.map(
                    (cyclist) => {
                      const isDeleting =
                        deletingId === cyclist.id;

                      const isEditing =
                        editingCyclistId ===
                        cyclist.id;

                      return (
                        <li
                          key={cyclist.id}
                          className="admin-list-item"
                          style={{
                            backgroundColor:isEditing?"#f5f5f5":"transparent",
                            padding:"12px"
                          }}
                        >
                          <div className="admin-list-item__content">
                            <strong>
                              {cyclist.name}
                            </strong>

                            {isEditing && (
                              <div
                                style={{
                                  marginTop: "4px",
                                  fontSize: "14px",
                                }}
                              >
                                Wordt momenteel
                                gewijzigd
                              </div>
                            )}
                          </div>

                          <div className="admin-list-item__actions">
                          <button
                            type="button"
                            onClick={() =>
                              startEditing(cyclist)
                            }
                            disabled={
                              saving ||
                              deletingId !== null
                            }
                          >
                            Wijzigen
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(cyclist)
                            }
                            disabled={
                              saving ||
                              deletingId !== null
                            }
                          >
                            {isDeleting
                              ? "Verwijderen..."
                              : "Verwijderen"}
                          </button>
                          </div>
                        </li>
                      );
                    }
                  )}
                </ul>
              </>
            ) : (
              <p>Selecteer een ploeg.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default CyclistManager;