import { useEffect, useState } from "react";

import {
  getCompetitions,
  getMyCompetitionTeam,
} from "../services/Api";


const POINTS_BY_POSITION = [
  20,
  17,
  15,
  13,
  11,
  10,
  9,
  8,
  7,
  6,
  5,
  4,
  3,
  2,
  1,
];

function Rules() {
  const [competitionId, setCompetitionId] = useState("");
  const [teamData, setTeamData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCompetitions();
  }, []);

  useEffect(() => {
    if (competitionId) {
      loadCompetitionRules(competitionId);
    } else {
      setTeamData(null);
    }
  }, [competitionId]);

  async function loadCompetitions() {
    setLoading(true);
    setError("");

    try {
      const data = await getCompetitions();

      const activeCompetition = data.find(
        (competition) => competition.isActive
      );

      if (activeCompetition) {
        setCompetitionId(activeCompetition.id);
      } else {
        setCompetitionId("");
        setTeamData(null);
        setLoading(false);
      }
    } catch (error) {
      console.error(error);

      setError(
        error.message ||
          "De competitie kon niet worden geladen."
      );

      setLoading(false);
    }
  }

async function loadCompetitionRules(
    selectedCompetitionId
  ) {
    setLoading(true);
    setError("");

    try {
      const data = await getMyCompetitionTeam(
        selectedCompetitionId
      );

      setTeamData(data);
    } catch (error) {
      console.error(error);
      setTeamData(null);

      setError(
        error.message ||
          "De spelregels konden niet worden geladen."
      );
    } finally {
      setLoading(false);
    }
  }

    return (
    <main className="page-container">
      <h2>Spelregels</h2>

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

      {loading && <p>Spelregels laden...</p>}

      {!loading &&
        !competitionId &&
        !error && (
          <p>
            Er is momenteel geen actieve competitie.
          </p>
        )}

      {!loading && teamData && (
        <>
          <section
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "15px",
              marginBottom: "25px",
            }}
          >
            <Summary
              label="Aantal renners"
              value={teamData.teamSize}
            />

            <Summary
              label="Budget"
              value={`€${teamData.budget}M`}
            />

            <Summary
              label="Transfers"
              value={teamData.maxTransfers}
            />
          </section>

          <RuleSection title="Ploeg samenstellen">
            <p>
              Je stelt voor deze competitie een ploeg
              samen van{" "}
              <strong>{teamData.teamSize} renners</strong>.
            </p>

            <p>
              Hiervoor beschik je over een budget van{" "}
              <strong>€{teamData.budget} miljoen</strong>.
            </p>

            <p>
              De totale waarde van je ploeg mag het
              beschikbare budget niet overschrijden.
            </p>

            <p>
              Tot aan de start van de eerste etappe kun je renners
              toevoegen en verwijderen. Na de deadline
              wordt je ploeg definitief. 
              De lijst met renners wordt dagelijks bijgewerkt zodra de deelnemende teams hun selecties bekendmaken.
            </p>
          </RuleSection>

          <RuleSection title="Jokers">
            <p>
              Zodra je ploeg compleet is, geef je iedere
              renner één jokeretappe. 
              In deze etappe scoort jouw renner dubbele punten.
            </p>

            <ul>
              <li>
                Iedere renner krijgt precies één
                jokeretappe.
              </li>

              <li>
                Iedere etappe mag binnen jouw ploeg maar
                één keer als joker worden gebruikt.
              </li>

              <li>
                Alle jokers moeten vóór de ploegdeadline
                zijn ingesteld.
              </li>

              <li>
                Na de ploegdeadline kunnen jokers niet
                meer worden toegevoegd of gewijzigd.
              </li>

              <li>
                Bij een transfer blijft de jokeretappe
                gekoppeld aan dezelfde plek in je ploeg
                en gaat deze mee naar de nieuwe renner.
              </li>
            </ul>

            <p>
              In de gekozen jokeretappe worden alleen de{" "}
              <strong>punten uit de etappeuitslag</strong>{" "}
              verdubbeld. Bonuspunten voor de
              leiderstrui, puntentrui, bergtrui en jongerentrui worden
              niet verdubbeld.
            </p>

            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr>
                    <TableHeader>Voorbeeld</TableHeader>
                    <TableHeader>Punten</TableHeader>
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <TableCell>
                      Etappeoverwinning
                    </TableCell>
                    <TableCell>
                      <strong>20</strong>
                    </TableCell>
                  </tr>

                  <tr>
                    <TableCell>Jokerbonus</TableCell>
                    <TableCell>
                      <strong>20</strong>
                    </TableCell>
                  </tr>

                  <tr>
                    <TableCell>Leiderstrui</TableCell>
                    <TableCell>
                      <strong>10</strong>
                    </TableCell>
                  </tr>

                  <tr>
                    <TableCell>
                      <strong>Totaal</strong>
                    </TableCell>
                    <TableCell>
                      <strong>50</strong>
                    </TableCell>
                  </tr>
                </tbody>
              </table>
            </div>
          </RuleSection>

          <RuleSection title="Transfers">
            <p>
              Tijdens de competitie kun je maximaal{" "}
              <strong>
                {teamData.maxTransfers} transfers
              </strong>{" "}
              uitvoeren.
            </p>

            <p>
              Je kunt één of meerdere renners tegelijk
              vervangen. Het budget dat vrijkomt door de
              geselecteerde renners wordt opgeteld bij je
              resterende budget en mag gezamenlijk worden
              gebruikt voor de nieuwe renners.
            </p>

            <p>
              Voor iedere renner die je vervangt, gebruik je
              één transfer. Na het uitvoeren van de transfers
              bestaat je ploeg opnieuw uit{" "}
              <strong>{teamData.teamSize} renners</strong>.
            </p>

            <p>
              De joker blijft gekoppeld aan dezelfde plek in
              je ploeg. Bij meerdere transfers bepaal je zelf
              welke nieuwe renner op welke plek komt en dus
              welke joker overneemt.
            </p>

            <p>
              Transfers zijn niet mogelijk wanneer een
              etappe al is gestart en de uitslag daarvan nog
              niet is gepubliceerd.
            </p>

            <p>
              Punten die een vervangen renner eerder voor jouw
              ploeg heeft behaald, blijven behouden. De nieuwe
              renner scoort vanaf de eerstvolgende etappe voor
              jouw ploeg.
            </p>
          </RuleSection>

          <RuleSection title="Punten per etappe">
            <p>
              Na iedere etappe ontvangen de
              eerste 15 renners punten volgens
              onderstaande verdeling.
            </p>

            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr>
                    <TableHeader>Positie</TableHeader>
                    <TableHeader>Punten</TableHeader>
                  </tr>
                </thead>

                <tbody>
                  {POINTS_BY_POSITION.map(
                    (points, index) => (
                      <tr key={index + 1}>
                        <TableCell>
                          {index + 1}
                        </TableCell>

                        <TableCell>
                          <strong>{points}</strong>
                        </TableCell>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </RuleSection>

          <RuleSection title="Bonuspunten voor truien">
            <p>
              Na iedere etappe ontvangen de
              dragers van de klassementstruien extra
              punten.
            </p>

            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr>
                    <TableHeader>
                      Klassementstrui
                    </TableHeader>
                    <TableHeader>
                      Bonuspunten
                    </TableHeader>
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <TableCell>Leiderstrui</TableCell>
                    <TableCell>
                      <strong>10</strong>
                    </TableCell>
                  </tr>

                  <tr>
                    <TableCell>Puntentrui</TableCell>
                    <TableCell>
                      <strong>5</strong>
                    </TableCell>
                  </tr>

                  <tr>
                    <TableCell>Bergtrui</TableCell>
                    <TableCell>
                      <strong>5</strong>
                    </TableCell>
                  </tr>

                  <tr>
                    <TableCell>Jongerentrui</TableCell>
                    <TableCell>
                      <strong>5</strong>
                    </TableCell>
                  </tr>

                </tbody>
              </table>
            </div>
          </RuleSection>

          <RuleSection title="Klassement">
            <p>
              Alle etappepunten, jokerbonussen en
              truienbonussen van de renners in jouw ploeg
              worden automatisch bij elkaar opgeteld.
            </p>

            <p>
              Alleen punten uit gepubliceerde etappes tellen
              mee voor het klassement.
            </p>

            <p>
              Er worden geen aparte punten toegekend voor
              de eindklassementen van de wielerwedstrijd.
            </p>

            <p>
              De speler met de meeste punten staat
              bovenaan in het klassement.
            </p>
          </RuleSection>
        </>
      )}
    </main>
  );
}

function Summary({ label, value }) {
  return (
    <div
      className="responsive-card"
      style={{
        textAlign: "left",
        padding: "22px",
      }}
    >
      <div
        style={{
          width: "38px",
          height: "3px",
          background: "#D62828",
          marginBottom: "16px",
        }}
      />

      <span
        style={{
          display: "block",
          color: "#666",
          fontSize: "0.85rem",
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: "6px",
        }}
      >
        {label}
      </span>

      <strong
        style={{
          display: "block",
          fontSize: "1.6rem",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function RuleSection({ title, children }) {
  return (
    <section
      className="responsive-card"
      style={{
        marginBottom: "24px",
        padding: "28px",
        textAlign: "left",
      }}
    >
      <div
        style={{
          width: "42px",
          height: "3px",
          background: "#D62828",
          marginBottom: "16px",
        }}
      />

      <h3
        style={{
          marginTop: 0,
          marginBottom: "20px",
          fontSize: "1.4rem",
        }}
      >
        {title}
      </h3>

      {children}
    </section>
  );
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

export default Rules;
