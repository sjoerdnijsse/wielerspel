function TeamList({
  cyclists,
  savingId,
  onRemove,
}) {
  return (
    <section
      style={{
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "8px",
        marginBottom: "25px",
      }}
    >
      <h3>Geselecteerde renners</h3>

      {cyclists.length === 0 && (
        <p>Je hebt nog geen renners geselecteerd.</p>
      )}

      <ul
        style={{
          listStyle: "none",
          padding: 0,
        }}
      >
        {cyclists.map((cyclist) => (
          <li
            key={cyclist.selectionId}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 0",
              borderBottom: "1px solid #ddd",
            }}
          >
            <div style={{ flex: 1 }}>
              <strong>{cyclist.name}</strong>

              <div>
                {cyclist.team?.name ?? "Geen ploeg"} · €{cyclist.price}M
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                onRemove(cyclist.competitionCyclistId)
              }
              disabled={
                savingId === cyclist.competitionCyclistId
              }
            >
              Verwijderen
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default TeamList;