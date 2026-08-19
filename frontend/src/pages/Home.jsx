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
              textShadow: "0 3px 12px rgba(0,0,0,.8)",
            }}
          >
            <span style={{ color: "#E83E8C" }}>
              GIRO
            </span>{" "}

            <span style={{ color: "#FFD700" }}>
              TOUR
            </span>{" "}

            <span style={{ color: "#D62828" }}>
              VUELTA
            </span>
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            marginBottom: "10px",
            flexWrap: "wrap",
          }}
        >
          <img
            src="/images/logo.webp"
            alt="GTV"
            style={{
              width: "70px",
              height: "70px",
              objectFit: "contain",
              flexShrink: 0,
            }}
          />

          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              margin: 0,
              lineHeight: "1.1",
            }}
          >
            GiroTourVuelta Wielerspel
          </h1>
        </div>

        <p
          style={{
            fontSize: "1.2rem",
            color: "#666",
            marginBottom: "35px",
          }}
        >
          Speel mee met de grootste wielerrondes ter
          wereld.
        </p>

        <p
          style={{
            maxWidth: "700px",
            margin: "0 auto",
            lineHeight: "1.8",
            fontSize: "1.05rem",
          }}
        >
          Stel jouw ideale wielerploeg samen, volg
          dagelijks de etappe-uitslagen en strijd met
          vrienden, familie of collega's om de
          eindoverwinning tijdens de Giro d'Italia,
          Tour de France en Vuelta a España.
        </p>
      </section>

      <section
        style={{
          marginTop: "50px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            color: "#D62828",
            fontSize: "0.8rem",
            fontWeight: "800",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}
        >
          Zo werkt het
        </div>

        <h2
          style={{
            fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
            marginBottom: "12px",
          }}
        >
          Speel, strategiseer en win
        </h2>

        <p
          style={{
            color: "#666",
            marginBottom: "30px",
          }}
        >
          Bouw jouw ploeg en neem het op tegen andere
          wielerfans.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
          }}
        >
          <FeatureCard
            title="Stel je team samen"
            text="Kies de beste renners binnen het beschikbare budget en bouw jouw ideale ploeg."
          />

          <FeatureCard
            title="Verdien punten"
            text="Iedere etappe levert punten op. Volg het klassement en zie jouw ploeg stijgen."
          />

          <FeatureCard
            title="Speel tactisch"
            text="Gebruik je joker op het juiste moment en maak het verschil tijdens beslissende etappes."
          />

          <FeatureCard
            title="Bekijk het klassement"
            text="Vergelijk jouw score met andere deelnemers en strijd om de eerste plaats."
          />
        </div>
      </section>

      <section
        style={{
          marginTop: "60px",
          padding: "55px 30px",
          textAlign: "center",
          borderTop: "1px solid #d9d7d0",
        }}
      >
        <div
          style={{
            color: "#D62828",
            fontSize: "0.82rem",
            fontWeight: "800",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}
        >
          Eén spel, drie grote rondes
        </div>

        <h2
          style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            marginBottom: "18px",
          }}
        >
          Giro, Tour & Vuelta
        </h2>

        <div
          style={{
            width: "50px",
            height: "3px",
            background: "#D62828",
            margin: "0 auto 24px",
          }}
        />

        <p
          style={{
            maxWidth: "760px",
            margin: "0 auto",
            lineHeight: "1.8",
            fontSize: "1.05rem",
            color: "#555",
          }}
        >
          Het GiroTourVuelta Wielerspel ondersteunt
          de drie grootste wielerrondes van het jaar.
          Speel mee tijdens de Giro d'Italia, Tour de
          France en Vuelta a España en ontdek wie zich
          de beste ploegleider mag noemen.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(3, minmax(0, 1fr))",
            gap: "20px",
            maxWidth: "760px",
            margin: "40px auto 0",
          }}
        >
          <RoundLabel
            name="Giro d'Italia"
            color="#E83E8C"
          />

          <RoundLabel
            name="Tour de France"
            color="#D2AC00"
          />

          <RoundLabel
            name="Vuelta a España"
            color="#D62828"
          />
        </div>
      </section>
    </main>
  );
}

function FeatureCard({ title, text }) {
  return (
    <div
      className="responsive-card"
      style={{
        padding: "30px 24px",
        textAlign: "left",
      }}
    >
      <div
        style={{
          width: "42px",
          height: "3px",
          background: "#D62828",
          marginBottom: "20px",
        }}
      />

      <h3
        style={{
          marginTop: 0,
          marginBottom: "14px",
          fontSize: "1.25rem",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          margin: 0,
          color: "#555",
          lineHeight: "1.7",
        }}
      >
        {text}
      </p>
    </div>
  );
}

function RoundLabel({ name, color }) {
  return (
    <div
      style={{
        padding: "20px 10px",
        borderTop: `3px solid ${color}`,
        fontWeight: "800",
        letterSpacing: "0.02em",
      }}
    >
      {name}
    </div>
  );
}

export default Home;