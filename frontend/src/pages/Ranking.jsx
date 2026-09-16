import {
  Fragment,
  useEffect,
  useState,
} from "react";

import {
  getCompetitions,
  getCyclistStandings,
  getPlayerStandingDetails,
  getStandings,
} from "../services/Api";

import PlayerStandingDetails from "../components/ranking/PlayerStandingDetails";

function Ranking() {
  const [competitions, setCompetitions] = useState([]);
  const [competitionId, setCompetitionId] = useState("");
  const [standings, setStandings] = useState([]);
  const [cyclistStandings, setCyclistStandings] = useState([]);
  const [view, setView] = useState("players");

  const [selectedUserId, setSelectedUserId] =
    useState("");

  const [playerDetails, setPlayerDetails] =
    useState(null);

  const [loading, setLoading] = useState(true);

  const [detailsLoading, setDetailsLoading] =
    useState(false);

  const [error, setError] = useState("");

  const [detailsError, setDetailsError] =
    useState("");

  useEffect(() => {
    loadCompetitions();
  }, []);

  useEffect(() => {
    setSelectedUserId("");
    setPlayerDetails(null);
    setDetailsError("");

    if (competitionId) {
      loadStandings(competitionId);
      loadCyclistStandings(competitionId);
    } else {
      setStandings([]);
      setCyclistStandings([]);
    }
  }, [competitionId]);

  async function loadCompetitions() {
    try {
      setLoading(true);
      setError("");

      const data = await getCompetitions();

      setCompetitions(data);

      const activeCompetition = data.find(
        (competition) =>
          competition.isActive &&
          !competition.isFinished
      );

      const latestFinishedCompetition = data.find(
        (competition) => competition.isFinished
      );

      const selectedCompetition =
        activeCompetition ??
        latestFinishedCompetition ??
        data[0] ??
        null;

      if (selectedCompetition) {
        setCompetitionId(selectedCompetition.id);
      } else {
        setCompetitionId("");
        setLoading(false);
      }
    } catch (error) {
      console.error(error);

      setError(
        error.message ||
          "De competities konden niet worden opgehaald."
      );

      setLoading(false);
    }
  }

  async function loadStandings(
    selectedCompetitionId
  ) {
    try {
      setLoading(true);
      setError("");

      const data = await getStandings(
        selectedCompetitionId
      );

      setStandings(data);
    } catch (error) {
      console.error(error);

      setError(
        error.message ||
          "Het klassement kon niet worden opgehaald."
      );

      setStandings([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadCyclistStandings(
    selectedCompetitionId
  ) {
    try {
      const data = await getCyclistStandings(
        selectedCompetitionId
      );

      setCyclistStandings(data);
    } catch (error) {
      console.error(error);

      setError(
        error.message ||
          "Het rennersklassement kon niet worden opgehaald."
      );

      setCyclistStandings([]);
    }
  }

  async function openPlayerDetails(userId) {
    if (selectedUserId === userId) {
      closePlayerDetails();
      return;
    }

    try {
      setSelectedUserId(userId);
      setDetailsLoading(true);
      setDetailsError("");
      setPlayerDetails(null);

      const data = await getPlayerStandingDetails(
        competitionId,
        userId
      );

      setPlayerDetails(data);
    } catch (error) {
      console.error(error);

      setDetailsError(
        error.message ||
          "De spelerdetails konden niet worden opgehaald."
      );
    } finally {
      setDetailsLoading(false);
    }
  }

  function closePlayerDetails() {
    setSelectedUserId("");
    setPlayerDetails(null);
    setDetailsError("");
    setDetailsLoading(false);
  }

  function getPositionLabel(index) {
    return index + 1;
  }

  return (
    <main className="page-container">
      <h2>Klassement</h2>

      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "20px",
        }}
      >
        <button
          type="button"
          onClick={() => setView("players")}
          style={{
            fontWeight: view === "players" ? "bold" : "normal",
            borderBottom:
              view === "players"
                ? "2px solid currentColor"
                : "2px solid transparent",
          }}
        >
          Spelers
        </button>

        <button
          type="button"
          onClick={() => setView("cyclists")}
          style={{
            fontWeight: view === "cyclists" ? "bold" : "normal",
            borderBottom:
              view === "cyclists"
                ? "2px solid currentColor"
                : "2px solid transparent",
          }}
        >
          Renners
        </button>
      </div>

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

      {loading && <p>Klassement laden...</p>}

      {!loading &&
        competitions.length === 0 &&
        !error && (
          <p>
            Er zijn nog geen competities beschikbaar.
          </p>
        )}

      {!loading &&
        view === "players" &&
        competitionId &&
        standings.length === 0 &&
        !error && (
          <p>
            Er staan nog geen spelers in het
            klassement.
          </p>
        )}

      {!loading &&
        view === "players" &&
        standings.length > 0 && (
        <div
          style={{
            width: "100%",
            marginTop: "20px",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "center",
                    padding: "12px 6px",
                    borderBottom: "2px solid #ccc",
                    width: "55px",
                  }}
                >
                  Positie
                </th>

                <th
                  style={{
                    textAlign: "left",
                    padding: "12px 6px",
                    borderBottom: "2px solid #ccc",
                  }}
                >
                  Speler
                </th>

                <th
                  style={{
                    textAlign: "center",
                    padding: "12px 6px",
                    borderBottom: "2px solid #ccc",
                    width: "70px",
                  }}
                >
                  Transfers
                </th>

                <th
                  style={{
                    textAlign: "right",
                    padding: "12px 6px",
                    borderBottom: "2px solid #ccc",
                    width: "60px",
                  }}
                >
                  Totaal
                </th>
              </tr>
            </thead>

            <tbody>
              {standings.map((standing, index) => {
                const isSelected =
                  selectedUserId === standing.userId;

                return (
                  <Fragment key={standing.userId}>
                    <tr
                      style={{
                        backgroundColor: isSelected
                          ? "#f5f5f5"
                          : "transparent",
                      }}
                    >
                      <td
                        style={{
                          padding: "12px 6px",
                          textAlign: "center",
                          borderBottom:
                            "1px solid #eee",
                          fontWeight:
                            index < 3
                              ? "bold"
                              : "normal",
                        }}
                      >
                        {getPositionLabel(index)}
                      </td>

                      <td
                        style={{
                          padding: "12px 6px",
                          textAlign: "left",
                          borderBottom:
                            "1px solid #eee",
                          minWidth: 0,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            openPlayerDetails(
                              standing.userId
                            )
                          }
                          style={{
                            padding: 0,
                            minHeight: 0,
                            border: "none",
                            background: "none",
                            font: "inherit",
                            fontWeight: isSelected
                              ? "bold"
                              : "normal",
                            textDecoration:
                              "underline",
                            cursor: "pointer",
                            textAlign: "left",
                            maxWidth: "100%",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {standing.userName}
                        </button>
                      </td>

                      <td
                        style={{
                          padding: "12px 6px",
                          textAlign: "center",
                          borderBottom:
                            "1px solid #eee",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {standing.transfersUsed ?? 0}
                      </td>

                      <td
                        style={{
                          padding: "12px 6px",
                          textAlign: "right",
                          borderBottom:
                            "1px solid #eee",
                          fontWeight: "bold",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {standing.totalPoints}
                      </td>
                    </tr>

                    {isSelected && (
                      <tr>
                        <td
                          colSpan={4}
                          style={{
                            padding: "0 6px 16px",
                            borderBottom:
                              "1px solid #ddd",
                            background: "#fafafa",
                          }}
                        >
                          <PlayerStandingDetails
                            playerDetails={
                              playerDetails
                            }
                            loading={detailsLoading}
                            error={detailsError}
                            onClose={
                              closePlayerDetails
                            }
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading &&
        view === "cyclists" &&
        competitionId &&
        cyclistStandings.length === 0 &&
        !error && (
          <p>
            Er zijn nog geen punten voor renners beschikbaar.
          </p>
        )}

      {!loading &&
        view === "cyclists" &&
        cyclistStandings.length > 0 && (
          <div
            style={{
              width: "100%",
              marginTop: "20px",
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr>
                  <th style={{ textAlign: "center", padding: "12px 6px", borderBottom: "2px solid #ccc" }}>
                    Positie
                  </th>
                  <th style={{ textAlign: "left", padding: "12px 6px", borderBottom: "2px solid #ccc" }}>
                    Renner
                  </th>
                  <th style={{ textAlign: "left", padding: "12px 6px", borderBottom: "2px solid #ccc" }}>
                    Ploeg
                  </th>
                  <th style={{ textAlign: "right", padding: "12px 6px", borderBottom: "2px solid #ccc", whiteSpace: "nowrap" }}>
                    Etappepunten
                  </th>
                  <th style={{ textAlign: "right", padding: "12px 6px", borderBottom: "2px solid #ccc", whiteSpace: "nowrap" }}>
                    Truipunten
                  </th>
                  <th style={{ textAlign: "right", padding: "12px 6px", borderBottom: "2px solid #ccc" }}>
                    Totaal
                  </th>
                </tr>
              </thead>

              <tbody>
                {cyclistStandings.map((cyclist, index) => (
                  <tr key={cyclist.competitionCyclistId}>
                    <td style={{ padding: "12px 6px", textAlign: "center", borderBottom: "1px solid #eee", fontWeight: index < 3 ? "bold" : "normal" }}>
                      {index + 1}
                    </td>
                    <td style={{ padding: "12px 6px", textAlign: "left", borderBottom: "1px solid #eee" }}>
                      {cyclist.cyclistName}
                    </td>
                    <td style={{ padding: "12px 6px", textAlign: "left", borderBottom: "1px solid #eee" }}>
                      {cyclist.teamName || "-"}
                    </td>
                    <td style={{ padding: "12px 6px", textAlign: "right", borderBottom: "1px solid #eee", whiteSpace: "nowrap" }}>
                      {cyclist.stageResultPoints}
                    </td>
                    <td style={{ padding: "12px 6px", textAlign: "right", borderBottom: "1px solid #eee", whiteSpace: "nowrap" }}>
                      {cyclist.jerseyPoints}
                    </td>
                    <td style={{ padding: "12px 6px", textAlign: "right", borderBottom: "1px solid #eee", fontWeight: "bold", whiteSpace: "nowrap" }}>
                      {cyclist.totalPoints}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </main>
  );
}

export default Ranking;