const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:10000/api";

function getToken() {
  return localStorage.getItem("token");
}

function createHeaders({ authenticated = true, hasBody = false } = {}) {
  const headers = {};

  if (authenticated) {
    headers.Authorization = `Bearer ${getToken()}`;
  }

  if (hasBody) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

async function getErrorMessage(response, fallbackMessage) {
  const responseText = await response.text();

  if (!responseText) {
    return fallbackMessage;
  }

  try {
    const parsed = JSON.parse(responseText);

    if (typeof parsed === "string") {
      return parsed;
    }

    if (parsed.errors) {
      return Object.entries(parsed.errors)
        .flatMap(([field, messages]) =>
          messages.map((message) => `${field}: ${message}`)
        )
        .join(" ");
    }

    return parsed.detail ?? parsed.title ?? parsed.message ?? fallbackMessage;
  } catch {
    return responseText;
  }
}


// Authenticatie

export async function register(user) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: createHeaders({
      authenticated: false,
      hasBody: true,
    }),
    body: JSON.stringify(user),
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Registreren mislukt")
    );
  }

  return response.json();
}

export async function login(credentials) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: createHeaders({
      authenticated: false,
      hasBody: true,
    }),
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Inloggen mislukt")
    );
  }

  return response.json();
}


// Algemene professionele ploegen

export async function getTeamsForAdmin() {
  const response = await fetch(`${API_URL}/teams`, {
    headers: createHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Ploegen ophalen mislukt")
    );
  }

  return response.json();
}

export async function createTeam(name) {
  const response = await fetch(`${API_URL}/teams`, {
    method: "POST",
    headers: createHeaders({ hasBody: true }),
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Ploeg toevoegen mislukt")
    );
  }

  return response.json();
}

export async function updateTeam(id, name) {
  const response = await fetch(`${API_URL}/teams/${id}`, {
    method: "PUT",
    headers: createHeaders({ hasBody: true }),
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Ploeg wijzigen mislukt")
    );
  }

  return response.json();
}

export async function deleteTeam(id) {
  const response = await fetch(`${API_URL}/teams/${id}`, {
    method: "DELETE",
    headers: createHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Ploeg verwijderen mislukt")
    );
  }

  return response.json();
}


// Algemene renners

export async function getCyclists() {
  const response = await fetch(`${API_URL}/cyclists`, {
    headers: createHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Renners ophalen mislukt")
    );
  }

  return response.json();
}

export async function createCyclist(cyclist) {
  const response = await fetch(`${API_URL}/cyclists`, {
    method: "POST",
    headers: createHeaders({ hasBody: true }),
    body: JSON.stringify(cyclist),
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Renner toevoegen mislukt")
    );
  }

  return response.json();
}

export async function updateCyclist(id, cyclist) {
  const response = await fetch(`${API_URL}/cyclists/${id}`, {
    method: "PUT",
    headers: createHeaders({ hasBody: true }),
    body: JSON.stringify(cyclist),
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Renner wijzigen mislukt")
    );
  }

  return response.json();
}

export async function deleteCyclist(id) {
  const response = await fetch(`${API_URL}/cyclists/${id}`, {
    method: "DELETE",
    headers: createHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Renner verwijderen mislukt")
    );
  }

  return response.json();
}


// Competities

export async function getCompetitions() {
  const response = await fetch(`${API_URL}/competitions`, {
    headers: createHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Wedstrijden ophalen mislukt")
    );
  }

  return response.json();
}

export async function getCompetitionsForAdmin() {
  const response = await fetch(`${API_URL}/competitions/admin`, {
    headers: createHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        "Wedstrijden voor beheer ophalen mislukt"
      )
    );
  }

  return response.json();
}

export async function createCompetition(competition) {
  const response = await fetch(`${API_URL}/competitions`, {
    method: "POST",
    headers: createHeaders({ hasBody: true }),
    body: JSON.stringify(competition),
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Wedstrijd toevoegen mislukt")
    );
  }

  return response.json();
}

export async function updateCompetition(id, competition) {
  const response = await fetch(`${API_URL}/competitions/${id}`, {
    method: "PUT",
    headers: createHeaders({ hasBody: true }),
    body: JSON.stringify(competition),
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Wedstrijd wijzigen mislukt")
    );
  }

  return response.json();
}

export async function deleteCompetition(id) {
  const response = await fetch(`${API_URL}/competitions/${id}`, {
    method: "DELETE",
    headers: createHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Wedstrijd verwijderen mislukt")
    );
  }

  return response.json();
}


// Renners binnen een competitie

export async function getCompetitionCyclists(competitionId) {
  const response = await fetch(
    `${API_URL}/competitions/${competitionId}/cyclists`,
    {
      headers: createHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        "Wedstrijdrenners ophalen mislukt"
      )
    );
  }

  return response.json();
}

