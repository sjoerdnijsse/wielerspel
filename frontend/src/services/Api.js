const API_URL = "http://localhost:5287/api";

export async function register(user) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });

  return response.json();
}


export async function login(credentials) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  return response.json();
}


export async function getCyclists() {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_URL}/cyclists`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.json();
}


export async function addCyclistToMyTeam(cyclistId) {
    const token = localStorage.getItem("token");

    const response = await fetch(
        `http://localhost:5287/api/myteam/${cyclistId}`,
        {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        }
    );

    if (!response.ok) {
        throw new Error("Renner toevoegen mislukt");
    }

    return await response.json();
}

export async function getMyTeam() {
    const token = localStorage.getItem("token");

    const response = await fetch(
        "http://localhost:5287/api/myteam",
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    if (!response.ok) {
        throw new Error("Mijn ploeg ophalen mislukt");
    }

    return await response.json();
}


export async function removeCyclistFromMyTeam(cyclistId) {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_URL}/myteam/${cyclistId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Renner verwijderen mislukt");
  }

  return response.json();
}


export async function getTeamsForAdmin() {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/teams`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Ploegen ophalen mislukt");
  }

  return response.json();
}

export async function createTeam(name) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/teams`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Ploeg toevoegen mislukt");
  }

  return response.json();
}

export async function updateTeam(id, name) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/teams/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Ploeg wijzigen mislukt");
  }

  return response.json();
}

export async function deleteTeam(id) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/teams/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Ploeg verwijderen mislukt");
  }

  return response.json();
}

export async function createCyclist(cyclist) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/cyclists`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cyclist),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Renner toevoegen mislukt");
  }

  return response.json();
}

export async function updateCyclist(id, cyclist) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/cyclists/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cyclist),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Renner wijzigen mislukt");
  }

  return response.json();
}

export async function deleteCyclist(id) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/cyclists/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Renner verwijderen mislukt");
  }

  return response.json();
}

export async function getCompetitions() {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/competitions`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Wedstrijden ophalen mislukt");
  }

  return response.json();
}

export async function createCompetition(competition) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/competitions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(competition),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Wedstrijd toevoegen mislukt");
  }

  return response.json();
}

export async function updateCompetition(id, competition) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/competitions/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(competition),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Wedstrijd wijzigen mislukt");
  }

  return response.json();
}

export async function deleteCompetition(id) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/competitions/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Wedstrijd verwijderen mislukt");
  }

  return response.json();
}

export async function getCompetitionCyclists(competitionId) {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_URL}/competitions/${competitionId}/cyclists`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Renners ophalen mislukt");
  }

  return response.json();
}

export async function addCompetitionCyclist(
  competitionId,
  cyclistId,
  number,
  price
) {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_URL}/competitions/${competitionId}/cyclists`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cyclistId,
        number,
        price,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export async function updateCompetitionCyclist(
  competitionId,
  cyclistId,
  number,
  price
) {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_URL}/competitions/${competitionId}/cyclists/${cyclistId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cyclistId,
        number,
        price,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export async function deleteCompetitionCyclist(
  competitionId,
  cyclistId
) {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_URL}/competitions/${competitionId}/cyclists/${cyclistId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export async function getMyCompetitionTeam(competitionId) {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_URL}/competitions/${competitionId}/myteam`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Mijn ploeg ophalen mislukt");
  }

  return response.json();
}

export async function addCyclistToCompetitionTeam(
  competitionId,
  competitionCyclistId
) {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_URL}/competitions/${competitionId}/myteam/${competitionCyclistId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(cleanApiMessage(message));
  }

  return response.json();
}

export async function removeCyclistFromCompetitionTeam(
  competitionId,
  competitionCyclistId
) {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_URL}/competitions/${competitionId}/myteam/${competitionCyclistId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(cleanApiMessage(message));
  }

  return response.json();
}

function cleanApiMessage(message) {
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