import { useEffect, useState } from "react";

import {
  getTeamsForAdmin,
  createTeam,
  updateTeam,
  deleteTeam,
} from "../../services/Api";

function TeamManager() {
  const [teams, setTeams] = useState([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [editingTeamName, setEditingTeamName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadTeams();
  }, []);

  async function loadTeams() {
    setLoading(true);
    setError("");

    try {
      const data = await getTeamsForAdmin();
      setTeams(data);
    } catch (error) {
      console.error(error);
      setError("Ploegen konden niet worden geladen.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTeam(event) {
    event.preventDefault();

    const name = newTeamName.trim();

    if (!name) {
      setError("Vul een ploegnaam in.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await createTeam(name);
      setNewTeamName("");
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
    setEditingTeamName(team.name);
    setError("");
  }

  function cancelEditing() {
    setEditingTeamId(null);
    setEditingTeamName("");
  }

  async function handleUpdateTeam(teamId) {
    const name = editingTeamName.trim();

    if (!name) {
      setError("Vul een ploegnaam in.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await updateTeam(teamId, name);
      cancelEditing();
      await loadTeams();
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTeam(team) {
    const confirmed = window.confirm(
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
      <h3>🚴 Ploegen beheren</h3>

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

      <form onSubmit={handleCreateTeam}>
        <label htmlFor="new-team-name">Nieuwe ploeg</label>

        <div
          style={{
            display: "flex",
            gap: "10px",
            marginTop: "8px",
          }}
        >
          <input
            id="new-team-name"
            type="text"
            value={newTeamName}
            onChange={(event) => setNewTeamName(event.target.value)}
            placeholder="Bijvoorbeeld INEOS Grenadiers"
            style={{
              flex: 1,
              padding: "10px",
            }}
          />

          <button type="submit" disabled={saving}>
            {saving ? "Opslaan..." : "Toevoegen"}
          </button>
        </div>
      </form>

      <h4 style={{ marginTop: "30px" }}>Bestaande ploegen</h4>

      {loading && <p>Ploegen laden...</p>}

      {!loading && teams.length === 0 && (
        <p>Er zijn nog geen ploegen toegevoegd.</p>
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
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 0",
              borderBottom: "1px solid #ddd",
            }}
          >
            {editingTeamId === team.id ? (
              <>
                <input
                  type="text"
                  value={editingTeamName}
                  onChange={(event) =>
                    setEditingTeamName(event.target.value)
                  }
                  style={{
                    flex: 1,
                    padding: "8px",
                  }}
                />

                <button
                  type="button"
                  onClick={() => handleUpdateTeam(team.id)}
                  disabled={saving}
                >
                  Opslaan
                </button>

                <button type="button" onClick={cancelEditing}>
                  Annuleren
                </button>
              </>
            ) : (
              <>
                <strong style={{ flex: 1 }}>{team.name}</strong>

                <button
                  type="button"
                  onClick={() => startEditing(team)}
                >
                  Wijzigen
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteTeam(team)}
                >
                  Verwijderen
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default TeamManager;