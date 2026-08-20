import { useEffect, useState } from "react";

import {
  changePassword,
  getProfile,
  updateProfile,
} from "../services/Api";

function Profile() {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(true);

  const [savingProfile, setSavingProfile] =
    useState(false);

  const [savingPassword, setSavingPassword] =
    useState(false);

  const [profileError, setProfileError] =
    useState("");

  const [profileMessage, setProfileMessage] =
    useState("");

  const [passwordError, setPasswordError] =
    useState("");

  const [passwordMessage, setPasswordMessage] =
    useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setProfileError("");

      const data = await getProfile();

      setProfile({
        name: data.name ?? "",
        email: data.email ?? "",
      });
    } catch (error) {
      setProfileError(
        error?.message ||
          "Je profiel kon niet worden geladen."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleProfileChange(event) {
    const { name, value } = event.target;

    setProfile((current) => ({
      ...current,
      [name]: value,
    }));

    setProfileError("");
    setProfileMessage("");
  }

  function handlePasswordChange(event) {
    const { name, value } = event.target;

    setPasswordForm((current) => ({
      ...current,
      [name]: value,
    }));

    setPasswordError("");
    setPasswordMessage("");
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();

    const name = profile.name.trim();
    const email = profile.email.trim();

    setProfileError("");
    setProfileMessage("");

    if (!name) {
      setProfileError("Naam is verplicht.");
      return;
    }

    if (!email) {
      setProfileError("E-mailadres is verplicht.");
      return;
    }

    try {
      setSavingProfile(true);

      const result = await updateProfile(
        name,
        email
      );

      setProfile({
        name: result.name ?? "",
        email: result.email ?? "",
      });

      setProfileMessage(
        "Je profiel is bijgewerkt."
      );
    } catch (error) {
      setProfileError(
        error?.message ||
          "Je profiel kon niet worden bijgewerkt."
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();

    setPasswordError("");
    setPasswordMessage("");

    if (!passwordForm.currentPassword) {
      setPasswordError(
        "Vul je huidige wachtwoord in."
      );
      return;
    }

    if (!passwordForm.newPassword) {
      setPasswordError(
        "Vul een nieuw wachtwoord in."
      );
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError(
        "Het nieuwe wachtwoord moet minimaal 8 tekens bevatten."
      );
      return;
    }

    if (!passwordForm.confirmPassword) {
      setPasswordError(
        "Herhaal je nieuwe wachtwoord."
      );
      return;
    }

    if (
      passwordForm.newPassword !==
      passwordForm.confirmPassword
    ) {
      setPasswordError(
        "De nieuwe wachtwoorden komen niet overeen."
      );
      return;
    }

    if (
      passwordForm.currentPassword ===
      passwordForm.newPassword
    ) {
      setPasswordError(
        "Je nieuwe wachtwoord moet verschillen van je huidige wachtwoord."
      );
      return;
    }

    try {
      setSavingPassword(true);

      const result = await changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );

      setPasswordMessage(
        result.message ||
          "Je wachtwoord is gewijzigd."
      );

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setPasswordError(
        error?.message ||
          "Je wachtwoord kon niet worden gewijzigd."
      );
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return (
      <main className="page-container">
        <p>Profiel laden...</p>
      </main>
    );
  }

  return (
    <main className="page-container">
      <h2>Mijn profiel</h2>

      <section
        className="responsive-card"
        style={{
          marginBottom: "24px",
        }}
      >
        <h3>Accountgegevens</h3>

        {profileError && (
          <div
            role="alert"
            aria-live="polite"
            style={{
              padding: "12px 14px",
              marginBottom: "18px",
              border: "1px solid #b52b25",
              borderRadius: "4px",
              background: "#fdecea",
              color: "#b52b25",
              fontWeight: "600",
            }}
          >
            {profileError}
          </div>
        )}

        {profileMessage && (
          <div
            role="status"
            aria-live="polite"
            style={{
              padding: "12px 14px",
              marginBottom: "18px",
              border: "1px solid #287a4b",
              borderRadius: "4px",
              background: "#edf8f1",
              color: "#20613c",
              fontWeight: "600",
            }}
          >
            {profileMessage}
          </div>
        )}

        <form onSubmit={handleProfileSubmit}>
          <label
            style={{
              display: "block",
              marginBottom: "20px",
            }}
          >
            <span
              style={{
                display: "block",
                marginBottom: "6px",
                fontWeight: "700",
              }}
            >
              Naam
            </span>

            <input
              type="text"
              name="name"
              value={profile.name}
              onChange={handleProfileChange}
              className="responsive-input"
              autoComplete="name"
              disabled={savingProfile}
            />

            <small
              style={{
                display: "block",
                marginTop: "6px",
                color: "#666",
              }}
            >
              Deze naam wordt getoond in het spel.
            </small>
          </label>

          <label
            style={{
              display: "block",
              marginBottom: "20px",
            }}
          >
            <span
              style={{
                display: "block",
                marginBottom: "6px",
                fontWeight: "700",
              }}
            >
              E-mailadres
            </span>

            <input
              type="email"
              name="email"
              value={profile.email}
              onChange={handleProfileChange}
              className="responsive-input"
              autoComplete="email"
              disabled={savingProfile}
            />
          </label>

          <div className="responsive-actions">
            <button
              type="submit"
              disabled={savingProfile}
            >
              {savingProfile
                ? "Opslaan..."
                : "Gegevens opslaan"}
            </button>
          </div>
        </form>
      </section>

      <section className="responsive-card">
        <h3>Wachtwoord wijzigen</h3>

        <p
          style={{
            marginTop: 0,
            marginBottom: "20px",
            color: "#666",
          }}
        >
          Je nieuwe wachtwoord moet minimaal 8
          tekens bevatten.
        </p>

        {passwordError && (
          <div
            role="alert"
            aria-live="polite"
            style={{
              padding: "12px 14px",
              marginBottom: "18px",
              border: "1px solid #b52b25",
              borderRadius: "4px",
              background: "#fdecea",
              color: "#b52b25",
              fontWeight: "600",
            }}
          >
            {passwordError}
          </div>
        )}

        {passwordMessage && (
          <div
            role="status"
            aria-live="polite"
            style={{
              padding: "12px 14px",
              marginBottom: "18px",
              border: "1px solid #287a4b",
              borderRadius: "4px",
              background: "#edf8f1",
              color: "#20613c",
              fontWeight: "600",
            }}
          >
            {passwordMessage}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit}>
          <label
            style={{
              display: "block",
              marginBottom: "16px",
            }}
          >
            <span
              style={{
                display: "block",
                marginBottom: "6px",
                fontWeight: "700",
              }}
            >
              Huidig wachtwoord
            </span>

            <input
              type="password"
              name="currentPassword"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              className="responsive-input"
              autoComplete="current-password"
              disabled={savingPassword}
            />
          </label>

          <label
            style={{
              display: "block",
              marginBottom: "16px",
            }}
          >
            <span
              style={{
                display: "block",
                marginBottom: "6px",
                fontWeight: "700",
              }}
            >
              Nieuw wachtwoord
            </span>

            <input
              type="password"
              name="newPassword"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              className="responsive-input"
              autoComplete="new-password"
              disabled={savingPassword}
            />
          </label>

          <label
            style={{
              display: "block",
              marginBottom: "20px",
            }}
          >
            <span
              style={{
                display: "block",
                marginBottom: "6px",
                fontWeight: "700",
              }}
            >
              Nieuw wachtwoord herhalen
            </span>

            <input
              type="password"
              name="confirmPassword"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange}
              className="responsive-input"
              autoComplete="new-password"
              disabled={savingPassword}
            />
          </label>

          <div className="responsive-actions">
            <button
              type="submit"
              disabled={savingPassword}
            >
              {savingPassword
                ? "Wijzigen..."
                : "Wachtwoord wijzigen"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default Profile;