function PlayerStandingDetails({
  playerDetails,
  loading,
  error,
  onClose,
}) {
  if (loading) {
    return (
      <section
        style={{
          marginTop: "12px",
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "10px",
        }}
      >
        <p style={{ margin: 0 }}>
          Spelerdetails laden...
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section
        style={{
          marginTop: "12px",
          padding: "20px",
          border: "1px solid #c33",
          borderRadius: "10px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "16px",
          }}
        >
          <p style={{ margin: 0 }}>{error}</p>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            Sluiten
          </button>
        </div>
      </section>
    );
  }

  if (!playerDetails) {
    return null;
  }

  return (
    <section
      style={{
        marginTop: "12px",
        padding: "20px",
        border: "1px solid #ddd",
        borderRadius: "10px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3
            style={{
              marginTop: 0,
              marginBottom: "6px",
            }}
          >
            {playerDetails.userName}
          </h3>

          <p style={{ margin: 0 }}>
            Totaalscore:{" "}
            <strong>
              {playerDetails.totalPoints}
            </strong>
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            padding: "8px 12px",
            cursor: "pointer",
          }}
        >
          Sluiten
        </button>
      </div>

      <div style={{ marginTop: "28px" }}>
        <h4>Punten per etappe</h4>

        {playerDetails.stagePoints?.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
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
                      padding: "10px",
                      textAlign: "left",
                      borderBottom:
                        "2px solid #ccc",
                    }}
                  >
                    Etappe
                  </th>

                  <th
                    style={{
                      padding: "10px",
                      textAlign: "right",
                      borderBottom:
                        "2px solid #ccc",
                    }}
                  >
                    Punten
                  </th>
                </tr>
              </thead>

              <tbody>
                {playerDetails.stagePoints.map(
                  (stagePoint) => (
                    <tr key={stagePoint.stageId}>
                      <td
                        style={{
                          padding: "10px",
                          borderBottom:
                            "1px solid #eee",
                        }}
                      >
                        Etappe{" "}
                        {stagePoint.stageNumber}
                      </td>

                      <td
                        style={{
                          padding: "10px",
                          textAlign: "right",
                          borderBottom:
                            "1px solid #eee",
                          fontWeight: "bold",
                        }}
                      >
                        {stagePoint.points}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <p>
            Er zijn nog geen gepubliceerde
            etappe-uitslagen.
          </p>
        )}
      </div>

      <div style={{ marginTop: "28px" }}>
        <h4>Team</h4>

        {!playerDetails.teamVisible && (
          <p>
            Het team wordt zichtbaar nadat de
            teamdeadline is verstreken.
          </p>
        )}

        {playerDetails.teamVisible &&
          playerDetails.cyclists?.length === 0 && (
            <p>
              Deze speler heeft geen renners in het
              team.
            </p>
          )}

        {playerDetails.teamVisible &&
          playerDetails.cyclists?.length > 0 && (
            <div style={{ overflowX: "auto" }}>
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
                        padding: "10px",
                        textAlign: "left",
                        borderBottom:
                          "2px solid #ccc",
                      }}
                    >
                      Renner
                    </th>

                    <th
                      style={{
                        padding: "10px",
                        textAlign: "left",
                        borderBottom:
                          "2px solid #ccc",
                      }}
                    >
                      Ploeg
                    </th>

                    <th
                      style={{
                        padding: "10px",
                        textAlign: "left",
                        borderBottom:
                          "2px solid #ccc",
                      }}
                    >
                      Joker
                    </th>

                    <th
                      style={{
                        padding: "10px",
                        textAlign: "right",
                        borderBottom:
                          "2px solid #ccc",
                      }}
                    >
                      Prijs
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {playerDetails.cyclists.map(
                    (cyclist) => (
                      <tr
                        key={
                          cyclist.competitionCyclistId
                        }
                      >
                        <td
                          style={{
                            padding: "10px",
                            borderBottom:
                              "1px solid #eee",
                          }}
                        >
                          {cyclist.cyclistName}
                        </td>

                        <td
                          style={{
                            padding: "10px",
                            borderBottom:
                              "1px solid #eee",
                          }}
                        >
                          {cyclist.teamName || "-"}
                        </td>

                        <td
                          style={{
                            padding: "10px",
                            borderBottom:
                              "1px solid #eee",
                          }}
                        >
                          {cyclist.jokerStageNumber
                            ? `Etappe ${cyclist.jokerStageNumber}`
                            : "-"}
                        </td>

                        <td
                          style={{
                            padding: "10px",
                            textAlign: "right",
                            borderBottom:
                              "1px solid #eee",
                          }}
                        >
                          €{cyclist.price}M
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </section>
  );
}

export default PlayerStandingDetails;