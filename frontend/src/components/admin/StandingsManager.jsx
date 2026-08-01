import { useEffect, useState } from "react";
import { getStandings } from "../../services/Api";

function StandingsManager({ competition }) {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadStandings();
  }, [competition.id]);

  async function loadStandings() {
    setLoading(true);
    setError("");

    try {
      const data = await getStandings(competition.id);
      setStandings(data);
    } catch (error) {
      console.error(error);
      setError(
        error.message || "Het klassement kon niet worden geladen."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h3>Klassement</h3>

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

      {loading ? (
        <p>Klassement laden...</p>
      ) : standings.length === 0 ? (
        <p>Er zijn nog geen deelnemers.</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              <th style={headerStyle}>Positie</th>
              <th style={headerStyle}>Speler</th>
              <th style={headerStyle}>Punten</th>
            </tr>
          </thead>

          <tbody>
            {standings.map((standing, index) => (
              <tr key={standing.userId}>
                <td style={cellStyle}>{index + 1}</td>
                <td style={cellStyle}>{standing.userName}</td>
                <td style={cellStyle}>
                  {standing.totalPoints}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

const headerStyle = {
  textAlign: "left",
  padding: "10px",
  borderBottom: "2px solid #ccc",
};

const cellStyle = {
  padding: "10px",
  borderBottom: "1px solid #ddd",
};

export default StandingsManager;