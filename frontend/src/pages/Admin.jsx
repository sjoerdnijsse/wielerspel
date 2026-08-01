import { useState } from "react";

import CompetitionManager from "../components/admin/CompetitionManager";
import CompetitionDashboard from "../components/admin/CompetitionDashboard";

function Admin() {
  const [selectedCompetition, setSelectedCompetition] =
    useState(null);

  function openCompetition(competition) {
    console.log("Competitie geopend:", competition);
    setSelectedCompetition(competition);
  }

  function closeCompetition() {
    setSelectedCompetition(null);
  }

  return (
    <main className="page-container">
      {!selectedCompetition && (
        <>
          <header
            style={{
              marginBottom: "24px",
            }}
          >
            <h2>Beheer</h2>

            <p>
              Kies een wedstrijdeditie of maak een nieuwe
              wedstrijd aan.
            </p>
          </header>

          <CompetitionManager
            onOpen={openCompetition}
          />
        </>
      )}

      {selectedCompetition && (
        <CompetitionDashboard
          competition={selectedCompetition}
          onBack={closeCompetition}
          onCompetitionUpdated={
            setSelectedCompetition
          }
        />
      )}
    </main>
  );
}

export default Admin;