import { useEffect, useMemo, useState } from "react";

import {
  getCompetitionParticipants,
} from "../../services/Api";

function ParticipantsManager({ competition }) {
  const [participants, setParticipants] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadParticipants();
  }, [competition.id]);

  async function loadParticipants() {
    setLoading(true);
    setError("");

    try {
      const data = await getCompetitionParticipants(
        competition.id
      );

      setParticipants(data);
    } catch (error) {
      console.error(error);
      setError(
        cleanApiError(error.message) ||
        "De deelnemers konden niet worden geladen."
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredParticipants = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) {
      return participants;
    }

    return participants.filter((participant) => {
      const name = participant.name?.toLowerCase() ?? "";
      const email = participant.email?.toLowerCase() ?? "";

      return (
        name.includes(searchValue) ||
        email.includes(searchValue)
      );
    });
  }, [participants, search]);

  return (
    <section
      style={{
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <header
        style={{
          marginBottom: "20px",
        }}
      >
        <h3>Deelnemers</h3>

        <p>
          Spelers die deelnemen aan {competition.name}{" "}
          {competition.year}.
        </p>

        {!loading && !error && (
          <p>
            <strong>
              {participants.length}{" "}
              {participants.length === 1
                ? "deelnemer"
                : "deelnemers"}
            </strong>
          </p>
        )}
      </header>

      {error && (
        <div
          role="alert"
          style={{
            padding: "12px",
            marginBottom: "20px",
            border: "1px solid #c33",
            borderRadius: "8px",
          }}
        >
          <p style={{ marginTop: 0 }}>
            {error}
          </p>

          <button
            type="button"
            onClick={loadParticipants}
          >
            Opnieuw proberen
          </button>
        </div>
      )}

      {loading ? (
        <p>Deelnemers laden...</p>
      ) : !error && participants.length === 0 ? (
        <p>
          Er doen nog geen spelers mee aan deze wedstrijd.
        </p>
      ) : !error ? (
        <>
          <label
            htmlFor="participant-search"
            style={{
              display: "block",
              marginBottom: "8px",
            }}
          >
            Zoeken
          </label>

          <input
            id="participant-search"
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Zoek op naam of e-mailadres"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "10px",
              marginBottom: "20px",
            }}
          />

          {filteredParticipants.length === 0 ? (
            <p>
              Geen deelnemers gevonden voor deze zoekopdracht.
            </p>
          ) : (
            <div
              style={{
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
                    <th
                      scope="col"
                      style={{
                        padding: "12px",
                        borderBottom: "2px solid #ccc",
                        textAlign: "left",
                      }}
                    >
                      Naam
                    </th>

                    <th
                      scope="col"
                      style={{
                        padding: "12px",
                        borderBottom: "2px solid #ccc",
                        textAlign: "left",
                      }}
                    >
                      E-mailadres
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredParticipants.map(
                    (participant) => (
                      <tr key={participant.id}>
                        <td
                          style={{
                            padding: "12px",
                            borderBottom:
                              "1px solid #ddd",
                          }}
                        >
                          <strong>
                            {participant.name ||
                              "Naam onbekend"}
                          </strong>
                        </td>

                        <td
                          style={{
                            padding: "12px",
                            borderBottom:
                              "1px solid #ddd",
                          }}
                        >
                          {participant.email ? (
                            <a
                              href={`mailto:${participant.email}`}
                            >
                              {participant.email}
                            </a>
                          ) : (
                            "Geen e-mailadres"
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}
    </section>
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

export default ParticipantsManager;