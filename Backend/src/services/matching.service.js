const SKILL_CANONICALS = {
  javascript: ["javascript", "js", "ecmascript"],
  html: ["html", "html5"],
  css: ["css", "css3"],
  "node.js": ["node.js", "nodejs", "node js"],
  react: ["react", "react.js", "reactjs"],
  typescript: ["typescript", "ts"],
  postgresql: ["postgresql", "postgres"],
  mongodb: ["mongodb", "mongo"],
  "c++": ["c++", "cplusplus"],
  "c#": ["c#", "csharp"],
  ".net": [".net", "dotnet"],
  kubernetes: ["kubernetes", "k8s"],
  aws: ["amazon web services", "aws"],
  "rest api": ["rest api", "rest apis", "restful api", "restful apis"],
};

const compact = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9+#]/g, "");

function normalizeSkill(skill = "") {
  const value = String(skill).trim().toLowerCase();
  const key = compact(value);
  for (const [canonical, aliases] of Object.entries(SKILL_CANONICALS)) {
    if (aliases.some((alias) => compact(alias) === key)) return canonical;
  }
  return value
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function skillAppearsInText(skill, text = "") {
  const canonical = normalizeSkill(skill);
  const aliases = SKILL_CANONICALS[canonical] || [skill];
  const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return aliases.some((alias) => {
    const parts = alias.match(/[a-z0-9]+|[+#]/gi) || [];
    if (!parts.length) return false;
    const pattern = parts.map(escape).join("[\\s._-]*");
    return new RegExp(`(^|[^a-z0-9])${pattern}(?=$|[^a-z0-9])`, "i").test(text);
  });
}

function computeSkillMatch(studentSkills = [], jobRequiredSkills = []) {
  const normalizedStudentSkills = new Set(
    (studentSkills || []).map((skill) => skill.toLowerCase().trim()),
  );

  const matchedSkills = [];
  const missingSkills = [];

  for (const required of jobRequiredSkills || []) {
    const normalized = required.toLowerCase().trim();
    if (normalizedStudentSkills.has(normalized)) {
      matchedSkills.push(normalized);
    } else {
      missingSkills.push(normalized);
    }
  }

  const total = jobRequiredSkills?.length || 0;
  const matchScore =
    total === 0 ? 0 : Math.round((matchedSkills.length / total) * 100);

  return { matchScore, matchedSkills, missingSkills };
}

function computeResumeSkillMatch(resumeSkills = [], roleSkills = []) {
  const normalizedResumeSkills = new Set(
    (resumeSkills || []).map(normalizeSkill),
  );
  const matchedSkills = [];
  const missingSkills = [];
  for (const skill of roleSkills || []) {
    const normalized = normalizeSkill(skill);
    (normalizedResumeSkills.has(normalized)
      ? matchedSkills
      : missingSkills
    ).push(normalized);
  }
  const total = roleSkills?.length || 0;
  return {
    matchScore: total ? Math.round((matchedSkills.length / total) * 100) : 0,
    matchedSkills,
    missingSkills,
  };
}

module.exports = {
  computeSkillMatch,
  computeResumeSkillMatch,
  normalizeSkill,
  skillAppearsInText,
};
