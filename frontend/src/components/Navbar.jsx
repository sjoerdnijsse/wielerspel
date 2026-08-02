import { useState } from "react";

import {
  isLoggedIn,
  isModerator,
  logout,
} from "../services/Auth";

export default function Navbar({
  page,
  setPage,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const loggedIn = isLoggedIn();
  const moderator = isModerator();
  const player = loggedIn && !moderator;

  function openPage(newPage) {
    setPage(newPage);
    setMenuOpen(false);
  }

  function handleLogout() {
    logout();
    setPage("home");
    window.location.reload();
  }

  function getButtonClass(pageName) {
    return page === pageName
      ? "main-navbar__link main-navbar__link--active"
      : "main-navbar__link";
  }

  return (
    <nav className="main-navbar">
      <h1
        className="main-navbar__title"
        onClick={() => openPage("home")}
      >
        <span aria-hidden="true">🚴</span>{" "}
        GiroTourVuelta Wielerspel
      </h1>

      <button
        type="button"
        className="main-navbar__menu-button"
        onClick={() =>
          setMenuOpen((current) => !current)
        }
        aria-expanded={menuOpen}
        aria-controls="main-navigation"
      >
        {menuOpen ? "Menu sluiten" : "Menu"}
      </button>

      <div
        id="main-navigation"
        className={[
          "main-navbar__actions",
          menuOpen
            ? "main-navbar__actions--open"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <button
          type="button"
          className={getButtonClass("home")}
          onClick={() => openPage("home")}
        >
          Home
        </button>

        {!loggedIn && (
          <>
            <button
              type="button"
              className={getButtonClass("register")}
              onClick={() => openPage("register")}
            >
              Registreren
            </button>

            <button
              type="button"
              className={getButtonClass("login")}
              onClick={() => openPage("login")}
            >
              Inloggen
            </button>
          </>
        )}

        {loggedIn && (
          <>
            <button
              type="button"
              className={getButtonClass("team")}
              onClick={() => openPage("team")}
            >
              Mijn ploeg
            </button>

            <button
              type="button"
              className={getButtonClass("ranking")}
              onClick={() => openPage("ranking")}
            >
              Klassement
            </button>

            <button
              type="button"
              className={getButtonClass(
                "hallOfFame"
              )}
              onClick={() =>
                openPage("hallOfFame")
              }
            >
              Hall of Fame
            </button>

            {loggedIn && (
              <button
                type="button"
                className={getButtonClass("rules")}
                onClick={() => openPage("rules")}
              >
                Spelregels
              </button>
            )}

            {moderator && (
              <button
                type="button"
                className={getButtonClass("admin")}
                onClick={() => openPage("admin")}
              >
                Beheer
              </button>
            )}

            <button
              type="button"
              className="main-navbar__link"
              onClick={handleLogout}
            >
              Uitloggen
            </button>
          </>
        )}
      </div>
    </nav>
  );
}