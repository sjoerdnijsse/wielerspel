function AvailableCyclists({
  cyclists,
  search,
  onSearchChange,
  savingId,
  remainingBudget,
  selectedCount,
  teamSize,
  onAdd,
}) {
  return (
    <section
      style={{
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <h3>Beschikbare renners</h3>

      <input
        type="search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Zoek op renner of ploeg"
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "10px",
          marginBottom: "20px",
        }}
      />

      {cyclists.length === 0 && (
        <p>Geen beschikbare renners gevonden.</p>
      )}

      <ul
        style={{
          listStyle: "none",
          padding: 0,
        }}
      >
        {cyclists.map((item) => {
          const exceedsBudget = item.price > remainingBudget;
          const teamIsFull = selectedCount >= teamSize;

          return (
            <li
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 0",
                borderBottom: "1px solid #ddd",
              }}
            >
              <div style={{ flex: 1 }}>
                <strong>{item.cyclist.name}</strong>

                <div>
                  {item.cyclist.team?.name ?? "Geen ploeg"} · €{item.price}M
                </div>
              </div>

              <button
                type="button"
                onClick={() => onAdd(item.id)}
                disabled={
                  savingId === item.id ||
                  exceedsBudget ||
                  teamIsFull
                }
              >
                {teamIsFull
                  ? "Ploeg vol"
                  : exceedsBudget
                    ? "Te duur"
                    : "Toevoegen"}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default AvailableCyclists;