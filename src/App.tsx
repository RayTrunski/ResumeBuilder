import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { BsTelephoneInbound } from "react-icons/bs";
import { AiOutlineMail } from "react-icons/ai";
import { FaLocationDot } from "react-icons/fa6";

type ExperienceEntry = {
  role: string;
  company: string;
  location: string;
  period: string;
  highlights: string;
};

type ResumeData = {
  name: string;
  title: string;
  email: string;
  phone: string;
  city: string;
  linkedin: string;
  github: string;
  objective: string;
  degree: string;
  school: string;
  educationPeriod: string;
  educationAddress: string;
  skills: string;
  experiences: ExperienceEntry[];
};

const initialResume: ResumeData = {
  name: "TROTSKY RAY SAINT VIL",
  title: "Software Engineer",
  email: "saintviltrotskyray@gmail.com",
  phone: "3337890626",
  city: "Guadalajara, Jal",
  linkedin: "www.linkedin.com/in/saint-vil-trosky-ray",
  github: "https://github.com/RayTrunski",

  objective:
    "Software Engineering student graduating in four months, with hands-on experience building web and software applications using Java, Python, JavaScript, TypeScript, React, Next.js, SQL, and PostgreSQL. Proactive and adaptable, with strong problem-solving skills and bilingual communication experience. Interested in full-stack and backend roles focused on scalable, practical, user-centered solutions.",
  degree: "Bachelor in Software Engineering\nComputer Science",
  school: "Universidad Enrique Diaz de Leon",
  educationPeriod: "September 2022 - current",
  educationAddress:
    "Av. Enrique Diaz de Leon 90 Col. Americana, Guadalajara Jal.",
  skills:
    "JavaScript\nTypeScript\nSQL\nPython\nJava\nReact\nNext.js\nNode.js\nTailwind CSS\nGitHub\nGitLab",
  experiences: [
    {
      role: "Software Engineer Intern",
      company: "Secretaria de Seguridad",
      location: "Guadalajara, Jal.",
      period: "November 2025 - current",
      highlights:
        "Implemented functional improvements in web modules and database integrations, including query optimization, view creation, and application fixes that improved data retrieval accuracy and system reliability.\nContributed to the development of a React and Next.js platform that automated information search and retrieval, helping achieve major process improvements.\nCollaborated with a 2-person team to replace a manual workflow with a web-based solution, reducing report generation time from 15-30 minutes to under 5 minutes.",
    },
    {
      role: "Full-Stack Developer - ReCyClapp Academic Project",
      company: "UNEDL",
      location: "Guadalajara, Jal.",
      period: "March 2025 - current",
      highlights:
        "Contributed to the development of a web-based platform focused on recycling, repair, and donation workflows for furniture and appliances.\nBuilt core CRUD operations and collaborated on feature planning, technical documentation, and coordination across the development team.",
    },
    {
      role: "Bilingual Tech Support Representative",
      company: "Teleperformance",
      location: "Guadalajara, Jal.",
      period: "May 2023 - November 2023",
      highlights:
        "Delivered bilingual customer support in English and Spanish for internet connectivity issues, guiding users through troubleshooting steps.\nDocumented critical technical details and escalated cases to the support team, helping maintain response quality and service times.",
    },
  ],
};

const splitLines = (value: string) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

const createEmptyExperience = (): ExperienceEntry => ({
  role: "New Role",
  company: "Company Name",
  location: "City, State",
  period: "Month Year - Month Year",
  highlights: "Add your first impact statement here.",
});

const createBlankResume = (): ResumeData => ({
  name: "",
  title: "",
  email: "",
  phone: "",
  city: "",
  linkedin: "",
  github: "",
  objective: "",
  degree: "",
  school: "",
  educationPeriod: "",
  educationAddress: "",
  skills: "",
  experiences: [createEmptyExperience()],
});

const DEFAULT_RESUME_ENDPOINT = "/api/default-resume";

const cloneResume = (resume: ResumeData): ResumeData => ({
  ...resume,
  experiences: resume.experiences.map((entry) => ({ ...entry })),
});

