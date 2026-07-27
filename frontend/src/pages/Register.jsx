import { useState } from "react";
import { register } from "../services/Api";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleRegister(e) {
    e.preventDefault();

    try {
      const data = await register({
        name,
        email,
        password,
      });

      console.log(data);

      if (data.message) {
        alert("Registratie gelukt!");

        setName("");
        setEmail("");
        setPassword("");
      } else {
        alert("Registratie mislukt");
      }
    } catch (error) {
      console.error(error);
      alert("Kan geen verbinding maken met de server");
    }
  }

  return (
    <main
      style={{
        maxWidth: "400px",
        margin: "50px auto",
      }}
    >
      <h2>📝 Registreren</h2>

      <form onSubmit={handleRegister}>
        <div>
          <label>Naam</label>
          <br />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <br />

        <div>
          <label>Email</label>
          <br />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <br />

        <div>
          <label>Wachtwoord</label>
          <br />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <br />

        <button type="submit">
          Registreren
        </button>
      </form>
    </main>
  );
}

export default Register;