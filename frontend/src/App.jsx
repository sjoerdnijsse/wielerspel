import { useState } from "react";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Team from "./pages/Team";
import Ranking from "./pages/Ranking";

import "./App.css";

function App() {
  const [page, setPage] = useState("home");

  return (
    <>
      <Navbar setPage={setPage} />

      <main>
        {page === "home" && <Home />}

        {page === "login" && <Login setPage={setPage} />}

        {page === "register" && <Register />}

        {page === "team" && <Team />}

        {page === "ranking" && <Ranking />}
      </main>
    </>
  );
}

export default App;