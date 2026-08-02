function Home() {
  return (
    <main
      className="page-container"
      style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "40px 20px",
      }}
    >
            <section
        style={{
          backgroundImage: "url('/images/home-banner.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderRadius: "20px",
          minHeight: "420px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          textShadow: "0 2px 8px rgba(0,0,0,.7)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontSize: "clamp(2.8rem, 6vw, 5rem)",
              fontWeight: "900",
              marginBottom: "20px",
              lineHeight: "1.1",
              textTransform: "uppercase",
              textShadow: "0 3px 12px rgba(0,0,0,.8)"
            }}
          >
            <span style={{ color: "#E83E8C" }}>GIRO</span>{" "}
            <span style={{ color: "#FFD700" }}>TOUR</span>{" "}
            <span style={{ color: "#D62828" }}>VUELTA</span>
            <br />
            <span style={{ color: "#FFFFFF" }}>WIELERSPEL</span>
          </h1>

          
        </div>
      </section>
      
      <section
        className="responsive-card"
        style={{
          textAlign: "center",
          padding: "50px 30px",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
            marginBottom: "10px",
          }}
        >
          🚴 GiroTourVuelta Wielerspel
        </h1>

        <p
          style={{
            fontSize: "1.2rem",
            color: "#666",
            marginBottom: "35px",
          }}
        >
          Speel mee met de grootste wielerrondes ter wereld.
        </p>

        <p
          style={{
            maxWidth: "700px",
            margin: "0 auto",
            lineHeight: "1.8",
            fontSize: "1.05rem",
          }}
        >
          Stel jouw ideale wielerploeg samen, volg dagelijks de
          etappe-uitslagen en strijd met vrienden, familie of collega's
          om de eindoverwinning tijdens de Giro d'Italia, Tour de France
          en Vuelta a España.
        </p>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "20px",
          marginTop: "35px",
        }}
      >
        <div className="responsive-card">
          <h2>🚴 Stel je team samen</h2>

          <p>
            Kies de beste renners binnen het beschikbare budget en bouw
            jouw droomploeg.
          </p>
        </div>

        <div className="responsive-card">
          <h2>🏆 Verdien punten</h2>

          <p>
            Iedere etappe levert punten op. Volg de klassementen en zie
            jouw team stijgen.
          </p>
        </div>

        <div className="responsive-card">
          <h2>🎯 Speel tactisch</h2>

          <p>
            Gebruik je Joker op het juiste moment en maak het verschil
            tijdens beslissende etappes.
          </p>
        </div>

        <div className="responsive-card">
          <h2>📊 Bekijk de ranglijst</h2>

          <p>
            Vergelijk jouw score met andere deelnemers en strijd om de
            eerste plaats.
          </p>
        </div>
      </section>

      <section
        className="responsive-card"
        style={{
          marginTop: "35px",
          textAlign: "center",
          padding: "35px",
        }}
      >
        <h2>🌍 Eén spel voor drie grote rondes</h2>

        <p
          style={{
            maxWidth: "750px",
            margin: "20px auto 0",
            lineHeight: "1.8",
          }}
        >
          Het GiroTourVuelta Wielerspel ondersteunt de drie grootste
          wielerrondes van het jaar. Speel mee tijdens de Giro d'Italia,
          Tour de France en Vuelta a España en ontdek wie zich de beste
          ploegleider mag noemen.
        </p>
      </section>
    </main>
  );
}

export default Home;