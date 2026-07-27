import { useEffect, useState } from "react";

import {
  getCyclists,
  getMyTeam,
  addCyclistToMyTeam,
  removeCyclistFromMyTeam,
} from "../services/Api";

function Team() {
  const [cyclists, setCyclists] = useState([]);
  const [myTeam, setMyTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const allCyclists = await getCyclists();
      const selectedCyclists = await getMyTeam();

      setCyclists(allCyclists);
      setMyTeam(selectedCyclists);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(cyclistId) {
    try {
      await addCyclistToMyTeam(cyclistId);
      await loadData();
    } catch (error) {
      console.error(error);
      alert("Renner toevoegen mislukt");
    }
  }

  async function handleRemove(cyclistId) {
    try {
      await removeCyclistFromMyTeam(cyclistId);
      await loadData();
    } catch (error) {
      console.error(error);
      alert("Renner verwijderen mislukt");
    }
  }

  return (
    <main style={{ padding: "30px" }}>
      <h2>🚴 Mijn ploeg</h2>

      {loading && <p>Renners laden...</p>}

      {!loading && myTeam.length === 0 && (
        <p>Je hebt nog geen renners gekozen.</p>
      )}

      <ul>
        {myTeam.map((cyclist) => (
          <li key={cyclist.id}>
            <strong>{cyclist.name}</strong>

            {" - "}

            {cyclist.team?.name}

            <button
              onClick={() => handleRemove(cyclist.id)}
              style={{ marginLeft: "15px" }}
            >
              Verwijderen
            </button>
          </li>
        ))}
      </ul>

      <hr />

      <h2>Beschikbare renners</h2>

      {!loading &&
        cyclists.filter(
          (cyclist) =>
            !myTeam.some((selected) => selected.id === cyclist.id)
        ).length === 0 && (
          <p>Er zijn geen beschikbare renners meer.</p>
        )}

      <ul>
        {cyclists
          .filter(
            (cyclist) =>
              !myTeam.some((selected) => selected.id === cyclist.id)
          )
          .map((cyclist) => (
            <li key={cyclist.id}>
              <strong>{cyclist.name}</strong>

              {" - "}

              {cyclist.team?.name}

              <button
                onClick={() => handleAdd(cyclist.id)}
                style={{ marginLeft: "15px" }}
              >
                Toevoegen
              </button>
            </li>
          ))}
      </ul>
    </main>
  );
}

export default Team;