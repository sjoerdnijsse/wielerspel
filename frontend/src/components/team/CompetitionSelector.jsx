function CompetitionSelector({
  competitions,
  competitionId,
  onChange,
}) {
  return (
    <>
      <label htmlFor="competition">
        Wedstrijd
      </label>

      <select
        id="competition"
        value={competitionId}
        onChange={(event) => onChange(event.target.value)}
        style={{
          display: "block",
          marginTop: "8px",
          marginBottom: "25px",
          padding: "10px",
        }}
      >
        {competitions.map((competition) => (
          <option
            key={competition.id}
            value={competition.id}
          >
            {competition.name} {competition.year}
          </option>
        ))}
      </select>
    </>
  );
}

export default CompetitionSelector;