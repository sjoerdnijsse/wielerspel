import { useEffect, useState } from "react";

import {
  getTeamsForAdmin,
  createTeam,
  updateTeam,
  deleteTeam,
} from "../../services/Api";

function TeamManager() {
  const [teams, setTeams] = useState([]);

  const [newTeamName, setNewTeamName] =
    useState("");

  const [
    newTeamJerseyImageUrl,
    setNewTeamJerseyImageUrl,
  ] = useState("");

  const [editingTeamId, setEditingTeamId] =
    useState(null);

  const [editingTeamName, setEditingTeamName] =
    useState("");

  const [
    editingTeamJerseyImageUrl,
    setEditingTeamJerseyImageUrl,
  ] = useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadTeams();
  }, []);

  async function loadTeams() {
    setLoading(true);
    setError("");

    try {
      const data =
        await getTeamsForAdmin();

      setTeams(data);
    } catch (error) {
      console.error(error);

      setError(
        "Ploegen konden niet worden geladen."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTeam(event) {
    event.preventDefault();

    const name = newTeamName.trim();

    const jerseyImageUrl =
      newTeamJerseyImageUrl.trim();

    if (!name) {
      setError(
        "Vul een ploegnaam in."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      await createTeam(
        name,
        jerseyImageUrl
      );

      setNewTeamName("");
      setNewTeamJerseyImageUrl("");

      await loadTeams();
    } catch (error) {
      console.error(error);

      setError(error.message);
    } finally {
      setSaving(false);
    }
  }

  function startEditing(team) {
    setEditingTeamId(team.id);

    setEditingTeamName(
      team.name ?? ""
    );

    setEditingTeamJerseyImageUrl(
      team.jerseyImageUrl ?? ""
    );

    setError("");
  }

  function cancelEditing() {
    setEditingTeamId(null);
    setEditingTeamName("");
    setEditingTeamJerseyImageUrl("");
  }

  async function handleUpdateTeam(
    teamId
  ) {
    const name =
      editingTeamName.trim();

    const jerseyImageUrl =
      editingTeamJerseyImageUrl.trim();

    if (!name) {
      setError(
        "Vul een ploegnaam in."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      await updateTeam(
        teamId,
        name,
        jerseyImageUrl
      );

      cancelEditing();

      await loadTeams();
    } catch (error) {
      console.error(error);

      setError(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTeam(
    team
  ) {
    const confirmed =
      window.confirm(
        `Weet je zeker dat je "${team.name}" wilt verwijderen?`
      );

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      await deleteTeam(team.id);

      await loadTeams();
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <section
      style={{
        marginTop: "30px",
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <h3>Ploegen beheren</h3>

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

      <form
        onSubmit={handleCreateTeam}
      >
        <label
          htmlFor="new-team-name"
          style={{
            display: "block",
            marginBottom: "6px",
            fontWeight: "700",
          }}
        >
          Ploegnaam
        </label>

        <input
          id="new-team-name"
          type="text"
          value={newTeamName}
          onChange={(event) =>
            setNewTeamName(
              event.target.value
            )
          }
          placeholder="Bijvoorbeeld INEOS Grenadiers"
          className="responsive-input"
          style={{
            marginBottom: "14px",
          }}
        />

        <label
          htmlFor="new-team-jersey"
          style={{
            display: "block",
            marginBottom: "6px",
            fontWeight: "700",
          }}
        >
          Shirtafbeelding
        </label>

        <input
          id="new-team-jersey"
          type="text"
          value={newTeamJerseyImageUrl}
          onChange={(event) =>
            setNewTeamJerseyImageUrl(
              event.target.value
            )
          }
          placeholder="/images/jerseys/ineos.webp"
          className="responsive-input"
        />

        {newTeamJerseyImageUrl && (
          <div
            style={{
              marginTop: "12px",
            }}
          >
            <img
              src={newTeamJerseyImageUrl}
              alt="Voorbeeld shirt"
              style={{
                width: "54px",
                height: "68px",
                objectFit: "contain",
              }}
              onError={(event) => {
                event.currentTarget.style.display =
                  "none";
              }}
            />
          </div>
        )}

        <div
          className="responsive-actions"
          style={{
            marginTop: "16px",
          }}
        >
          <button
            type="submit"
            disabled={saving}
          >
            {saving
              ? "Opslaan..."
              : "Toevoegen"}
          </button>
        </div>
      </form>

      <h4
        style={{
          marginTop: "30px",
        }}
      >
        Bestaande ploegen
      </h4>

      {loading && (
        <p>Ploegen laden...</p>
      )}

      {!loading &&
        teams.length === 0 && (
          <p>
            Er zijn nog geen ploegen
            toegevoegd.
          </p>
        )}

      <ul
        style={{
          listStyle: "none",
          padding: 0,
        }}
      >
        {teams.map((team) => (
          <li
            key={team.id}
            style={{
              padding: "14px 0",
              borderBottom:
                "1px solid #ddd",
            }}
          >
            {editingTeamId ===
            team.id ? (
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontWeight: "700",
                  }}
                >
                  Ploegnaam
                </label>

                <input
                  type="text"
                  value={editingTeamName}
                  onChange={(event) =>
                    setEditingTeamName(
                      event.target.value
                    )
                  }
                  className="responsive-input"
                  style={{
                    marginBottom: "12px",
                  }}
                />

                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontWeight: "700",
                  }}
                >
                  Shirtafbeelding
                </label>

                <input
                  type="text"
                  value={
                    editingTeamJerseyImageUrl
                  }
                  onChange={(event) =>
                    setEditingTeamJerseyImageUrl(
                      event.target.value
                    )
                  }
                  className="responsive-input"
                  placeholder="/images/jerseys/ineos.webp"
                />

                {editingTeamJerseyImageUrl && (
                  <div
                    style={{
                      marginTop: "12px",
                    }}
                  >
                    <img
                      src={
                        editingTeamJerseyImageUrl
                      }
                      alt={`Shirt van ${editingTeamName}`}
                      style={{
                        width: "54px",
                        height: "68px",
                        objectFit:
                          "contain",
                      }}
                      onError={(event) => {
                        event.currentTarget.style.display =
                          "none";
                      }}
                    />
                  </div>
                )}

                <div
                  className="responsive-actions"
                  style={{
                    marginTop: "14px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateTeam(
                        team.id
                      )
                    }
                    disabled={saving}
                  >
                    Opslaan
                  </button>

                  <button
                    type="button"
                    onClick={
                      cancelEditing
                    }
                    disabled={saving}
                  >
                    Annuleren
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    width: "58px",
                    minHeight: "68px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                      "center",
                    flexShrink: 0,
                  }}
                >
                  {team.jerseyImageUrl ? (
                    <img
                      src={
                        team.jerseyImageUrl
                      }
                      alt={`Shirt van ${team.name}`}
                      style={{
                        width: "52px",
                        height: "66px",
                        objectFit:
                          "contain",
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        color: "#777",
                        fontSize:
                          "0.8rem",
                      }}
                    >
                      Geen shirt
                    </span>
                  )}
                </div>

                <div
                  style={{
                    flex: "1 1 220px",
                    minWidth: 0,
                  }}
                >
                  <strong>
                    {team.name}
                  </strong>

                  {team.jerseyImageUrl && (
                    <div
                      style={{
                        marginTop: "4px",
                        color: "#666",
                        fontSize:
                          "0.85rem",
                        overflowWrap:
                          "anywhere",
                      }}
                    >
                      {
                        team.jerseyImageUrl
                      }
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      startEditing(team)
                    }
                  >
                    Wijzigen
                  </button>

                  <button
                    type="button"
                    className="button-danger"
                    onClick={() =>
                      handleDeleteTeam(
                        team
                      )
                    }
                  >
                    Verwijderen
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default TeamManager;