"use client";

import { JOB_CATEGORIES } from "@veyrivo/domain";
import { ExternalLink, Github, Globe2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Profile = {
  userId: string;
  displayName: string;
  headline: string | null;
  bio: string | null;
  primaryRole: string | null;
  skills: string[];
  experienceLevel: string | null;
  yearsExperience: number | null;
  languages: string[];
  availability: "AVAILABLE" | "LIMITED" | "UNAVAILABLE";
  preferredWorkCategories: string[];
  countryCode: string | null;
  timezone: string;
  githubUrl: string | null;
  websiteUrl: string | null;
  linkedinUrl: string | null;
  isPublic: boolean;
};

type PortfolioItem = {
  id: string;
  title: string;
  description: string;
  projectUrl: string | null;
  githubUrl: string | null;
  skills: string[];
  projectRole: string | null;
};

const commaList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const emptyPortfolio = {
  title: "",
  description: "",
  projectUrl: "",
  githubUrl: "",
  skills: "",
  projectRole: "",
};

export function ProfileEditor({
  initialProfile,
  initialPortfolio,
}: {
  initialProfile: Profile;
  initialPortfolio: PortfolioItem[];
}) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [skillsText, setSkillsText] = useState(initialProfile.skills.join(", "));
  const [languagesText, setLanguagesText] = useState(initialProfile.languages.join(", "));
  const [portfolio, setPortfolio] = useState(initialPortfolio);
  const [editing, setEditing] = useState(false);
  const [portfolioForm, setPortfolioForm] = useState(emptyPortfolio);
  const [portfolioId, setPortfolioId] = useState<string | null>(null);
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const set = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setProfile((current) => ({ ...current, [key]: value }));

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setFeedback("");
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...profile,
        headline: profile.headline ?? "",
        bio: profile.bio ?? "",
        primaryRole: profile.primaryRole ?? "",
        experienceLevel: profile.experienceLevel ?? "INTERMEDIATE",
        countryCode: profile.countryCode ?? "",
        skills: commaList(skillsText),
        languages: commaList(languagesText),
      }),
    });
    const body = await response.json();
    if (!response.ok) setFeedback(body.error?.message ?? "Profile could not be saved.");
    else {
      setProfile(body.data);
      setEditing(false);
      setFeedback("Profile saved.");
      router.refresh();
    }
    setBusy(false);
  };

  const editPortfolio = (item: PortfolioItem) => {
    setPortfolioId(item.id);
    setPortfolioForm({
      title: item.title,
      description: item.description,
      projectUrl: item.projectUrl ?? "",
      githubUrl: item.githubUrl ?? "",
      skills: item.skills.join(", "),
      projectRole: item.projectRole ?? "",
    });
    setShowPortfolioForm(true);
  };

  const savePortfolio = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setFeedback("");
    const response = await fetch(
      portfolioId ? `/api/profile/portfolio/${portfolioId}` : "/api/profile/portfolio",
      {
        method: portfolioId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(!portfolioId ? { "Idempotency-Key": crypto.randomUUID() } : {}),
        },
        body: JSON.stringify({ ...portfolioForm, skills: commaList(portfolioForm.skills) }),
      },
    );
    const body = await response.json();
    if (!response.ok) setFeedback(body.error?.message ?? "Portfolio item could not be saved.");
    else {
      setPortfolio((items) =>
        portfolioId
          ? items.map((item) => (item.id === portfolioId ? body.data : item))
          : [body.data, ...items],
      );
      setPortfolioId(null);
      setPortfolioForm(emptyPortfolio);
      setShowPortfolioForm(false);
      setFeedback("Portfolio saved.");
    }
    setBusy(false);
  };

  const removePortfolio = async (id: string) => {
    if (!confirm("Remove this portfolio item?")) return;
    setBusy(true);
    const response = await fetch(`/api/profile/portfolio/${id}`, { method: "DELETE" });
    if (response.ok) setPortfolio((items) => items.filter((item) => item.id !== id));
    else {
      const body = await response.json();
      setFeedback(body.error?.message ?? "Portfolio item could not be removed.");
    }
    setBusy(false);
  };

  return (
    <div className="talent-editor-stack">
      <section className="panel profile-main">
        <div className="profile-editor-heading">
          <div className="profile-identity compact">
            <div className="profile-avatar">{profile.displayName.slice(0, 2).toUpperCase()}</div>
            <div>
              <div>
                <h2>{profile.displayName}</h2>
                <span className={`availability availability-${profile.availability.toLowerCase()}`}>
                  {profile.availability.toLowerCase()}
                </span>
              </div>
              <p>{profile.headline || "Add a professional headline"}</p>
              <span>{profile.primaryRole || "Add your primary role"}</span>
            </div>
          </div>
          <div className="profile-editor-actions">
            <Link className="secondary-button" href={`/talent/${profile.userId}`}>
              <ExternalLink size={15} /> Public profile
            </Link>
            <button className="secondary-button" onClick={() => setEditing((value) => !value)}>
              {editing ? <X size={15} /> : <Pencil size={15} />}
              {editing ? "Cancel" : "Edit profile"}
            </button>
          </div>
        </div>
        {feedback && (
          <p className={`form-feedback ${feedback.endsWith("saved.") ? "success" : "error"}`}>
            {feedback}
          </p>
        )}
        {editing ? (
          <form className="profile-edit-form" onSubmit={saveProfile}>
            <div className="two-fields">
              <label>
                Display name
                <input
                  value={profile.displayName}
                  onChange={(event) => set("displayName", event.target.value)}
                  required
                />
              </label>
              <label>
                Primary role
                <input
                  value={profile.primaryRole ?? ""}
                  onChange={(event) => set("primaryRole", event.target.value)}
                  required
                />
              </label>
            </div>
            <label>
              Professional headline
              <input
                value={profile.headline ?? ""}
                onChange={(event) => set("headline", event.target.value)}
                maxLength={160}
                required
              />
            </label>
            <label>
              Bio
              <textarea
                value={profile.bio ?? ""}
                onChange={(event) => set("bio", event.target.value)}
                rows={6}
                maxLength={5000}
                required
              />
            </label>
            <div className="two-fields">
              <label>
                Skills
                <input
                  value={skillsText}
                  onChange={(event) => setSkillsText(event.target.value)}
                  placeholder="React, research, product design"
                />
              </label>
              <label>
                Languages
                <input
                  value={languagesText}
                  onChange={(event) => setLanguagesText(event.target.value)}
                  placeholder="English, French"
                />
              </label>
            </div>
            <div className="three-fields">
              <label>
                Experience level
                <select
                  value={profile.experienceLevel ?? "INTERMEDIATE"}
                  onChange={(event) => set("experienceLevel", event.target.value)}
                >
                  <option value="ENTRY">Entry</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="EXPERT">Expert</option>
                </select>
              </label>
              <label>
                Years of experience
                <input
                  type="number"
                  min={0}
                  max={80}
                  value={profile.yearsExperience ?? ""}
                  onChange={(event) =>
                    set("yearsExperience", event.target.value ? Number(event.target.value) : null)
                  }
                />
              </label>
              <label>
                Availability
                <select
                  value={profile.availability}
                  onChange={(event) =>
                    set("availability", event.target.value as Profile["availability"])
                  }
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="LIMITED">Limited</option>
                  <option value="UNAVAILABLE">Unavailable</option>
                </select>
              </label>
            </div>
            <div className="two-fields">
              <label>
                Country code
                <input
                  value={profile.countryCode ?? ""}
                  onChange={(event) => set("countryCode", event.target.value.toUpperCase())}
                  maxLength={2}
                  required
                />
              </label>
              <label>
                Timezone
                <input
                  value={profile.timezone}
                  onChange={(event) => set("timezone", event.target.value)}
                  required
                />
              </label>
            </div>
            <fieldset className="category-checks">
              <legend>Preferred work categories</legend>
              {JOB_CATEGORIES.map((category) => (
                <label key={category}>
                  <input
                    type="checkbox"
                    checked={profile.preferredWorkCategories.includes(category)}
                    onChange={(event) =>
                      set(
                        "preferredWorkCategories",
                        event.target.checked
                          ? [...profile.preferredWorkCategories, category]
                          : profile.preferredWorkCategories.filter((item) => item !== category),
                      )
                    }
                  />
                  {category.toLowerCase()}
                </label>
              ))}
            </fieldset>
            <div className="three-fields">
              <label>
                GitHub URL
                <input
                  type="url"
                  value={profile.githubUrl ?? ""}
                  onChange={(event) => set("githubUrl", event.target.value || null)}
                />
              </label>
              <label>
                Website URL
                <input
                  type="url"
                  value={profile.websiteUrl ?? ""}
                  onChange={(event) => set("websiteUrl", event.target.value || null)}
                />
              </label>
              <label>
                LinkedIn URL
                <input
                  type="url"
                  value={profile.linkedinUrl ?? ""}
                  onChange={(event) => set("linkedinUrl", event.target.value || null)}
                />
              </label>
            </div>
            <label className="terms-check profile-public-toggle">
              <input
                type="checkbox"
                checked={profile.isPublic}
                onChange={(event) => set("isPublic", event.target.checked)}
              />
              <span>Show my professional profile in talent discovery.</span>
            </label>
            <button className="primary-button" disabled={busy}>
              <Save size={16} /> {busy ? "Saving..." : "Save profile"}
            </button>
          </form>
        ) : (
          <div className="profile-view-body">
            <section className="profile-bio">
              <h3>About</h3>
              <p>{profile.bio || "Add a bio to describe your professional work."}</p>
            </section>
            <section className="profile-skills">
              <h3>Skills</h3>
              <div>
                {profile.skills.length ? (
                  profile.skills.map((skill) => <span key={skill}>{skill}</span>)
                ) : (
                  <p>No skills added yet.</p>
                )}
              </div>
            </section>
            <div className="profile-links">
              {profile.githubUrl && (
                <a href={profile.githubUrl} target="_blank" rel="noreferrer">
                  <Github size={15} /> GitHub
                </a>
              )}
              {profile.websiteUrl && (
                <a href={profile.websiteUrl} target="_blank" rel="noreferrer">
                  <Globe2 size={15} /> Website
                </a>
              )}
              {profile.linkedinUrl && (
                <a href={profile.linkedinUrl} target="_blank" rel="noreferrer">
                  <ExternalLink size={15} /> LinkedIn
                </a>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="panel portfolio-manager">
        <div className="section-heading">
          <div>
            <h2>Portfolio</h2>
            <p>Show clients relevant work, your role, and the technologies used.</p>
          </div>
          <button
            className="secondary-button"
            onClick={() => {
              setPortfolioId(null);
              setPortfolioForm(emptyPortfolio);
              setShowPortfolioForm(true);
            }}
          >
            <Plus size={15} /> Add project
          </button>
        </div>
        {showPortfolioForm && (
          <form className="portfolio-form" onSubmit={savePortfolio}>
            <div className="two-fields">
              <label>
                Project title
                <input
                  value={portfolioForm.title}
                  onChange={(event) =>
                    setPortfolioForm((value) => ({ ...value, title: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Your role
                <input
                  value={portfolioForm.projectRole}
                  onChange={(event) =>
                    setPortfolioForm((value) => ({ ...value, projectRole: event.target.value }))
                  }
                />
              </label>
            </div>
            <label>
              Description
              <textarea
                rows={4}
                value={portfolioForm.description}
                onChange={(event) =>
                  setPortfolioForm((value) => ({ ...value, description: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Skills and technologies
              <input
                value={portfolioForm.skills}
                onChange={(event) =>
                  setPortfolioForm((value) => ({ ...value, skills: event.target.value }))
                }
              />
            </label>
            <div className="two-fields">
              <label>
                Project URL
                <input
                  type="url"
                  value={portfolioForm.projectUrl}
                  onChange={(event) =>
                    setPortfolioForm((value) => ({ ...value, projectUrl: event.target.value }))
                  }
                />
              </label>
              <label>
                GitHub URL
                <input
                  type="url"
                  value={portfolioForm.githubUrl}
                  onChange={(event) =>
                    setPortfolioForm((value) => ({ ...value, githubUrl: event.target.value }))
                  }
                />
              </label>
            </div>
            <div className="proposal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowPortfolioForm(false)}
              >
                Cancel
              </button>
              <button className="primary-button" disabled={busy}>
                <Save size={15} />{" "}
                {busy ? "Saving..." : portfolioId ? "Update project" : "Add project"}
              </button>
            </div>
          </form>
        )}
        <div className="portfolio-list">
          {portfolio.length ? (
            portfolio.map((item) => (
              <article key={item.id}>
                <div>
                  <h3>{item.title}</h3>
                  <span>{item.projectRole || "Project contributor"}</span>
                </div>
                <p>{item.description}</p>
                <div className="skill-list">
                  {item.skills.map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>
                <footer>
                  <div>
                    {item.projectUrl && (
                      <a href={item.projectUrl} target="_blank" rel="noreferrer">
                        <ExternalLink size={14} /> Project
                      </a>
                    )}
                    {item.githubUrl && (
                      <a href={item.githubUrl} target="_blank" rel="noreferrer">
                        <Github size={14} /> Source
                      </a>
                    )}
                  </div>
                  <div>
                    <button
                      className="icon-button"
                      onClick={() => editPortfolio(item)}
                      aria-label={`Edit ${item.title}`}
                      title="Edit project"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="icon-button danger"
                      onClick={() => removePortfolio(item.id)}
                      aria-label={`Delete ${item.title}`}
                      title="Delete project"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </footer>
              </article>
            ))
          ) : (
            <div className="market-empty compact-empty">
              <h3>No portfolio projects yet</h3>
              <p>Add work samples that help clients evaluate relevant experience.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
