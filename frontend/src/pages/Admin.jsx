import TeamManager from "../components/admin/TeamManager";
import CyclistManager from "../components/admin/CyclistManager";

function Admin() {
  return (
    <main
      style={{
        padding: "30px",
        maxWidth: "1100px",
        margin: "0 auto",
      }}
    >
      <h2>🛠️ Beheer</h2>

      <p>Beheer hier de gegevens van het Wielerspel.</p>

      <TeamManager />

      <CyclistManager />
    </main>
  );
}

export default Admin;