export async function addCompetitionCyclist(
  competitionId,
  cyclistId,
  price
) {
  const response = await fetch(
    `${API_URL}/competitions/${competitionId}/cyclists`,
    {
      method: "POST",
      headers: createHeaders({ hasBody: true }),
      body: JSON.stringify({
        cyclistId,
        price,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        "Renner aan wedstrijd toevoegen mislukt"
      )
    );
  }

  return response.json();
}

export async function updateCompetitionCyclist(
  competitionId,
  cyclistId,
  price
) {
  const response = await fetch(
    `${API_URL}/competitions/${competitionId}/cyclists/${cyclistId}`,
    {
      method: "PUT",
      headers: createHeaders({ hasBody: true }),
      body: JSON.stringify({
        cyclistId,
        price,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        "Wedstrijdrenner wijzigen mislukt"
      )
    );
  }

  return response.json();
}

export async function deleteCompetitionCyclist(
  competitionId,
  cyclistId
) {
  const response = await fetch(
    `${API_URL}/competitions/${competitionId}/cyclists/${cyclistId}`,
    {
      method: "DELETE",
      headers: createHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        "Renner uit wedstrijd verwijderen mislukt"
      )
    );
  }

  return response.json();
}


// Ploeg van de ingelogde speler

export async function getMyCompetitionTeam(competitionId) {
  const response = await fetch(
    `${API_URL}/competitions/${competitionId}/myteam`,
    {
      headers: createHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Mijn ploeg ophalen mislukt")
    );
  }

  return response.json();
}

export async function addCyclistToCompetitionTeam(
  competitionId,
  competitionCyclistId
) {
  const response = await fetch(
    `${API_URL}/competitions/${competitionId}/myteam/${competitionCyclistId}`,
    {
      method: "POST",
      headers: createHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Renner toevoegen mislukt")
    );
  }

  return response.json();
}

export async function removeCyclistFromCompetitionTeam(
  competitionId,
  competitionCyclistId
) {
  const response = await fetch(
    `${API_URL}/competitions/${competitionId}/myteam/${competitionCyclistId}`,
    {
      method: "DELETE",
      headers: createHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Renner verwijderen mislukt")
    );
  }

  return response.json();
}


// Etappes

export async function getStages(competitionId) {
  const response = await fetch(
    `${API_URL}/competitions/${competitionId}/stages`,
    {
      headers: createHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Etappes ophalen mislukt")
    );
  }

  return response.json();
}

export async function getStage(competitionId, stageId) {
  const response = await fetch(
    `${API_URL}/competitions/${competitionId}/stages/${stageId}`,
    {
      headers: createHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Etappe ophalen mislukt")
    );
  }

  return response.json();
}

export async function createStage(competitionId, stage) {
  const response = await fetch(
    `${API_URL}/competitions/${competitionId}/stages`,
    {
      method: "POST",
      headers: createHeaders({ hasBody: true }),
      body: JSON.stringify(stage),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Etappe toevoegen mislukt")
    );
  }

  return response.json();
}

export async function updateStage(
  competitionId,
  stageId,
  stage
) {
  const response = await fetch(
    `${API_URL}/competitions/${competitionId}/stages/${stageId}`,
    {
      method: "PUT",
      headers: createHeaders({ hasBody: true }),
      body: JSON.stringify(stage),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Etappe wijzigen mislukt")
    );
  }

  return response.json();
}

export async function deleteStage(competitionId, stageId) {
  const response = await fetch(
    `${API_URL}/competitions/${competitionId}/stages/${stageId}`,
    {
      method: "DELETE",
      headers: createHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Etappe verwijderen mislukt")
    );
  }

  return response.json();
}

export async function getStageResults(competitionId, stageId) {
  const response = await fetch(
    `${API_URL}/competitions/${competitionId}/stages/${stageId}/results`,
    {
      headers: createHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Uitslagen ophalen mislukt")
    );
  }

  return response.json();
}

export async function saveStageResults(
  competitionId,
  stageId,
  results,
  yellowJerseyCompetitionCyclistId,
  greenJerseyCompetitionCyclistId,
  polkaDotJerseyCompetitionCyclistId,
  whiteJerseyCompetitionCyclistId
) {
  const response = await fetch(
    `${API_URL}/competitions/${competitionId}/stages/${stageId}/results`,
    {
      method: "PUT",
      headers: createHeaders({ hasBody: true }),
      body: JSON.stringify({
        results,
        yellowJerseyCompetitionCyclistId,
        greenJerseyCompetitionCyclistId,
        polkaDotJerseyCompetitionCyclistId,
        whiteJerseyCompetitionCyclistId,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        "Uitslagen opslaan mislukt"
      )
    );
  }

  return response.json();
}

 export async function deleteStageResults(
  competitionId,
  stageId
) {
  const response = await fetch(
    `${API_URL}/competitions/${competitionId}/stages/${stageId}/results`,
    {
      method: "DELETE",
      headers: createHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Uitslagen verwijderen mislukt")
    );
  }

  return response.json();
}

export async function getStandings(competitionId) {
  const response = await fetch(
    `${API_URL}/competitions/${competitionId}/standings`,
    {
      headers: createHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        "Klassement ophalen mislukt"
      )
    );
  }

  return response.json();
}

export async function publishStageResults(
  competitionId,
  stageId
) {
  const response = await fetch(
    `${API_URL}/competitions/${competitionId}/stages/${stageId}/publish-results`,
    {
      method: "PUT",
      headers: createHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        "Uitslag publiceren mislukt"
      )
    );
  }

  return response.json();
}

