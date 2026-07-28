import { useState } from "react";

import CompetitionManager from "../components/admin/CompetitionManager";
import CompetitionDashboard from "../components/admin/CompetitionDashboard";

function Admin() {
  
  const [selectedCompetition, setSelectedCompetition] = useState(null);

  function openCompetition(competition) {
    console.log("Competitie geopend:", competition);

    setSelectedCompetition(competition);
  }

  function closeCompetition() {
    setSelectedCompetition(null);
  }

  return (
    <main
      style={{
        padding: "30px",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      {!selectedCompetition && (
        <>
          <h2>Beheer</h2>

          <p>
            Kies een wedstrijdeditie of maak een nieuwe wedstrijd aan.
          </p>

          <CompetitionManager onOpen={openCompetition} />
        </>
      )}

      {selectedCompetition && (
        <CompetitionDashboard
          competition={selectedCompetition}
          onBack={closeCompetition}
          onCompetitionUpdated={setSelectedCompetition}
        />
      )}
    </main>
  );
}

export default Admin;