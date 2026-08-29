import { Fragment, useState } from "react";

function PlayerStandingDetails({
  playerDetails,
  loading,
  error,
  onClose,
}) {
  const [expandedStageId, setExpandedStageId] =
    useState(null);

  function toggleStage(stageId) {
    setExpandedStageId((currentStageId) =>
      currentStageId === stageId
        ? null
        : stageId
    );
  }

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

          <p
            style={{
              marginTop: "6px",
              marginBottom: 0,
            }}
          >
            Transfers gebruikt:{" "}
            <strong>
              {playerDetails.transfersUsed ?? 0}
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
                      padding: "10px 4px",
                      textAlign: "left",
                      borderBottom: "2px solid #ccc",
                    }}
                  >
                    Etappe
                  </th>

                  <th
                    style={{
                      padding: "10px 4px",
                      textAlign: "right",
                      borderBottom: "2px solid #ccc",
                    }}
                  >
                    Punten
                  </th>
                </tr>
              </thead>

              <tbody>
                {playerDetails.stagePoints.map(
                  (stagePoint) => {
                    const isExpanded =
                      expandedStageId ===
                      stagePoint.stageId;

                    const canExpand =
                      !stagePoint.noResult &&
                      stagePoint.cyclists?.length > 0;

                    return (
                      <Fragment key={stagePoint.stageId}>
                        <tr>
                          <td
                            style={{
                              padding: "10px 4px",
                              borderBottom:
                                isExpanded
                                  ? "none"
                                  : "1px solid #eee",
                            }}
                          >
                            {canExpand ? (
                              <button
                                type="button"
                                onClick={() =>
                                  toggleStage(
                                    stagePoint.stageId
                                  )
                                }
                                style={{
                                  padding: 0,
                                  minHeight: 0,
                                  border: "none",
                                  background: "none",
                                  font: "inherit",
                                  fontWeight: "bold",
                                  textDecoration:
                                    "underline",
                                  cursor: "pointer",
                                }}
                              >
                                Etappe{" "}
                                {stagePoint.stageNumber}
                              </button>
                            ) : (
                              <>
                                Etappe{" "}
                                {stagePoint.stageNumber}
                              </>
                            )}
                          </td>

                          <td
                            style={{
                              padding: "10px 4px",
                              textAlign: "right",
                              borderBottom:
                                isExpanded
                                  ? "none"
                                  : "1px solid #eee",
                              fontWeight: "bold",
                            }}
                          >
                            {stagePoint.noResult
                              ? "Geen uitslag"
                              : stagePoint.points}
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr>
                            <td
                              colSpan={2}
                              style={{
                                padding: "0 0 16px 0",
                                borderBottom:
                                  "1px solid #eee",
                              }}
                            >
                              <div
                                style={{
                                  padding: "12px",
                                  background: "#fafafa",
                                  borderRadius: "8px",
                                }}
                              >
                                <div
                                  style={{
                                    fontWeight: "bold",
                                    marginBottom: "8px",
                                    textAlign: "left",
                                  }}
                                >
                                  Team in etappe{" "}
                                  {stagePoint.stageNumber}
                                </div>

                                {stagePoint.cyclists.map(
                                  (cyclist) => (
                                    <div
                                      key={
                                        cyclist.competitionCyclistId
                                      }
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                        padding: "7px 0",
                                        borderBottom:
                                          "1px solid #eee",
                                        width: "100%",
                                      }}
                                    >
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "8px",
                                          minWidth: 0,
                                        }}
                                      >
                                        {cyclist.jerseyImageUrl && (
                                          <img
                                            src={
                                              cyclist.jerseyImageUrl
                                            }
                                            alt=""
                                            style={{
                                              width: "24px",
                                              height: "30px",
                                              objectFit:
                                                "contain",
                                              flexShrink: 0,
                                            }}
                                          />
                                        )}

                                        <div
                                          style={{
                                            minWidth: 0,
                                          }}
                                        >
                                          <div>
                                            {
                                              cyclist.cyclistName
                                            }
                                          </div>

                                          <div
                                            style={{
                                              fontSize:
                                                "0.85em",
                                              color: "#666",
                                            }}
                                          >
                                            {cyclist.teamName ||
                                              "-"}
                                          </div>
                                        </div>
                                      </div>

                                      <strong
                                        style={{
                                          whiteSpace:
                                            "nowrap",
                                          marginLeft: "auto",
                                          textAlign: "right",
                                          minWidth: "70px",
                                        }}
                                      >
                                        {cyclist.points} pnt
                                      </strong>
                                    </div>
                                  )
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  }
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
            <div
              style={{
                width: "100%",
                overflowX: "hidden",
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
                        padding: "10px",
                        textAlign: "left",
                        borderBottom: "2px solid #ccc",
                      }}
                    >
                      Renner / ploeg
                    </th>

                    <th
                      style={{
                        padding: "10px",
                        textAlign: "left",
                        borderBottom: "2px solid #ccc",
                      }}
                    >
                      Joker
                    </th>

                    <th
                      style={{
                        padding: "10px",
                        textAlign: "right",
                        borderBottom: "2px solid #ccc",
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
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                            }}
                          >
                            {cyclist.jerseyImageUrl && (
                              <img
                                src={
                                  cyclist.jerseyImageUrl
                                }
                                alt=""
                                style={{
                                  width: "32px",
                                  height: "40px",
                                  objectFit: "contain",
                                  flexShrink: 0,
                                }}
                              />
                            )}

                            <div>
                              <div>
                                <strong>
                                  {cyclist.cyclistName}
                                </strong>{" "}
                                <strong>
                                  ({cyclist.points ?? 0} pnt)
                                </strong>
                              </div>

                              <div
                                style={{
                                  marginTop: "2px",
                                  fontSize: "0.9em",
                                  color: "#666",
                                }}
                              >
                                {cyclist.teamName || "-"}
                              </div>
                            </div>
                          </div>
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

      <div style={{ marginTop: "28px" }}>
        <h4>Transferhistorie</h4>

        {playerDetails.transfers?.length > 0 ? (
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
                      width: "180px",
                      padding: "10px",
                      textAlign: "left",
                      borderBottom: "2px solid #ccc",
                    }}
                  >
                    Moment
                  </th>

                  <th
                    style={{
                      padding: "10px",
                      textAlign: "left",
                      borderBottom: "2px solid #ccc",
                    }}
                  >
                    Transfer
                  </th>
                </tr>
              </thead>

              <tbody>
                {playerDetails.transfers.map(
                  (transfer, index) => (
                    <tr
                      key={`${transfer.afterStageNumber}-${transfer.outgoingCyclistName}-${transfer.incomingCyclistName}-${index}`}
                    >
                      <td
                        style={{
                          width: "180px",
                          padding: "10px",
                          textAlign: "left",
                          borderBottom:
                            "1px solid #eee",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Na etappe{" "}
                        {transfer.afterStageNumber}
                      </td>

                      <td
                        style={{
                          padding: "10px",
                          textAlign: "left",
                          borderBottom:
                            "1px solid #eee",
                        }}
                      >
                        {transfer.outgoingCyclistName}{" "}
                        <strong>
                          ({transfer.outgoingCyclistPoints ?? 0} pnt)
                        </strong>
                        {" → "}
                        <strong>
                          {transfer.incomingCyclistName}
                        </strong>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <p>
            Deze speler heeft nog geen transfers
            uitgevoerd.
          </p>
        )}
      </div>
    </section>
  );
}

export default PlayerStandingDetails;