import { useEffect, useState } from "react";

import { getHallOfFame } from "../services/Api";

function HallOfFame() {
  const [data, setData] = useState({
    competitions: [],
    mostWins: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadHallOfFame();
  }, []);

  async function loadHallOfFame() {
    setLoading(true);
    setError("");

    try {
      const result = await getHallOfFame();

      setData({
        competitions: result.competitions ?? [],
        mostWins: result.mostWins ?? [],
      });
    } catch (error) {
      console.error(error);

      setError(
        error.message ||
          "De Hall of Fame kon niet worden geladen."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-container">
      
      <header
        style={{
          marginBottom: "28px",
        }}
      >
        <h2>🏆 Hall of Fame</h2>

        <p>
          Bekijk de winnaars van afgeronde wedstrijden
          en ontdek wie de meeste overwinningen heeft.
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

      {loading && <p>Hall of Fame laden...</p>}

      {!loading && !error && (
        <>
          <section
            style={{
              padding: "20px",
              marginBottom: "25px",
              border: "1px solid #ccc",
              borderRadius: "8px",
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              🥇 Meeste overwinningen
            </h3>

            {data.mostWins.length === 0 ? (
              <p>
                Er zijn nog geen afgeronde wedstrijden.
              </p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                  }}
                >
                  <thead>
                    <tr>
                      <TableHeader>Rang</TableHeader>
                      <TableHeader>Speler</TableHeader>
                      <TableHeader>Overwinningen</TableHeader>
                    </tr>
                  </thead>

                  <tbody>
                    {data.mostWins.map(
                      (player, index) => (
                        <tr key={player.userId}>
                          <TableCell>
                            {getMedal(index + 1)}
                          </TableCell>

                          <TableCell>
                            <strong>
                              {player.userName}
                            </strong>
                          </TableCell>

                          <TableCell>
                            {player.wins}
                          </TableCell>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <h3>Podiums per wedstrijd</h3>

            {data.competitions.length === 0 ? (
              <p>
                Er zijn nog geen afgeronde wedstrijden.
              </p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: "20px",
                }}
              >
                {data.competitions.map(
                  (competition) => (
                    <article
                      key={competition.competitionId}
                      style={{
                        padding: "20px",
                        border: "1px solid #ccc",
                        borderRadius: "8px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          gap: "12px",
                          alignItems: "flex-start",
                          flexWrap: "wrap",
                          marginBottom: "16px",
                        }}
                      >
                        <div>
                          <h4
                            style={{
                              marginTop: 0,
                              marginBottom: "5px",
                            }}
                          >
                            {competition.competitionName}{" "}
                            {competition.year}
                          </h4>

                          {competition.finishedAt && (
                            <div>
                              Afgerond op{" "}
                              {new Date(
                                competition.finishedAt
                              ).toLocaleString(
                                "nl-NL"
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {competition.topThree.length ===
                      0 ? (
                        <p>
                          Er is geen definitieve top 3
                          beschikbaar.
                        </p>
                      ) : (
                        <ol
                          style={{
                            listStyle: "none",
                            padding: 0,
                            margin: 0,
                          }}
                        >
                          {competition.topThree.map(
                            (standing) => (
                              <li
                                key={standing.userId}
                                style={{
                                  display: "flex",
                                  justifyContent:
                                    "space-between",
                                  gap: "16px",
                                  padding: "10px 0",
                                  borderBottom:
                                    "1px solid #eee",
                                }}
                              >
                                <span>
                                  {getMedal(
                                    standing.position
                                  )}{" "}
                                  <strong>
                                    {standing.userName}
                                  </strong>
                                </span>

                                <span>
                                  {standing.totalPoints}{" "}
                                  punten
                                </span>
                              </li>
                            )
                          )}
                        </ol>
                      )}
                    </article>
                  )
                )}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

function getMedal(position) {
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

function TableHeader({ children }) {
  return (
    <th
      style={{
        padding: "10px",
        textAlign: "left",
        borderBottom: "2px solid #aaa",
      }}
    >
      {children}
    </th>
  );
}

function TableCell({ children }) {
  return (
    <td
      style={{
        padding: "10px",
        borderBottom: "1px solid #ddd",
      }}
    >
      {children}
    </td>
  );
}

export default HallOfFame;
