import { useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import "./App.css";

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

function App() {
  const [resume, setResume] = useState<ResumeData>(initialResume);
  const [isExporting, setIsExporting] = useState(false);
  const resumeRef = useRef<HTMLDivElement>(null);

  const skillList = useMemo(() => splitLines(resume.skills), [resume.skills]);

  const updateField = <K extends keyof ResumeData>(
    field: K,
    value: ResumeData[K],
  ) => {
    setResume((current) => ({ ...current, [field]: value }));
  };

  const updateExperience = (
    index: number,
    field: keyof ExperienceEntry,
    value: ExperienceEntry[keyof ExperienceEntry],
  ) => {
    setResume((current) => ({
      ...current,
      experiences: current.experiences.map((item, currentIndex) => {
        if (currentIndex !== index) {
          return item;
        }

        return {
          ...item,
          [field]: value,
        };
      }),
    }));
  };

  const addExperience = () => {
    setResume((current) => ({
      ...current,
      experiences: [...current.experiences, createEmptyExperience()],
    }));
  };

  const removeExperience = (index: number) => {
    setResume((current) => {
      if (current.experiences.length <= 1) {
        return {
          ...current,
          experiences: [createEmptyExperience()],
        };
      }

      return {
        ...current,
        experiences: current.experiences.filter(
          (_, currentIndex) => currentIndex !== index,
        ),
      };
    });
  };

  const exportPdf = async () => {
    if (!resumeRef.current || isExporting) {
      return;
    }

    try {
      setIsExporting(true);

      const canvas = await html2canvas(resumeRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = 210;
      const pdfHeight = 297;
      const imageWidth = pdfWidth;
      const imageHeight = (canvas.height * imageWidth) / canvas.width;

      let heightLeft = imageHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imageWidth, imageHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imageWidth, imageHeight);
        heightLeft -= pdfHeight;
      }

      const safeName = resume.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      pdf.save(`${safeName || "resume"}-resume.pdf`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="builder-page">
      <aside className="editor-panel">
        <h1>Resume Builder</h1>
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

          <label>
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
          className="export-button"
          onClick={exportPdf}
          disabled={isExporting}
        >
          {isExporting ? "Exporting PDF..." : "Export Resume PDF"}
        </button>
      </aside>

      <main className="preview-stage">
        <div className="resume-paper" ref={resumeRef}>
          <header className="resume-header">
            <div className="name-box">{resume.name}</div>
            <p className="title-text">{resume.title}</p>
          </header>

          <section className="resume-grid">
            <aside className="left-column">
              <section>
                <h3>Contact</h3>
                <ul className="plain-list contact-list">
                  <li>{resume.email}</li>
                  <li>{resume.phone}</li>
                  <li>{resume.city}</li>
                  <li>{resume.linkedin}</li>
                </ul>
              </section>

              <section>
                <h3>Education</h3>
                <div className="education-box">
                  {splitLines(resume.degree).map((line) => (
                    <p key={`degree-${line}`}>{line}</p>
                  ))}
                  <p>{resume.school}</p>
                  <p>{resume.educationPeriod}</p>
                  <p>{resume.educationAddress}</p>
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
