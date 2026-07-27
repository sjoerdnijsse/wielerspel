function Home() {
  return (
    <main
      style={{
        textAlign: "center",
        marginTop: "50px",
      }}
    >
      <h1>🚴 Welkom bij Wielerspel</h1>

      <h2>Stel jouw eigen wielerploeg samen</h2>

      <p>
        Kies je favoriete renners, verdien punten tijdens de koers
        en strijd tegen vrienden om het klassement.
      </p>

      <button
        style={{
          padding: "12px 24px",
          marginTop: "20px",
          cursor: "pointer",
        }}
      >
        Start met spelen
      </button>
    </main>
  );
}

export default Home;