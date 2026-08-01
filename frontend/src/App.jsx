import { useState } from "react";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Team from "./pages/Team";
import Ranking from "./pages/Ranking";
import Admin from "./pages/Admin";
import Rules from "./pages/Rules";
import HallOfFame from "./pages/HallOfFame";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import "./App.css";

function getInitialPage() {
  const parameters = new URLSearchParams(window.location.search);
  return parameters.get("page") === "resetPassword"
    ? "resetPassword"
    : "home";
}

function App() {
  const [page, setPage] = useState(getInitialPage);

  return (
    <>
      <Navbar page={page} setPage={setPage} />

      <main>
        {page === "home" && <Home />}
        {page === "login" && <Login setPage={setPage} />}
        {page === "forgotPassword" && <ForgotPassword setPage={setPage} />}
        {page === "resetPassword" && <ResetPassword setPage={setPage} />}
        {page === "register" && <Register />}
        {page === "team" && <Team />}
        {page === "ranking" && <Ranking />}
        {page === "hallOfFame" && <HallOfFame />}
        {page === "rules" && <Rules />}
        {page === "admin" && <Admin />}
      </main>
    </>
  );
}

export default App;