const normalizeExperience = (
  experience?: Partial<ExperienceEntry>,
): ExperienceEntry => ({
  ...createEmptyExperience(),
  ...experience,
});

const normalizeResume = (resume?: Partial<ResumeData>): ResumeData => ({
  ...createBlankResume(),
  ...resume,
  experiences:
    resume?.experiences?.length
      ? resume.experiences.map((entry) => normalizeExperience(entry))
      : [createEmptyExperience()],
});

const getSafeResumeFileName = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "resume";

const waitForNextPaint = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

const waitForPrintAssets = async (printDocument: Document) => {
  const pendingImages = Array.from(printDocument.images).filter(
    (image) => !image.complete,
  );

  await Promise.all(
    pendingImages.map(
      (image) =>
        new Promise<void>((resolve) => {
          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => resolve(), { once: true });
        }),
    ),
  );

  if ("fonts" in printDocument) {
    await printDocument.fonts.ready.catch(() => undefined);
  }
};

const readErrorMessage = async (response: Response, fallbackMessage: string) => {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
};

function App() {
  const [resumes, setResumes] = useState<ResumeData[]>([
    cloneResume(initialResume),
  ]);
  const [activeResumeIndex, setActiveResumeIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isSavingDefault, setIsSavingDefault] = useState(false);
  const resumeRef = useRef<HTMLDivElement>(null);
  const resume = resumes[activeResumeIndex] ?? initialResume;

  const skillList = useMemo(() => splitLines(resume.skills), [resume.skills]);
  const degreeLines = useMemo(() => splitLines(resume.degree), [resume.degree]);
  const educationAddressLines = useMemo(
    () => splitLines(resume.educationAddress),
    [resume.educationAddress],
  );
  const educationTitle = degreeLines[0] ?? "";
  const educationDetails = [
    ...degreeLines.slice(1),
    resume.school,
    resume.educationPeriod,
  ].filter((line) => line.trim().length > 0);

  useEffect(() => {
    let isCancelled = false;

    const loadDefaultResume = async () => {
      try {
        const response = await fetch(DEFAULT_RESUME_ENDPOINT);

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          resume?: Partial<ResumeData> | null;
        };

        if (!data.resume || isCancelled) {
          return;
        }

        setResumes((current) => [
          normalizeResume(data.resume ?? undefined),
          ...current.slice(1),
        ]);
      } catch (error) {
        console.error("Unable to load the saved default resume.", error);
      }
    };

    void loadDefaultResume();

    return () => {
      isCancelled = true;
    };
  }, []);

  const updateField = <K extends keyof ResumeData>(
    field: K,
    value: ResumeData[K],
  ) => {
    setResumes((current) =>
      current.map((item, index) => {
        if (index !== activeResumeIndex) {
          return item;
        }

        return {
          ...item,
          [field]: value,
        };
      }),
    );
  };

  const updateExperience = (
    index: number,
    field: keyof ExperienceEntry,
    value: ExperienceEntry[keyof ExperienceEntry],
  ) => {
    setResumes((current) =>
      current.map((resumeItem, resumeIndex) => {
        if (resumeIndex !== activeResumeIndex) {
          return resumeItem;
        }

        return {
          ...resumeItem,
          experiences: resumeItem.experiences.map((item, currentIndex) => {
            if (currentIndex !== index) {
              return item;
            }

            return {
              ...item,
              [field]: value,
            };
          }),
        };
      }),
    );
  };

  const addExperience = () => {
    setResumes((current) =>
      current.map((resumeItem, index) => {
        if (index !== activeResumeIndex) {
          return resumeItem;
        }

        return {
          ...resumeItem,
          experiences: [...resumeItem.experiences, createEmptyExperience()],
        };
      }),
    );
  };

  const removeExperience = (index: number) => {
    setResumes((current) =>
      current.map((resumeItem, resumeIndex) => {
        if (resumeIndex !== activeResumeIndex) {
          return resumeItem;
        }

        if (resumeItem.experiences.length <= 1) {
          return {
            ...resumeItem,
            experiences: [createEmptyExperience()],
          };
        }

        return {
          ...resumeItem,
          experiences: resumeItem.experiences.filter(
            (_, currentIndex) => currentIndex !== index,
          ),
        };
      }),
    );
  };

  const createNewResume = () => {
    setResumes((current) => {
      const nextResumes = [...current, createBlankResume()];
      setActiveResumeIndex(nextResumes.length - 1);
      return nextResumes;
    });
  };

  const deleteCurrentResume = () => {
    if (activeResumeIndex === 0) {
      return;
    }

    setResumes((current) =>
      current.filter((_, index) => index !== activeResumeIndex),
    );
    setActiveResumeIndex((current) => (current > 0 ? current - 1 : 0));
  };

  const saveCurrentResumeAsDefault = async () => {
    if (isSavingDefault) {
      return;
    }

    const defaultResume = cloneResume(resume);

    try {
      setIsSavingDefault(true);

      const response = await fetch(DEFAULT_RESUME_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resume: defaultResume,
        }),
      });

      if (!response.ok) {
        const fallbackMessage =
          response.status === 404
            ? "The save endpoint is not active yet. Restart `npm run dev` and try again."
            : `Failed to save default resume (${response.status}).`;
        throw new Error(
          await readErrorMessage(response, fallbackMessage),
        );
      }

      setResumes((current) =>
        current.map((item, index) =>
          index === 0 ? cloneResume(defaultResume) : item,
        ),
      );
    } catch (error) {
      console.error("Unable to save the default resume.", error);
      window.alert(
        error instanceof Error
          ? error.message
          : "Could not save the default resume.",
      );
    } finally {
      setIsSavingDefault(false);
    }
  };

  const exportPdf = async () => {
    if (!resumeRef.current || isExporting) {
      return;
    }

    let printFrame: HTMLIFrameElement | null = null;

    try {
      setIsExporting(true);
      await waitForNextPaint();

      const safeName = getSafeResumeFileName(resume.name);
      const printResumeMarkup = resumeRef.current.outerHTML.replace(
        /\s+exporting\b/g,
        "",
      );
      const stylesheetMarkup = Array.from(
        document.querySelectorAll('style, link[rel="stylesheet"]'),
      )
        .map((node) => node.outerHTML)
        .join("\n");

      printFrame = document.createElement("iframe");
      printFrame.setAttribute("title", "Resume PDF export");
      printFrame.setAttribute("aria-hidden", "true");
      printFrame.style.position = "fixed";
      printFrame.style.right = "0";
      printFrame.style.bottom = "0";
      printFrame.style.width = "0";
      printFrame.style.height = "0";
      printFrame.style.border = "0";
      document.body.appendChild(printFrame);

      const printWindow = printFrame.contentWindow;
      const printDocument = printFrame.contentDocument;

      if (!printWindow || !printDocument) {
        throw new Error("Unable to open the print view.");
      }

      printDocument.open();
      printDocument.write(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safeName}-resume</title>
    ${stylesheetMarkup}
    <style>
      @page {
        size: A4 portrait;
        margin: 0;
      }

      html,
      body {
        margin: 0;
        padding: 0;
        background: #ffffff;
      }

      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .pdf-shell {
        margin: 0 auto;
        background: #ffffff;
      }

      .pdf-shell .resume-paper {
        margin: 0 auto;
      }
    </style>
  </head>
  <body>
    <div class="pdf-shell">
      ${printResumeMarkup}
    </div>
  </body>
</html>`);
      printDocument.close();

      await waitForPrintAssets(printDocument);

      await new Promise<void>((resolve) => {
        let settled = false;

        const cleanup = () => {
          if (settled) {
            return;
          }

          settled = true;
          printWindow.removeEventListener("afterprint", handleAfterPrint);
          resolve();
        };

        const handleAfterPrint = () => {
          cleanup();
        };

        printWindow.addEventListener("afterprint", handleAfterPrint);

        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
        }, 150);

        setTimeout(() => {
          cleanup();
        }, 60000);
      });
    } finally {
      printFrame?.remove();
      setIsExporting(false);
    }
  };

  return (
    <div className="builder-page">
      <aside className="editor-panel">
        <h1>Resume Builder</h1>
        <div className="resume-actions">
          <button
            className="new-resume-button"
            type="button"
            onClick={createNewResume}
          >
            + New Resume
          </button>

          <button
            className="delete-resume-button"
            type="button"
            onClick={deleteCurrentResume}
            disabled={activeResumeIndex === 0}
            title={
              activeResumeIndex === 0
                ? "Resume 1 is protected and cannot be deleted"
                : "Delete this resume"
            }
          >
            - Delete Resume
          </button>

          <label className="resume-page-selector">
            Resume Page
            <select
              value={activeResumeIndex}
              onChange={(event) =>
                setActiveResumeIndex(Number(event.target.value))
              }
            >
              {resumes.map((_, index) => (
                <option key={`resume-option-${index}`} value={index}>
                  Resume {index + 1}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="panel-subtitle">
          Edit your details and export the resume as a PDF.
        </p>

        <div className="field-grid">
          <label>
            Name
            <input
              value={resume.name}
              onChange={(event) => updateField("name", event.target.value)}
            />
          </label>

          <label>
            Professional title
            <input
              value={resume.title}
              onChange={(event) => updateField("title", event.target.value)}
            />
          </label>

          <label>
            Email
            <input
              value={resume.email}
              onChange={(event) => updateField("email", event.target.value)}
            />
          </label>

          <label>
            Phone
            <input
              value={resume.phone}
              onChange={(event) => updateField("phone", event.target.value)}
            />
          </label>

          <label>
            City
            <input
              value={resume.city}
              onChange={(event) => updateField("city", event.target.value)}
            />
          </label>

          <label>
            LinkedIn URL
            <input
              value={resume.linkedin}
              onChange={(event) => updateField("linkedin", event.target.value)}
            />
          </label>

          <label>
            GitHub URL
            <input
              value={resume.github}
              onChange={(event) => updateField("github", event.target.value)}
            />
          </label>

          <label className="span-2">
            Career objective
            <textarea
              rows={6}
              value={resume.objective}
              onChange={(event) => updateField("objective", event.target.value)}
            />
          </label>

          <label>
            Degree (line break with Enter)
            <textarea
              rows={4}
              value={resume.degree}
              onChange={(event) => updateField("degree", event.target.value)}
            />
          </label>

          <label>
            School
            <textarea
              rows={4}
              value={resume.school}
              onChange={(event) => updateField("school", event.target.value)}
            />
          </label>

          <label className="span-2">
            Education period
            <input
              value={resume.educationPeriod}
              onChange={(event) =>
                updateField("educationPeriod", event.target.value)
              }
            />
          </label>

          <label>
            Education address
            <textarea
              rows={3}
              value={resume.educationAddress}
              onChange={(event) =>
                updateField("educationAddress", event.target.value)
              }
            />
          </label>

          <label className="span-2">
            Skills (one per line)
            <textarea
              rows={7}
              value={resume.skills}
              onChange={(event) => updateField("skills", event.target.value)}
            />
          </label>
        </div>

        <section className="experience-editor">
          <div className="experience-editor-header">
            <h2>Work Experience</h2>
            <button
              className="experience-action-button"
              type="button"
              onClick={addExperience}
            >
              + Add Section
            </button>
          </div>
          {resume.experiences.map((experience, index) => (
            <div
              className="experience-card"
              key={`${experience.role}-${index}`}
            >
              <div className="experience-card-header">
                <p>Section {index + 1}</p>
                <button
                  className="experience-action-button remove"
                  type="button"
                  onClick={() => removeExperience(index)}
                >
                  - Remove
                </button>
              </div>

              <label>
                Role
                <input
                  value={experience.role}
                  onChange={(event) =>
                    updateExperience(index, "role", event.target.value)
                  }
                />
              </label>

              <label>
                Company
                <input
                  value={experience.company}
                  onChange={(event) =>
                    updateExperience(index, "company", event.target.value)
                  }
                />
              </label>

              <label>
                Location
                <input
                  value={experience.location}
                  onChange={(event) =>
                    updateExperience(index, "location", event.target.value)
                  }
                />
              </label>

              <label>
                Period
                <input
                  value={experience.period}
                  onChange={(event) =>
                    updateExperience(index, "period", event.target.value)
                  }
                />
              </label>

              <label>
                Highlights (one bullet per line)
                <textarea
                  rows={5}
                  value={experience.highlights}
                  onChange={(event) =>
                    updateExperience(index, "highlights", event.target.value)
                  }
                />
              </label>
            </div>
          ))}
        </section>

        <button
          className="save-default-button"
          type="button"
          onClick={() => void saveCurrentResumeAsDefault()}
          disabled={isSavingDefault}
        >
          {isSavingDefault ? "Saving Default..." : "Save To Default"}
        </button>

        <button
          className="export-button"
          onClick={exportPdf}
          disabled={isExporting}
        >
          {isExporting ? "Preparing PDF..." : "Print / Save Resume PDF"}
        </button>
      </aside>

      <main className="preview-stage">
        <div
          className={`resume-paper ${isExporting ? "exporting" : ""}`.trim()}
          ref={resumeRef}
        >
          <header className="resume-header">
            <div className="name-box">{resume.name}</div>
            <p className="title-text">{resume.title}</p>
          </header>

          <section className="resume-grid">
            <aside className="left-column">
              <section>
                <h3>Contact</h3>
                <ul className="plain-list contact-list">
                  <li className="contact-item">
                    <span className="contact-text">{resume.email}</span>
                    <AiOutlineMail
                      className="contact-icon"
                      aria-hidden="true"
                    />
                  </li>
                  <li className="contact-item">
                    <span className="contact-text">{resume.phone}</span>
                    <BsTelephoneInbound
                      className="contact-icon"
                      aria-hidden="true"
                    />
                  </li>
                  <li className="contact-item">
                    <span className="contact-text">{resume.city}</span>
                    <FaLocationDot
                      className="contact-icon"
                      aria-hidden="true"
                    />
                  </li>
                  <li className="contact-item">
                    <span className="contact-text">{resume.linkedin}</span>
                    <FaLinkedin className="contact-icon" aria-hidden="true" />
                  </li>
                  {resume.github.trim() ? (
                    <li className="contact-item">
                      <span className="contact-text">{resume.github}</span>
                      <FaGithub className="contact-icon" aria-hidden="true" />
                    </li>
                  ) : null}
                </ul>
              </section>

              <section>
                <h3>Education</h3>
                <div className="education-box">
                  {educationTitle ? (
                    <p className="education-title">{educationTitle}</p>
                  ) : null}
                  {educationDetails.map((line, index) => (
                    <p
                      className="education-info"
                      key={`education-info-${index}`}
                    >
                      {line}
                    </p>
                  ))}
                  {educationAddressLines.map((line, index) => (
                    <p
                      className="education-address"
                      key={`education-address-${index}`}
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </section>

              <section>
                <h3>Skills</h3>
                <ul className="plain-list skills-list">
                  {skillList.map((skill) => (
                    <li key={skill}>{skill}</li>
                  ))}
                </ul>
              </section>
            </aside>

            <section className="right-column">
              <section>
                <h3>Career Objective</h3>
                <p className="objective-text">{resume.objective}</p>
              </section>

              <section>
                <h3>Work Experience</h3>
                <div className="experience-list">
                  {resume.experiences.map((experience, index) => (
                    <article key={`preview-${experience.role}-${index}`}>
                      <h4>{experience.role}</h4>
                      <p className="company-line">{experience.company}</p>
                      <p className="period-line">
                        {experience.period} <span>/</span> {experience.location}
                      </p>
                      <ul>
                        {splitLines(experience.highlights).map((line) => (
                          <li key={`${experience.role}-${line}`}>{line}</li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </section>
            </section>
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
