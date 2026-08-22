import {
  Fragment,
  useEffect,
  useState,
} from "react";

import {
  getCompetitions,
  getPlayerStandingDetails,
  getStandings,
} from "../services/Api";

import PlayerStandingDetails from "../components/ranking/PlayerStandingDetails";

function Ranking() {
  const [competitions, setCompetitions] = useState([]);
  const [competitionId, setCompetitionId] = useState("");
  const [standings, setStandings] = useState([]);

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
    } else {
      setStandings([]);
    }
  }, [competitionId]);

  async function loadCompetitions() {
    try {
      setLoading(true);
      setError("");

      const data = await getCompetitions();

      setCompetitions(data);

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
        competitionId &&
        standings.length === 0 &&
        !error && (
          <p>
            Er staan nog geen spelers in het
            klassement.
          </p>
        )}

      {!loading && standings.length > 0 && (
        <div
          style={{
            overflowX: "auto",
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
                    textAlign: "left",
                    padding: "12px",
                    borderBottom: "2px solid #ccc",
                    width: "100px",
                  }}
                >
                  Positie
                </th>

                <th
                  style={{
                    textAlign: "left",
                    padding: "12px",
                    borderBottom: "2px solid #ccc",
                  }}
                >
                  Speler
                </th>

                <th
                  style={{
                    textAlign: "right",
                    padding: "12px",
                    borderBottom: "2px solid #ccc",
                    width: "150px",
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
                          padding: "12px",
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
                          padding: "12px",
                          borderBottom:
                            "1px solid #eee",
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
                          }}
                        >
                          {standing.userName}
                        </button>
                      </td>

                      <td
                        style={{
                          padding: "12px",
                          textAlign: "right",
                          borderBottom:
                            "1px solid #eee",
                          fontWeight: "bold",
                        }}
                      >
                        {standing.totalPoints}
                      </td>
                    </tr>

                    {isSelected && (
                      <tr>
                        <td
                          colSpan={3}
                          style={{
                            padding: "0 12px 16px",
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
    </main>
  );
}

export default Ranking;