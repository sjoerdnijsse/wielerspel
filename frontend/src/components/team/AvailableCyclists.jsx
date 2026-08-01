import { useMemo, useState } from "react";

function AvailableCyclists({
  cyclists,
  search,
  onSearchChange,
  savingId,
  remainingBudget,
  selectedCount,
  teamSize,
  transferMode = false,
  outgoingCyclistName = "",
  onAdd,
  onTransfer,
}) {
  const [sortOption, setSortOption] = useState(
    "price-descending"
  );

  const sortedCyclists = useMemo(() => {
    return [...cyclists].sort((first, second) => {
      const firstName = first.cyclist.name ?? "";
      const secondName = second.cyclist.name ?? "";
      const firstTeam =
        first.cyclist.team?.name ?? "Geen ploeg";
      const secondTeam =
        second.cyclist.team?.name ?? "Geen ploeg";

      switch (sortOption) {
        case "price-descending": {
          const priceDifference =
            second.price - first.price;

          if (priceDifference !== 0) {
            return priceDifference;
          }

          return firstName.localeCompare(
            secondName,
            "nl",
            { sensitivity: "base" }
          );
        }

        case "team-ascending": {
          const teamDifference =
            firstTeam.localeCompare(
              secondTeam,
              "nl",
              { sensitivity: "base" }
            );

          if (teamDifference !== 0) {
            return teamDifference;
          }

          return firstName.localeCompare(
            secondName,
            "nl",
            { sensitivity: "base" }
          );
        }

        case "team-descending": {
          const teamDifference =
            secondTeam.localeCompare(
              firstTeam,
              "nl",
              { sensitivity: "base" }
            );

          if (teamDifference !== 0) {
            return teamDifference;
          }

          return firstName.localeCompare(
            secondName,
            "nl",
            { sensitivity: "base" }
          );
        }

        case "price-ascending":
        default: {
          const priceDifference =
            first.price - second.price;

          if (priceDifference !== 0) {
            return priceDifference;
          }

          return firstName.localeCompare(
            secondName,
            "nl",
            { sensitivity: "base" }
          );
        }
      }
    });
  }, [cyclists, sortOption]);

  function handleAction(competitionCyclistId) {
    if (transferMode) {
      onTransfer?.(competitionCyclistId);
      return;
    }

    onAdd?.(competitionCyclistId);
  }

  return (
    <section className="responsive-card">
      <h3>
        {transferMode
          ? "Kies een vervangende renner"
          : "Beschikbare renners"}
      </h3>

      {transferMode && outgoingCyclistName && (
        <p>
          Selecteer hieronder de vervanger voor{" "}
          <strong>{outgoingCyclistName}</strong>.
        </p>
      )}

      <div className="available-cyclists__filters">
        <label>
          <span className="available-cyclists__label">
            Zoeken
          </span>

          <input
            type="search"
            value={search}
            onChange={(event) =>
              onSearchChange(event.target.value)
            }
            placeholder="Zoek op renner of ploeg"
            className="responsive-input"
          />
        </label>

        <label>
          <span className="available-cyclists__label">
            Sorteren op
          </span>

          <select
            value={sortOption}
            onChange={(event) =>
              setSortOption(event.target.value)
            }
            className="responsive-input"
          >
            <option value="price-ascending">
              Prijs: laag naar hoog
            </option>

            <option value="price-descending">
              Prijs: hoog naar laag
            </option>

            <option value="team-ascending">
              Ploeg: A–Z
            </option>

            <option value="team-descending">
              Ploeg: Z–A
            </option>
          </select>
        </label>
      </div>

      {sortedCyclists.length === 0 && (
        <p>Geen beschikbare renners gevonden.</p>
      )}

      <ul className="available-cyclists__list">
        {sortedCyclists.map((item) => {
          const exceedsBudget =
            item.price > remainingBudget;

          const teamIsFull =
            !transferMode &&
            selectedCount >= teamSize;

          const isSaving = savingId === item.id;

          let buttonText = "Toevoegen";

          if (isSaving) {
            buttonText = transferMode
              ? "Transfer verwerken..."
              : "Toevoegen...";
          } else if (exceedsBudget) {
            buttonText = "Te duur";
          } else if (teamIsFull) {
            buttonText = "Ploeg vol";
          } else if (transferMode) {
            buttonText = "Kies als vervanger";
          }

          return (
            <li
              key={item.id}
              className="available-cyclists__item"
            >
              <div className="available-cyclists__info">
                <strong>{item.cyclist.name}</strong>

                <div>
                  {item.cyclist.team?.name ??
                    "Geen ploeg"}{" "}
                  · €{item.price}M
                </div>
              </div>

              <div className="available-cyclists__action">
                <button
                  type="button"
                  onClick={() =>
                    handleAction(item.id)
                  }
                  disabled={
                    isSaving ||
                    exceedsBudget ||
                    teamIsFull
                  }
                >
                  {buttonText}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default AvailableCyclists;