export async function unpublishStageResults(
  competitionId,
  stageId
) {
  const response = await fetch(
    `${API_URL}/competitions/${competitionId}/stages/${stageId}/unpublish-results`,
    {
      method: "PUT",
      headers: createHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        "Publicatie intrekken mislukt"
      )
    );
  }

  return response.json();
}

export async function getPlayerStandingDetails(
  competitionId,
  userId
) {
  const response = await fetch(
    `${API_URL}/competitions/${competitionId}/standings/${userId}`,
    {
      headers: createHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        "De details van de speler konden niet worden opgehaald."
      )
    );
  }

  return response.json();
}

export async function transferCompetitionCyclists(
  competitionId,
  transfers
) {
  const response = await fetch(
    `${API_URL}/competitions/${competitionId}/myteam/transfer`,
    {
      method: "POST",
      headers: createHeaders({ hasBody: true }),
      body: JSON.stringify({
        transfers,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        "Transfers uitvoeren mislukt"
      )
    );
  }

  return response.json();
}

export async function getCompetitionParticipants(
  competitionId
) {
  const response = await fetch(
    `${API_URL}/competitions/${competitionId}/participants`,
    {
      method: "GET",
      headers: createHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        "De deelnemers konden niet worden geladen."
      )
    );
  }

  return response.json();
}

// Jokers van de ingelogde speler opslaan

export async function saveCompetitionTeamJokers(
  competitionId,
  jokers
) {
  const response = await fetch(
    `${API_URL}/competitions/${competitionId}/myteam/jokers`,
    {
      method: "PUT",
      headers: createHeaders({ hasBody: true }),
      body: JSON.stringify({
        jokers,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        "De jokers konden niet worden opgeslagen."
      )
    );
  }

  return response.json();
}

export async function finalizeCompetition(competitionId) {
  const response = await fetch(
    `${API_URL}/competitions/${competitionId}/finalize`,
    {
      method: "PUT",
      headers: createHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        "De wedstrijd kon niet worden afgerond."
      )
    );
  }

  return response.json();
}

export async function getHallOfFame() {
  const response = await fetch(
    `${API_URL}/hall-of-fame`,
    {
      headers: createHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        "De Hall of Fame kon niet worden geladen."
      )
    );
  }

  return response.json();
}

// Wachtwoordherstel aanvragen

export async function forgotPassword(email) {
  const response = await fetch(
    `${API_URL}/auth/forgot-password`,
    {
      method: "POST",
      headers: createHeaders({ hasBody: true }),
      body: JSON.stringify({
        email,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        "De herstelmail kon niet worden aangevraagd."
      )
    );
  }

  return response.json();
}

// Nieuw wachtwoord opslaan

export async function resetPassword({
  email,
  token,
  newPassword,
}) {
  const response = await fetch(
    `${API_URL}/auth/reset-password`,
    {
      method: "POST",
      headers: createHeaders({ hasBody: true }),
      body: JSON.stringify({
        email,
        token,
        newPassword,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        "Het wachtwoord kon niet worden gewijzigd."
      )
    );
  }

  return response.json();
}

export async function getProfile() {
  const response = await fetch(
    `${API_URL}/auth/profile`,
    {
      headers: createHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        "Profiel ophalen mislukt"
      )
    );
  }

  return response.json();
}

export async function updateProfile(
  name,
  email
) {
  const response = await fetch(
    `${API_URL}/auth/profile`,
    {
      method: "PUT",
      headers: createHeaders({ hasBody: true }),
      body: JSON.stringify({
        name,
        email,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        "Profiel bijwerken mislukt"
      )
    );
  }

  return response.json();
}

export async function changePassword(
  currentPassword,
  newPassword
) {
  const response = await fetch(
    `${API_URL}/auth/change-password`,
    {
      method: "PUT",
      headers: createHeaders({ hasBody: true }),
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        "Wachtwoord wijzigen mislukt"
      )
    );
  }

  return response.json();
}