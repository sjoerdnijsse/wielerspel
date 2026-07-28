import { useEffect, useMemo, useState } from "react";

import {
  getCyclists,
  getCompetitionCyclists,
  addCompetitionCyclist,
  updateCompetitionCyclist,
  deleteCompetitionCyclist,
} from "../../services/Api";

function PriceManager({ competition }) {
  const [allCyclists, setAllCyclists] = useState([]);
  const [competitionCyclists, setCompetitionCyclists] = useState([]);

  const [search, setSearch] = useState("");
  const [selectedCyclist, setSelectedCyclist] = useState(null);
  const [newNumber, setNewNumber] = useState("");
  const [newPrice, setNewPrice] = useState("");

  const [editingCyclistId, setEditingCyclistId] = useState(null);
  const [editingNumber, setEditingNumber] = useState("");
  const [editingPrice, setEditingPrice] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, [competition.id]);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [cyclistsData, competitionCyclistsData] = await Promise.all([
        getCyclists(),
        getCompetitionCyclists(competition.id),
      ]);

      setAllCyclists(cyclistsData);
      setCompetitionCyclists(competitionCyclistsData);
    } catch (error) {
      console.error(error);
      setError("Renners, rugnummers en prijzen konden niet worden geladen.");
    } finally {
      setLoading(false);
    }
  }

  const availableCyclists = useMemo(() => {
    const linkedIds = new Set(
      competitionCyclists.map((item) => item.cyclistId)
    );

    const searchValue = search.trim().toLowerCase();

    return allCyclists
      .filter((cyclist) => !linkedIds.has(cyclist.id))
      .filter((cyclist) => {
        if (!searchValue) {
          return true;
        }

        const teamName = cyclist.team?.name ?? "";

        return (
          cyclist.name.toLowerCase().includes(searchValue) ||
          teamName.toLowerCase().includes(searchValue)
        );
      });
  }, [allCyclists, competitionCyclists, search]);

  function selectCyclist(cyclist) {
    setSelectedCyclist(cyclist);
    setNewNumber("");
    setNewPrice("");
    setError("");
    setMessage("");
  }

  function cancelSelection() {
    setSelectedCyclist(null);
    setNewNumber("");
    setNewPrice("");
  }

  async function handleAdd() {
    if (!selectedCyclist) {
      setError("Selecteer eerst een renner.");
      return;
    }

    const number = Number(newNumber);
    const price = Number(newPrice);

    if (!Number.isInteger(number) || number <= 0) {
      setError("Vul een geldig rugnummer in.");
      return;
    }

    if (!Number.isInteger(price) || price <= 0) {
      setError("Vul een geldige prijs in hele miljoenen in.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await addCompetitionCyclist(
        competition.id,
        selectedCyclist.id,
        number,
        price
      );

      setMessage(
        `${selectedCyclist.name} is toegevoegd met rugnummer ${number} voor €${price}M.`
      );

      cancelSelection();
      await loadData();
    } catch (error) {
      console.error(error);
      setError(cleanApiError(error.message));
    } finally {
      setSaving(false);
    }
  }

  function startEditing(item) {
    setEditingCyclistId(item.cyclistId);
    setEditingNumber(String(item.number));
    setEditingPrice(String(item.price));
    setError("");
    setMessage("");
  }

  function cancelEditing() {
    setEditingCyclistId(null);
    setEditingNumber("");
    setEditingPrice("");
  }

  async function handleUpdate(item) {
    const number = Number(editingNumber);
    const price = Number(editingPrice);

    if (!Number.isInteger(number) || number <= 0) {
      setError("Vul een geldig rugnummer in.");
      return;
    }

    if (!Number.isInteger(price) || price <= 0) {
      setError("Vul een geldige prijs in hele miljoenen in.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await updateCompetitionCyclist(
        competition.id,
        item.cyclistId,
        number,
        price
      );

      setMessage(
        `${item.cyclist.name} is bijgewerkt: rugnummer ${number}, prijs €${price}M.`
      );

      cancelEditing();
      await loadData();
    } catch (error) {
      console.error(error);
      setError(cleanApiError(error.message));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(
      `Weet je zeker dat je "${item.cyclist.name}" uit deze wedstrijd wilt verwijderen?`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await deleteCompetitionCyclist(
        competition.id,
        item.cyclistId
      );

      if (editingCyclistId === item.cyclistId) {
        cancelEditing();
      }

      setMessage(
        `${item.cyclist.name} is uit deze wedstrijd verwijderd.`
      );

      await loadData();
    } catch (error) {
      console.error(error);
      setError(cleanApiError(error.message));
    }
  }

  return (
    <section>
      <header
        style={{
          marginBottom: "20px",
        }}
      >
        <h3>Wedstrijdrenners</h3>

        <p>
          Koppel renners aan {competition.name} {competition.year} en stel
          per renner het rugnummer en de prijs in.
        </p>
      </header>

      {error && (
        <p
          style={{
            padding: "12px",
            border: "1px solid #c33",
            borderRadius: "8px",
          }}
        >
          {error}
        </p>
      )}

      {message && (
        <p
          style={{
            padding: "12px",
            border: "1px solid #2a7",
            borderRadius: "8px",
          }}
        >
          {message}
        </p>
      )}

      {loading ? (
        <p>Renners laden...</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            gap: "24px",
            alignItems: "start",
          }}
        >
          <section
            style={{
              padding: "20px",
              border: "1px solid #ccc",
              borderRadius: "8px",
            }}
          >
            <h4>Beschikbare renners</h4>

            <label
              htmlFor="price-manager-search"
              style={{
                display: "block",
                marginBottom: "8px",
              }}
            >
              Zoeken
            </label>

            <input
              id="price-manager-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Zoek op renner of ploeg"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px",
                marginBottom: "20px",
              }}
            />

            {availableCyclists.length === 0 && (
              <p>Geen beschikbare renners gevonden.</p>
            )}

            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
              }}
            >
              {availableCyclists.map((cyclist) => (
                <li
                  key={cyclist.id}
                  style={{
                    padding: "12px 0",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <strong>{cyclist.name}</strong>
                      <div>{cyclist.team?.name ?? "Geen ploeg"}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => selectCyclist(cyclist)}
                    >
                      Selecteren
                    </button>
                  </div>

                  {selectedCyclist?.id === cyclist.id && (
                    <div
                      style={{
                        marginTop: "12px",
                        padding: "12px",
                        border: "1px solid #ccc",
                        borderRadius: "8px",
                      }}
                    >
                      <label htmlFor={`number-${cyclist.id}`}>
                        Rugnummer
                      </label>

                      <input
                        id={`number-${cyclist.id}`}
                        type="number"
                        min="1"
                        step="1"
                        value={newNumber}
                        onChange={(event) =>
                          setNewNumber(event.target.value)
                        }
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: "10px",
                          marginTop: "8px",
                          marginBottom: "12px",
                        }}
                      />

                      <label htmlFor={`price-${cyclist.id}`}>
                        Prijs in miljoenen
                      </label>

                      <input
                        id={`price-${cyclist.id}`}
                        type="number"
                        min="1"
                        step="1"
                        value={newPrice}
                        onChange={(event) =>
                          setNewPrice(event.target.value)
                        }
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: "10px",
                          marginTop: "8px",
                        }}
                      />

                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          marginTop: "10px",
                        }}
                      >
                        <button
                          type="button"
                          onClick={handleAdd}
                          disabled={saving}
                        >
                          {saving ? "Opslaan..." : "Toevoegen"}
                        </button>

                        <button
                          type="button"
                          onClick={cancelSelection}
                        >
                          Annuleren
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section
            style={{
              padding: "20px",
              border: "1px solid #ccc",
              borderRadius: "8px",
            }}
          >
            <h4>
              Renners in {competition.name} {competition.year}
            </h4>

            {competitionCyclists.length === 0 && (
              <p>Er zijn nog geen renners aan deze wedstrijd gekoppeld.</p>
            )}

            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
              }}
            >
              {competitionCyclists.map((item) => (
                <li
                  key={item.id}
                  style={{
                    padding: "12px 0",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <strong>{item.cyclist.name}</strong>

                      <div>
                        {item.cyclist.team?.name ?? "Geen ploeg"}
                      </div>

                      {editingCyclistId !== item.cyclistId && (
                        <div>
                          Rugnummer {item.number} · €{item.price}M
                        </div>
                      )}
                    </div>

                    {editingCyclistId === item.cyclistId ? (
                      <>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={editingNumber}
                          onChange={(event) =>
                            setEditingNumber(event.target.value)
                          }
                          aria-label={`Rugnummer van ${item.cyclist.name}`}
                          style={{
                            width: "90px",
                            padding: "8px",
                          }}
                        />

                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={editingPrice}
                          onChange={(event) =>
                            setEditingPrice(event.target.value)
                          }
                          aria-label={`Prijs van ${item.cyclist.name}`}
                          style={{
                            width: "90px",
                            padding: "8px",
                          }}
                        />

                        <button
                          type="button"
                          onClick={() => handleUpdate(item)}
                          disabled={saving}
                        >
                          Opslaan
                        </button>

                        <button
                          type="button"
                          onClick={cancelEditing}
                        >
                          Annuleren
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => startEditing(item)}
                        >
                          Wijzigen
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                        >
                          Verwijderen
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </section>
  );
}

function cleanApiError(message) {
  if (!message) {
    return "Er is iets misgegaan.";
  }

  try {
    const parsed = JSON.parse(message);

    if (typeof parsed === "string") {
      return parsed;
    }

    return parsed.message ?? message;
  } catch {
    return message;
  }
}

export default PriceManager;