function computeSkillMatch(studentSkills = [], jobRequiredSkills = []) {
    const normalizedStudentSkills = new Set(
        (studentSkills || []).map((s) => s.toLowerCase().trim())
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
    const matchScore = total === 0 ? 0 : Math.round((matchedSkills.length / total) * 100);

    return { matchScore, matchedSkills, missingSkills };
}

module.exports = { computeSkillMatch };