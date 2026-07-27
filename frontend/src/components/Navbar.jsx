import { isLoggedIn, isModerator, logout } from "../services/Auth";

export default function Navbar({ setPage }) {
  function handleLogout() {
    logout();
    setPage("home");
    window.location.reload();
  }

  const loggedIn = isLoggedIn();
  const moderator = isModerator();

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "15px 30px",
        backgroundColor: "#1b1b1b",
        color: "white",
      }}
    >
      <h1
        style={{
          cursor: "pointer",
        }}
        onClick={() => setPage("home")}
      >
        🚴 Wielerspel
      </h1>

      <div
        style={{
          display: "flex",
          gap: "15px",
        }}
      >
        <button onClick={() => setPage("home")}>
          Home
        </button>

        {!loggedIn && (
          <>
            <button onClick={() => setPage("register")}>
              Registreren
            </button>

            <button onClick={() => setPage("login")}>
              Inloggen
            </button>
          </>
        )}

        {loggedIn && (
          <>
            <button onClick={() => setPage("team")}>
              Mijn ploeg
            </button>

            <button onClick={() => setPage("ranking")}>
              Klassement
            </button>

            {moderator && (
              <button onClick={() => setPage("admin")}>
                Beheer
              </button>
            )}

            <button onClick={handleLogout}>
              Uitloggen
            </button>
          </>
        )}
      </div>
    </nav>
  );
}