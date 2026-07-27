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