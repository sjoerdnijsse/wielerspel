function Card({ label, value }) {
  return (
    <div
      style={{
        padding: "15px",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <div>{label}</div>

      <strong>{value}</strong>
    </div>
  );
}

function TeamSummary({ team }) {
  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0,1fr))",
        gap: "15px",
        marginBottom: "25px",
      }}
    >
      <Card
        label="Renners"
        value={`${team.selectedCount} / ${team.teamSize}`}
      />

      <Card
        label="Budget"
        value={`€${team.totalPrice}M / €${team.budget}M`}
      />

      <Card
        label="Over"
        value={`€${team.remainingBudget}M`}
      />
    </section>
  );
}

export default TeamSummary;